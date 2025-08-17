import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { shopsAPI, apiCall } from '../services/api';
import './HomePage.css';

const HomePage = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showSearch, setShowSearch] = useState(false);
    const [categories] = useState([
        { id: 'all', name: 'All Categories', icon: '🏪', color: '#4a90e2' },
        { id: 'grocery', name: 'Grocery', icon: '🛒', color: '#27ae60' },
        { id: 'pharmacy', name: 'Pharmacy', icon: '💊', color: '#e74c3c' },
        { id: 'electronics', name: 'Electronics', icon: '📱', color: '#9b59b6' },
        { id: 'clothing', name: 'Fashion', icon: '👕', color: '#f39c12' },
        { id: 'restaurant', name: 'Restaurants', icon: '🍽️', color: '#e67e22' }
    ]);

    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

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

            const params = {};
            if (selectedCategory !== 'all') params.category = selectedCategory;
            if (searchTerm) params.search = searchTerm;
            params.limit = 20;

            console.log('🔄 Fetching shops with params:', params);

            const result = await apiCall(shopsAPI.getAll, params);

            if (result.success) {
                console.log('📦 API Response:', result.data);

                // Handle different response formats
                let shopsData = [];
                if (result.data.success) {
                    shopsData = result.data.data?.shops || result.data.shops || [];
                } else if (Array.isArray(result.data)) {
                    shopsData = result.data;
                } else if (result.data.shops) {
                    shopsData = result.data.shops;
                }

                if (shopsData.length > 0) {
                    setShops(shopsData);
                    setError('');
                } else {
                    console.log('No shops from API, using sample data');
                    setShops(filterSampleShops());
                    setError('Showing sample shops - backend may be updating');
                }
            } else {
                console.log('API call failed, using sample data');
                setShops(filterSampleShops());
                setError('Using sample data - please check your internet connection');
            }

        } catch (err) {
            console.error('❌ Failed to fetch shops:', err);
            console.log('Using sample shops as fallback');
            setShops(filterSampleShops());
            setError('Using sample data - please check your internet connection');
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, searchTerm]);

    useEffect(() => {
        fetchShops();
    }, [fetchShops]);

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
        fetchShops();
    };

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId);
        setShowSearch(false);
    };

    const handleQuickAction = (action) => {
        switch (action) {
            case 'orders':
                navigate('/orders');
                break;
            case 'cart':
                navigate('/cart');
                break;
            case 'profile':
                navigate('/profile');
                break;
            default:
                break;
        }
    };

    if (loading) {
        return (
            <div className="modern-home-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Discovering amazing shops...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="modern-home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1 className="hero-title">
                            <span className="gradient-text">DelhiveryWay</span>
                            <br />
                            <span className="hero-subtitle">Your Gateway to Everything</span>
                        </h1>
                        <p className="hero-description">
                            Discover the best shops, restaurants, and services in your area. 
                            Fast delivery, great prices, and exceptional service.
                        </p>
                        {user && (
                            <div className="user-welcome">
                                <span className="welcome-icon">👋</span>
                                <span>Welcome back, {user.name}!</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="hero-search">
                        <form onSubmit={handleSearch} className="hero-search-form">
                            <div className="search-input-group">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder="What are you looking for today?"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="hero-search-input"
                                />
                                <button type="submit" className="hero-search-btn">
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div className="hero-visual">
                    <div className="floating-elements">
                        <div className="floating-card card-1">🛒</div>
                        <div className="floating-card card-2">📱</div>
                        <div className="floating-card card-3">🍕</div>
                        <div className="floating-card card-4">💊</div>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            {user && (
                <section className="quick-actions-section">
                    <div className="quick-actions-grid">
                        <button 
                            className="quick-action-card"
                            onClick={() => handleQuickAction('orders')}
                        >
                            <div className="action-icon">📋</div>
                            <span>My Orders</span>
                        </button>
                        <button 
                            className="quick-action-card"
                            onClick={() => handleQuickAction('cart')}
                        >
                            <div className="action-icon">🛒</div>
                            <span>Shopping Cart</span>
                        </button>
                        <button 
                            className="quick-action-card"
                            onClick={() => handleQuickAction('profile')}
                        >
                            <div className="action-icon">👤</div>
                            <span>Profile</span>
                        </button>
                    </div>
                </section>
            )}

            {/* Featured Categories */}
            <section className="categories-section">
                <div className="section-header">
                    <h2>Explore Categories</h2>
                    <p>Find exactly what you need</p>
                </div>
                <div className="categories-grid">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id)}
                            className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
                            style={{ '--category-color': category.color }}
                        >
                            <div className="category-icon">{category.icon}</div>
                            <span className="category-name">{category.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Shops Section */}
            <section className="shops-section">
                <div className="section-header">
                    <h2>
                        {searchTerm ? `Search Results for "${searchTerm}"` : 'Available Shops'}
                    </h2>
                    <div className="shops-meta">
                        <span className="shops-count">{shops.length} shops available</span>
                        {error && (
                            <div className="info-banner">
                                <span className="info-icon">ℹ️</span>
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                {shops.length === 0 ? (
                    <div className="no-shops">
                        <div className="no-shops-icon">🏪</div>
                        <h3>No shops found</h3>
                        <p>
                            {searchTerm || selectedCategory !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'No shops are currently available'
                            }
                        </p>
                        <button onClick={fetchShops} className="retry-btn">
                            <span className="retry-icon">🔄</span>
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="shops-grid">
                        {shops.map(shop => (
                            <div
                                key={shop._id}
                                className="modern-shop-card"
                                onClick={() => handleShopClick(shop._id)}
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        handleShopClick(shop._id);
                                    }
                                }}
                            >
                                <div className="shop-card-header">
                                    <div className="shop-image">
                                        {shop.images && shop.images.length > 0 ? (
                                            <img
                                                src={shop.images[0]}
                                                alt={shop.name}
                                                onError={(e) => {
                                                    e.target.src = '/placeholder-shop.png';
                                                }}
                                            />
                                        ) : (
                                            <div className="shop-placeholder">
                                                <span className="shop-icon">🏪</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="shop-status-badge">
                                        <span className={`status-indicator ${shop.isOpenNow ? 'open' : 'closed'}`}>
                                            {shop.isOpenNow ? '🟢 Open' : '🔴 Closed'}
                                        </span>
                                    </div>
                                </div>

                                <div className="shop-card-body">
                                    <div className="shop-main-info">
                                        <h3 className="shop-name">{shop.name}</h3>
                                        <div className="shop-category-badge">
                                            <span className="category-text">{shop.category}</span>
                                        </div>
                                    </div>

                                    {shop.description && (
                                        <p className="shop-description">
                                            {shop.description.length > 80
                                                ? `${shop.description.substring(0, 80)}...`
                                                : shop.description
                                            }
                                        </p>
                                    )}

                                    <div className="shop-rating-section">
                                        <div className="rating-display">
                                            <div className="stars">
                                                {[...Array(5)].map((_, i) => (
                                                    <span 
                                                        key={i} 
                                                        className={`star ${i < Math.floor(shop.rating?.average || 4) ? 'filled' : ''}`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="rating-score">
                                                {shop.rating?.average?.toFixed(1) || '4.0'}
                                            </span>
                                            <span className="rating-count">
                                                ({shop.rating?.count || 0} reviews)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="shop-details-grid">
                                        <div className="detail-item">
                                            <span className="detail-icon">📍</span>
                                            <span className="detail-text">
                                                {shop.address?.city}, {shop.address?.state}
                                            </span>
                                        </div>
                                        
                                        {shop.deliveryFee !== undefined && (
                                            <div className="detail-item">
                                                <span className="detail-icon">🚚</span>
                                                <span className={`detail-text ${shop.deliveryFee === 0 ? 'free-delivery' : ''}`}>
                                                    {shop.deliveryFee === 0
                                                        ? 'Free Delivery'
                                                        : `₹${shop.deliveryFee} delivery`
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {shop.productCount !== undefined && (
                                            <div className="detail-item">
                                                <span className="detail-icon">📦</span>
                                                <span className="detail-text">
                                                    {shop.productCount} products
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="shop-card-footer">
                                    <button className="view-shop-btn">
                                        <span>View Shop</span>
                                        <span className="arrow-icon">→</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default HomePage;