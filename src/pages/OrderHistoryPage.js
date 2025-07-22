import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './OrderHistoryPage.css'; // Import CSS file

const OrderHistoryPage = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/orders/customer`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });

                const data = res.data;
                const sortedOrders = Array.isArray(data)
                    ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    : [];

                setOrders(sortedOrders);
                setError(null);
            } catch (err) {
                console.error('Failed to load orders:', err);
                setError('Failed to load order history. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'status-pending';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="order-history-loading">
                <div className="spinner"></div>
                <p>Loading your order history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="order-history-error">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="order-history-container">
            <h2 className="order-history-title">Your Order History</h2>

            {orders.length === 0 ? (
                <div className="empty-order-history">
                    <img
                        src="/empty-orders-icon.svg"
                        alt="No Orders"
                        className="empty-orders-icon"
                    />
                    <p>You have not placed any orders yet.</p>
                    <button
                        className="start-shopping-btn"
                        onClick={() => window.location.href = '/'}
                    >
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => {
                        const itemTotal = order.items.reduce((sum, i) => sum + i.productId.price * i.quantity, 0);
                        const gst = itemTotal * 0.05;
                        const platformFee = itemTotal * 0.029;
                        const tax = gst + platformFee;
                        const deliveryCharge = 30;
                        const grandTotal = itemTotal + tax + deliveryCharge;



                        // Group items by shopId
                        const grouped = {};
                        order.items.forEach(item => {
                            const shopId = item.productId.shopId._id;
                            const shopName = item.productId.shopId.name;
                            if (!grouped[shopId]) {
                                grouped[shopId] = {
                                    shopName,
                                    items: []
                                };
                            }
                            grouped[shopId].items.push(item);
                        });

                        const shopGroups = Object.values(grouped);

                        return (
                            <div key={order._id} className="order-card">
                                <div className="order-header">
                                    <div className="order-date">
                                        {formatDate(order.createdAt)}
                                    </div>
                                    <div className={`order-status ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </div>
                                    {order.status === 'cancelled' && order.reason && (
                                        <div className="order-reason">
                                            <strong>Reason:</strong> {order.reason}
                                        </div>
                                    )}
                                </div>

                                <div className="order-details">
                                    <div className="order-address">
                                        <strong>Delivery Address:</strong> {order.address}
                                    </div>

                                    {shopGroups.map((group, idx) => (
                                        <div key={idx} className="order-shop-group">
                                            <h4 className="shop-name">
                                                {group.shopName}
                                            </h4>
                                            <div className="shop-items">
                                                {group.items.map((item, i) => (
                                                    <div key={i} className="order-item">
                                                        <div className="item-details">
                                                            <span className="item-name">
                                                                {item.productId.name}
                                                            </span>
                                                            <span className="item-quantity">
                                                                × {item.quantity}
                                                            </span>
                                                        </div>
                                                        <span className="item-price">
                                                            ₹{(item.productId.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="order-total-breakdown">
                                        <div className="total-row">
                                            <span>Items Total</span>
                                            <span>₹{itemTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="total-row">
                                            <span>Taxes and Other Charges</span>
                                            <span>₹{tax.toFixed(2)}</span>
                                        </div>
                                        <div className="total-row">
                                            <span>Delivery Charge</span>
                                            <span>₹{deliveryCharge.toFixed(2)}</span>
                                        </div>
                                        <div className="total-row grand-total">
                                            <strong>Grand Total</strong>
                                            <strong>₹{grandTotal.toFixed(2)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrderHistoryPage;
