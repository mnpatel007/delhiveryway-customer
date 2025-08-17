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
            setShops(response.data.slice(0, 6)); // Show only 6 shops
            setLoading(false);
        } catch (error) {
            console.error('Error fetching shops:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading shops...</div>;
    }

    return (
        <div className="homepage">
            <div className="hero-section">
                <h1>DelhiveryWay</h1>
                <p>Personal shopping made easy</p>
            </div>

            <div className="shops-section">
                <h2>Popular Shops</h2>
                <div className="shops-grid">
                    {shops.map(shop => (
                        <Link key={shop._id} to={`/shop/${shop._id}`} className="shop-card">
                            <div className="shop-info">
                                <h3>{shop.name}</h3>
                                <p>{shop.category}</p>
                                <span className="shop-rating">⭐ {shop.rating?.average || 4.0}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomePage;