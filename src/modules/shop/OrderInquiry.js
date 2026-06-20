import React, { useState, useEffect } from 'react';
import { apiCall, shopsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './OrderInquiry.css';

const OrderInquiry = ({ order, onClose }) => {
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [inquiryAvailable, setInquiryAvailable] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { addNotification } = useSocket();

  // Calculate if inquiry is available based on order time and shop settings
  useEffect(() => {
    const checkInquiryAvailability = () => {
      if (!order || !order.createdAt) return;

      const orderTime = new Date(order.createdAt);
      const currentTime = new Date();
      const timeDiff = (currentTime - orderTime) / (1000 * 60); // minutes
      const inquiryTime = order.shopId?.inquiryAvailableTime || 15;

      if (timeDiff >= inquiryTime) {
        setInquiryAvailable(true);
        setTimeRemaining(0);
      } else {
        setInquiryAvailable(false);
        setTimeRemaining(Math.ceil(inquiryTime - timeDiff));
      }
    };

    checkInquiryAvailability();
    const interval = setInterval(checkInquiryAvailability, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [order]);

  // Show notification when inquiry becomes available
  useEffect(() => {
    if (inquiryAvailable && !showContactInfo) {
      addNotification({
        id: Date.now(),
        type: 'inquiry_available',
        title: 'Need help with your order?',
        message: 'You can now contact your personal shopper for order updates!',
        timestamp: new Date().toISOString(),
      });
    }
  }, [inquiryAvailable, showContactInfo, addNotification]);

  const getOrderStatusMessage = (status) => {
    const statusMessages = {
      confirmed: 'Your order is confirmed and being prepared',
      preparing: 'Your order is being prepared by the vendor',
      ready_for_pickup: 'Your order is ready for pickup',
      picked_up: 'Your order has been picked up and is on the way',
      out_for_delivery: 'Your order is out for delivery',
      delivered: 'Your order has been delivered!',
      cancelled: 'Your order has been cancelled',
    };
    return statusMessages[status] || 'Order is being processed';
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: '#28a745',
      preparing: '#ffc107',
      ready_for_pickup: '#17a2b8',
      picked_up: '#fd7e14',
      out_for_delivery: '#6f42c1',
      delivered: '#28a745',
      cancelled: '#dc3545',
    };
    return colors[status] || '#6c757d';
  };

  const handleContactShopper = async (method) => {
    const shopper = order.personalShopperId;
    if (!shopper) return;

    try {
      // Track inquiry in backend
      const response = await fetch(`/api/orders/${order._id}/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          method,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Open contact method
        if (method === 'call') {
          window.open(`tel:${shopper.phone}`, '_self');
        } else if (method === 'whatsapp') {
          const message = encodeURIComponent(
            `Hi! I'm inquiring about my order #${order.orderNumber}. Could you please provide an update?`
          );
          window.open(`https://wa.me/${shopper.phone}?text=${message}`, '_blank');
        }

        // Show success notification
        addNotification({
          id: Date.now(),
          type: 'inquiry_made',
          title: 'Inquiry sent',
          message: `You contacted your shopper via ${method}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        const errorData = await response.json();
        addNotification({
          id: Date.now(),
          type: 'error',
          title: 'Inquiry failed',
          message: errorData.message || 'Failed to track inquiry',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error tracking inquiry:', error);
      // Still allow contact even if tracking fails
      if (method === 'call') {
        window.open(`tel:${shopper.phone}`, '_self');
      } else if (method === 'whatsapp') {
        const message = encodeURIComponent(
          `Hi! I'm inquiring about my order #${order.orderNumber}. Could you please provide an update?`
        );
        window.open(`https://wa.me/${shopper.phone}?text=${message}`, '_blank');
      }
    }
  };

  if (!inquiryAvailable) {
    return (
      <div className="inquiry-waiting">
        <div className="inquiry-timer">
          <div className="timer-icon">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <h3>Order inquiry</h3>
          <p>
            You can contact your shopper in <strong>{timeRemaining} minutes</strong>
          </p>
          <div className="timer-progress">
            <div
              className="progress-bar"
              style={{
                width: `${(((order.shopId?.inquiryAvailableTime || 15) - timeRemaining) / (order.shopId?.inquiryAvailableTime || 15)) * 100}%`,
              }}
            ></div>
          </div>
          <small>We'll notify you when inquiry becomes available</small>
        </div>
      </div>
    );
  }

  return (
    <div className="order-inquiry-modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="inquiry-content">
        <div className="inquiry-header">
          <h2>
            <svg viewBox="0 0 24 24" className="ih-ic">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
            </svg>{' '}
            Order inquiry
          </h2>
          <button onClick={onClose} className="close-btn">
            <svg viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="inquiry-body">
          {/* Order Status Section */}
          <div className="order-status-section">
            <h3>Current order status</h3>
            <div className="status-card">
              <div
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(order.status) }}
              ></div>
              <div className="status-info">
                <h4>Order #{order.orderNumber}</h4>
                <p className="status-message">{getOrderStatusMessage(order.status)}</p>
                <p className="order-time">Ordered: {new Date(order.createdAt).toLocaleString()}</p>
                {order.estimatedDeliveryTime && (
                  <p className="eta">
                    ETA: {new Date(order.estimatedDeliveryTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Shopper Contact Section */}
          {order.personalShopperId ? (
            <div className="shopper-contact-section">
              <h3>Your personal shopper</h3>
              <div className="shopper-card">
                <div className="shopper-avatar">
                  {order.personalShopperId.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="shopper-info">
                  <h4>{order.personalShopperId.name || 'Personal Shopper'}</h4>
                  <p>{order.personalShopperId.phone || 'Contact available'}</p>
                  <div className="contact-buttons">
                    <button
                      className="contact-btn call"
                      onClick={() => handleContactShopper('call')}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
                      </svg>
                      Call now
                    </button>
                    <button
                      className="contact-btn whatsapp"
                      onClick={() => handleContactShopper('whatsapp')}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M21 12a9 9 0 01-13.5 7.8L3 21l1.3-4.4A9 9 0 1121 12z" />
                      </svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              <div className="inquiry-tips">
                <h4>Quick tips</h4>
                <ul>
                  <li>Your shopper is working hard to get your order ready</li>
                  <li>Delivery times may vary due to traffic or shop preparation</li>
                  <li>You'll get notified of any status changes</li>
                  <li>Be patient — quality takes time!</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="no-shopper-section">
              <div className="no-shopper-message">
                <h3>Finding your shopper</h3>
                <p>We're currently assigning a personal shopper to your order.</p>
                <p>You'll be able to contact them once they're assigned!</p>
                <div className="loading-animation">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inquiry History Section */}
          {order.timeline &&
            order.timeline.filter((t) => t.status === 'inquiry_made').length > 0 && (
              <div className="inquiry-history-section">
                <h3>Previous inquiries</h3>
                <div className="inquiry-history">
                  {order.timeline
                    .filter((t) => t.status === 'inquiry_made')
                    .slice(-3) // Show last 3 inquiries
                    .map((inquiry, index) => (
                      <div key={index} className="inquiry-item">
                        <div className="inquiry-time">
                          {new Date(inquiry.timestamp).toLocaleString()}
                        </div>
                        <div className="inquiry-note">
                          {inquiry.note || 'Customer made an inquiry'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Reassurance Section */}
          <div className="reassurance-section">
            <div className="reassurance-card">
              <h4>We've got you covered</h4>
              <p>
                Your order is being carefully handled. If there are any delays, we'll keep you
                updated every step of the way!
              </p>
            </div>
          </div>
        </div>

        <div className="inquiry-footer">
          <button onClick={onClose} className="close-inquiry-btn">
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderInquiry;
