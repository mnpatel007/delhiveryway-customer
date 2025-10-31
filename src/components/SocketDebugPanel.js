import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';
import './SocketDebugPanel.css';

const SocketDebugPanel = () => {
    const { socket, isConnected, notifications } = useSocket();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [apiStatus, setApiStatus] = useState('unknown');
    const [lastApiCheck, setLastApiCheck] = useState(null);

    // Handle ESC key to close panel
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

    // Check API health
    const checkApiHealth = async () => {
        try {
            // Try a basic endpoint that likely exists
            const response = await fetch(`${config.API_BASE_URL}/shops`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok || response.status === 401) {
                // 200 OK or 401 Unauthorized means API is responding
                setApiStatus('healthy');
            } else {
                setApiStatus('unhealthy');
            }
        } catch (error) {
            setApiStatus('error');
        }

        setLastApiCheck(new Date().toISOString());
    };

    useEffect(() => {
        checkApiHealth();
        const interval = setInterval(checkApiHealth, 60000); // Check every 60 seconds

        return () => clearInterval(interval);
    }, []);

    const getApiStatusColor = () => {
        switch (apiStatus) {
            case 'healthy': return '#28a745';
            case 'unhealthy': return '#ffc107';
            case 'error': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const getApiStatusText = () => {
        switch (apiStatus) {
            case 'healthy': return '✅ API Healthy';
            case 'unhealthy': return '⚠️ API Unhealthy';
            case 'error': return '❌ API Error';
            default: return '❓ API Unknown';
        }
    };

    if (!isOpen) {
        return (
            <button
                className="debug-panel-toggle"
                onClick={() => setIsOpen(true)}
                title="Debug Panel"
            >
                🐛
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="debug-panel-backdrop"
                onClick={() => setIsOpen(false)}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.2)',
                    zIndex: 999998
                }}
            />

            <div className="debug-panel">
                <div className="debug-panel-header">
                    <h3>🐛 Debug Panel</h3>
                    <button
                        className="debug-panel-close"
                        onClick={() => setIsOpen(false)}
                        title="Close Debug Panel"
                    >
                        ✖
                    </button>
                </div>

                <div className="debug-panel-content">
                    <div className="debug-section">
                        <h4>🔌 Connection Status</h4>
                        <div className="status-item">
                            <span>Socket:</span>
                            <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                                {isConnected ? '✅ Connected' : '❌ Disconnected'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span>API:</span>
                            <span className="status" style={{ color: getApiStatusColor() }}>
                                {getApiStatusText()}
                            </span>
                        </div>
                        {lastApiCheck && (
                            <div className="status-item">
                                <span>Last Check:</span>
                                <span>{new Date(lastApiCheck).toLocaleTimeString()}</span>
                            </div>
                        )}
                    </div>

                    <div className="debug-section">
                        <h4>⚙️ Configuration</h4>
                        <div className="config-item">
                            <span>API URL:</span>
                            <span className="config-value">{config.API_BASE_URL}</span>
                        </div>
                        <div className="config-item">
                            <span>Socket URL:</span>
                            <span className="config-value">{config.SOCKET_URL}</span>
                        </div>
                        <div className="config-item">
                            <span>Environment:</span>
                            <span className="config-value">{config.APP_ENV}</span>
                        </div>
                    </div>

                    <div className="debug-section">
                        <h4>👤 User Info</h4>
                        <div className="user-item">
                            <span>Logged In:</span>
                            <span>{user ? '✅ Yes' : '❌ No'}</span>
                        </div>
                        {user && (
                            <>
                                <div className="user-item">
                                    <span>User ID:</span>
                                    <span className="user-value">{user.id || user._id || 'N/A'}</span>
                                </div>
                                <div className="user-item">
                                    <span>Name:</span>
                                    <span className="user-value">{user.name || 'N/A'}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="debug-section">
                        <h4>🔔 Notifications</h4>
                        <div className="notifications-count">
                            {notifications.length} notification(s)
                        </div>
                        {notifications.length > 0 && (
                            <div className="notifications-list">
                                {notifications.slice(-3).map((notif, index) => (
                                    <div key={index} className="notification-item">
                                        <span className="notification-type">{notif.type}</span>
                                        <span className="notification-message">{notif.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="debug-section">
                        <h4>🛠️ Actions</h4>
                        <button
                            className="debug-action-btn"
                            onClick={checkApiHealth}
                        >
                            🔄 Check API Health
                        </button>
                        <button
                            className="debug-action-btn"
                            onClick={() => {
                                if (socket) {
                                    socket.emit('ping');
                                }
                            }}
                            disabled={!socket}
                        >
                            📡 Ping Socket
                        </button>
                        <button
                            className="debug-action-btn"
                            onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}
                        >
                            🗑️ Clear Storage & Reload
                        </button>
                        <button
                            className="debug-action-btn"
                            onClick={() => {
                                import('../utils/testNotifications').then(({ testNotifications, testBrowserNotifications }) => {
                                    testNotifications(socket, (notif) => {
                                        console.log('Test notification added:', notif);
                                    });
                                    testBrowserNotifications();
                                });
                            }}
                        >
                            🧪 Test Notifications
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SocketDebugPanel;