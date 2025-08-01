// Socket Connection Test Utility
export const testSocketConnection = (socket, userType = 'customer') => {
    if (!socket) {
        console.error('❌ Socket not available for testing');
        return false;
    }

    console.log(`🧪 Testing ${userType} socket connection...`);

    // Test basic connection
    if (socket.connected) {
        console.log('✅ Socket is connected');

        // Test heartbeat
        socket.emit('heartbeat', {
            timestamp: Date.now(),
            userType,
            test: true
        });
        console.log('💓 Test heartbeat sent');

        // Test custom event
        socket.emit('test-connection', {
            message: `Test from ${userType}`,
            timestamp: Date.now()
        });
        console.log('📡 Test event sent');

        return true;
    } else {
        console.error('❌ Socket is not connected');
        return false;
    }
};

// Test notification system
export const testNotificationSystem = (addNotification, playSound) => {
    console.log('🧪 Testing notification system...');

    // Add test notification
    addNotification({
        id: Date.now(),
        type: 'test',
        title: '🧪 Test Notification',
        message: 'This is a test notification to verify the system is working',
        timestamp: new Date().toISOString()
    });

    // Test sound
    if (playSound) {
        playSound();
        console.log('🔊 Test sound played');
    }

    console.log('✅ Notification test completed');
};

// Connection health check
export const checkConnectionHealth = (socket, isConnected, reconnectAttempts) => {
    const health = {
        status: 'unknown',
        connected: isConnected,
        socketExists: !!socket,
        reconnectAttempts,
        timestamp: new Date().toISOString()
    };

    if (socket && isConnected) {
        health.status = 'healthy';
    } else if (socket && !isConnected && reconnectAttempts > 0) {
        health.status = 'reconnecting';
    } else if (socket && !isConnected) {
        health.status = 'disconnected';
    } else {
        health.status = 'no-socket';
    }

    console.log('🏥 Connection Health Check:', health);
    return health;
};