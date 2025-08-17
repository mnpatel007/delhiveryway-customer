import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const navigate = useNavigate();
    const {
        notifications,
        removeNotification,
        clearNotifications,


        requestNotificationPermission
    } = useSocket();

    const [isOpen, setIsOpen] = useState(false);
    const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

    // Request notification permission on first interaction
    const handleRequestPermission = async () => {
        if (!hasRequestedPermission) {
            await requestNotificationPermission();
            setHasRequestedPermission(true);
        }
    };


    const unreadCount = notifications.length;

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (notification.type === 'final_checkout_ready') {
            navigate('/final-checkout');
            setIsOpen(false);
        }
    };

    return (
        <div className="notification-center">


            {/* Notification Bell */}
            <div className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </div>

            {/* Notification Panel */}
            {isOpen && (
                <div className="notification-panel">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <div className="notification-actions">
                            {!hasRequestedPermission && (
                                <button
                                    className="permission-btn"
                                    onClick={handleRequestPermission}
                                    title="Enable browser notifications"
                                >
                                    🔔 Enable
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    className="clear-btn"
                                    onClick={clearNotifications}
                                    title="Clear all notifications"
                                >
                                    🗑️ Clear
                                </button>
                            )}
                            <button
                                className="close-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                ✖️
                            </button>
                        </div>
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <p>No notifications yet</p>
                                <small>You'll see order updates here</small>
                            </div>
                        ) : (
                            notifications.map((notification) => (
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
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;