import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const navigate = useNavigate();
    const {
        notifications,
        removeNotification,
        clearNotifications,
    } = useSocket();

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (notification.type === 'final_checkout_ready') {
            navigate('/final-checkout');
        }
    };

    // Hide the panel if there are no notifications
    if (!notifications || notifications.length === 0) return null;

    return (
        <div className="notification-center">
            <div className="notification-panel">
                <div className="notification-header">
                    <h3>Notifications</h3>
                    <div className="notification-actions">
                        <button
                            className="clear-btn"
                            onClick={clearNotifications}
                            title="Clear all notifications"
                        >
                            🗑️ Clear
                        </button>
                    </div>
                </div>

                <div className="notification-list">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`notification-item ${notification.type} ${notification.type === 'final_checkout_ready' ? 'clickable' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="notification-content">
                                <div className="notification-title">
                                    {notification.title}
                                </div>
                                <div className="notification-message">
                                    {notification.message}
                                </div>
                                <div className="notification-time">
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                </div>
                                {notification.type === 'final_checkout_ready' && (
                                    <div className="notification-action">
                                        Click to proceed to checkout →
                                    </div>
                                )}
                            </div>
                            <button
                                className="remove-notification"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                }}
                                title="Remove notification"
                            >
                                ✖️
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;