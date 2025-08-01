import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const {
        notifications,
        removeNotification,
        clearNotifications,
        isConnected,
        reconnectAttempts,
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

    const getConnectionStatus = () => {
        if (isConnected) return { status: 'Connected', color: '#4CAF50' };
        if (reconnectAttempts > 0) return { status: `Reconnecting... (${reconnectAttempts})`, color: '#FF9800' };
        return { status: 'Disconnected', color: '#F44336' };
    };

    const connectionStatus = getConnectionStatus();
    const unreadCount = notifications.length;

    return (
        <div className="notification-center">
            {/* Connection Status Indicator */}
            <div className="connection-status" style={{ color: connectionStatus.color }}>
                <span className="status-dot" style={{ backgroundColor: connectionStatus.color }}></span>
                {connectionStatus.status}
            </div>

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
                                    className={`notification-item ${notification.type}`}
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
                                    </div>
                                    <button
                                        className="remove-notification"
                                        onClick={() => removeNotification(notification.id)}
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