import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

const HomePage = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/shops`);
            const shopsData = Array.isArray(response.data) ? response.data : response.data.shops || [];
            setShops(shopsData.slice(0, 8));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching shops:', error);
            // Show mock data if API fails
            setShops([
                { _id: '1', name: 'Fresh Mart Grocery', category: 'grocery', rating: { average: 4.5 } },
                { _id: '2', name: 'MedPlus Pharmacy', category: 'pharmacy', rating: { average: 4.8 } },
                { _id: '3', name: 'TechZone Electronics', category: 'electronics', rating: { average: 4.2 } },
                { _id: '4', name: 'Fashion Hub', category: 'clothing', rating: { average: 4.6 } },
                { _id: '5', name: 'Quick Bites', category: 'restaurant', rating: { average: 4.3 } },
                { _id: '6', name: 'Book World', category: 'books', rating: { average: 4.7 } }
            ]);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="homepage">
            <div className="search-section">
                <h1>What are you looking for?</h1>
                <div className="search-bar">
                    <input type="text" placeholder="Search for shops, products..." />
                    <button>🔍</button>
                </div>
            </div>

            <div className="categories">
                <div className="category-item">🛒 Grocery</div>
                <div className="category-item">💊 Pharmacy</div>
                <div className="category-item">📱 Electronics</div>
                <div className="category-item">👕 Fashion</div>
                <div className="category-item">🍕 Food</div>
                <div className="category-item">📚 Books</div>
            </div>

            <div className="shops-section">
                <h2>Popular Shops Near You</h2>
                <div className="shops-grid">
                    {shops.map(shop => (
                        <Link key={shop._id} to={`/shop/${shop._id}`} className="shop-card">
                            <div className="shop-header">
                                <h3>{shop.name}</h3>
                                <span className="rating">⭐ {shop.rating?.average || 4.0}</span>
                            </div>
                            <p className="category">{shop.category}</p>
                            <div className="shop-footer">
                                <span className="delivery-time">⏱️ 25-30 min</span>
                                <span className="delivery-fee">🚚 ₹25</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomePage;