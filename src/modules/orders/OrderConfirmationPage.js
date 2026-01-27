import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiCall, ordersAPI, api } from '../../services/api';
import '../cart/CheckoutPage.css';

const OrderConfirmationPage = () => {
    const { orderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // Get order from URL params or location state
                if (orderId) {
                    const response = await api.get(`/orders/${orderId}`);
                    if (response.data.success) {
                        setOrder(response.data.data.order);
                    } else {
                        setError('Order not found');
                    }
                } else if (location.state?.order) {
                    // Use order from navigation state if no orderId in URL
                    setOrder(location.state.order);
                } else {
                    setError('No order information available');
                }
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="checkout-container">
                <div className="checkout-wrapper">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading order details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="checkout-container">
                <div className="checkout-wrapper">
                    <div className="error-state">
                        <h2>❌ Error</h2>
                        <p>{error}</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/')}
                        >
                            Go to Home
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
                    <div className="success-icon">✅</div>
                    <h2>Order Confirmed!</h2>
                    <p>Your order has been placed successfully and sent to our personal shoppers.</p>
                </div>

                <div className="checkout-content">
                    <div className="order-confirmation-details">
                        <div className="confirmation-section">
                            <h3>Order Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Order Number:</span>
                                    <span className="info-value">{order?.orderNumber || location.state?.orderNumber}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Status:</span>
                                    <span className="info-value status-badge">{order?.status || 'pending_shopper'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Total Amount:</span>
                                    <span className="info-value">₹{order?.orderValue?.total?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        </div>

                        {order?.deliveryAddress && (
                            <div className="confirmation-section">
                                <h3>Delivery Address</h3>
                                <div className="address-display">
                                    <p>{order.deliveryAddress.street}</p>
                                    <p>{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                                    {order.deliveryAddress.zipCode && <p>{order.deliveryAddress.zipCode}</p>}
                                    {order.deliveryAddress.instructions && (
                                        <p className="instructions">
                                            <strong>Instructions:</strong> {order.deliveryAddress.instructions}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {order?.items && order.items.length > 0 && (
                            <div className="confirmation-section">
                                <h3>Order Items</h3>
                                <div className="items-list">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="order-item">
                                            <div className="order-item-details">
                                                <span className="product-name">{item.name}</span>
                                                <span className="product-quantity">x {item.quantity}</span>
                                            </div>
                                            <span className="product-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="confirmation-section">
                            <h3>What's Next?</h3>
                            <div className="next-steps">
                                <div className="step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>Shopper Assignment</h4>
                                        <p>A personal shopper will accept your order and head to the shop.</p>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>Item Verification</h4>
                                        <p>The shopper will check item availability and may revise quantities if needed.</p>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>Final Confirmation</h4>
                                        <p>You'll review and approve any changes before the shopper makes the purchase.</p>
                                    </div>
                                </div>
                                <div className="step">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>Delivery & Payment</h4>
                                        <p>The shopper will deliver your items and collect payment on delivery.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="confirmation-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => navigate('/orders')}
                            >
                                View My Orders
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/')}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
