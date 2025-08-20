import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { shopsAPI, apiCall } from '../services/api';
import api from '../services/api';
import config from '../config/config';
import './CheckoutPage.css';

const stripePromise = loadStripe(config.STRIPE_PUBLISHABLE_KEY);

const FinalCheckoutPage = () => {
    const { user } = useContext(AuthContext);
    const { cartItems, selectedShop, getOrderSummary } = useContext(CartContext);
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState([]);
    const [deliveryAddress, setDeliveryAddress] = useState('');

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const result = await apiCall(shopsAPI.getAll);
                if (result.success) {
                    const data = result.data;
                    if (Array.isArray(data)) setShops(data);
                    else if (Array.isArray(data.shops)) setShops(data.shops);
                }
            } catch (err) {
                console.error('Failed to load shops:', err);
            }
        };

        fetchShops();
    }, []);

    // Get order summary from cart context
    const orderSummary = getOrderSummary();

    const getShopName = (shopId) => {
        const id = typeof shopId === 'object' ? shopId._id : shopId;
        const match = shops.find((shop) => shop._id === id);
        return match ? match.name : 'Unknown Shop';
    };

    const handleStripePayment = async () => {
        if (!deliveryAddress.trim()) {
            alert('Please enter a delivery address');
            return;
        }

        const stripe = await stripePromise;
        try {
            setLoading(true);

            const formattedItems = cartItems.map(item => ({
                product: {
                    _id: item._id,
                    name: item.name,
                    price: item.price,
                    shopId: item.shopId
                },
                quantity: item.quantity
            }));

            // Store order amount for success page
            localStorage.setItem('lastOrderAmount', orderSummary.total);

            const response = await api.post('/payment/create-checkout-session', {
                items: formattedItems,
                address: deliveryAddress,
                deliveryCharge: orderSummary.deliveryFee
            });

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

    if (cartItems.length === 0) {
        return (
            <div className="checkout-container">
                <div className="checkout-wrapper">
                    <div className="checkout-header">
                        <h2>Your Cart is Empty</h2>
                        <p>Please add some items to your cart before proceeding to checkout.</p>
                    </div>
                    <div className="checkout-content">
                        <button 
                            className="btn btn-primary"
                            onClick={() => window.history.back()}
                        >
                            ← Back to Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <div className="checkout-wrapper">
                <div className="checkout-header">
                    <h2>Final Checkout</h2>
                    <p>Review your order and complete your purchase.</p>
                </div>

                <div className="checkout-content">
                    <div className="checkout-user-details">
                        <h3>Customer</h3>
                        <div className="user-info">
                            <p><span className="info-label">Name:</span> {user?.user?.name || user?.name}</p>
                            <p><span className="info-label">Email:</span> {user?.user?.email || user?.email}</p>
                        </div>
                    </div>

                    <div className="checkout-address">
                        <h3>Delivery Address</h3>
                        <textarea
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Enter your complete delivery address..."
                            className="address-input"
                            rows="3"
                            required
                        />
                    </div>

                    <div className="checkout-order-summary">
                        <h3>Order Summary</h3>

                        {selectedShop && (
                            <div className="shop-order-section">
                                <h4 className="shop-name">{selectedShop.name}</h4>
                                {cartItems.map((item, i) => (
                                    <div key={i} className="order-item">
                                        <div className="order-item-details">
                                            <span className="product-name">{item.name}</span>
                                            <span className="product-quantity">x {item.quantity}</span>
                                        </div>
                                        <span className="product-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="order-total-breakdown">
                            <div className="total-row">
                                <span>Items Total ({orderSummary.itemCount} items)</span>
                                <span>₹{orderSummary.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Delivery Fee</span>
                                <span>₹{orderSummary.deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Service Fee</span>
                                <span>₹{orderSummary.serviceFee.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Taxes</span>
                                <span>₹{orderSummary.taxes.toFixed(2)}</span>
                            </div>
                            <div className="total-row total-grand">
                                <span><strong>Grand Total</strong></span>
                                <span><strong>₹{orderSummary.total.toFixed(2)}</strong></span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="place-order-btn"
                        onClick={handleStripePayment}
                        disabled={loading || !deliveryAddress.trim()}
                    >
                        {loading ? 'Processing...' : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinalCheckoutPage;