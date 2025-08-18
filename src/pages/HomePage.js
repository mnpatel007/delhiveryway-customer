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
            } else {
                console.log('No shops from API, using sample data');
                setShops(filterSampleShops());
                setError('Showing sample shops - backend may be updating');
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

    if (loading) {
        return (
            <div className="home-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading shops...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="home-header">
                <h1>Welcome to DelhiveryWay</h1>
                {user && <p>Hello, {user.name}! Find shops near you.</p>}
                {error && (
                    <div className="info-banner">
                        <p>ℹ️ {error}</p>
                    </div>
                )}
            </div>

            <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search for shops, products, or categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button type="submit" className="search-btn">
                        Search
                    </button>
                </form>

                <div className="category-filters">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                        >
                            {category === 'all' ? 'All Categories' :
                                category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="shops-section">
                <h2 className="section-title">
                    {searchTerm ? `Search Results for "${searchTerm}"` : 'Available Shops'}
                    <span className="shops-count">({shops.length} shops)</span>
                </h2>

                {shops.length === 0 ? (
                    <div className="no-shops">
                        <h3>No shops found</h3>
                        <p>
                            {searchTerm || selectedCategory !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'No shops are currently available'
                            }
                        </p>
                        <button onClick={fetchShops} className="retry-btn">
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="shops-grid">
                        {shops.map(shop => (
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
                                                e.target.src = '/placeholder-shop.png';
                                            }}
                                        />
                                    ) : (
                                        <div className="shop-placeholder">
                                            <span className="shop-icon">🏪</span>
                                        </div>
                                    )}
                                </div>

                                <div className="shop-info">
                                    <h3 className="shop-name">{shop.name}</h3>
                                    <p className="shop-category">{shop.category}</p>

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

                                        <div className="shop-location">
                                            📍 {shop.address?.city}, {shop.address?.state}
                                        </div>

                                        {shop.deliveryFee !== undefined && (
                                            <div className="delivery-fee">
                                                {shop.deliveryFee === 0
                                                    ? 'Free Delivery'
                                                    : `₹${shop.deliveryFee} delivery`
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
    );
};

export default HomePage;