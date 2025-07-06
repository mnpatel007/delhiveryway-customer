import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import './CheckoutPage.css';

const stripePromise = loadStripe('pk_test_51RdZkxRvhEVshUODDQprocdR1VZc3ANHK3sXO8CBX2R15UGdHybkDJ2LO0qqoHYTfghWvaghMbOfqP3lBWLgrMzz009Sc0sv3a');

const FinalCheckoutPage = () => {
    const { user } = useContext(AuthContext);
    const [finalOrder, setFinalOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('finalCheckoutOrder');
        if (!saved) return;

        const parsed = JSON.parse(saved);
        const { items, address, deliveryCharge, totalAmount } = parsed;

        const fetchProductDetails = async () => {
            try {
                const fullItems = [];

                for (const item of items) {
                    if (!item.productId) {
                        console.warn('⚠️ Skipping item with missing productId:', item);
                        continue;
                    }

                    try {
                        const res = await axios.get(
                            `${process.env.REACT_APP_BACKEND_URL}/api/products/${item.productId}`,
                            {
                                headers: { Authorization: `Bearer ${user.token}` }
                            }
                        );

                        if (res.data) {
                            fullItems.push({
                                product: res.data,
                                quantity: item.quantity,
                                shopId: res.data.shopId
                            });
                        }

                    } catch (err) {
                        console.warn(`⚠️ Failed to fetch product ${item.productId}:`, err.message);
                        // Don't push it — skip this item silently
                    }
                }

                setFinalOrder({ items: fullItems, address, deliveryCharge, totalAmount });

            } catch (err) {
                console.error('❌ Failed to load product details:', err);
            }
        };

        fetchProductDetails();
    }, []);

    useEffect(() => {
        axios
            .get(`${process.env.REACT_APP_BACKEND_URL}/api/shops`)
            .then(res => {
                const data = res.data;
                if (Array.isArray(data)) setShops(data);
                else if (Array.isArray(data.shops)) setShops(data.shops);
            })
            .catch(err => console.error('Failed to load shops:', err));
    }, []);

    const getShopName = (shopId) => {
        const id = typeof shopId === 'object' ? shopId._id : shopId;
        const match = shops.find((shop) => shop._id === id);
        return match ? match.name : 'Unknown Shop';
    };



    const groupByShop = () => {
        if (!finalOrder?.items) return {};

        return finalOrder.items.reduce((acc, item) => {
            const shopId =
                typeof item.shopId === 'object' ? item.shopId._id : item.shopId;

            if (!acc[shopId]) acc[shopId] = [];
            acc[shopId].push(item);
            return acc;
        }, {});
    };

    const handleStripePayment = async () => {
        const stripe = await stripePromise;
        try {
            setLoading(true);

            const formattedItems = finalOrder.items.map(item => ({
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    price: item.product.price,
                    shopId: item.product.shopId
                },
                quantity: item.quantity
            }));

            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/payment/create-checkout-session`,
                {
                    items: formattedItems,
                    address: finalOrder.address,
                    deliveryCharge
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );

            const result = await stripe.redirectToCheckout({
                sessionId: response.data.id
            });

            if (result.error) {
                alert(result.error.message);
            }
        } catch (err) {
            console.error('Payment error:', err);
            alert('Payment failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!finalOrder) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading final order...</div>;
    }

    const itemTotal = finalOrder.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const tax = itemTotal * 0.05;
    const grandTotal = itemTotal + tax + finalOrder.deliveryCharge;

    return (
        <div className="checkout-container">
            <div className="checkout-wrapper">
                <div className="checkout-header">
                    <h2>Final Checkout</h2>
                    <p>This is the final version of your order confirmed by the vendor.</p>
                </div>

                <div className="checkout-content">
                    <div className="checkout-user-details">
                        <h3>Customer</h3>
                        <div className="user-info">
                            <p><span className="info-label">Name:</span> {user.user.name}</p>
                            <p><span className="info-label">Email:</span> {user.user.email}</p>
                        </div>
                    </div>

                    <div className="checkout-address">
                        <h3>Delivery Address</h3>
                        <p style={{ background: '#f5f5f5', padding: '10px', borderRadius: '6px' }}>
                            {finalOrder.address}
                        </p>
                    </div>

                    <div className="checkout-order-summary">
                        <h3>Order Summary</h3>

                        {Object.entries(groupByShop()).map(([shopId, items]) => (
                            <div key={shopId} className="shop-order-section">
                                <h4 className="shop-name">{getShopName(shopId)}</h4>
                                {items.map((item, i) => (
                                    <div key={i} className="order-item">
                                        <div className="order-item-details">
                                            <span className="product-name">{item.product.name}</span>
                                            <span className="product-quantity">x {item.quantity}</span>
                                        </div>
                                        <span className="product-price">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <div className="order-total-breakdown">
                            <div className="total-row">
                                <span>Items Total</span>
                                <span>₹{itemTotal.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>GST (5%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Delivery Charge</span>
                                <span>₹{finalOrder.deliveryCharge.toFixed(2)}</span>
                            </div>
                            <div className="total-row grand-total">
                                <strong>Grand Total</strong>
                                <strong>₹{grandTotal.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>

                    <button
                        className="place-order-btn"
                        onClick={handleStripePayment}
                        disabled={loading}
                    >
                        {loading ? 'Redirecting...' : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinalCheckoutPage;