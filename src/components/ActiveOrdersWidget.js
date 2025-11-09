import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, apiCall } from '../services/api';
import { useSocket } from '../context/SocketContext';
import InquiryButton from './InquiryButton';
import CancelButton from './CancelButton';
import './ActiveOrdersWidget.css';

const ActiveOrdersWidget = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateTimeout, setUpdateTimeout] = useState(null);
    const [cancellingOrder, setCancellingOrder] = useState(null);

    // Helper function to check if order can be cancelled
    const canCancelOrder = (order) => {
        const cancellableStatuses = [
            'pending',
            'confirmed',
            'accepted',
            'shopper_assigned',
            'personal_shopper_assigned',
            'shopper_on_the_way',
            'shopping_in_progress'
        ];
        const nonCancellableStatuses = [
            'picked_up',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'bill_uploaded',
            'bill_approved'
        ];

        return cancellableStatuses.includes(order.status) && !nonCancellableStatuses.includes(order.status);
    };

    // Helper function to check if order is within free cancellation period (10 minutes)
    const isWithinFreeCancellationPeriod = (order) => {
        const orderTime = new Date(order.createdAt);
        const now = new Date();
        const diffInMinutes = (now - orderTime) / (1000 * 60);
        return diffInMinutes <= 10;
    };

    // Helper function to get cancellation fee info
    const getCancellationFeeInfo = (order) => {
        const isWithinFreeTime = isWithinFreeCancellationPeriod(order);
        // Get delivery fee from order value or fallback to shop delivery fee
        const deliveryFee = order.orderValue?.deliveryFee || order.deliveryFee || order.shopId?.deliveryFee || 0;

        return {
            isFree: isWithinFreeTime,
            fee: isWithinFreeTime ? 0 : deliveryFee,
            message: isWithinFreeTime
                ? 'Free cancellation (within 10 minutes)'
                : `Cancellation fee: ₹${deliveryFee} (delivery fee only)`
        };
    };

    // Handle order cancellation
    const handleCancelOrder = async (order) => {
        const feeInfo = getCancellationFeeInfo(order);

        const confirmMessage = feeInfo.isFree
            ? `Cancel order #${order.orderNumber}?\n\n${feeInfo.message}`
            : `Cancel order #${order.orderNumber}?\n\n${feeInfo.message}\n\nDo you want to proceed?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setCancellingOrder(order._id);

            const result = await apiCall(() =>
                ordersAPI.cancel(order._id, 'Cancelled by customer')
            );

            if (result.success) {
                // Remove the cancelled order from active orders
                setActiveOrders(prev => prev.filter(o => o._id !== order._id));
                alert('Order cancelled successfully!');
            } else {
                alert('Failed to cancel order: ' + result.message);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order. Please try again.');
        } finally {
            setCancellingOrder(null);
        }
    };

    const fetchActiveOrders = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const result = await apiCall(ordersAPI.getCustomerOrders);

            if (result.success) {
                const ordersArray = result.data.data || result.data || [];

                // Filter for active orders (not delivered or cancelled)
                const activeOrdersFiltered = ordersArray.filter(order =>
                    !['delivered', 'cancelled'].includes(order.status)
                );

                // Sort by most recent first
                const sortedOrders = activeOrdersFiltered.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );

                console.log('Active orders loaded:', sortedOrders);
                sortedOrders.forEach(order => {
                    console.log(`Order ${order.orderNumber}: Status = ${order.status}, Shop = ${order.shopId?.name}, InquiryTime = ${order.shopId?.inquiryAvailableTime}`);
                });

                setActiveOrders(sortedOrders);
                setError(null);
            } else {
                setError(result.message || 'Failed to load orders');
            }
        } catch (err) {
            console.error('Failed to load active orders:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveOrders();
    }, [user]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket || !user) return;

        const handleOrderUpdate = (data) => {
            console.log('Socket order update received:', data);

            try {
                // Validate the incoming data
                if (!data || !data.orderId) {
                    console.warn('Invalid socket data received:', data);
                    return;
                }

                // Update the specific order in the active orders list
                setActiveOrders(prevOrders => {
                    const updatedOrders = prevOrders.map(order => {
                        if (order._id === data.orderId) {
                            // Only update fields that are provided in the socket data
                            const updatedOrder = { ...order };
                            if (data.status) updatedOrder.status = data.status;
                            if (data.personalShopperId) updatedOrder.personalShopperId = data.personalShopperId;
                            if (data.estimatedDeliveryTime) updatedOrder.estimatedDeliveryTime = data.estimatedDeliveryTime;

                            console.log('Updated order:', updatedOrder);
                            return updatedOrder;
                        }
                        return order;
                    });

                    return updatedOrders;
                });
            } catch (error) {
                console.error('Error handling socket order update:', error);
                // Don't crash the component, just log the error
            }
        };

        // Listen for various order update events
        socket.on('orderStatusUpdate', handleOrderUpdate);
        socket.on('orderUpdate', handleOrderUpdate);
        socket.on('shopperAction', handleOrderUpdate);

        return () => {
            socket.off('orderStatusUpdate', handleOrderUpdate);
            socket.off('orderUpdate', handleOrderUpdate);
            socket.off('shopperAction', handleOrderUpdate);

            // Clear any pending timeouts
            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }
        };
    }, [socket, user]);

    const getStatusDisplayName = (status) => {
        const statusMap = {
            'pending_shopper': 'Finding Personal Shopper',
            'accepted_by_shopper': 'Personal Shopper Assigned',
            'shopper_at_shop': 'Shopper at Store',
            'shopping_in_progress': 'Shopping in Progress',
            'shopper_revised_order': 'Order Revised - Please Review',
            'customer_reviewing_revision': 'Order Revised - Please Review',
            'customer_approved_revision': 'Revision Approved',
            'bill_uploaded': 'Bill Ready for Approval',
            'bill_sent': 'Bill Sent for Approval',
            'bill_approved': 'Bill Approved - Preparing Delivery',
            'confirmed': 'Confirmed',
            'preparing': 'Preparing',
            'ready': 'Ready for Pickup',
            'picked_up': 'Picked Up',
            'out_for_delivery': 'Out for Delivery'
        };
        return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'pending_shopper': '#ffc107',
            'accepted_by_shopper': '#28a745',
            'shopper_at_shop': '#17a2b8',
            'shopping_in_progress': '#fd7e14',
            'shopper_revised_order': '#dc3545',
            'customer_reviewing_revision': '#dc3545',
            'customer_approved_revision': '#28a745',
            'bill_uploaded': '#6f42c1',
            'bill_sent': '#6f42c1',
            'bill_approved': '#28a745',
            'confirmed': '#28a745',
            'preparing': '#ffc107',
            'ready': '#17a2b8',
            'picked_up': '#fd7e14',
            'out_for_delivery': '#6f42c1'
        };
        return colorMap[status] || '#6c757d';
    };

    // Don't show widget if user is not logged in
    if (!user) {
        return null;
    }

    // Don't show widget if loading or no active orders
    if (loading || activeOrders.length === 0) {
        return null;
    }

    if (error) {
        // Show a retry button instead of silently failing
        return (
            <div className="active-orders-widget error-state">
                <div className="widget-header">
                    <h3>📦 Your Active Orders</h3>
                    <button
                        className="refresh-btn"
                        onClick={fetchActiveOrders}
                        title="Try again"
                    >
                        🔄 Try Again
                    </button>
                </div>
                <div className="error-message">
                    <p>Something went wrong loading your orders.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="active-orders-widget">
            <div className="widget-header">
                <h3>📦 Your Active Orders</h3>
                <div className="header-actions">
                    <span className="orders-count">{activeOrders.length} active</span>
                    <button
                        className="refresh-btn"
                        onClick={fetchActiveOrders}
                        title="Refresh orders"
                    >
                        🔄
                    </button>
                </div>
            </div>

            <div className="active-orders-list">
                {activeOrders.slice(0, 3).map(order => {
                    // Add safety checks for each order
                    if (!order || !order._id) {
                        console.warn('Invalid order data:', order);
                        return null;
                    }

                    try {
                        return (
                            <div key={order._id} className="active-order-item">
                                <div className="order-info">
                                    <div className="order-header">
                                        <span className="order-number">
                                            Order #{order.orderNumber || order._id?.slice(-8) || 'Unknown'}
                                        </span>
                                        <span
                                            className="order-status-badge"
                                            style={{ backgroundColor: getStatusColor(order.status || 'pending') }}
                                        >
                                            {getStatusDisplayName(order.status || 'pending')}
                                        </span>
                                    </div>

                                    <div className="order-details">
                                        <span className="order-time">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown time'}
                                        </span>
                                        {order.shopId && order.shopId.name && (
                                            <span className="order-shop">
                                                🏪 {order.shopId.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="order-actions">
                                    <InquiryButton order={order} />
                                    <CancelButton
                                        order={order}
                                        onCancel={handleCancelOrder}
                                        isCancelling={cancellingOrder === order._id}
                                    />
                                </div>
                            </div>
                        );
                    } catch (orderError) {
                        console.error('Error rendering order:', orderError, order);
                        return null;
                    }
                }).filter(Boolean)}
            </div>

            {activeOrders.length > 3 && (
                <div className="widget-footer">
                    <button
                        className="view-all-btn"
                        onClick={() => window.location.href = '/order-history'}
                    >
                        View All Orders ({activeOrders.length})
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActiveOrdersWidget;