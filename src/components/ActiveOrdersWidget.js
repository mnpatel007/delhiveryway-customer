import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, apiCall, api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import InquiryButton from './InquiryButton';
import CancelButton from './CancelButton';
import UPIPaymentModal from './UPIPaymentModal';
import './ActiveOrdersWidget.css';

const ActiveOrdersWidget = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateTimeout, setUpdateTimeout] = useState(null);
    const [cancellingOrder, setCancellingOrder] = useState(null);
    const [showUPIModal, setShowUPIModal] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

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
        const orderTotal = order.orderValue?.total || 0;
        const refundAmount = orderTotal - deliveryFee;

        // Check if order is in no-refund status
        const noRefundStatuses = ['final_shopping', 'out_for_delivery', 'picked_up', 'bill_uploaded', 'bill_approved'];
        const isNoRefund = noRefundStatuses.includes(order.status);

        if (isNoRefund) {
            return {
                isFree: false,
                fee: orderTotal, // Full order amount as fee (no refund)
                isNoRefund: true,
                message: 'No refund available',
                detailedMessage: 'Order is too far in progress for refund. No amount will be refunded.'
            };
        }

        return {
            isFree: isWithinFreeTime,
            fee: isWithinFreeTime ? 0 : deliveryFee,
            isNoRefund: false,
            refundAmount: isWithinFreeTime ? orderTotal : refundAmount,
            message: isWithinFreeTime
                ? 'Free cancellation (within 10 minutes)'
                : `Cancellation fee: ₹${deliveryFee} (delivery fee only)`,
            detailedMessage: isWithinFreeTime
                ? `Full refund of ₹${orderTotal} will be processed.`
                : `₹${deliveryFee} will be deducted as cancellation fee. ₹${refundAmount} will be refunded to you.`
        };
    };

    // Handle order cancellation
    const handleCancelOrder = async (order) => {
        const feeInfo = getCancellationFeeInfo(order);

        let confirmMessage;
        if (feeInfo.isNoRefund) {
            confirmMessage = `Cancel order #${order.orderNumber}?\n\n⚠️ ${feeInfo.message}\n${feeInfo.detailedMessage}\n\nDo you still want to proceed?`;
        } else if (feeInfo.isFree) {
            confirmMessage = `Cancel order #${order.orderNumber}?\n\n✅ ${feeInfo.message}\n${feeInfo.detailedMessage}`;
        } else {
            confirmMessage = `Cancel order #${order.orderNumber}?\n\n💰 ${feeInfo.message}\n${feeInfo.detailedMessage}\n\nDo you want to proceed?`;
        }

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

                // Show appropriate success message based on refund status
                let successMessage;
                if (feeInfo.isNoRefund) {
                    successMessage = '❌ Order cancelled successfully!\n\nNo refund will be processed as the order was too far in progress.';
                } else if (feeInfo.isFree) {
                    successMessage = `✅ Order cancelled successfully!\n\n💰 Full refund of ₹${feeInfo.refundAmount} has been initiated and will reflect in your bank account in 3-5 business days.`;
                } else {
                    successMessage = `✅ Order cancelled successfully!\n\n💰 Refund of ₹${feeInfo.refundAmount} (after ₹${feeInfo.fee} cancellation fee) has been initiated and will reflect in your bank account in 3-5 business days.`;
                }

                alert(successMessage);
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

    // Auto-show UPI modal for payment required orders (persistent across page reloads)
    useEffect(() => {
        if (activeOrders.length > 0 && !showUPIModal) {
            const paymentRequiredOrder = activeOrders.find(order =>
                (order.status === 'accepted_by_shopper' || order.status === 'awaiting_upi_payment') &&
                order.payment?.status === 'awaiting_upi_payment'
            );

            if (paymentRequiredOrder && !selectedOrderForPayment) {
                console.log('🏦 Auto-showing UPI modal for payment required order:', paymentRequiredOrder.orderNumber);
                handlePayNow(paymentRequiredOrder);
            }
        }
    }, [activeOrders, showUPIModal, selectedOrderForPayment]);

    const getStatusDisplayName = (status) => {
        const statusMap = {
            'pending_shopper': 'Finding Personal Shopper',
            'accepted_by_shopper': 'Payment Required',
            'awaiting_upi_payment': 'Payment Required',
            'payment_completed': 'Payment Completed - Shopper Can Proceed',
            'shopper_at_shop': 'Shopper at Store',
            'shopping_in_progress': 'Shopping in Progress',
            'final_shopping': 'Final Shopping',
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
            'accepted_by_shopper': '#dc3545',
            'awaiting_upi_payment': '#dc3545',
            'payment_completed': '#28a745',
            'shopper_at_shop': '#17a2b8',
            'shopping_in_progress': '#fd7e14',
            'final_shopping': '#dc3545',
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

    const handlePayNow = (order) => {
        const paymentData = {
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentAmount: order.orderValue?.total || order.totalAmount || 0,
            shopperUpiId: order.payment?.shopperUpiId || 'shopper@upi',
            shopperName: order.personalShopperId?.name || 'Personal Shopper'
        };
        setSelectedOrderForPayment(paymentData);
        setShowUPIModal(true);
    };

    const handlePaymentConfirm = async (transactionId) => {
        try {
            const response = await api.post('/orders/confirm-payment', {
                orderId: selectedOrderForPayment.orderId,
                upiTransactionId: transactionId
            });

            if (response.data.success) {
                setShowUPIModal(false);
                setSelectedOrderForPayment(null);
                // Refresh orders to show updated status
                fetchActiveOrders();
                alert('✅ Payment confirmed successfully! Your shopper will now proceed with your order.');
            } else {
                throw new Error(response.data.message || 'Failed to confirm payment');
            }
        } catch (error) {
            console.error('Payment confirmation error:', error);
            throw error;
        }
    };

    const handleCloseUPIModal = () => {
        setShowUPIModal(false);
        // Don't clear selectedOrderForPayment so user can reopen if needed
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
                                    {/* Show Pay Now button for payment required orders */}
                                    {(order.status === 'accepted_by_shopper' || order.status === 'awaiting_upi_payment') && (
                                        <button
                                            className="pay-now-btn"
                                            onClick={() => handlePayNow(order)}
                                            style={{
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                marginRight: '8px',
                                                fontSize: '12px'
                                            }}
                                        >
                                            💳 Pay Now
                                        </button>
                                    )}
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

            {/* UPI Payment Modal */}
            <UPIPaymentModal
                isOpen={showUPIModal}
                onClose={handleCloseUPIModal}
                orderData={selectedOrderForPayment}
                onPaymentConfirm={handlePaymentConfirm}
            />
        </div>
    );
};

export default ActiveOrdersWidget;