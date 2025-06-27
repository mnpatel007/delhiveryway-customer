import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../context/CartContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CartPage.css'; // Import CSS file

const CartPage = () => {
    const {
        cart, removeFromCart, setCart
    } = useContext(CartContext);

    const [toast, setToast] = useState('');
    const [tempQuantities, setTempQuantities] = useState(() =>
        cart.reduce((acc, item) => {
            acc[item.product._id] = item.quantity.toString();
            return acc;
        }, {})
    );
    const [shops, setShops] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:5000/api/shops')
            .then(res => setShops(res.data))
            .catch(err => console.error('Failed to load shops:', err));
    }, []);

    const getShopName = (shopId) => {
        const shop = shops.find(s => s._id === shopId);
        return shop ? shop.name : 'Unknown Shop';
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 1500);
    };

    const handleChange = (productId, value) => {
        setTempQuantities(prev => ({
            ...prev,
            [productId]: value
        }));
    };

    const handleBlur = (productId) => {
        const raw = tempQuantities[productId];
        const qty = parseInt(raw);

        if (!raw || raw === '' || isNaN(qty) || qty <= 0) {
            removeFromCart(productId);
            showToast('Item removed from cart');
            setTempQuantities(prev => {
                const copy = { ...prev };
                delete copy[productId];
                return copy;
            });
            return;
        }

        const updated = cart.map(item =>
            item.product._id === productId
                ? { ...item, quantity: qty }
                : item
        );
        setCart(updated);
        localStorage.setItem('cart', JSON.stringify(updated));
        showToast('Quantity updated');
    };

    const grouped = cart.reduce((acc, item) => {
        if (!acc[item.shopId]) acc[item.shopId] = [];
        acc[item.shopId].push(item);
        return acc;
    }, {});

    const isCartEmpty = Object.keys(grouped).length === 0;

    const handleCheckout = (itemsToOrder) => {
        navigate('/checkout', { state: { selectedItems: itemsToOrder } });
    };

    const calculateShopTotal = (items) => {
        return items.reduce((total, { product, quantity }) => total + (product.price * quantity), 0);
    };

    const calculateOverallTotal = () => {
        return cart.reduce((total, { product, quantity }) => total + (product.price * quantity), 0);
    };

    return (
        <div className="cart-page-container">
            <h2 className="cart-page-title">Your Cart</h2>

            {/* Toast Notification */}
            {toast && (
                <div className="toast-notification">
                    {toast}
                </div>
            )}

            {/* Empty Cart State */}
            {isCartEmpty ? (
                <div className="empty-cart-message">
                    <img
                        src="/empty-cart-icon.svg"
                        alt="Empty Cart"
                        className="empty-cart-icon"
                    />
                    <p>Your cart is empty</p>
                    <button
                        className="continue-shopping-btn"
                        onClick={() => navigate('/')}
                    >
                        Continue Shopping
                    </button>
                </div>
            ) : (
                <div className="cart-content">
                    {/* Shop-wise Cart Items */}
                    {Object.entries(grouped).map(([shopId, items]) => (
                        <div key={shopId} className="cart-shop-section">
                            <div className="cart-shop-header">
                                <h3 className="cart-shop-name">
                                    {getShopName(shopId)}
                                </h3>
                                <span className="cart-shop-total">
                                    Total: ₹{calculateShopTotal(items).toFixed(2)}
                                </span>
                            </div>

                            <div className="cart-shop-items">
                                {items.map(({ product, quantity }) => {
                                    const quantityInput = tempQuantities[product._id] || '';
                                    const parsedQty = parseInt(quantityInput) || 0;
                                    return (
                                        <div key={product._id} className="cart-item">
                                            <div className="cart-item-details">
                                                <h4 className="cart-item-name">{product.name}</h4>
                                                <p className="cart-item-price">₹{product.price}</p>
                                            </div>
                                            <div className="cart-item-quantity">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={quantityInput}
                                                    onChange={e => handleChange(product._id, e.target.value)}
                                                    onBlur={() => handleBlur(product._id)}
                                                    className="quantity-input"
                                                />
                                                <span className="cart-item-subtotal">
                                                    ₹{(product.price * parsedQty).toFixed(2)}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        removeFromCart(product._id);
                                                        showToast('Item removed from cart');
                                                    }}
                                                    className="remove-item-btn"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handleCheckout(items)}
                                className="checkout-shop-btn"
                            >
                                Checkout This Shop
                            </button>
                        </div>
                    ))}

                    {/* Overall Checkout */}
                    <div className="cart-overall-checkout">
                        <div className="cart-total">
                            <span>Total Amount:</span>
                            <strong>₹{calculateOverallTotal().toFixed(2)}</strong>
                        </div>
                        <button
                            onClick={() => handleCheckout(cart)}
                            className="checkout-all-btn"
                        >
                            Checkout All Items
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;