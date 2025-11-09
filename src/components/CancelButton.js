import { useState, useEffect } from 'react';
import './CancelButton.css';

const CancelButton = ({ order, onCancel, isCancelling = false }) => {
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Calculate time remaining for free cancellation
    useEffect(() => {
        const calculateTimeRemaining = () => {
            if (!order || !order.createdAt) return;

            const orderTime = new Date(order.createdAt);
            const currentTime = new Date();
            const timeDiff = (currentTime - orderTime) / (1000 * 60); // minutes
            const cancelTimeLimit = 10; // 10 minutes for free cancellation

            if (timeDiff <= cancelTimeLimit) {
                setTimeRemaining(Math.ceil(cancelTimeLimit - timeDiff));
            } else {
                setTimeRemaining(0);
            }
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [order]);

    // Handle cancel click
    const handleCancelClick = async () => {
        if (isCancelling) return;
        await onCancel(order);
    };

    // Only hide if order is delivered or cancelled
    if (!order || ['delivered', 'cancelled'].includes(order.status)) {
        return null;
    }

    // Determine if cancellation is free or has a fee
    const isWithinFreeTime = timeRemaining > 0;
    // Get delivery fee from order value or fallback to shop delivery fee
    const deliveryFee = order.orderValue?.deliveryFee || order.deliveryFee || order.shopId?.deliveryFee || 0;
    const feeInfo = isWithinFreeTime
        ? { isFree: true, message: 'Free cancellation' }
        : { isFree: false, message: `₹${deliveryFee} cancellation fee` };

    // Show timer widget if within free cancellation period
    if (isWithinFreeTime) {
        const cancelTimeLimit = 10;
        const progress = ((cancelTimeLimit - timeRemaining) / cancelTimeLimit) * 100;

        return (
            <div className="cancel-timer-widget" title="Free cancellation available">
                <div className="timer-content">
                    <span className="timer-icon">⏰</span>
                    <span className="timer-text">
                        Free cancel: {timeRemaining}min
                    </span>
                </div>
                <div className="timer-progress-bar">
                    <div
                        className="timer-progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <button
                    className="cancel-button cancel-button-timer"
                    onClick={handleCancelClick}
                    disabled={isCancelling}
                    title={`${feeInfo.message} - Click to cancel order`}
                >
                    <span className="cancel-icon">❌</span>
                    <span className="cancel-text">
                        {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </span>
                </button>
            </div>
        );
    }

    // Show regular cancel button (with fee after 10 minutes)
    return (
        <button
            className={`cancel-button ${!isWithinFreeTime ? 'cancel-button-fee' : ''}`}
            onClick={handleCancelClick}
            disabled={isCancelling}
            title={`${feeInfo.message} - Click to cancel order`}
        >
            <span className="cancel-icon">❌</span>
            <span className="cancel-text">
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </span>
            {!isWithinFreeTime && deliveryFee > 0 && (
                <span className="cancel-fee-badge">₹{deliveryFee}</span>
            )}
            <span className="cancel-pulse"></span>
        </button>
    );
};

export default CancelButton;