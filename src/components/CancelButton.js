import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import './CancelButton.css';

const CancelButton = ({ order, onCancel, isCancelling = false }) => {
    const [cancelAvailable, setCancelAvailable] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const { addNotification } = useSocket();

    // Check if cancellation is available based on order timing and status
    useEffect(() => {
        const checkCancelAvailability = () => {
            if (!order || !order.createdAt) return;

            // Skip if order is already delivered or cancelled
            if (['delivered', 'cancelled', 'picked_up', 'out_for_delivery', 'bill_uploaded', 'bill_approved'].includes(order.status)) {
                setCancelAvailable(false);
                return;
            }

            const orderTime = new Date(order.createdAt);
            const currentTime = new Date();
            const timeDiff = (currentTime - orderTime) / (1000 * 60); // minutes
            const cancelTimeLimit = 10; // 10 minutes for cancellation

            if (timeDiff <= cancelTimeLimit) {
                setCancelAvailable(true);
                setTimeRemaining(Math.ceil(cancelTimeLimit - timeDiff));
            } else {
                // Check if still cancellable based on status (even after 10 min)
                const cancellableStatuses = ['pending', 'confirmed', 'accepted', 'shopper_assigned', 'shopper_on_the_way', 'shopping_in_progress'];
                setCancelAvailable(cancellableStatuses.includes(order.status));
                setTimeRemaining(0);
            }
        };

        checkCancelAvailability();
        const interval = setInterval(checkCancelAvailability, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [order]);

    // Handle cancel click
    const handleCancelClick = async () => {
        if (!cancelAvailable || isCancelling) return;

        await onCancel(order);
    };

    // Don't show anything if order is delivered or cancelled
    if (!order || ['delivered', 'cancelled'].includes(order.status)) {
        return null;
    }

    // Show timer if within 10 minutes
    if (!cancelAvailable && timeRemaining > 0) {
        const cancelTimeLimit = 10;
        const progress = ((cancelTimeLimit - timeRemaining) / cancelTimeLimit) * 100;

        return (
            <div className="cancel-timer-widget" title={`You can cancel your order within 10 minutes from order placement`}>
                <div className="timer-content">
                    <span className="timer-icon">⏰</span>
                    <span className="timer-text">
                        Cancel in {timeRemaining}min
                    </span>
                </div>
                <div className="timer-progress-bar">
                    <div
                        className="timer-progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        );
    }

    // Show cancel button if cancellation is available
    if (cancelAvailable) {
        // Determine cancellation fee info
        const isWithinFreeTime = (() => {
            const orderTime = new Date(order.createdAt);
            const now = new Date();
            const diffInMinutes = (now - orderTime) / (1000 * 60);
            return diffInMinutes <= 10;
        })();

        const deliveryFee = order.deliveryFee || 0;
        const feeInfo = isWithinFreeTime
            ? { isFree: true, message: 'Free cancellation' }
            : { isFree: false, message: `₹${deliveryFee} cancellation fee` };

        return (
            <button
                className="cancel-button"
                onClick={handleCancelClick}
                disabled={isCancelling}
                title={`${feeInfo.message} - Click to cancel order`}
            >
                <span className="cancel-icon">❌</span>
                <span className="cancel-text">
                    {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </span>
                <span className="cancel-pulse"></span>
            </button>
        );
    }

    return null;
};

export default CancelButton;