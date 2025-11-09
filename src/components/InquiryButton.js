import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import OrderInquiry from './OrderInquiry';
import './InquiryButton.css';

const InquiryButton = ({ order }) => {
    const [inquiryAvailable, setInquiryAvailable] = useState(false);
    const [showInquiry, setShowInquiry] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const { addNotification } = useSocket();

    // Check if this order has already been notified
    const getNotificationKey = (orderId) => `inquiry_notified_${orderId}`;

    const hasBeenNotified = (orderId) => {
        return localStorage.getItem(getNotificationKey(orderId)) === 'true';
    };

    const markAsNotified = (orderId) => {
        localStorage.setItem(getNotificationKey(orderId), 'true');
    };

    // Clean up notification flags for completed orders
    useEffect(() => {
        if (order && ['delivered', 'cancelled'].includes(order.status)) {
            localStorage.removeItem(getNotificationKey(order._id));
        }
    }, [order]);

    // Check if inquiry is available based on order timing
    useEffect(() => {
        const checkInquiryAvailability = () => {
            if (!order || !order.createdAt) return;

            // Skip if order is already delivered or cancelled
            if (['delivered', 'cancelled'].includes(order.status)) {
                setInquiryAvailable(false);
                return;
            }

            const orderTime = new Date(order.createdAt);
            const currentTime = new Date();
            const timeDiff = (currentTime - orderTime) / (1000 * 60); // minutes
            const inquiryTime = order.shopId?.inquiryAvailableTime || 15;
            console.log(`Order ${order.orderNumber}: Using inquiry time = ${inquiryTime} minutes (from shop: ${order.shopId?.name})`);

            if (timeDiff >= inquiryTime) {
                if (!inquiryAvailable) {
                    setInquiryAvailable(true);
                    setTimeRemaining(0);

                    // Show notification when inquiry becomes available (only once per order)
                    if (!hasBeenNotified(order._id)) {
                        addNotification({
                            id: Date.now(),
                            type: 'inquiry_available',
                            title: '📞 Need Help with Your Order?',
                            message: `You can now inquire about order #${order.orderNumber}`,
                            timestamp: new Date().toISOString()
                        });
                        markAsNotified(order._id);
                    }
                }
            } else {
                setInquiryAvailable(false);
                setTimeRemaining(Math.ceil(inquiryTime - timeDiff));
            }
        };

        checkInquiryAvailability();
        const interval = setInterval(checkInquiryAvailability, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [order, inquiryAvailable, addNotification]);

    // Don't show anything if order is delivered or cancelled
    if (!order || ['delivered', 'cancelled'].includes(order.status)) {
        return null;
    }

    if (!inquiryAvailable) {
        const inquiryTime = order.shopId?.inquiryAvailableTime || 15;
        const progress = ((inquiryTime - timeRemaining) / inquiryTime) * 100;

        return (
            <div className="inquiry-timer-widget" title={`You can inquire about your order after ${inquiryTime} minutes from order placement`}>
                <div className="timer-content">
                    <span className="timer-icon">⏰</span>
                    <span className="timer-text">
                        Inquiry in {timeRemaining}min
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

    return (
        <>
            <button
                className="inquiry-button"
                onClick={() => setShowInquiry(true)}
                title="Contact your personal shopper"
            >
                <span className="inquiry-icon">📞</span>
                <span className="inquiry-text">Do an Inquiry</span>
                <span className="inquiry-pulse"></span>
            </button>

            {showInquiry && (
                <OrderInquiry
                    order={order}
                    onClose={() => setShowInquiry(false)}
                />
            )}
        </>
    );
};

export default InquiryButton;