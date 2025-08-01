import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { testSocketConnection, testNotificationSystem, checkConnectionHealth } from '../utils/socketTest';
import './SocketDebugPanel.css';

const SocketDebugPanel = () => {
    const {
        socket,
        isConnected,
        reconnectAttempts,
        addNotification,
        playNotificationSound,
        notifications
    } = useSocket();

    const [isOpen, setIsOpen] = useState(false);
    const [testResults, setTestResults] = useState([]);

    const addTestResult = (result) => {
        setTestResults(prev => [...prev.slice(-4), { ...result, timestamp: new Date().toLocaleTimeString() }]);
    };

    const runConnectionTest = () => {
        const result = testSocketConnection(socket, 'customer');
        addTestResult({ type: 'connection', success: result, message: result ? 'Connection test passed' : 'Connection test failed' });
    };

    const runNotificationTest = () => {
        testNotificationSystem(addNotification, playNotificationSound);
        addTestResult({ type: 'notification', success: true, message: 'Notification test completed' });
    };

    const runHealthCheck = () => {
        const health = checkConnectionHealth(socket, isConnected, reconnectAttempts);
        addTestResult({ type: 'health', success: health.status === 'healthy', message: `Health: ${health.status}` });
    };

    const forceReconnect = () => {
        if (socket) {
            socket.disconnect();
            setTimeout(() => socket.connect(), 1000);
            addTestResult({ type: 'reconnect', success: true, message: 'Forced reconnection initiated' });
        }
    };

    const clearTests = () => {
        setTestResults([]);
    };

    // Only show in development or when explicitly enabled
    if (process.env.NODE_ENV === 'production' && !localStorage.getItem('enableSocketDebug')) {
        return null;
    }

    return (
        <div className="socket-debug-panel">
            <button
                className="debug-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="Socket Debug Panel"
            >
                🔧
            </button>

            {isOpen && (
                <div className="debug-panel">
                    <div className="debug-header">
                        <h4>🔧 Socket Debug Panel</h4>
                        <button onClick={() => setIsOpen(false)}>✖️</button>
                    </div>

                    <div className="debug-status">
                        <div className={`status-item ${isConnected ? 'connected' : 'disconnected'}`}>
                            <span className="status-dot"></span>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                        <div className="status-item">
                            Reconnect Attempts: {reconnectAttempts}
                        </div>
                        <div className="status-item">
                            Notifications: {notifications.length}
                        </div>
                    </div>

                    <div className="debug-actions">
                        <button onClick={runConnectionTest} className="test-btn">
                            🧪 Test Connection
                        </button>
                        <button onClick={runNotificationTest} className="test-btn">
                            🔔 Test Notifications
                        </button>
                        <button onClick={runHealthCheck} className="test-btn">
                            🏥 Health Check
                        </button>
                        <button onClick={forceReconnect} className="test-btn">
                            🔄 Force Reconnect
                        </button>
                        <button onClick={clearTests} className="clear-btn">
                            🗑️ Clear
                        </button>
                    </div>

                    <div className="test-results">
                        <h5>Test Results:</h5>
                        {testResults.length === 0 ? (
                            <p className="no-results">No tests run yet</p>
                        ) : (
                            testResults.map((result, index) => (
                                <div key={index} className={`test-result ${result.success ? 'success' : 'failure'}`}>
                                    <span className="result-icon">
                                        {result.success ? '✅' : '❌'}
                                    </span>
                                    <span className="result-message">{result.message}</span>
                                    <span className="result-time">{result.timestamp}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocketDebugPanel;