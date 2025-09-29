import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ordersAPI, apiCall, api } from '../services/api';
import io from 'socket.io-client';
import config from '../config/config';
import './OrderHistoryPage.css';

const OrderHistoryPage = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleBillApproval = async (orderId) => {
        try {
            const result = await apiCall(() =>
                api.put(`/orders/${orderId}/approve-bill`)
            );

            if (result.success) {
                // Update the order status in local state
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        order._id === orderId
                            ? { ...order, status: 'bill_approved' }
                            : order
                    )
                );
                alert('Bill approved successfully!');
            } else {
                alert('Failed to approve bill: ' + result.message);
            }
        } catch (error) {
            console.error('Error approving bill:', error);
            alert('Failed to approve bill. Please try again.');
        }
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const result = await apiCall(ordersAPI.getCustomerOrders);

                if (result.success) {
                    console.log('API result:', result);
                    console.log('result.data:', result.data);
                    console.log('result.data.data:', result.data.data);

                    // The backend returns { success: true, data: { data: [...], pagination: {...} } }
                    const ordersArray = result.data.data || result.data || [];
                    console.log('Extracted orders array:', ordersArray);

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
            case 'shopper_revised_order': return 'status-ready';
            case 'customer_reviewing_revision': return 'status-ready';
            case 'customer_approved_revision': return 'status-confirmed';
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
            case 'shopper_revised_order': return 'Order Revised - Please Review';
            case 'customer_reviewing_revision': return 'Order Revised - Please Review';
            case 'customer_approved_revision': return 'Revision Approved';
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
            // Use revised order total if available (for revised orders)
            if (order.revisedOrderValue && order.revisedOrderValue.total) {
                return parseFloat(order.revisedOrderValue.total);
            }

            // Use original order total if available
            if (order.orderValue && order.orderValue.total) {
                return parseFloat(order.orderValue.total);
            }

            // Fallback to legacy fields
            if (order.totalAmount || order.finalAmount || order.amount) {
                return parseFloat(order.totalAmount || order.finalAmount || order.amount);
            }

            if (!order.items || !Array.isArray(order.items)) return 0;

            // Calculate from items (no taxes as per requirements)
            const itemTotal = order.items.reduce((sum, item) => {
                const product = item.productId || item.product || item;
                const price = parseFloat(product.price || item.price || 0);
                const quantity = parseInt(item.quantity || 1);
                return sum + (price * quantity);
            }, 0);

            const deliveryCharge = order.deliveryFee || 30;

            return itemTotal + deliveryCharge;
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
                                        {order.status === 'cancelled' ? (
                                            (() => {
                                                if (order.cancelledBy === 'admin') {
                                                    return 'Order cancelled by admin';
                                                } else if (order.cancelledBy === 'customer') {
                                                    return order.cancellationReason || 'Order cancelled by customer';
                                                } else if (order.reason) {
                                                    return `Shopper cancelled: ${order.reason}`;
                                                } else if (order.cancellationReason) {
                                                    return order.cancellationReason;
                                                } else {
                                                    return 'Order cancelled by shopper';
                                                }
                                            })()
                                        ) : (
                                            getStatusDisplayName(order.status)
                                        )}
                                    </div>
                                    {(order.status === 'customer_reviewing_revision' || order.status === 'shopper_revised_order') && (
                                        <div className="revision-actions">
                                            <button
                                                className="review-revision-btn"
                                                onClick={() => {
                                                    window.location.href = `/revised-order/${order._id}`;
                                                }}
                                            >
                                                Review Changes
                                            </button>
                                        </div>
                                    )}
                                    {order.status === 'bill_uploaded' && (
                                        <div className="bill-actions">
                                            <button
                                                className="view-bill-btn"
                                                onClick={() => {
                                                    const billUrl = order.billImage || order.billPhoto || order.bill || order.actualBill?.photo;
                                                    console.log('Bill URL:', billUrl);
                                                    console.log('Order actualBill:', order.actualBill);
                                                    if (billUrl) {
                                                        // Check if it's a base64 image
                                                        if (billUrl.startsWith('data:image/')) {
                                                            // Create a new window with the base64 image
                                                            const newWindow = window.open();
                                                            newWindow.document.write(`<img src="${billUrl}" style="max-width: 100%; height: auto;" />`);
                                                        } else {
                                                            // If it's a relative path, prepend the API base URL
                                                            const fullUrl = billUrl.startsWith('http')
                                                                ? billUrl
                                                                : `http://localhost:5000${billUrl}`;
                                                            console.log('Opening URL:', fullUrl);
                                                            window.open(fullUrl, '_blank');
                                                        }
                                                    } else {
                                                        alert('Bill image not available');
                                                    }
                                                }}
                                            >
                                                View Bill
                                            </button>
                                            <button
                                                className="approve-bill-btn"
                                                onClick={() => handleBillApproval(order._id)}
                                            >
                                                Approve Bill
                                            </button>
                                        </div>
                                    )}

                                </div>

                                <div className="order-details">
                                    <div className="order-address">
                                        <strong>Delivery Address:</strong> {(() => {
                                            const addr = order.deliveryAddress || order.address;
                                            if (typeof addr === 'string') {
                                                return addr;
                                            } else if (typeof addr === 'object' && addr !== null) {
                                                const parts = [
                                                    addr.street,
                                                    addr.city,
                                                    addr.state,
                                                    addr.zipCode
                                                ].filter(Boolean);
                                                return parts.length > 0 ? parts.join(', ') : 'Address not provided';
                                            }
                                            return 'Address not provided';
                                        })()}
                                    </div>

                                    {/* Show shop info if available */}
                                    {order.shopId && (
                                        <div className="order-shop-group">
                                            <h4 className="shop-name">
                                                {order.shopId.name || 'Shop'}
                                            </h4>
                                        </div>
                                    )}

                                    {/* Show items or fallback to order description */}
                                    {order.items && order.items.length > 0 ? (
                                        order.items.map((item, i) => {
                                            const product = item.productId || item.product || item;
                                            const price = parseFloat(product.price || item.price || 0);
                                            const quantity = parseInt(item.quantity || 1);

                                            return (
                                                <div key={i} className="order-item">
                                                    <div className="item-details">
                                                        <span className="item-name">
                                                            {product.name || item.name || item.description || 'Product'}
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
                                        })
                                    ) : (
                                        <div className="order-item">
                                            <div className="item-details">
                                                <span className="item-name">
                                                    {order.description || order.orderNumber || 'Custom Order'}
                                                </span>
                                                <span className="item-quantity">× 1</span>
                                            </div>
                                            <span className="item-price">
                                                ₹{order.totalAmount || order.amount || 0}
                                            </span>
                                        </div>
                                    )}

                                    <div className="order-total-breakdown">
                                        {(() => {
                                            // Get order values for breakdown
                                            const orderValues = order.revisedOrderValue || order.orderValue;

                                            if (orderValues) {
                                                return (
                                                    <>
                                                        <div className="total-row">
                                                            <span>Items</span>
                                                            <span>₹{orderValues.subtotal?.toFixed(2) || '0.00'}</span>
                                                        </div>
                                                        <div className="total-row">
                                                            <span>Delivery Fee</span>
                                                            <span>₹{orderValues.deliveryFee?.toFixed(2) || '0.00'}</span>
                                                        </div>
                                                        <div className="total-row grand-total">
                                                            <strong>Grand Total</strong>
                                                            <strong>₹{grandTotal.toFixed(2)}</strong>
                                                        </div>
                                                    </>
                                                );
                                            } else {
                                                return (
                                                    <div className="total-row grand-total">
                                                        <strong>Grand Total</strong>
                                                        <strong>₹{grandTotal.toFixed(2)}</strong>
                                                    </div>
                                                );
                                            }
                                        })()}
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
