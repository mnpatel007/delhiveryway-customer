import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../context/CartContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = () => {
    const { cart, removeFromCart, setCart } = useContext(CartContext);
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
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/shops`)
            .then(res => {
                const data = res.data;
                if (Array.isArray(data)) {
                    setShops(data);
                } else if (Array.isArray(data.shops)) {
                    setShops(data.shops);
                } else {
                    console.error("Unexpected API response format:", data);
                    setShops([]);
                }
            })
            .catch(err => console.error('Failed to load shops:', err));
    }, []);

    const getShopName = (shopId) => {
        const shop = shops.find(s => s._id === shopId);
        return shop ? shop.name : 'Unknown Shop';
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2000);
    };

    const handleChange = (productId, value) => {
        if (/^\d*$/.test(value)) {
            setTempQuantities(prev => ({ ...prev, [productId]: value }));
        }
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
            item.product._id === productId ? { ...item, quantity: qty } : item
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

    const calculateShopTotal = (items) =>
        items.reduce((total, { product, quantity }) => total + product.price * quantity, 0);

    const calculateOverallTotal = () =>
        cart.reduce((total, { product, quantity }) => total + product.price * quantity, 0);

    return (
        <div className="cart-page-container">
            <h2 className="cart-page-title">Your Cart</h2>

            {toast && <div className="toast-notification">{toast}</div>}

            {isCartEmpty ? (
                <div className="empty-cart-message">
                    <img
                        src="/empty-cart-icon.svg"
                        alt="Empty Cart"
                        className="empty-cart-icon"
                        loading="lazy"
                        width="150"
                        height="150"
                    />
                    <p>Your cart is empty</p>
                    <button className="continue-shopping-btn" onClick={() => navigate('/')}>
                        Continue Shopping
                    </button>
                </div>
            ) : (
                <div className="cart-content">
                    {Object.entries(grouped).map(([shopId, items]) => (
                        <section key={shopId} className="cart-shop-section" aria-label={`Cart items from ${getShopName(shopId)}`}>
                            <header className="cart-shop-header">
                                <h3 className="cart-shop-name">{getShopName(shopId)}</h3>
                                <p className="cart-shop-total">
                                    Total: <strong>₹{calculateShopTotal(items).toFixed(2)}</strong>
                                </p>
                            </header>

                            <div className="cart-shop-items">
                                {items.map(({ product, quantity }) => {
                                    const quantityInput = tempQuantities[product._id] || '';
                                    const parsedQty = parseInt(quantityInput) || 0;

                                    return (
                                        <article key={product._id} className="cart-item">
                                            <div className="cart-item-details">
                                                <h4 className="cart-item-name">{product.name}</h4>
                                                <p className="cart-item-price">₹{product.price.toFixed(2)}</p>
                                            </div>
                                            <div className="cart-item-actions">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    aria-label={`Quantity for ${product.name}`}
                                                    value={quantityInput}
                                                    onChange={e => handleChange(product._id, e.target.value)}
                                                    onBlur={() => handleBlur(product._id)}
                                                    className="quantity-input"
                                                />
                                                <p className="cart-item-subtotal" aria-live="polite">
                                                    ₹{(product.price * parsedQty).toFixed(2)}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        removeFromCart(product._id);
                                                        showToast('Item removed from cart');
                                                        setTempQuantities(prev => {
                                                            const copy = { ...prev };
                                                            delete copy[product._id];
                                                            return copy;
                                                        });
                                                    }}
                                                    aria-label={`Remove ${product.name} from cart`}
                                                    className="remove-item-btn"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handleCheckout(items)}
                                className="checkout-shop-btn"
                                aria-label={`Checkout items from ${getShopName(shopId)}`}
                            >
                                Checkout This Shop
                            </button>
                        </section>
                    ))}

                    <footer className="cart-overall-checkout">
                        <div className="cart-total">
                            <span>Total Amount:</span>
                            <strong>₹{calculateOverallTotal().toFixed(2)}</strong>
                        </div>
                        <button
                            onClick={() => handleCheckout(cart)}
                            className="checkout-all-btn"
                            aria-label="Checkout all items in cart"
                        >
                            Checkout All Items
                        </button>
                    </footer>
                </div>
            )}
        </div>
    );
};

export default CartPage;