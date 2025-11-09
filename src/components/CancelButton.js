import React, { useState, useEffect } from 'react';
import { ordersAPI, apiCall } from '../services/api';
import './CancelButton.css';

const CancelButton = ({ order }) => {
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isCancelling, setIsCancelling] = useState(false);

    // Helper function to check if order is within free cancellation period (10 minutes)
    const isWithinFreeCancellationPeriod = (order) => {
        const orderTime = new Date(order.createdAt);
        const now = new Date();
        const diffInMinutes = (now - orderTime) / (1000 * 60);
        return diffInMinutes <= 10;
    };

    // Helper function to check if order can be cancelled
    const canOrderBeCancelled = (order) => {
        const nonCancellableStatuses = ['delivered', 'cancelled', 'refunded'];
        return !nonCancellableStatuses.includes(order.status);
    };

    // Helper function to get cancellation policy based on status and time
    const getCancellationPolicy = (order) => {
        const isWithinFreeTime = isWithinFreeCancellationPeriod(order);
        const deliveryFee = order.orderValue?.deliveryFee || order.deliveryFee || 0;
        const total = order.orderValue?.total || order.total || 0;

        // Check if order has reached final stages
        const finalStages = ['final_shopping', 'out_for_delivery', 'delivered'];
        const isInFinalStage = finalStages.includes(order.status);

        if (isWithinFreeTime) {
            // Within 10 minutes - free cancellation regardless of status
            return {
                type: 'free',
                fee: 0,
                refund: total,
                message: 'Free cancellation',
                description: 'Full refund will be issued'
            };
        } else if (isInFinalStage) {
            // After final shopping starts - no refund
            return {
                type: 'no_refund',
                fee: total,
                refund: 0,
                message: 'No refund available',
                description: 'Order is in final stage - no refund will be issued'
            };
        } else {
            // After 10 min but before final shopping - only delivery fee charged
            return {
                type: 'delivery_fee_only',
                fee: deliveryFee,
                refund: total - deliveryFee,
                message: `Cancellation fee: ₹${deliveryFee}`,
                description: 'Only delivery fee will be charged, rest will be refunded'
            };
        }
    };

    // Calculate remaining time for free cancellation
    const calculateTimeRemaining = () => {
        const orderTime = new Date(order.createdAt);
        const now = new Date();
        const diffInMs = now - orderTime;
        const tenMinutesInMs = 10 * 60 * 1000;
        const remaining = Math.max(0, tenMinutesInMs - diffInMs);
        return remaining;
    };

    // Update timer every second
    useEffect(() => {
        const updateTimer = () => {
            const remaining = calculateTimeRemaining();
            setTimeRemaining(remaining);
        };

        updateTimer(); // Initial calculation
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [order.createdAt]);

    // Format time remaining
    const formatTimeRemaining = (ms) => {
        const minutes = Math.floor(ms / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Calculate progress percentage (0-100)
    const getProgressPercentage = () => {
        const tenMinutesInMs = 10 * 60 * 1000;
        const elapsed = tenMinutesInMs - timeRemaining;
        return Math.min(100, (elapsed / tenMinutesInMs) * 100);
    };

    // Handle order cancellation
    const handleCancelOrder = async () => {
        if (!canOrderBeCancelled(order)) {
            alert('This order cannot be cancelled.');
            return;
        }

        const policy = getCancellationPolicy(order);

        let confirmMessage = `Cancel order #${order.orderNumber}?\n\n`;

        if (policy.type === 'free') {
            confirmMessage += `${policy.message}\n${policy.description}`;
        } else if (policy.type === 'no_refund') {
            confirmMessage += `${policy.message}\n${policy.description}\n\nAre you sure you want to proceed?`;
        } else {
            confirmMessage += `${policy.message}\n${policy.description}\nRefund amount: ₹${policy.refund}\n\nDo you want to proceed?`;
        }

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setIsCancelling(true);

            const result = await apiCall(() =>
                ordersAPI.cancel(order._id, 'Cancelled by customer')
            );

            if (result.success) {
                alert('Order cancelled successfully!');
                // Refresh the page to update the order list
                window.location.reload();
            } else {
                alert('Failed to cancel order: ' + result.message);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    const policy = getCancellationPolicy(order);
    const isFreePeriod = timeRemaining > 0;
    const canCancel = canOrderBeCancelled(order);

    // Don't show cancel button if order cannot be cancelled
    if (!canCancel) {
        return null;
    }

    return (
        <button
            className={`cancel-button ${policy.type === 'free' ? 'free-period' : policy.type === 'no_refund' ? 'no-refund-period' : 'fee-period'}`}
            onClick={handleCancelOrder}
            disabled={isCancelling}
        >
            <div className="cancel-content">
                <div className="cancel-icon">❌</div>
                <div className="cancel-text">
                    <div className="cancel-label">
                        {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </div>
                    <div className="cancel-info">
                        {policy.type === 'free' && isFreePeriod
                            ? `Free for ${formatTimeRemaining(timeRemaining)}`
                            : policy.message
                        }
                    </div>
                    {policy.type !== 'free' && (
                        <div className="cancel-description">
                            {policy.description}
                        </div>
                    )}
                </div>
            </div>
            {policy.type === 'free' && isFreePeriod && (
                <div className="cancel-progress">
                    <div
                        className="cancel-progress-bar"
                        style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                </div>
            )}
        </button>
    );
};

export default CancelButton;