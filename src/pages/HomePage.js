import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PermanentNotices from '../components/PermanentNotices';
import Logo from '../components/Logo';
import axios from 'axios';
import './HomePage.css';

const HomePage = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    // eslint-disable-next-line no-unused-vars
    const [categories] = useState(['all', 'grocery', 'pharmacy', 'electronics', 'clothing', 'restaurant']);

    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const searchInputRef = useRef(null);

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
                // Sort shops: highest orders first (absolute priority), then open shops before closed shops
                const sortedShops = shopsData.sort((a, b) => {
                    // First priority: Order count (highest first) - ABSOLUTE PRIORITY
                    const aOrders = a.orderCount || a.totalOrders || 0;
                    const bOrders = b.orderCount || b.totalOrders || 0;
                    if (aOrders !== bOrders) {
                        return bOrders - aOrders; // Higher orders first
                    }
                    
                    // Second priority: Open status (open shops first)
                    const aOpen = a.isOpenNow || isShopOpen(a);
                    const bOpen = b.isOpenNow || isShopOpen(b);
                    if (aOpen !== bOpen) {
                        return bOpen - aOpen; // Open (true) comes before closed (false)
                    }
                    
                    // Third priority: Rating (highest first)
                    const aRating = a.rating?.average || 0;
                    const bRating = b.rating?.average || 0;
                    return bRating - aRating;
                });
                
                setShops(sortedShops);
                setError('');
                console.log('✅ Shops loaded and sorted successfully:', sortedShops.length);
            } else {
                console.log('⚠️ No shops from API, using sample data');
                setShops(filterSampleShops());
                setError('Showing sample shops - backend may be updating');
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

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

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
            
            const aRating = a.rating?.average || 0;
            const bRating = b.rating?.average || 0;
            return bRating - aRating;
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
        // Search will be triggered by useEffect when searchTerm changes
    };

    const retryFetch = () => {
        setError('');
        fetchShops();
    };

    const clearSearch = () => {
        setSearchTerm('');
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
                </div>
            </div>



            {/* Shops Section */}
            <div className="shops-section">
                <div className="shops-content">
                    <div className="section-header">
                        <h2>
                            {searchTerm ? `Search Results for "${searchTerm}"` : 'Available Shops'}
                            <span className="shops-count">({filteredShops.length} shops)</span>
                        </h2>
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

                                            {shop.deliveryFee !== undefined && (
                                                <div className="delivery-fee">
                                                    {shop.deliveryFee === 0
                                                        ? '🚚 Free Delivery'
                                                        : `🚚 ₹${shop.deliveryFee} delivery`
                                                    }
                                                </div>
                                            )}

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