import React from 'react';
import { useSocket } from '../context/SocketContext';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
    const { isConnected, reconnectAttempts } = useSocket();

    if (isConnected) return null; // Don't show when connected

    return (
        <div className="connection-status-banner">
            <div className="connection-status-content">
                {reconnectAttempts > 0 ? (
                    <>
                        <span className="status-icon">🔄</span>
                        <span>Reconnecting... (Attempt {reconnectAttempts})</span>
                    </>
                ) : (
                    <>
                        <span className="status-icon">⚠️</span>
                        <span>Connection lost. Trying to reconnect...</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConnectionStatus;