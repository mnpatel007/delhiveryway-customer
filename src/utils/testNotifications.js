// Test notification utility for debugging socket connections
export const testNotifications = (socket, addNotification) => {
    if (!socket) {
        console.log('❌ No socket connection available');
        return;
    }

    console.log('🧪 Testing notifications...');

    // Test 1: Add a local notification
    addNotification({
        id: Date.now(),
        type: 'test',
        title: '🧪 Test Notification',
        message: 'This is a test notification to verify the system is working.',
        timestamp: new Date().toISOString()
    });

    // Test 2: Emit a test event to backend
    socket.emit('testNotification', {
        message: 'Test notification from customer app',
        timestamp: Date.now()
    });

    // Test 3: Check socket connection status
    console.log('🔌 Socket connected:', socket.connected);
    console.log('🆔 Socket ID:', socket.id);

    // Test 4: Try to trigger a heartbeat
    socket.emit('heartbeat', {
        timestamp: Date.now(),
        userType: 'customer',
        test: true
    });

    console.log('✅ Test notifications completed');
};

export const testBrowserNotifications = () => {
    console.log('🧪 Testing browser notifications...');

    if ('Notification' in window) {
        console.log('🔔 Notification permission:', Notification.permission);

        if (Notification.permission === 'granted') {
            new Notification('🧪 Test Browser Notification', {
                body: 'This is a test browser notification.',
                icon: '/logo192.png',
                tag: 'test-notification'
            });
            console.log('✅ Browser notification sent');
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('🔔 Permission result:', permission);
                if (permission === 'granted') {
                    new Notification('🧪 Test Browser Notification', {
                        body: 'Permission granted! This is a test notification.',
                        icon: '/logo192.png',
                        tag: 'test-notification'
                    });
                }
            });
        } else {
            console.log('❌ Browser notifications are blocked');
        }
    } else {
        console.log('❌ Browser notifications not supported');
    }
};