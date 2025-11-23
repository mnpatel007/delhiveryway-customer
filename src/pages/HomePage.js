import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import PermanentNotices from '../components/PermanentNotices';
import ActiveOrdersWidget from '../components/ActiveOrdersWidget';
import Logo from '../components/Logo';
import { calculateDeliveryFeesBulk, getDeliveryFeeDisplay, getCustomerLocation, getCurrentLocation } from '../utils/deliveryCalculator';
import axios from 'axios';
import './HomePage.css';

const HomePage = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // `searchTerm` is the applied filter used when fetching shops.
    // `query` is the live input bound to the search box (used for suggestions).
    const [searchTerm, setSearchTerm] = useState('');
    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [deliveryFees, setDeliveryFees] = useState({});
    const [customerLocation, setCustomerLocation] = useState(null);
    const [locationPermission, setLocationPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
    const [gettingLocation, setGettingLocation] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [categories] = useState(['all', 'grocery', 'pharmacy', 'electronics', 'clothing', 'restaurant']);

    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const searchInputRef = useRef(null);
    const { indexLoaded, searchLocal } = useSearch();
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Sample shops as fallback
    const sampleShops = [
        {
            _id: 'sample1',
            name: 'Fresh Mart Grocery',
            description: 'Your neighborhood grocery store with fresh produce and daily essentials',
            category: 'grocery',
            address: {
                street: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400001'
            },
            rating: { average: 4.5, count: 120 },
            deliveryFee: 0,
            productCount: 50,
            isOpenNow: true,
            images: []
        },
        {
            _id: 'sample2',
            name: 'MedPlus Pharmacy',
            description: 'Trusted pharmacy with medicines and health products',
            category: 'pharmacy',
            address: {
                street: '456 Health Avenue',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400002'
            },
            rating: { average: 4.8, count: 85 },
            deliveryFee: 25,
            productCount: 200,
            isOpenNow: true,
            images: []
        },
        {
            _id: 'sample3',
            name: 'TechZone Electronics',
            description: 'Latest gadgets and electronics at competitive prices',
            category: 'electronics',
            address: {
                street: '789 Tech Park',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400003'
            },
            rating: { average: 4.3, count: 95 },
            deliveryFee: 50,
            productCount: 150,
            isOpenNow: true,
            images: []
        },
        {
            _id: 'sample4',
            name: 'Fashion Hub',
            description: 'Trendy clothing and accessories for all ages',
            category: 'clothing',
            address: {
                street: '321 Fashion Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400004'
            },
            rating: { average: 4.2, count: 110 },
            deliveryFee: 30,
            productCount: 80,
            isOpenNow: false,
            images: []
        },
        {
            _id: 'sample5',
            name: 'Spice Garden Restaurant',
            description: 'Authentic Indian cuisine with home-style cooking',
            category: 'restaurant',
            address: {
                street: '654 Food Court',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400005'
            },
            rating: { average: 4.6, count: 200 },
            deliveryFee: 40,
            productCount: 25,
            isOpenNow: true,
            images: []
        }
    ];

    const fetchShops = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const API_URL = process.env.REACT_APP_API_URL || 'https://delhiveryway-backend-1.onrender.com/api';

            const params = new URLSearchParams();
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            if (searchTerm) params.append('search', searchTerm);
            params.append('limit', '20');

            const url = `${API_URL}/shops?${params.toString()}`;
            console.log('🔄 Fetching shops from:', url);

            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('📦 API Response:', response.data);

            // Handle different response formats
            let shopsData = [];
            if (response.data.success) {
                shopsData = response.data.data?.shops || response.data.shops || [];
            } else if (Array.isArray(response.data)) {
                shopsData = response.data;
            } else if (response.data.shops) {
                shopsData = response.data.shops;
            }

            if (shopsData.length > 0) {
                // Sort shops: highest orders first, then open shops, then number of items
                const sortedShops = shopsData.sort((a, b) => {
                    // First priority: Order count (highest first)
                    const aOrders = a.orderCount || a.totalOrders || 0;
                    const bOrders = b.orderCount || b.totalOrders || 0;
                    if (aOrders !== bOrders) {
                        return bOrders - aOrders;
                    }

                    // Second priority: Open status (open shops first)
                    const aOpen = a.isOpenNow || isShopOpen(a);
                    const bOpen = b.isOpenNow || isShopOpen(b);
                    if (aOpen !== bOpen) {
                        return bOpen - aOpen;
                    }

                    // Third priority: Number of items (highest first)
                    const aItems = a.productCount || 0;
                    const bItems = b.productCount || 0;
                    return bItems - aItems;
                });

                setShops(sortedShops);
                setError('');
                console.log('✅ Shops loaded and sorted successfully:', sortedShops.length);

                // Get location and calculate delivery fees
                requestLocationAndCalculateFees(sortedShops);
            } else {
                console.log('⚠️ No shops from API, using sample data');
                const sampleShops = filterSampleShops();
                setShops(sampleShops);
                setError('Showing sample shops - backend may be updating');
                requestLocationAndCalculateFees(sampleShops);
            }

        } catch (err) {
            console.error('❌ Failed to fetch shops:', err);
            console.log('🔄 Using sample shops as fallback');
            setShops(filterSampleShops());
            setError('Using sample data - please check your internet connection or try again later');
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, searchTerm]);

    // Get user's current location for accurate delivery fees
    const requestLocationAndCalculateFees = useCallback(async (shopsData) => {
        if (!shopsData || shopsData.length === 0) {
            console.log('📍 No shops available for delivery fee calculation');
            return;
        }

        setGettingLocation(true);

        try {
            // First try to get current location (most accurate)
            let location = await getCurrentLocation();

            if (location) {
                setLocationPermission('granted');
                setCustomerLocation(location);
                console.log('📍 Using current GPS location for delivery fees');
            } else {
                // Fallback to saved location
                location = getCustomerLocation();
                if (location) {
                    setCustomerLocation(location);
                    console.log('📍 Using saved location for delivery fees');
                } else {
                    setLocationPermission('denied');
                    console.log('📍 No location available for delivery fee calculation');
                    return;
                }
            }

            // Calculate delivery fees with the obtained location
            const shopIds = shopsData.map(shop => shop._id).filter(id => id && !id.startsWith('sample'));

            if (shopIds.length === 0) {
                console.log('📍 No real shops to calculate delivery fees for');
                return;
            }

            console.log('🚚 Calculating delivery fees for', shopIds.length, 'shops using location:', location);
            const feeResults = await calculateDeliveryFeesBulk(shopIds, location);

            const feesMap = {};
            feeResults.forEach(result => {
                if (result.shopId && !result.error) {
                    // Store the complete result to access discount info
                    feesMap[result.shopId] = {
                        deliveryFee: result.deliveryFee,
                        originalDeliveryFee: result.originalDeliveryFee,
                        discountApplied: result.discountApplied
                    };
                }
            });

            setDeliveryFees(feesMap);
            console.log('✅ Delivery fees calculated:', feesMap);

        } catch (error) {
            console.error('❌ Error getting location or calculating delivery fees:', error);
        } finally {
            setGettingLocation(false);
        }
    }, []);

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

    // Ensure when arriving on HomePage (including via back navigation) we start at the top
    useEffect(() => {
        if (location && (location.pathname === '/' || location.pathname === '')) {
            try {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            } catch (e) {
                // fallback
                window.scrollTo(0, 0);
            }
        }
    }, [location.key, location.pathname]);

    // Automatically request location on page load for better UX
    useEffect(() => {
        const autoRequestLocation = async () => {
            // Check if we already have a recent location
            const existingLocation = getCustomerLocation();
            if (existingLocation) {
                setCustomerLocation(existingLocation);
                setLocationPermission('granted');
                return;
            }

            // Auto-request location if user hasn't denied it before
            const locationDenied = localStorage.getItem('locationDenied');
            if (!locationDenied) {
                console.log('📍 Auto-requesting location for better delivery fee accuracy');
                try {
                    const location = await getCurrentLocation();
                    if (location) {
                        setCustomerLocation(location);
                        setLocationPermission('granted');
                        // Recalculate fees with new location if shops are already loaded
                        if (shops.length > 0) {
                            requestLocationAndCalculateFees(shops);
                        }
                    }
                } catch (error) {
                    console.log('📍 Auto location request failed, will show manual prompt');
                    localStorage.setItem('locationDenied', 'true');
                    setLocationPermission('denied');
                }
            } else {
                setLocationPermission('denied');
            }
        };

        // Small delay to let the page load first
        setTimeout(autoRequestLocation, 1000);
    }, [shops, requestLocationAndCalculateFees]);

    // Helper function to check if shop is currently open
    const isShopOpen = (shop) => {
        if (!shop?.operatingHours) return true; // Default to open if no hours defined

        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const day = dayNames[istTime.getDay()];
        const currentTime = istTime.toTimeString().slice(0, 5);

        const todayHours = shop.operatingHours[day];
        if (!todayHours || todayHours.closed) return false;
        if (!todayHours.open || !todayHours.close) return true;

        return currentTime >= todayHours.open && currentTime <= todayHours.close;
    };

    const filterSampleShops = () => {
        let filtered = sampleShops;

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(shop => shop.category === selectedCategory);
        }

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(shop =>
                shop.name.toLowerCase().includes(searchLower) ||
                shop.description.toLowerCase().includes(searchLower) ||
                shop.category.toLowerCase().includes(searchLower)
            );
        }

        // Sort sample shops same way as API shops
        filtered.sort((a, b) => {
            const aOrders = a.orderCount || 0;
            const bOrders = b.orderCount || 0;
            if (aOrders !== bOrders) {
                return bOrders - aOrders;
            }

            const aOpen = a.isOpenNow;
            const bOpen = b.isOpenNow;
            if (aOpen !== bOpen) {
                return bOpen ? 1 : -1;
            }

            const aItems = a.productCount || 0;
            const bItems = b.productCount || 0;
            return bItems - aItems;
        });

        return filtered;
    };

    const handleShopClick = (shopId) => {
        if (shopId.startsWith('sample')) {
            alert('This is sample data. Please wait for the backend to be fully deployed.');
            return;
        }
        navigate(`/shop/${shopId}`);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Apply the live query as the search filter which will trigger fetchShops
        setSearchTerm(query.trim());
        setShowSuggestions(false);
    };

    // Instant suggestions using local Fuse index (small debounce)
    useEffect(() => {
        // Use `query` (live input) for suggestions so typing doesn't trigger shop fetches.
        if (!query || query.trim().length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        let cancelled = false;
        const t = setTimeout(() => {
            if (indexLoaded) {
                const local = searchLocal(query, 500);
                if (cancelled) return;
                setSuggestions(local);
                setShowSuggestions(local.length > 0);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 120);

        return () => { cancelled = true; clearTimeout(t); };
    }, [query, indexLoaded]);

    const handleSuggestionClick = (item) => {
        // Clicking a suggestion should navigate to the shop and highlight the product.
        if (item.shopId && item.shopId._id) {
            navigate(`/shop/${item.shopId._id}?highlight=${encodeURIComponent(item._id)}`);
        } else if (item.shopId) {
            navigate(`/shop/${item.shopId}?highlight=${encodeURIComponent(item._id)}`);
        } else {
            // fallback: apply the item name as search filter
            setSearchTerm(item.name || '');
            navigate(`/search?q=${encodeURIComponent(item.name || '')}`);
        }
        setQuery('');
        setShowSuggestions(false);
    };

    const retryFetch = () => {
        setError('');
        fetchShops();
    };

    const clearSearch = () => {
        setSearchTerm('');
        setQuery('');
        setSelectedCategory('all');
        fetchShops();
    };

    // Use shops directly since filtering is already done in fetchShops
    const filteredShops = shops;

    if (loading) {
        return (
            <div className="home-container">
                <div className="loading-state">
                    <Logo size="large" showText={true} className="loading" />
                    <h3>Loading shops...</h3>
                    <p>Please wait while we fetch the latest shops</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="home-container">
                <div className="error-state">
                    <Logo size="large" showText={true} />
                    <h2>Oops! Something went wrong</h2>
                    <p>{error}</p>
                    <button onClick={retryFetch} className="btn btn-primary">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <PermanentNotices />
            {/* Header Section */}
            <div className="home-header">
                <div className="header-content">
                    <div className="header-logo">
                        <Logo size="large" showText={true} variant="white" />
                    </div>
                    <h1>Welcome to DelhiveryWay</h1>
                    {user && <p>Hello, {user.name}! Find shops near you.</p>}
                    {error && (
                        <div className="error-banner">
                            <p>ℹ️ {error}</p>
                        </div>
                    )}
                    {!customerLocation && (
                        <div className="location-prompt">
                            {gettingLocation ? (
                                <p>📍 Getting your location for accurate delivery fees...</p>
                            ) : locationPermission === 'denied' ? (
                                <>
                                    <p>📍 Enable location access for accurate delivery fees</p>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => requestLocationAndCalculateFees(shops)}
                                    >
                                        Enable Location
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p>📍 Allow location access to see exact delivery fees</p>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => requestLocationAndCalculateFees(shops)}
                                    >
                                        Get My Location
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {customerLocation && (
                        <div className="location-success">
                            <p>📍 Location detected - showing accurate delivery fees</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Orders Widget */}
            <ActiveOrdersWidget />

            {/* Shops Section */}
            <div className="shops-section">
                <div className="shops-content">
                    <div className="section-header">
                        <h2>
                            {searchTerm ? `Search Results for "${searchTerm}"` : 'Available Shops'}
                            <span className="shops-count">({filteredShops.length} shops)</span>
                        </h2>

                        {/* Search placed under Available Shops header */}
                        <div className="search-section" style={{ marginTop: 16 }}>
                            <div className="search-content">
                                <form className="search-form" onSubmit={handleSearch}>
                                    <div className="search-container">
                                        <span className="search-icon">🔍</span>
                                        <input
                                            ref={searchInputRef}
                                            className="search-input"
                                            type="search"
                                            placeholder="Search for products or shops (e.g. 'dal tadka')"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            aria-label="Search products"
                                        />

                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="home-search-suggestions" role="listbox">
                                                {(() => {
                                                    // Group suggestions by shop
                                                    const grouped = {};
                                                    suggestions.forEach(s => {
                                                        const shopId = s.shopId?._id || s.shopId || 'unknown';
                                                        const shopName = s.shopId?.name || 'Unknown Shop';
                                                        if (!grouped[shopId]) {
                                                            grouped[shopId] = { shopName, products: [] };
                                                        }
                                                        grouped[shopId].products.push(s);
                                                    });

                                                    return Object.entries(grouped).map(([shopId, { shopName, products }]) => (
                                                        <div key={shopId} className="suggestion-shop-group">
                                                            <div className="suggestion-shop-header">{shopName}</div>
                                                            {products.slice(0, 3).map(s => (
                                                                <div key={s._id} role="option" tabIndex={0} className="suggestion-item" onClick={() => handleSuggestionClick(s)}>
                                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                        {s.images?.[0] && <img src={s.images[0]} alt={s.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />}
                                                                        <div>
                                                                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                                                                            <div style={{ fontSize: 12, color: '#666' }}>₹{s.price}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" className="search-btn">Search</button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {filteredShops.length === 0 ? (
                        <div className="no-shops">
                            <div className="no-shops-icon">🏪</div>
                            <h3>No shops found</h3>
                            <p>
                                {searchTerm || selectedCategory !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'No shops are currently available'
                                }
                            </p>
                            <div className="no-shops-actions">
                                <button onClick={fetchShops} className="btn btn-primary">
                                    Try Again
                                </button>
                                <button onClick={clearSearch} className="btn btn-secondary">
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="shops-grid">
                            {filteredShops.map(shop => (
                                <div
                                    key={shop._id}
                                    className="shop-card"
                                    onClick={() => handleShopClick(shop._id)}
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            handleShopClick(shop._id);
                                        }
                                    }}
                                >
                                    <div className="shop-image">
                                        {shop.images && shop.images.length > 0 ? (
                                            <img
                                                src={shop.images[0]}
                                                alt={shop.name}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="shop-placeholder" style={{ display: shop.images && shop.images.length > 0 ? 'none' : 'flex' }}>
                                            <span className="shop-icon">🏪</span>
                                        </div>
                                    </div>

                                    <div className="shop-content">
                                        <div className="shop-header-info">
                                            <h3 className="shop-name">{shop.name}</h3>
                                            <span className="shop-category">{shop.category}</span>
                                        </div>

                                        {shop.description && (
                                            <p className="shop-description">
                                                {shop.description.length > 100
                                                    ? `${shop.description.substring(0, 100)}...`
                                                    : shop.description
                                                }
                                            </p>
                                        )}

                                        <div className="shop-details">
                                            <div className="shop-rating">
                                                <span className="rating-stars">
                                                    {'★'.repeat(Math.floor(shop.rating?.average || 4))}
                                                    {'☆'.repeat(5 - Math.floor(shop.rating?.average || 4))}
                                                </span>
                                                <span className="rating-text">
                                                    {shop.rating?.average?.toFixed(1) || '4.0'}
                                                    ({shop.rating?.count || 0})
                                                </span>
                                            </div>

                                            <div className="shop-location" title={`${shop.address?.street || ''}${shop.address?.street ? ', ' : ''}${shop.address?.city || ''}${shop.address?.city ? ', ' : ''}${shop.address?.state || ''}${shop.address?.zipCode ? ' ' + shop.address?.zipCode : ''}`}>
                                                📍 {(shop.address?.street && `${shop.address.street}, `) || ''}{shop.address?.city}{shop.address?.state ? `, ${shop.address.state}` : ''}{shop.address?.zipCode ? ` ${shop.address.zipCode}` : ''}
                                            </div>

                                            <div className="delivery-fee">
                                                {(() => {
                                                    // Use calculated delivery fee if available
                                                    const feeResult = deliveryFees[shop._id];

                                                    if (feeResult !== undefined) {
                                                        // Check if this is a detailed result with discount info
                                                        if (typeof feeResult === 'object' && feeResult.deliveryFee !== undefined) {
                                                            const hasDiscount = feeResult.originalDeliveryFee && feeResult.discountApplied;

                                                            if (hasDiscount) {
                                                                return (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85em' }}>
                                                                                🚚 ₹{feeResult.originalDeliveryFee}
                                                                            </span>
                                                                            <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                                                                                ₹{feeResult.deliveryFee}
                                                                            </span>
                                                                        </div>
                                                                        <span style={{ fontSize: '0.7em', color: '#28a745', fontWeight: '600' }}>
                                                                            💰 Save ₹{feeResult.originalDeliveryFee - feeResult.deliveryFee}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }

                                                            return feeResult.deliveryFee === 0
                                                                ? '🚚 Free Delivery'
                                                                : `🚚 ₹${feeResult.deliveryFee} delivery`;
                                                        }

                                                        // Simple number result (backward compatibility)
                                                        return feeResult === 0
                                                            ? '🚚 Free Delivery'
                                                            : `🚚 ₹${feeResult} delivery`;
                                                    }

                                                    // Fallback to display logic based on shop settings
                                                    const displayText = getDeliveryFeeDisplay(shop);
                                                    return `🚚 ${displayText}`;
                                                })()}
                                            </div>

                                            {shop.productCount !== undefined && (
                                                <div className="product-count">
                                                    {shop.productCount} products
                                                </div>
                                            )}

                                            <div className={`shop-status ${shop.isOpenNow ? 'open' : 'closed'}`}>
                                                {shop.isOpenNow ? '🟢 Open' : '🔴 Closed'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;