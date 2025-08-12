import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopsAPI, handleApiError } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState([]);

    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchShops();
    }, [selectedCategory, searchTerm]);

    const fetchShops = async () => {
        try {
            setLoading(true);
            setError('');

            const params = {
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                search: searchTerm || undefined,
                limit: 20
            };

            const response = await shopsAPI.getAll(params);

            if (response.success) {
                setShops(response.data.shops || []);

                // Extract categories for filter
                if (response.data.filters?.categories) {
                    setCategories(['all', ...response.data.filters.categories]);
                }
            } else {
                setError(response.message || 'Failed to fetch shops');
            }
        } catch (err) {
            const errorInfo = handleApiError(err);
            setError(errorInfo.message);
            console.error('Failed to fetch shops:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleShopClick = (shopId) => {
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

    if (error) {
        return (
            <div className="home-container">
                <div className="error-container">
                    <h3>Unable to load shops</h3>
                    <p>{error}</p>
                    <button onClick={fetchShops} className="retry-btn">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="home-header">
                <h1>Welcome to DelhiveryWay</h1>
                {user && <p>Hello, {user.name}! Find shops near you.</p>}
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
                                : 'No shops are currently available in your area'
                            }
                        </p>
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
