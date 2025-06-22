import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../context/CartContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Your Cart</h2>

            {toast && (
                <div style={{
                    background: '#4caf50', color: 'white',
                    padding: '0.5rem 1rem', borderRadius: '5px',
                    marginBottom: '1rem'
                }}>
                    {toast}
                </div>
            )}

            {isCartEmpty ? (
                <p>No items in cart</p>
            ) : (
                <>
                    {Object.entries(grouped).map(([shopId, items]) => (
                        <div key={shopId} style={{ border: '1px solid gray', margin: '1rem', padding: '1rem' }}>
                            <h3>Shop: {getShopName(shopId)}</h3>
                            <ul>
                                {items.map(({ product }) => {
                                    const quantityInput = tempQuantities[product._id] || '';
                                    const parsedQty = parseInt(quantityInput) || 0;
                                    return (
                                        <li key={product._id}>
                                            {product.name} - ₹{product.price} ×
                                            <input
                                                type="number"
                                                min="0"
                                                value={quantityInput}
                                                onChange={e => handleChange(product._id, e.target.value)}
                                                onBlur={() => handleBlur(product._id)}
                                                style={{ width: '60px', margin: '0 10px' }}
                                            />
                                            = ₹{product.price * parsedQty}
                                            <button
                                                onClick={() => {
                                                    removeFromCart(product._id);
                                                    showToast('Item removed from cart');
                                                }}
                                                style={{ marginLeft: '1rem', color: 'red' }}
                                            >
                                                🗑️ Remove
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>

                            <button onClick={() => handleCheckout(items)}>
                                Checkout This Shop
                            </button>
                        </div>
                    ))}

                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button
                            onClick={() => handleCheckout(cart)}
                            style={{ fontWeight: 'bold', padding: '0.7rem 1.5rem' }}
                        >
                            Checkout All
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CartPage;
