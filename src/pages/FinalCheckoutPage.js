import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { shopsAPI, apiCall, api } from '../services/api';
import { geocodeAddress } from '../utils/geocoding';
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
    const { user } = useContext(AuthContext);
    const { cartItems, selectedShop, getOrderSummary, clearCart } = useContext(CartContext);
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState([]);
    const [deliveryAddress, setDeliveryAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        instructions: '',
        contactName: user?.name || '',
        contactPhone: user?.phone || ''
    });
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodingError, setGeocodingError] = useState('');
    const navigate = useNavigate();

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

    // Get order summary from cart context
    const orderSummary = getOrderSummary();

    const getShopName = (shopId) => {
        const id = typeof shopId === 'object' ? shopId._id : shopId;
        const match = shops.find((shop) => shop._id === id);
        return match ? match.name : 'Unknown Shop';
    };

    const handleConfirmOrder = async () => {
        // Validate delivery address
        if (!deliveryAddress.street.trim() || !deliveryAddress.city.trim() || !deliveryAddress.state.trim()) {
            alert('Please fill in all required address fields (Street, City, State)');
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
            const response = await api.post('/orders', {
                shopId: selectedShop._id,
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
                    contactName: deliveryAddress.contactName,
                    contactPhone: deliveryAddress.contactPhone
                },
                paymentMethod: 'cash' // Default to cash on delivery
            });

            if (response.data.success) {
                // Clear cart after successful order placement
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

    const handleAddressChange = (field, value) => {
        setDeliveryAddress(prev => ({
            ...prev,
            [field]: value
        }));
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
                            onClick={handleConfirmOrder}
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
                        <h3>Delivery Address</h3>
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
                                    <label>Contact Name</label>
                                    <input
                                        type="text"
                                        value={deliveryAddress.contactName}
                                        onChange={(e) => handleAddressChange('contactName', e.target.value)}
                                        placeholder="Contact person name"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={deliveryAddress.contactPhone}
                                        onChange={(e) => handleAddressChange('contactPhone', e.target.value)}
                                        placeholder="Contact phone number"
                                        className="form-input"
                                    />
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
                        </div>
                    </div>

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
                            <div className="total-row">
                                <span>Taxes (5%)</span>
                                <span>{formatPrice(orderSummary.taxes)}</span>
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
                        onClick={handleConfirmOrder}
                        disabled={loading || !deliveryAddress.street.trim() || !deliveryAddress.city.trim() || !deliveryAddress.state.trim()}
                    >
                        {loading ? 'Placing Order...' : '✅ Confirm Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinalCheckoutPage;