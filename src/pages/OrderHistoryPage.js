import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ordersAPI, apiCall } from '../services/api';
import io from 'socket.io-client';
import config from '../config/config';
import './OrderHistoryPage.css';

const OrderHistoryPage = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const result = await apiCall(ordersAPI.getCustomerOrders);

                if (result.success) {
                    console.log('API result:', result);
                    const data = result.data;
                    // Handle both array format and object format with pagination
                    const ordersArray = Array.isArray(data) ? data : (data.orders || data);
                    const sortedOrders = Array.isArray(ordersArray)
                        ? ordersArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        : [];

                    console.log('Processed orders:', sortedOrders);
                    setOrders(sortedOrders);
                    setError(null);
                } else {
                    setError(result.message || 'Failed to load order history. Please try again.');
                }
            } catch (err) {
                console.error('Failed to load orders:', err);
                setError('Failed to load order history. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    // Socket connection for real-time order updates
    useEffect(() => {
        if (!user?.id) return;

        const socket = io(config.SOCKET_URL);

        // Join customer room
        socket.emit('join', `customer_${user.id}`);

        // Listen for order status updates
        socket.on('orderStatusUpdate', (data) => {
            console.log('Received order status update:', data);

            // Update the specific order in state
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === data.orderId
                        ? {
                            ...order,
                            status: data.status,
                            pickedUpAt: data.status === 'picked_up' ? data.timestamp : order.pickedUpAt,
                            deliveredAt: data.status === 'delivered' ? data.timestamp : order.deliveredAt,
                            deliveryBoyLocation: data.deliveryBoyLocation || order.deliveryBoyLocation
                        }
                        : order
                )
            );

            // Show notification for important updates
            if (data.message && ['picked_up', 'delivered'].includes(data.status)) {
                console.log('Order status update:', data.message);
            }
        });

        // Listen for delivery location updates
        socket.on('delivery_location_update', (data) => {
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === data.orderId
                        ? {
                            ...order,
                            deliveryBoyLocation: data.deliveryBoyLocation
                        }
                        : order
                )
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.id]);

    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const getStatusColor = (status) => {
        if (!status) return '';
        
        switch (status.toLowerCase()) {
            case 'pending': return 'status-pending';
            case 'pending_shopper': return 'status-pending';
            case 'accepted_by_shopper': return 'status-confirmed';
            case 'shopper_at_shop': return 'status-preparing';
            case 'shopping_in_progress': return 'status-preparing';
            case 'shopping': return 'status-preparing';
            case 'final_shopping': return 'status-preparing';
            case 'bill_uploaded': return 'status-ready';
            case 'bill_sent': return 'status-ready';
            case 'bill_approved': return 'status-confirmed';
            case 'confirmed': return 'status-confirmed';
            case 'preparing': return 'status-preparing';
            case 'ready': return 'status-ready';
            case 'picked_up': return 'status-picked-up';
            case 'out_for_delivery': return 'status-picked-up';
            case 'delivered': return 'status-delivered';
            case 'cancelled': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    const getStatusDisplayName = (status) => {
        if (!status) return 'Unknown';
        
        switch (status.toLowerCase()) {
            case 'pending': return 'Pending';
            case 'pending_shopper': return 'Finding Personal Shopper';
            case 'accepted_by_shopper': return 'Personal Shopper Assigned';
            case 'shopper_at_shop': return 'Shopper Arrived at Store';
            case 'shopping_in_progress': return 'Shopping in Progress';
            case 'shopping': return 'Shopping in Progress';
            case 'final_shopping': return 'Finalizing Purchase';
            case 'bill_uploaded': return 'Bill Uploaded - Awaiting Approval';
            case 'bill_sent': return 'Bill Sent for Approval';
            case 'bill_approved': return 'Bill Approved - Preparing Delivery';
            case 'confirmed': return 'Confirmed';
            case 'preparing': return 'Preparing';
            case 'ready': return 'Ready for Pickup';
            case 'picked_up': return 'Picked Up';
            case 'out_for_delivery': return 'Out for Delivery';
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    };

    const calculateOrderTotal = (order) => {
        try {
            if (!order.items || !Array.isArray(order.items)) return 0;
            
            const itemTotal = order.items.reduce((sum, item) => {
                const product = item.productId || item.product || item;
                const price = parseFloat(product.price || 0);
                const quantity = parseInt(item.quantity || 1);
                return sum + (price * quantity);
            }, 0);
            
            const gst = itemTotal * 0.05;
            const platformFee = itemTotal * 0.029;
            const tax = gst + platformFee;
            const deliveryCharge = 30;
            
            return itemTotal + tax + deliveryCharge;
        } catch (error) {
            console.error('Error calculating order total:', error);
            return 0;
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
                    <div className="empty-orders-icon">📦</div>
                    <p>You have not placed any orders yet.</p>
                    <button
                        className="start-shopping-btn"
                        onClick={() => window.location.assign('/')}
                    >
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => {
                        const grandTotal = calculateOrderTotal(order);

                        // Group items by shop
                        const grouped = {};
                        if (order.items && Array.isArray(order.items)) {
                            order.items.forEach(item => {
                                const product = item.productId || item.product || item;
                                const shopId = product.shopId?._id || product.shopId;
                                const shopName = product.shopId?.name || 'Unknown Shop';
                                
                                if (!grouped[shopId]) {
                                    grouped[shopId] = {
                                        shopName,
                                        items: []
                                    };
                                }
                                grouped[shopId].items.push(item);
                            });
                        }

                        const shopGroups = Object.values(grouped);

                        return (
                            <div key={order._id} className="order-card">
                                <div className="order-header">
                                    <div className="order-date">
                                        {formatDate(order.createdAt)}
                                    </div>
                                    <div className={`order-status ${getStatusColor(order.status)}`}>
                                        {getStatusDisplayName(order.status)}
                                    </div>
                                    {order.status === 'cancelled' && order.reason && (
                                        <div className="order-reason">
                                            <strong>Reason:</strong> {order.reason}
                                        </div>
                                    )}
                                </div>

                                <div className="order-details">
                                    <div className="order-address">
                                        <strong>Delivery Address:</strong> {typeof order.address === 'object' ?
                                            `${order.address.street || ''}, ${order.address.city || ''}, ${order.address.state || ''} ${order.address.zipCode || ''}` :
                                            order.address || 'Address not provided'}
                                    </div>

                                    {shopGroups.length > 0 ? (
                                        shopGroups.map((group, idx) => (
                                            <div key={idx} className="order-shop-group">
                                                <h4 className="shop-name">
                                                    {group.shopName}
                                                </h4>
                                                <div className="shop-items">
                                                    {group.items.map((item, i) => {
                                                        const product = item.productId || item.product || item;
                                                        const price = parseFloat(product.price || 0);
                                                        const quantity = parseInt(item.quantity || 1);
                                                        
                                                        return (
                                                            <div key={i} className="order-item">
                                                                <div className="item-details">
                                                                    <span className="item-name">
                                                                        {product.name || 'Unknown Product'}
                                                                    </span>
                                                                    <span className="item-quantity">
                                                                        × {quantity}
                                                                    </span>
                                                                </div>
                                                                <span className="item-price">
                                                                    ₹{(price * quantity).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-items">
                                            <p>No items found in this order</p>
                                        </div>
                                    )}

                                    <div className="order-total-breakdown">
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
