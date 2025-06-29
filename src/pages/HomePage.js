import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';  // Make sure this file exists and is in the right location

const HomePage = () => {
    const [shops, setShops] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('${process.env.REACT_APP_BACKEND_URL}/api/shops')
            .then(res => setShops(res.data))
            .catch(err => console.error('Failed to fetch shops:', err));
    }, []);

    return (
        <div className="home-container">
            <h2 className="home-title">Available Shops</h2>
            <ul className="shops-list">
                {shops.map(shop => (
                    <li
                        key={shop._id}
                        className="shop-item"
                        onClick={() => navigate(`/shop/${shop._id}`)}
                        tabIndex={0}  // For keyboard accessibility
                        onKeyDown={e => {
                            if (e.key === "Enter" || e.key === " ") {
                                navigate(`/shop/${shop._id}`);
                            }
                        }}
                    >
                        <h3 className="shop-item-title">{shop.name}</h3>
                        <p className="shop-item-description">{shop.description}</p>
                        <p className="shop-item-location">{shop.location}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default HomePage;