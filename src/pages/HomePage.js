import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const [shops, setShops] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:5000/api/shops')
            .then(res => setShops(res.data))
            .catch(err => console.error('Failed to fetch shops:', err));
    }, []);

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Available Shops</h2>
            <ul>
                {shops.map(shop => (
                    <li
                        key={shop._id}
                        style={{
                            border: '1px solid #ccc',
                            padding: '1rem',
                            marginBottom: '1rem',
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/shop/${shop._id}`)}
                    >
                        <h3>{shop.name}</h3>
                        <p>{shop.description}</p>
                        <p>{shop.location}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default HomePage;
