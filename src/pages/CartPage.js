import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { shopsAPI, apiCall } from '../services/api';
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
    const [loading, setLoading] = useState(true);
    const [removingItem, setRemovingItem] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchShops = async () => {
            try {
                setLoading(true);
                const result = await apiCall(shopsAPI.getAll);
                if (result.success) {
                    const data = result.data;
                    if (Array.isArray(data)) {
                        setShops(data);
                    } else if (Array.isArray(data.shops)) {
                        setShops(data.shops);
                    } else {
                        console.error("Unexpected API response format");
                        setShops([]);
                    }
                } else {
                    console.error('Failed to load shops:', result.message);
                    setShops([]);
                }
            } catch (err) {
                console.error('Failed to load shops:', err);
                setShops([]);
            } finally {
                setLoading(false);
            }
        };

        fetchShops();
    }, []);

    const getShopName = (shopId) => {
        const shop = shops.find(s => s._id === shopId);
        return shop ? shop.name : 'Unknown Shop';
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
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
        showToast('Quantity updated successfully');
    };

    const handleRemoveItem = async (productId, productName) => {
        setRemovingItem(productId);
        showToast(`Removing ${productName}...`);
        
        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        removeFromCart(productId);
        setRemovingItem(null);
        showToast(`${productName} removed from cart`);
        setTempQuantities(prev => {
            const copy = { ...prev };
            delete copy[productId];
            return copy;
        });
    };

    const grouped = cart.reduce((acc, item) => {
        if (!acc[item.shopId]) acc[item.shopId] = [];
        acc[item.shopId].push(item);
        return acc;
    }, {});

    const isCartEmpty = Object.keys(grouped).length === 0;

    const handleCheckout = (itemsToOrder) => {
        navigate('/rehearsal-checkout', { state: { selectedItems: itemsToOrder } });
    };

    const calculateShopTotal = (items) =>
        items.reduce((total, { product, quantity }) => total + product.price * quantity, 0);

    const calculateOverallTotal = () =>
        cart.reduce((total, { product, quantity }) => total + product.price * quantity, 0);

    const calculateItemCount = () =>
        cart.reduce((total, { quantity }) => total + quantity, 0);

    if (loading) {
        return (
            <div className="modern-cart-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading your cart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="modern-cart-container">
            {/* Header Section */}
            <div className="cart-header">
                <div className="cart-header-content">
                    <div className="cart-title-section">
                        <h1 className="cart-main-title">
                            <span className="cart-icon">🛒</span>
                            Shopping Cart
                        </h1>
                        <p className="cart-subtitle">
                            {isCartEmpty 
                                ? 'Your cart is waiting for amazing products' 
                                : `${calculateItemCount()} items from ${Object.keys(grouped).length} shop${Object.keys(grouped).length > 1 ? 's' : ''}`
                            }
                        </p>
                    </div>
                    
                    {!isCartEmpty && (
                        <div className="cart-summary">
                            <div className="summary-item">
                                <span className="summary-label">Total Items:</span>
                                <span className="summary-value">{calculateItemCount()}</span>
                            </div>
                            <div className="summary-item total">
                                <span className="summary-label">Total Amount:</span>
                                <span className="summary-value">₹{calculateOverallTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="toast-notification">
                    <div className="toast-content">
                        <span className="toast-icon">✨</span>
                        <span className="toast-message">{toast}</span>
                    </div>
                </div>
            )}

            {/* Empty Cart State */}
            {isCartEmpty ? (
                <div className="empty-cart-section">
                    <div className="empty-cart-content">
                        <div className="empty-cart-icon">🛒</div>
                        <h2 className="empty-cart-title">Your cart is empty</h2>
                        <p className="empty-cart-description">
                            Looks like you haven't added any items yet. Start shopping to fill your cart with amazing products!
                        </p>
                        <button 
                            className="continue-shopping-btn"
                            onClick={() => navigate('/')}
                        >
                            <span className="btn-icon">🛍️</span>
                            Start Shopping
                        </button>
                    </div>
                </div>
            ) : (
                /* Cart Content */
                <div className="cart-content">
                    {Object.entries(grouped).map(([shopId, items], shopIndex) => (
                        <section 
                            key={shopId} 
                            className="cart-shop-section"
                            style={{ animationDelay: `${shopIndex * 0.1}s` }}
                        >
                            {/* Shop Header */}
                            <div className="shop-section-header">
                                <div className="shop-info">
                                    <div className="shop-avatar">
                                        <span className="shop-emoji">🏪</span>
                                    </div>
                                    <div className="shop-details">
                                        <h3 className="shop-name">{getShopName(shopId)}</h3>
                                        <span className="shop-item-count">
                                            {items.length} item{items.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="shop-total">
                                    <span className="total-label">Shop Total:</span>
                                    <span className="total-amount">₹{calculateShopTotal(items).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Shop Items */}
                            <div className="shop-items-container">
                                {items.map(({ product, quantity }, itemIndex) => {
                                    const quantityInput = tempQuantities[product._id] || '';
                                    const parsedQty = parseInt(quantityInput) || 0;
                                    const isRemoving = removingItem === product._id;

                                    return (
                                        <article 
                                            key={product._id} 
                                            className={`cart-item ${isRemoving ? 'removing' : ''}`}
                                            style={{ animationDelay: `${itemIndex * 0.05}s` }}
                                        >
                                            <div className="item-image-section">
                                                <div className="item-image">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            onError={(e) => {
                                                                e.target.src = '/placeholder-product.png';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="item-placeholder">
                                                            <span className="product-icon">📦</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="item-details">
                                                <div className="item-main-info">
                                                    <h4 className="item-name">{product.name}</h4>
                                                    <p className="item-description">
                                                        {product.description || 'No description available'}
                                                    </p>
                                                </div>
                                                
                                                <div className="item-price-info">
                                                    <div className="price-section">
                                                        <span className="item-price">₹{product.price.toFixed(2)}</span>
                                                        <span className="price-per-unit">per unit</span>
                                                    </div>
                                                    <div className="quantity-section">
                                                        <label htmlFor={`qty-${product._id}`} className="quantity-label">
                                                            Qty:
                                                        </label>
                                                        <input
                                                            id={`qty-${product._id}`}
                                                            type="number"
                                                            min="1"
                                                            aria-label={`Quantity for ${product.name}`}
                                                            value={quantityInput}
                                                            onChange={e => handleChange(product._id, e.target.value)}
                                                            onBlur={() => handleBlur(product._id)}
                                                            className="quantity-input"
                                                            disabled={isRemoving}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="item-actions">
                                                <div className="item-subtotal">
                                                    <span className="subtotal-label">Subtotal:</span>
                                                    <span className="subtotal-amount">₹{(product.price * parsedQty).toFixed(2)}</span>
                                                </div>
                                                
                                                <button
                                                    onClick={() => handleRemoveItem(product._id, product.name)}
                                                    aria-label={`Remove ${product.name} from cart`}
                                                    className="remove-item-btn"
                                                    disabled={isRemoving}
                                                >
                                                    <span className="remove-icon">🗑️</span>
                                                    <span className="remove-text">Remove</span>
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {/* Shop Checkout Button */}
                            <div className="shop-checkout-section">
                                <button
                                    onClick={() => handleCheckout(items)}
                                    className="checkout-shop-btn"
                                    aria-label={`Checkout items from ${getShopName(shopId)}`}
                                >
                                    <span className="checkout-icon">🚀</span>
                                    <span>Checkout This Shop</span>
                                    <span className="checkout-arrow">→</span>
                                </button>
                            </div>
                        </section>
                    ))}

                    {/* Overall Checkout Footer */}
                    <footer className="cart-overall-footer">
                        <div className="overall-summary">
                            <div className="summary-row">
                                <span className="summary-label">Total Items:</span>
                                <span className="summary-value">{calculateItemCount()}</span>
                            </div>
                            <div className="summary-row total-row">
                                <span className="summary-label">Total Amount:</span>
                                <span className="summary-value total-amount">₹{calculateOverallTotal().toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <button 
                            className="checkout-all-btn"
                            onClick={() => handleCheckout(cart)}
                        >
                            <span className="checkout-icon">💳</span>
                            <span>Checkout All Items</span>
                            <span className="checkout-arrow">→</span>
                        </button>
                    </footer>
                </div>
            )}
        </div>
    );
};

export default CartPage;