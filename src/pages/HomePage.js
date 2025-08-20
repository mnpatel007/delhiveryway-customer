import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
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
                setShops(shopsData);
                setError('');
                console.log('✅ Shops loaded successfully:', shopsData.length);
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

    if (loading) {
        return (
            <div className="home-page-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <h3>Loading Shops...</h3>
                    <p>Please wait while we fetch the latest shops</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="home-page-container">
                <div className="error-state">
                    <div className="error-icon">🏪</div>
                    <h2>Oops! Something went wrong</h2>
                    <p>{error}</p>
                    <button onClick={retryFetch} className="retry-btn">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page-container">
            {/* Hero Section */}
            <div className="hero-section">
                <h1 className="hero-title">Welcome to DelhiveryWay</h1>
                <p className="hero-subtitle">
                    Discover amazing shops and products delivered right to your doorstep.
                    From groceries to electronics, we've got everything you need.
                </p>
                <div className="hero-actions">
                    <button className="hero-btn primary" onClick={() => document.querySelector('.search-input').focus()}>
                        🛍️ Start Shopping
                    </button>
                    <button className="hero-btn secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        📍 View All Shops
                    </button>
                </div>
            </div>

            {/* Search Section */}
            <div className="search-section">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search for shops, products, or categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <span className="search-icon">🔍</span>
                </div>
            </div>

            {/* Shops Section */}
            <div className="shops-section">
                <div className="section-header">
                    <h2 className="section-title">Discover Amazing Shops</h2>
                    <p className="section-subtitle">
                        Explore our curated collection of shops offering quality products and excellent service
                    </p>
                </div>

                {filteredShops.length === 0 ? (
                    <div className="no-shops">
                        <div className="no-shops-icon">🏪</div>
                        <h3>No Shops Found</h3>
                        <p>
                            {searchTerm
                                ? `No shops match "${searchTerm}". Try adjusting your search.`
                                : 'No shops are available at the moment. Please check back later.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="shops-grid">
                        {filteredShops.map(shop => (
                            <div key={shop._id} className="shop-card" onClick={() => navigate(`/shop/${shop._id}`)}>
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
                                    <div className="shop-emoji" style={{ display: shop.images && shop.images.length > 0 ? 'none' : 'flex' }}>
                                        🏪
                                    </div>
                                </div>

                                <div className="shop-info">
                                    <h3 className="shop-name">{shop.name}</h3>
                                    <p className="shop-description">
                                        {shop.description || 'Welcome to our shop! We offer quality products and excellent service.'}
                                    </p>

                                    <div className="shop-meta">
                                        {shop.category && (
                                            <span className="meta-item">
                                                🏷️ {shop.category}
                                            </span>
                                        )}
                                        {shop.productCount > 0 && (
                                            <span className="meta-item">
                                                📦 {shop.productCount} products
                                            </span>
                                        )}
                                        {shop.deliveryFee !== undefined && (
                                            <span className="meta-item">
                                                🚚 {shop.deliveryFee === 0 ? 'Free delivery' : `₹${shop.deliveryFee} delivery`}
                                            </span>
                                        )}
                                    </div>

                                    <div className="shop-footer">
                                        {shop.rating && (
                                            <div className="shop-rating">
                                                <span>⭐ {shop.rating.average?.toFixed(1) || '4.0'}</span>
                                                <span>({shop.rating.count || 0})</span>
                                            </div>
                                        )}
                                        <button className="visit-shop-btn">
                                            Visit Shop →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;