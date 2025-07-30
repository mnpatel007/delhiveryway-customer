import React, { useEffect, useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
    const { clearCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                clearCart();
                localStorage.removeItem('checkoutItems');
                localStorage.removeItem('checkoutAddress');

                // Check if we have a session_id from Stripe
                const urlParams = new URLSearchParams(location.search);
                const sessionId = urlParams.get('session_id');

                if (sessionId) {
                    // Fetch session details from backend
                    const response = await axios.get(
                        `${process.env.REACT_APP_BACKEND_URL}/api/payments/session/${sessionId}`,
                        {
                            headers: { Authorization: `Bearer ${user.token}` }
                        }
                    );
                    setOrderDetails(response.data);
                } else if (location.state) {
                    // Fallback to location state
                    setOrderDetails(location.state);
                }
            } catch (error) {
                console.error('Failed to fetch order details:', error);
                // Set minimal order details as fallback
                setOrderDetails({
                    totalAmount: 0,
                    orderId: `DW${Date.now().toString().slice(-6)}`
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [clearCart, location.state, location.search, user.token]);

    const handleBackToHome = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/orders');
    };

    const handleTrackOrder = () => {
        if (orderDetails?.orderId) {
            navigate(`/track-order/${orderDetails.orderId}`);
        } else {
            navigate('/orders');
        }
    };

    const generateOrderId = () => {
        return orderDetails?.orderId || orderDetails?.sessionId?.slice(-8) || `DW${Date.now().toString().slice(-6)}`;
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="order-success-container">
                <div className="order-success-card">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading order details...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="order-success-container">
            <div className="order-success-card">
                {/* Success Animation */}
                <div className="success-animation">
                    <div className="success-checkmark">
                        <div className="check-icon">
                            <span className="icon-line line-tip"></span>
                            <span className="icon-line line-long"></span>
                            <div className="icon-circle"></div>
                            <div className="icon-fix"></div>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                <div className="success-content">
                    <h1 className="success-title">Order Placed Successfully!</h1>
                    <p className="success-subtitle">
                        Thank you for your order. We've received your payment and your delicious food is being prepared.
                    </p>
                </div>

                {/* Order Details */}
                <div className="order-details-card">
                    <div className="order-header">
                        <h3>Order Details</h3>
                        <span className="order-id">#{generateOrderId()}</span>
                    </div>

                    <div className="order-info">
                        <div className="info-row">
                            <span className="info-label">
                                <i className="icon">💰</i>
                                Total Amount
                            </span>
                            <span className="info-value">
                                {formatAmount(orderDetails?.totalAmount)}
                            </span>
                        </div>

                        <div className="info-row">
                            <span className="info-label">
                                <i className="icon">📅</i>
                                Order Date
                            </span>
                            <span className="info-value">
                                {new Date().toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>

                        <div className="info-row">
                            <span className="info-label">
                                <i className="icon">⏰</i>
                                Estimated Delivery
                            </span>
                            <span className="info-value">
                                {new Date(Date.now() + 45 * 60000).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })} (45 mins)
                            </span>
                        </div>

                        <div className="info-row">
                            <span className="info-label">
                                <i className="icon">💳</i>
                                Payment Status
                            </span>
                            <span className="info-value success-status">
                                <span className="status-dot"></span>
                                Paid
                            </span>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="next-steps">
                    <h4>What happens next?</h4>
                    <div className="steps-list">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h5>Order Confirmation</h5>
                                <p>Restaurant confirms your order</p>
                            </div>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h5>Preparation</h5>
                                <p>Your food is being prepared</p>
                            </div>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h5>Out for Delivery</h5>
                                <p>Delivery partner picks up your order</p>
                            </div>
                        </div>
                        <div className="step">
                            <div className="step-number">4</div>
                            <div className="step-content">
                                <h5>Delivered</h5>
                                <p>Enjoy your delicious meal!</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button onClick={handleTrackOrder} className="btn-primary">
                        <i className="btn-icon">📍</i>
                        Track Order
                    </button>
                    <button onClick={handleViewOrders} className="btn-secondary">
                        <i className="btn-icon">📋</i>
                        View All Orders
                    </button>
                    <button onClick={handleBackToHome} className="btn-outline">
                        <i className="btn-icon">🏠</i>
                        Continue Shopping
                    </button>
                </div>

                {/* Support Info */}
                <div className="support-info">
                    <p>Need help? Contact us at <strong>support@delhiveryway.com</strong> or call <strong>+91-XXXX-XXXX</strong></p>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;
