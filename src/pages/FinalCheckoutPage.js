import React, { useContext, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { shopsAPI, apiCall, api } from '../services/api';
import { geocodeAddress } from '../utils/geocoding';
import { getCurrentLocation } from '../utils/deliveryCalculator';
import OrderConfirmationPopup from '../components/OrderConfirmationPopup';
import './FinalCheckoutPage.css';

// Format price with Indian Rupee symbol and proper formatting
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
};

const FinalCheckoutPage = () => {
    const { user } = useAuth();
    const {
        cartItems,
        selectedShop,
        getOrderSummary,
        clearCart,
        calculateRealTimeDeliveryFee,
        isCalculatingDeliveryFee,
        deliveryCalculationDetails
    } = useContext(CartContext);
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState([]);
    const [deliveryAddress, setDeliveryAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        instructions: '',
        contactName: user?.name || user?.user?.name || '',
        contactPhone: '', // Always start empty to make it compulsory
        countryCode: '+91' // Default to India
    });
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodingError, setGeocodingError] = useState('');
    const [deliveryCalculation, setDeliveryCalculation] = useState(null);
    const [hasGeocodedAddress, setHasGeocodedAddress] = useState(false);
    const [acceptanceTime, setAcceptanceTime] = useState(null);
    const [loadingAcceptanceTime, setLoadingAcceptanceTime] = useState(false);
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const navigate = useNavigate();

    // Clean up user data and ensure phone field is empty if invalid
    useEffect(() => {
        if (user) {
            const userPhone = user?.phone || user?.user?.phone || '';
            // Only use user phone if it's a valid 10-digit number and not a placeholder
            const isValidPhone = /^[0-9]{10}$/.test(userPhone) &&
                userPhone !== '0000000000' &&
                userPhone !== '1111111111' &&
                userPhone !== '1234567890';

            setDeliveryAddress(prev => ({
                ...prev,
                contactName: user?.name || user?.user?.name || '',
                contactPhone: isValidPhone ? userPhone : '' // Only use if valid, otherwise empty
            }));
        }
    }, [user]);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const { data } = await api.get('/shops');
                if (data?.success) {
                    const shopsData = data.data || data.shops;
                    if (Array.isArray(shopsData)) {
                        setShops(shopsData);
                    }
                }
            } catch (err) {
                console.error('Failed to load shops:', err);
            }
        };

        fetchShops();
    }, []);

    // Fetch order acceptance time when selectedShop changes
    useEffect(() => {
        const fetchAcceptanceTime = async () => {
            if (!selectedShop || !selectedShop._id) return;

            try {
                setLoadingAcceptanceTime(true);

                // Extract shop ID from different possible structures
                const shopId = selectedShop.data?.shop?._id || selectedShop._id;

                const response = await api.get(`/orders/acceptance-time/${shopId}`);

                if (response.data.success) {
                    setAcceptanceTime(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching acceptance time:', error);
                // Set default values if API fails
                setAcceptanceTime({
                    pendingOrdersCount: 0,
                    estimatedMinutes: 5,
                    estimatedTime: '5 minutes'
                });
            } finally {
                setLoadingAcceptanceTime(false);
            }
        };

        fetchAcceptanceTime();

        // Refresh acceptance time every 30 seconds
        const interval = setInterval(fetchAcceptanceTime, 30000);

        return () => clearInterval(interval);
    }, [selectedShop]);

    // Calculate delivery fee ONLY for distance-based shops when we have valid coordinates
    useEffect(() => {
        if (deliveryAddress.coordinates &&
            deliveryAddress.coordinates.lat &&
            deliveryAddress.coordinates.lng &&
            deliveryAddress.coordinates.lat >= 6 &&
            deliveryAddress.coordinates.lat <= 37 &&
            deliveryAddress.coordinates.lng >= 68 &&
            deliveryAddress.coordinates.lng <= 97) {

            // Only calculate delivery fee for distance-based shops
            if (selectedShop?.deliveryFeeMode === 'distance') {
                console.log('📍 Valid coordinates detected for distance-based shop, calculating delivery fee');
                calculateRealTimeDeliveryFee();
            } else {
                console.log('📍 Fixed delivery fee shop - no calculation needed');
            }
        }
    }, [deliveryAddress.coordinates, calculateRealTimeDeliveryFee, selectedShop?.deliveryFeeMode]);

    // Auto-geocode address when user stops typing (debounced)
    useEffect(() => {
        const { street, city, state } = deliveryAddress;

        // Only geocode for distance-based shops (fixed fee shops don't need coordinates)
        if (street && city && state && !deliveryAddress.coordinates && !isGeocoding && !hasGeocodedAddress && selectedShop?.deliveryFeeMode === 'distance') {
            console.log('🗺️ Starting auto-geocoding for distance-based shop:', { street, city, state });

            const timeoutId = setTimeout(() => {
                geocodeCurrentAddress();
                setHasGeocodedAddress(true);
            }, 3000); // Wait 3 seconds after user stops typing

            return () => clearTimeout(timeoutId);
        }
    }, [deliveryAddress.street, deliveryAddress.city, deliveryAddress.state, deliveryAddress.zipCode]);

    // Get order summary from cart context
    const orderSummary = getOrderSummary();

    const getShopName = (shopId) => {
        const id = typeof shopId === 'object' ? shopId._id : shopId;
        const match = shops.find((shop) => shop._id === id);
        return match ? match.name : 'Unknown Shop';
    };

    const handleInitialConfirmOrder = () => {
        // Show confirmation popup first
        setShowConfirmationPopup(true);
    };

    const handleFinalConfirmOrder = async () => {
        // Validate delivery address and contact information
        if (!deliveryAddress.street.trim() || !deliveryAddress.city.trim() || !deliveryAddress.state.trim()) {
            alert('Please fill in all required address fields (Street, City, State)');
            return;
        }

        // Enhanced validation for contact name
        if (!deliveryAddress.contactName.trim()) {
            alert('❌ Contact Name is required. Please enter the name of the person who will receive the order.');
            return;
        }

        if (deliveryAddress.contactName.trim().length < 2) {
            alert('❌ Contact Name must be at least 2 characters long.');
            return;
        }

        // Enhanced validation for contact phone
        if (!deliveryAddress.contactPhone.trim()) {
            alert('❌ Contact Phone Number is required. Please enter a valid phone number for delivery coordination.');
            return;
        }

        // Validate phone number (should be exactly 10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        const cleanPhone = deliveryAddress.contactPhone.replace(/\s+/g, '');

        if (!phoneRegex.test(cleanPhone)) {
            alert('❌ Please enter a valid 10-digit phone number (numbers only, no spaces or special characters).');
            return;
        }

        // Additional phone validation - check for common invalid patterns
        if (cleanPhone === '0000000000' || cleanPhone === '1111111111' || cleanPhone === '1234567890') {
            alert('❌ Please enter a valid phone number. The number you entered appears to be invalid.');
            return;
        }

        try {
            setLoading(true);
            setGeocodingError('');
            setIsGeocoding(true);

            // Geocode the address to get coordinates
            const coordinates = await geocodeAddress({
                street: deliveryAddress.street,
                city: deliveryAddress.city,
                state: deliveryAddress.state,
                zipCode: deliveryAddress.zipCode
            });

            console.log('Geocoded coordinates:', coordinates);
            setIsGeocoding(false);

            // Format the full address for display
            const fullAddress = [
                deliveryAddress.street,
                deliveryAddress.city,
                deliveryAddress.state,
                deliveryAddress.zipCode,
                'India'
            ].filter(Boolean).join(', ');

            // Format items for order placement
            const formattedItems = cartItems.map(item => ({
                productId: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                notes: item.notes || ''
            }));

            // Place order without payment
            console.log('🛒 Selected shop:', selectedShop);

            // Extract the actual shop ID from the shop object
            let shopId;

            // Handle different shop data structures
            if (selectedShop.data && selectedShop.data.shop && selectedShop.data.shop._id) {
                // Structure: {success: true, data: {shop: {_id: "...", ...}}}
                shopId = selectedShop.data.shop._id;
            } else if (typeof selectedShop._id === 'string') {
                // Structure: {_id: "...", ...}
                shopId = selectedShop._id;
            } else if (selectedShop._id && selectedShop._id._id) {
                // Structure: {_id: {_id: "...", ...}}
                shopId = selectedShop._id._id;
            } else {
                console.error('🛒 Invalid shop structure:', selectedShop);
                throw new Error('Invalid shop ID format');
            }

            console.log('🛒 Extracted shop ID:', shopId);

            const response = await api.post('/orders', {
                shopId: shopId,
                items: formattedItems,
                deliveryAddress: {
                    street: deliveryAddress.street,
                    city: deliveryAddress.city,
                    state: deliveryAddress.state,
                    zipCode: deliveryAddress.zipCode,
                    coordinates: {
                        lat: coordinates.lat,
                        lng: coordinates.lng
                    },
                    formattedAddress: fullAddress,
                    instructions: deliveryAddress.instructions,
                    contactName: deliveryAddress.contactName.trim(),
                    contactPhone: `${deliveryAddress.countryCode}${deliveryAddress.contactPhone.replace(/\s+/g, '')}`
                },
                paymentMethod: 'cash' // Default to cash on delivery
            });

            if (response.data.success) {
                // Close popup and clear cart
                setShowConfirmationPopup(false);
                clearCart();

                // Navigate to order confirmation page
                navigate(`/order-confirmation/${response.data.data.order._id}`, {
                    state: { orderNumber: response.data.data.order.orderNumber }
                });
            } else {
                alert('Failed to place order. Please try again.');
            }

        } catch (err) {
            console.error('Order placement error:', err);
            const errorMessage = isGeocoding
                ? `Error processing address: ${err.message || 'Could not determine location coordinates'}`
                : (err.response?.data?.message || 'Failed to place order. Please try again.');

            setGeocodingError(errorMessage);
            alert(errorMessage);
        } finally {
            setLoading(false);
            setIsGeocoding(false);
        }
    };

    const handlePopupConfirm = () => {
        // User confirmed they understand the payment process
        handleFinalConfirmOrder();
    };

    const handlePopupCancel = () => {
        // User cancelled the order
        setShowConfirmationPopup(false);
    };

    // Get current GPS location
    const getCurrentGPSLocation = async () => {
        try {
            setIsGeocoding(true);
            setGeocodingError('');

            console.log('📍 Getting current GPS location...');

            // Try to get the most accurate location possible
            console.log('📍 Attempting high-accuracy GPS location...');
            const location = await getCurrentLocation();

            if (location) {
                console.log('📍 Got GPS coordinates:', location);
                console.log('📍 Location accuracy:', location.accuracy ? `±${Math.round(location.accuracy)}m` : 'Unknown');

                // Try to reverse geocode to get address
                try {
                    // Simple reverse geocoding using Nominatim (free)
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.address) {
                            const addr = data.address;

                            // Auto-fill address fields
                            setDeliveryAddress(prev => ({
                                ...prev,
                                street: `${addr.house_number || ''} ${addr.road || addr.street || ''}`.trim() || 'Current Location',
                                city: addr.city || addr.town || addr.village || addr.suburb || '',
                                state: addr.state || addr.state_district || '',
                                zipCode: addr.postcode || '',
                                coordinates: {
                                    lat: location.lat,
                                    lng: location.lng,
                                    accuracy: location.accuracy
                                }
                            }));

                            console.log('📍 Address auto-filled:', addr);
                        } else {
                            // Fallback: just set coordinates
                            setDeliveryAddress(prev => ({
                                ...prev,
                                street: 'Current Location',
                                coordinates: {
                                    lat: location.lat,
                                    lng: location.lng
                                }
                            }));
                        }
                    }
                } catch (reverseError) {
                    console.log('⚠️ Reverse geocoding failed, using coordinates only');
                    // Still set coordinates
                    setDeliveryAddress(prev => ({
                        ...prev,
                        street: 'Current Location',
                        coordinates: {
                            lat: location.lat,
                            lng: location.lng
                        }
                    }));
                }

                setGeocodingError('');
            } else {
                throw new Error('Could not get current location');
            }

        } catch (error) {
            console.error('❌ GPS location error:', error);
            setGeocodingError('Could not get current location. Please enable location access.');
        } finally {
            setIsGeocoding(false);
        }
    };

    // Auto-geocode address when user finishes typing
    const geocodeCurrentAddress = async () => {
        const { street, city, state, zipCode } = deliveryAddress;

        // Check if we have enough address info
        if (!street || !city || !state) {
            return;
        }

        try {
            setIsGeocoding(true);
            setGeocodingError('');

            const fullAddress = `${street}, ${city}, ${state}${zipCode ? ', ' + zipCode : ''}, India`;
            console.log('🗺️ Auto-geocoding address:', { street, city, state, zipCode });
            console.log('🗺️ Full address string:', fullAddress);

            const coordinates = await geocodeAddress({
                street,
                city,
                state,
                zipCode
            });

            console.log('📍 Got coordinates:', coordinates);
            console.log('📍 Coordinates validation:', {
                lat: coordinates.lat,
                lng: coordinates.lng,
                isValidLat: coordinates.lat >= -90 && coordinates.lat <= 90,
                isValidLng: coordinates.lng >= -180 && coordinates.lng <= 180,
                isInIndia: coordinates.lat >= 6 && coordinates.lat <= 37 && coordinates.lng >= 68 && coordinates.lng <= 97
            });

            // Validate coordinates before setting
            if (!coordinates.lat || !coordinates.lng ||
                coordinates.lat < 6 || coordinates.lat > 37 ||
                coordinates.lng < 68 || coordinates.lng > 97) {

                console.error('❌ Invalid coordinates received:', coordinates);
                console.error('❌ Address that failed:', { street, city, state, zipCode });

                // For testing: Use fallback coordinates based on city
                let fallbackCoords = null;
                const cityLower = city.toLowerCase();
                const stateLower = state.toLowerCase();

                if (cityLower.includes('indore') || stateLower.includes('madhya')) {
                    fallbackCoords = { lat: 22.7196, lng: 75.8577 }; // Indore center
                } else if (cityLower.includes('mumbai') || cityLower.includes('bombay')) {
                    fallbackCoords = { lat: 19.0760, lng: 72.8777 }; // Mumbai center
                } else if (cityLower.includes('delhi')) {
                    fallbackCoords = { lat: 28.6139, lng: 77.2090 }; // Delhi center
                } else if (cityLower.includes('bangalore') || cityLower.includes('bengaluru')) {
                    fallbackCoords = { lat: 12.9716, lng: 77.5946 }; // Bangalore center
                }

                if (fallbackCoords) {
                    console.log('🔧 Using fallback coordinates for', city, ':', fallbackCoords);

                    setDeliveryAddress(prev => ({
                        ...prev,
                        coordinates: fallbackCoords
                    }));
                    setGeocodingError('');
                    return;
                }

                throw new Error(`Invalid coordinates for India: ${coordinates.lat}, ${coordinates.lng}`);
            }

            // Update delivery address with coordinates
            setDeliveryAddress(prev => ({
                ...prev,
                coordinates: {
                    lat: coordinates.lat,
                    lng: coordinates.lng
                }
            }));

            setGeocodingError('');

        } catch (error) {
            console.error('❌ Geocoding error:', error);
            setGeocodingError('Could not locate address. Please check and try again.');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleAddressChange = (field, value) => {
        setDeliveryAddress(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear previous coordinates when address changes
        if (['street', 'city', 'state', 'zipCode'].includes(field)) {
            setDeliveryAddress(prev => ({
                ...prev,
                coordinates: null
            }));
            setHasGeocodedAddress(false); // Reset geocoding flag
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="checkout-container">
                <div className="checkout-wrapper">
                    <div className="checkout-header">
                        <h2>Your Cart is Empty</h2>
                        <p>Please add some items to your cart before proceeding to checkout.</p>
                    </div>
                    <div className="checkout-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleInitialConfirmOrder}
                            disabled={loading || isGeocoding}
                        >
                            {isGeocoding
                                ? 'Locating your address...'
                                : loading
                                    ? 'Placing Order...'
                                    : 'Confirm Order'}
                        </button>
                        {geocodingError && (
                            <div className="error-message" style={{ marginTop: '10px', color: 'red' }}>
                                {geocodingError}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <div className="checkout-wrapper">
                <div className="checkout-header">
                    <h2>Final Checkout</h2>
                    <p>Review your order and complete your purchase.</p>


                </div>

                <div className="checkout-content">
                    <div className="checkout-user-details">
                        <h3>Customer</h3>
                        <div className="user-info">
                            <p><span className="info-label">Name:</span> {user?.user?.name || user?.name}</p>
                            <p><span className="info-label">Email:</span> {user?.user?.email || user?.email}</p>
                        </div>
                    </div>

                    <div className="checkout-address">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>Delivery Address</h3>
                            <button
                                type="button"
                                onClick={getCurrentGPSLocation}
                                disabled={isGeocoding}
                                className="btn btn-primary"
                                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                            >
                                {isGeocoding ? '📍 Getting Location...' : '📍 Get My Location'}
                            </button>
                        </div>
                    </div>

                    <div className="address-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Street Address *</label>
                                <input
                                    type="text"
                                    value={deliveryAddress.street}
                                    onChange={(e) => handleAddressChange('street', e.target.value)}
                                    placeholder="Enter street address"
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>City *</label>
                                <input
                                    type="text"
                                    value={deliveryAddress.city}
                                    onChange={(e) => handleAddressChange('city', e.target.value)}
                                    placeholder="Enter city"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>State *</label>
                                <input
                                    type="text"
                                    value={deliveryAddress.state}
                                    onChange={(e) => handleAddressChange('state', e.target.value)}
                                    placeholder="Enter state"
                                    className="form-input"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>ZIP Code</label>
                                <input
                                    type="text"
                                    value={deliveryAddress.zipCode}
                                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                                    placeholder="Enter ZIP code"
                                    className="form-input"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Contact Name <span style={{ color: '#ff4444', fontWeight: 'bold' }}>*</span></label>
                                <input
                                    type="text"
                                    value={deliveryAddress.contactName}
                                    onChange={(e) => handleAddressChange('contactName', e.target.value)}
                                    placeholder="Enter contact person name (Required)"
                                    className={`form-input ${!deliveryAddress.contactName.trim() ? 'required-field' : ''}`}
                                    required
                                    minLength="2"
                                />
                                {!deliveryAddress.contactName.trim() && (
                                    <small style={{ color: '#ff4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        ⚠️ Contact name is required for delivery
                                    </small>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Contact Phone <span style={{ color: '#ff4444', fontWeight: 'bold' }}>*</span></label>
                                <div className="phone-input-group">
                                    <select
                                        value={deliveryAddress.countryCode}
                                        onChange={(e) => handleAddressChange('countryCode', e.target.value)}
                                        className="country-code-select"
                                    >
                                        <option value="+91">🇮🇳 +91</option>
                                        <option value="+1">🇺🇸 +1</option>
                                        <option value="+44">🇬🇧 +44</option>
                                        <option value="+61">🇦🇺 +61</option>
                                        <option value="+971">🇦🇪 +971</option>
                                        <option value="+65">🇸🇬 +65</option>
                                    </select>
                                    <input
                                        type="tel"
                                        value={deliveryAddress.contactPhone}
                                        onChange={(e) => {
                                            // Only allow numbers and limit to 10 digits
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            handleAddressChange('contactPhone', value);
                                        }}
                                        placeholder="Enter 10-digit phone number (Required)"
                                        className={`form-input phone-input ${!deliveryAddress.contactPhone.trim() || deliveryAddress.contactPhone.length !== 10 ? 'required-field' : ''}`}
                                        maxLength="10"
                                        required
                                    />
                                </div>
                                {(!deliveryAddress.contactPhone.trim() || deliveryAddress.contactPhone.length !== 10) && (
                                    <small style={{ color: '#ff4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        ⚠️ {!deliveryAddress.contactPhone.trim()
                                            ? 'Phone number is required for delivery coordination'
                                            : `Phone number must be exactly 10 digits (currently ${deliveryAddress.contactPhone.length})`}
                                    </small>
                                )}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Delivery Instructions</label>
                                <textarea
                                    value={deliveryAddress.instructions}
                                    onChange={(e) => handleAddressChange('instructions', e.target.value)}
                                    placeholder="Any special delivery instructions..."
                                    className="form-textarea"
                                    rows="3"
                                />
                            </div>
                        </div>

                        {/* Calculate Delivery Fee Button - Only show for distance-based shops */}
                        {deliveryAddress.street.trim() && deliveryAddress.city.trim() && deliveryAddress.state.trim() && !deliveryAddress.coordinates && selectedShop && selectedShop.deliveryFeeMode === 'distance' && (
                            <div className="form-row" style={{ marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={geocodeCurrentAddress}
                                    disabled={isGeocoding}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '0.75rem' }}
                                >
                                    {isGeocoding ? '🗺️ Calculating Delivery Fee...' : '🗺️ Calculate Delivery Fee'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Acceptance Time Estimate */}
                {loadingAcceptanceTime ? (
                    <div className="acceptance-time-section">
                        <div className="acceptance-time-loading">
                            <span>⏳ Calculating order acceptance time...</span>
                        </div>
                    </div>
                ) : acceptanceTime && (
                    <div className="acceptance-time-section">
                        <div className="acceptance-time-card">
                            <div className="acceptance-time-header">
                                <span className="time-icon">⏱️</span>
                                <h3>Order Acceptance Time</h3>
                            </div>
                            <div className="acceptance-time-content">
                                <div className="estimated-time">
                                    <span className="time-value">{acceptanceTime.estimatedTime}</span>
                                    <span className="time-label">Estimated acceptance time</span>
                                </div>
                                <div className="queue-info">
                                    <span className="queue-count">{acceptanceTime.pendingOrdersCount}</span>
                                    <span className="queue-label">orders ahead of you</span>
                                </div>
                            </div>
                            <div className="acceptance-time-note">
                                <span className="note-icon">💡</span>
                                <p>This is an estimate based on current order queue. Your order will be accepted by a personal shopper within this timeframe.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="checkout-order-summary">
                    <h3>Order Summary</h3>

                    {selectedShop && (
                        <div className="shop-order-section">
                            <h4 className="shop-name">{selectedShop.name}</h4>
                            {cartItems.map((item, i) => (
                                <div key={i} className="order-item">
                                    <div className="order-item-details">
                                        <span className="product-name">{item.name}</span>
                                        <span className="product-quantity">x {item.quantity}</span>
                                    </div>
                                    <span className="product-price">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="order-total-breakdown">
                        <div className="total-row">
                            <span>Items ({orderSummary.itemCount})</span>
                            <span>{formatPrice(orderSummary.subtotal)}</span>
                        </div>
                        <div className="total-row">
                            <span>Delivery Fee</span>
                            <span>{formatPrice(orderSummary.deliveryFee)}</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="total-row total-grand">
                            <span><strong>Total Amount</strong></span>
                            <span><strong>{formatPrice(orderSummary.total)}</strong></span>
                        </div>
                    </div>
                </div>

                <button
                    className="place-order-btn"
                    onClick={handleInitialConfirmOrder}
                    disabled={
                        loading ||
                        !deliveryAddress.street.trim() ||
                        !deliveryAddress.city.trim() ||
                        !deliveryAddress.state.trim() ||
                        !deliveryAddress.contactName.trim() ||
                        !deliveryAddress.contactPhone.trim() ||
                        deliveryAddress.contactPhone.length !== 10
                    }
                >
                    {loading ? 'Placing Order...' : '✅ Confirm Order'}
                </button>
            </div>

            {/* Order Confirmation Popup */}
            {showConfirmationPopup && (
                <OrderConfirmationPopup
                    isOpen={showConfirmationPopup}
                    onConfirm={handlePopupConfirm}
                    onCancel={handlePopupCancel}
                />
            )}
        </div>
    );
};

export default FinalCheckoutPage;