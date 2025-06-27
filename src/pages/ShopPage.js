import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import './ShopPage.css'; // Import CSS file

const ShopPage = () => {
    const { id } = useParams();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [toast, setToast] = useState('');
    const [loading, setLoading] = useState(true);
    const { addToCart } = useContext(CartContext);

    useEffect(() => {
        const fetchShopAndProducts = async () => {
            try {
                setLoading(true);
                const [shopRes, productRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/shops/${id}`),
                    axios.get(`http://localhost:5000/api/products/shop/${id}`)
                ]);

                setShop(shopRes.data);
                setProducts(productRes.data);
            } catch (err) {
                console.error('Error fetching shop or products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchShopAndProducts();
    }, [id]);

    const handleAddToCart = (product) => {
        addToCart(product, id);
        setToast(`${product.name} added to cart`);
        setTimeout(() => setToast(''), 1500);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading shop details...</p>
            </div>
        );
    }

    if (!shop) {
        return <div className="error-container">Shop not found</div>;
    }

    return (
        <div className="shop-page-container">
            {/* Toast Notification */}
            {toast && (
                <div className="toast-notification">
                    {toast}
                </div>
            )}

            {/* Shop Header */}
            <div className="shop-header">
                <div className="shop-info">
                    <h2 className="shop-name">{shop.name}</h2>
                    <p className="shop-description">{shop.description}</p>
                    <div className="shop-location">
                        <i className="location-icon">📍</i>
                        {shop.location}
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="products-section">
                <h3 className="products-title">Our Products</h3>

                {products.length === 0 ? (
                    <div className="no-products">
                        <p>No products available for this shop.</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.map(product => (
                            <div key={product._id} className="product-card">
                                <div className="product-details">
                                    <h4 className="product-name">{product.name}</h4>
                                    <p className="product-description">{product.description}</p>
                                    <div className="product-footer">
                                        <span className="product-price">₹{product.price}</span>
                                        <button
                                            className="add-to-cart-btn"
                                            onClick={() => handleAddToCart(product)}
                                        >
                                            Add to Cart
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

export default ShopPage;