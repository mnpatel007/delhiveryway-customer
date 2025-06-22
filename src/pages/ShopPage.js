import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';

const ShopPage = () => {
    const { id } = useParams(); // shopId
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [toast, setToast] = useState('');
    const { addToCart } = useContext(CartContext);

    useEffect(() => {
        const fetchShopAndProducts = async () => {
            try {
                const shopRes = await axios.get(`http://localhost:5000/api/shops/${id}`);
                const productRes = await axios.get(`http://localhost:5000/api/products/shop/${id}`);
                setShop(shopRes.data);
                setProducts(productRes.data);
            } catch (err) {
                console.error('Error fetching shop or products:', err);
            }
        };

        fetchShopAndProducts();
    }, [id]);

    const handleAddToCart = (product) => {
        addToCart(product, id);
        setToast(`${product.name} added to cart`);
        setTimeout(() => setToast(''), 1500);
    };

    if (!shop) return <p>Loading shop...</p>;

    return (
        <div style={{ padding: '2rem' }}>
            {toast && (
                <div style={{
                    background: '#4caf50',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    marginBottom: '1rem',
                    maxWidth: 'fit-content'
                }}>
                    {toast}
                </div>
            )}

            <h2>{shop.name}</h2>
            <p>{shop.description}</p>
            <p>{shop.location}</p>

            <h3>Products</h3>
            {products.length === 0 ? (
                <p>No products available for this shop.</p>
            ) : (
                <ul>
                    {products.map(product => (
                        <li key={product._id} style={{ marginBottom: '1rem' }}>
                            <strong>{product.name}</strong> - ₹{product.price}
                            <p>{product.description}</p>
                            <button onClick={() => handleAddToCart(product)}>Add to Cart</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ShopPage;
