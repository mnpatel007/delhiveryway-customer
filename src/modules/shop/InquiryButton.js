import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import OrderInquiry from './OrderInquiry';
import './InquiryButton.css';

const InquiryButton = ({ order }) => {
  const [inquiryAvailable, setInquiryAvailable] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasNotified, setHasNotified] = useState(false);
  const { addNotification } = useSocket();

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
      console.log(
        `Order ${order.orderNumber}: Using inquiry time = ${inquiryTime} minutes (from shop: ${order.shopId?.name})`
      );

      if (timeDiff >= inquiryTime) {
        if (!inquiryAvailable) {
          setInquiryAvailable(true);
          setTimeRemaining(0);

          // Show notification when inquiry becomes available (only once)
          if (!hasNotified) {
            addNotification({
              id: Date.now(),
              type: 'inquiry_available',
              title: 'Need help with your order?',
              message: `You can now inquire about order #${order.orderNumber}`,
              timestamp: new Date().toISOString(),
            });
            setHasNotified(true);
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
  }, [order, inquiryAvailable, hasNotified, addNotification]);

  // Don't show anything if order is delivered or cancelled
  if (!order || ['delivered', 'cancelled'].includes(order.status)) {
    return null;
  }

  if (!inquiryAvailable) {
    const inquiryTime = order.shopId?.inquiryAvailableTime || 15;
    const progress = ((inquiryTime - timeRemaining) / inquiryTime) * 100;

    return (
      <div
        className="inquiry-timer-widget"
        title={`You can inquire about your order after ${inquiryTime} minutes from order placement`}
      >
        <div className="timer-content">
          <span className="timer-icon">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <span className="timer-text">Inquiry in {timeRemaining}min</span>
        </div>
        <div className="timer-progress-bar">
          <div className="timer-progress-fill" style={{ width: `${progress}%` }}></div>
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
        <span className="inquiry-icon">
          <svg viewBox="0 0 24 24">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
          </svg>
        </span>
        <span className="inquiry-text">Do an inquiry</span>
        <span className="inquiry-pulse"></span>
      </button>

      {showInquiry && <OrderInquiry order={order} onClose={() => setShowInquiry(false)} />}
    </>
  );
};

export default InquiryButton;
