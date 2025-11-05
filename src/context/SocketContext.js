import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

export const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Play notification sound - moved outside component to avoid dependency issues
const playNotificationSound = (isUrgent = false) => {
    const playCount = isUrgent ? 3 : 1; // Play multiple times for urgent notifications
    const volume = isUrgent ? 0.8 : 0.5;

    for (let i = 0; i < playCount; i++) {
        setTimeout(() => {
            try {
                // Try to play MP3 file first
                const audio = new Audio('/notification.mp3');
                audio.volume = volume;
                audio.play().catch(error => {
                    console.log('MP3 not available, generating sound:', error);
                    // Fallback: Generate a simple notification sound using Web Audio API
                    generateNotificationSound(isUrgent);
                });
            } catch (error) {
                console.log('Audio not available:', error);
                generateNotificationSound(isUrgent);
            }
        }, i * 500); // 500ms between repeats
    }
};

// Generate notification sound using Web Audio API
const generateNotificationSound = (isUrgent = false) => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create a simple notification sound (two-tone beep)
        const playTone = (frequency, duration, delay = 0, volume = 0.3) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = isUrgent ? 'square' : 'sine'; // Square wave for urgent notifications

                gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            }, delay);
        };

        if (isUrgent) {
            // Urgent notification: longer, more prominent sound
            const volume = 0.5;
            playTone(1000, 0.3, 0, volume);     // First high tone
            playTone(800, 0.3, 200, volume);    // Second tone
            playTone(1000, 0.3, 400, volume);   // Third high tone
            playTone(600, 0.4, 600, volume);    // Final low tone
        } else {
            // Regular notification: simple two-tone
            playTone(800, 0.2, 0, 0.3);     // First tone
            playTone(600, 0.3, 250, 0.3);   // Second tone
        }

    } catch (error) {
        console.log('Web Audio API not available:', error);
    }
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [pendingAlerts, setPendingAlerts] = useState([]);

    const [, setLastActivity] = useState(Date.now());

    // Auto-request browser notification permission on first load
    useEffect(() => {
        try {
            if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                requestNotificationPermission();
            }
        } catch (e) {
            console.log('Notification API not available:', e);
        }
    }, []);

    // Track user activity to maintain connection
    useEffect(() => {
        const updateActivity = () => {
            setLastActivity(Date.now());

        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, updateActivity, true);
            });
        };
    }, [socket, isConnected]);

    // Heartbeat to keep connection alive
    useEffect(() => {
        const heartbeat = setInterval(() => {
            if (socket && isConnected) {
                socket.emit('heartbeat', {
                    timestamp: Date.now(),
                    userId: user?._id,
                    userType: 'customer'
                });
                console.log('💓 Customer heartbeat sent');
            }
        }, 25000); // Every 25 seconds

        return () => clearInterval(heartbeat);
    }, [socket, isConnected, user]);

    // Periodic alert system for important notifications
    useEffect(() => {
        const alertInterval = setInterval(() => {
            if (pendingAlerts.length > 0) {
                const alert = pendingAlerts[0];

                // Show alert for critical notifications
                if (['shopping_completed', 'order_revised', 'payment_confirmed', 'order_cancelled', 'shopper_response'].includes(alert.type)) {
                    const shouldShow = window.confirm(`${alert.title}\n\n${alert.message}\n\nDismiss this alert?`);
                    if (shouldShow) {
                        setPendingAlerts(prev => prev.slice(1)); // Remove this alert
                    }
                } else {
                    // For less critical notifications, just show and remove
                    alert(`${alert.title}\n\n${alert.message}`);
                    setPendingAlerts(prev => prev.slice(1));
                }
            }
        }, 15000); // Check every 15 seconds

        return () => clearInterval(alertInterval);
    }, [pendingAlerts]);

    // Enhanced notification system with fallback alerts
    useEffect(() => {
        // Clear old alerts that are more than 5 minutes old
        const cleanupInterval = setInterval(() => {
            setPendingAlerts(prev => prev.filter(alert => {
                const alertAge = Date.now() - new Date(alert.timestamp).getTime();
                return alertAge < 5 * 60 * 1000; // Keep alerts for 5 minutes
            }));
        }, 60000); // Cleanup every minute

        return () => clearInterval(cleanupInterval);
    }, []);





    useEffect(() => {
        if (user?._id) {
            console.log('🔌 Initializing customer socket connection...');
            console.log('👤 Customer ID:', user._id);

            // Initialize socket connection
            const newSocket = io(BACKEND_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            });

            newSocket.on('connect', () => {
                console.log('🟢 Customer socket connected:', newSocket.id);
                setIsConnected(true);

                // Register as customer
                newSocket.emit('registerCustomer', user._id);
                console.log('📝 Registered as customer:', user._id);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔴 Customer socket disconnected:', reason);
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('❌ Customer socket connection error:', error);
                setIsConnected(false);
            });



            // Listen for order status updates
            newSocket.on('orderStatusUpdate', (data) => {
                console.log('📋 Order status update received for order:', data.orderId || 'unknown');

                addNotification({
                    id: Date.now(),
                    type: 'status_update',
                    title: 'Order Status Updated',
                    message: getStatusMessage(data.status, data),
                    timestamp: new Date().toISOString()
                });

                // Handle specific status updates
                handleStatusUpdate(data);

                // Play notification sound (urgent for critical statuses)
                const isUrgent = ['picked_up', 'delivered', 'cancelled'].includes(data.status);
                playNotificationSound(isUrgent);

                // Show browser notification
                showBrowserNotification(
                    'Order Status Updated',
                    getStatusMessage(data.status, data)
                );

                // Trigger page refresh for order updates
                if (window.refreshOrderData) {
                    window.refreshOrderData();
                }

                // Also trigger a general page refresh for order-related pages
                if (window.location.pathname.includes('/orders') ||
                    window.location.pathname.includes('/checkout') ||
                    window.location.pathname.includes('/awaiting')) {
                    setTimeout(() => window.location.reload(), 2000);
                }
            });

            // Keep backward compatibility
            newSocket.on('orderStatusUpdated', (data) => {
                console.log('📋 Order status updated (legacy):', data);
                newSocket.emit('orderStatusUpdate', data); // Forward to new handler
            });

            // Listen for rehearsal checkout updates
            newSocket.on('rehearsalCheckoutUpdate', (data) => {
                console.log('🎭 Rehearsal checkout update:', data);

                addNotification({
                    id: Date.now(),
                    type: 'rehearsal_update',
                    title: 'Rehearsal Checkout Update',
                    message: `Your rehearsal checkout has been ${data.status}`,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification('Rehearsal Checkout Update', `Your rehearsal checkout has been ${data.status}`);
            });

            // Listen for final checkout updates
            newSocket.on('finalCheckoutUpdate', (data) => {
                console.log('✅ Final checkout update:', data);

                addNotification({
                    id: Date.now(),
                    type: 'final_update',
                    title: 'Final Checkout Update',
                    message: `Your final checkout has been ${data.status}`,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound(true); // Urgent for final checkout
                showBrowserNotification('Final Checkout Update', `Your final checkout has been ${data.status}`);
            });

            // Listen for shopper responses (when shopper accepts order)
            newSocket.on('shopperResponse', (data) => {
                console.log('👥 Shopper response:', data);

                addNotification({
                    id: Date.now(),
                    type: 'shopper_response',
                    title: 'Shopper Response',
                    message: data.accepted ? 'A personal shopper has accepted your order!' : `Order rejected: ${data.reason}`,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification(
                    'Shopper Response',
                    data.accepted ? 'A personal shopper has accepted your order!' : `Order rejected: ${data.reason}`
                );
            });

            // Listen for shopper final confirmation (when shopping is complete)
            newSocket.on('shopperCompletedShopping', (data) => {
                console.log('✅ Shopper completed shopping:', data);

                addNotification({
                    id: Date.now(),
                    type: 'shopping_completed',
                    title: '🎉 Shopping Complete!',
                    message: 'Your personal shopper has completed shopping and is ready for delivery.',
                    timestamp: new Date().toISOString()
                });

                playNotificationSound(true); // Urgent for shopping completion
                showBrowserNotification(
                    '🎉 Shopping Complete!',
                    'Your personal shopper has completed shopping and is ready for delivery.'
                );

                // Show completion alert
                setTimeout(() => {
                    alert('🎉 Great news! Your personal shopper has completed shopping and is ready for delivery!\n\nYou will receive updates about the delivery soon.');
                }, 2000);
            });

            // Listen for order cancellations
            newSocket.on('orderCancelled', (data) => {
                console.log('❌ Order cancelled:', data);

                addNotification({
                    id: Date.now(),
                    type: 'order_cancelled',
                    title: '❌ Order Cancelled',
                    message: `Your order has been cancelled. Reason: ${data.reason || 'No reason provided'}`,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound(true); // Urgent for cancellation
                showBrowserNotification('❌ Order Cancelled', `Reason: ${data.reason || 'No reason provided'}`);

                // Show prominent alert
                setTimeout(() => {
                    alert(`❌ Your order has been cancelled.\n\nReason: ${data.reason || 'No reason provided'}\n\n💸 A refund has been initiated and will reflect in your bank account in 3–5 business days.`);
                }, 1000);
            });

            // Listen for payment confirmations
            newSocket.on('paymentConfirmed', (data) => {
                console.log('💳 Payment confirmed:', data);

                addNotification({
                    id: Date.now(),
                    type: 'payment_confirmed',
                    title: '💳 Payment Successful!',
                    message: `Payment of ₹${data.amount} has been processed successfully. Your order is now confirmed.`,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound(true); // Urgent for payment confirmation
                showBrowserNotification('💳 Payment Successful!', `Payment of ₹${data.amount} processed successfully`);

                // Clear any stored checkout data
                localStorage.removeItem('finalCheckoutOrder');
                localStorage.removeItem('rehearsalOrder');

                // Redirect to orders page after a short delay
                setTimeout(() => {
                    if (window.confirm('🎉 Payment successful! Your order has been confirmed.\n\nWould you like to view your orders?')) {
                        window.location.href = '/orders';
                    }
                }, 2000);
            });

            // Listen for delivery assignments
            newSocket.on('deliveryAssigned', (data) => {
                console.log('🚚 Delivery assigned:', data);

                addNotification({
                    id: Date.now(),
                    type: 'delivery_assigned',
                    title: '🚚 Delivery Partner Assigned!',
                    message: `${data.deliveryPartner?.name || 'A delivery partner'} has been assigned to your order.`,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification('🚚 Delivery Partner Assigned!', `${data.deliveryPartner?.name || 'A delivery partner'} will deliver your order`);
            });

            // Listen for order accepted by shopper
            newSocket.on('orderAccepted', (data) => {
                console.log('✅ Order accepted by shopper:', data);

                addNotification({
                    id: Date.now(),
                    type: 'order_accepted',
                    title: '✅ Order Accepted!',
                    message: `Your order has been accepted by ${data.shopperName || 'a personal shopper'}. They will start shopping soon.`,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification(
                    '✅ Order Accepted!',
                    `Your order has been accepted by ${data.shopperName || 'a personal shopper'}`
                );

                // Gentle in-page prompt
                setTimeout(() => {
                    alert('✅ Your shopper accepted the order. We\'ll keep you posted at each step.');
                }, 500);
            });

            // Listen for order revised by shopper
            newSocket.on('orderRevised', (data) => {
                console.log('📝 Order revised by shopper:', data);

                addNotification({
                    id: Date.now(),
                    type: 'order_revised',
                    title: '📝 Order Revision Required',
                    message: `Your order has been revised by the shopper. Please review the changes and approve or reject them.`,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound(true); // Urgent for order revision
                showBrowserNotification(
                    '📝 Order Revision Required',
                    'Your order has been revised. Please review the changes.'
                );

                // Optional: prompt to view revised order page
                setTimeout(() => {
                    if (window.confirm('Your order has been revised. Would you like to review the changes now?')) {
                        if (data.orderId) {
                            window.location.href = `/revised-order/${data.orderId}`;
                        }
                    }
                }, 500);
            });

            // Listen for shopper location updates
            newSocket.on('shopperLocationUpdate', (data) => {
                console.log('📍 Shopper location update:', data);

                addNotification({
                    id: Date.now(),
                    type: 'shopper_location',
                    title: '📍 Shopper Location Update',
                    message: data.message || 'Your shopper has updated their location.',
                    timestamp: new Date().toISOString()
                });

                // Don't play sound for location updates to avoid spam
                // playNotificationSound();
            });

            // Listen for shopper actions
            newSocket.on('shopperAction', (data) => {
                console.log('🛒 Shopper action:', data);

                addNotification({
                    id: Date.now(),
                    type: 'shopper_action',
                    title: '🛒 Shopper Update',
                    message: data.message || 'Your shopper has taken an action on your order.',
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification(
                    '🛒 Shopper Update',
                    data.message || 'Your shopper has taken an action on your order.'
                );
            });

            // Listen for refreshed notices (every 15 minutes)
            newSocket.on('refreshNotice', (data) => {
                console.log('🔄 Notice refresh received:', data);

                // Clear any existing dismissals for this notice to show it again
                const dismissed = JSON.parse(localStorage.getItem('dismissedNotices') || '[]');
                const updatedDismissed = dismissed.filter(id => id !== data.id);
                localStorage.setItem('dismissedNotices', JSON.stringify(updatedDismissed));

                // Play notification sound based on priority
                const isUrgent = data.priority === 'urgent' || data.priority === 'high';
                playNotificationSound(isUrgent);

                // Show browser notification for refresh
                if (window.Notification && Notification.permission === 'granted') {
                    const notification = new Notification(`🔄 REMINDER: ${data.title}`, {
                        body: `${data.message}\n\n(This is a periodic reminder)`,
                        icon: '/logo192.png',
                        tag: `notice-refresh-${data.id}`,
                        requireInteraction: isUrgent,
                        silent: false
                    });

                    if (data.priority !== 'urgent') {
                        setTimeout(() => notification.close(), 12000);
                    }
                }

                // Add to pending alerts
                setPendingAlerts(prev => [...prev, {
                    type: 'notice-refresh',
                    title: `🔄 REMINDER: ${data.title}`,
                    message: data.message,
                    priority: data.priority,
                    timestamp: Date.now()
                }]);
            });

            // Listen for new notices from admin (real-time)
            newSocket.on('new-notice', (data) => {
                console.log('📢 Received new notice:', data);
                // Trigger notice refresh in components
                window.dispatchEvent(new CustomEvent('new-notice', { detail: data }));
            });

            // Test response handlers
            newSocket.on('testResponse', (data) => {
                console.log('🧪 Test response received:', data);
                addNotification({
                    id: Date.now(),
                    type: 'test_response',
                    title: '✅ Test Response',
                    message: data.message || 'Test response received from server',
                    timestamp: new Date().toISOString()
                });
            });

            newSocket.on('heartbeatResponse', (data) => {
                console.log('💓 Heartbeat response received:', data);
            });

            // Keep backward compatibility for old notice events
            newSocket.on('newNotice', (data) => {
                console.log('🚨 IMPORTANT NOTICE RECEIVED (legacy):', data);
                console.log('🚨 Socket connected:', newSocket.connected);

                // Play notification sound based on priority (multiple times for urgent)
                const isUrgent = data.priority === 'urgent' || data.priority === 'high';
                const playCount = isUrgent ? 3 : 2;

                for (let i = 0; i < playCount; i++) {
                    setTimeout(() => {
                        playNotificationSound(isUrgent);
                    }, i * 800);
                }

                // Show browser notification if permission granted
                if (window.Notification && Notification.permission === 'granted') {
                    const notification = new Notification(`🚨 IMPORTANT: ${data.title}`, {
                        body: data.message,
                        icon: '/logo192.png',
                        tag: `notice-${data.id}`,
                        requireInteraction: true, // Always require interaction for notices
                        silent: false
                    });

                    // Keep urgent notices open longer
                    if (data.priority !== 'urgent') {
                        setTimeout(() => notification.close(), 15000);
                    }
                }

                // IMMEDIATE ALERT for high priority notices
                if (isUrgent) {
                    setTimeout(() => {
                        alert(`🚨 URGENT NOTICE 🚨\n\n${data.title}\n\n${data.message}\n\nThis is an important announcement from DelhiveryWay!`);
                    }, 1000);
                }

                // Add to pending alerts for periodic display
                setPendingAlerts(prev => [...prev, {
                    type: 'notice',
                    title: `🚨 ${data.title}`,
                    message: data.message,
                    priority: data.priority,
                    timestamp: Date.now()
                }]);

                // Flash the page title for attention
                const originalTitle = document.title;
                let flashCount = 0;
                const flashInterval = setInterval(() => {
                    document.title = flashCount % 2 === 0 ? `🚨 NOTICE: ${data.title}` : originalTitle;
                    flashCount++;
                    if (flashCount >= 10) {
                        clearInterval(flashInterval);
                        document.title = originalTitle;
                    }
                }, 1000);
            });

            setSocket(newSocket);

            return () => {
                console.log('🔌 Cleaning up customer socket connection...');
                newSocket.disconnect();
                setSocket(null);
                setIsConnected(false);
            };
        }
    }, [user?._id]);

    // Get user-friendly status messages
    const getStatusMessage = (status, data) => {
        switch (status) {
            case 'confirmed':
                return 'Your order has been confirmed and is being prepared';
            case 'preparing':
                return 'Your order is being prepared by the vendor';
            case 'ready_for_pickup':
                return 'Your order is ready for pickup by delivery';
            case 'picked_up':
                return data.deliveryOTP ?
                    `Your order has been picked up! Delivery OTP: ${data.deliveryOTP}` :
                    'Your order has been picked up for delivery';
            case 'out_for_delivery':
                return 'Your order is out for delivery';
            case 'delivered':
                return 'Your order has been delivered successfully!';
            case 'cancelled':
                return data.reason ? `Order cancelled: ${data.reason}` : 'Your order has been cancelled';
            default:
                return `Order status: ${status}`;
        }
    };

    // Handle specific status updates
    const handleStatusUpdate = (data) => {
        // Show OTP alert for picked up orders
        if (data.status === 'picked_up' && data.deliveryOTP) {
            const otpMessage = `🚚 Your order has been picked up!\n\n🔐 Your delivery OTP is: ${data.deliveryOTP}\n\nPlease share this OTP with the delivery person when they arrive.`;

            // Show prominent alert
            setTimeout(() => {
                alert(otpMessage);
            }, 1000);
        }

        // Handle delivered status
        if (data.status === 'delivered') {
            setTimeout(() => {
                alert('🎉 Your order has been delivered successfully!\n\nThank you for using DeliveryWay!');
            }, 1000);
        }
    };

    // Add notification to list
    const addNotification = (notification) => {
        setNotifications(prev => {
            // Check if notification already exists
            const exists = prev.some(notif =>
                notif.id === notification.id ||
                (notif.message === notification.message && notif.title === notification.title)
            );

            if (exists) {
                return prev; // Don't add duplicate
            }

            // Create a clean notification object without nested data
            const cleanNotification = {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                timestamp: notification.timestamp
            };

            return [cleanNotification, ...prev.slice(0, 49)]; // Keep last 50 notifications
        });

        // Add to pending alerts for critical notifications
        if (['shopping_completed', 'order_revised', 'payment_confirmed', 'order_cancelled', 'order_accepted', 'shopper_response'].includes(notification.type)) {
            setPendingAlerts(prev => {
                const exists = prev.some(alert =>
                    alert.id === notification.id ||
                    (alert.message === notification.message && alert.title === notification.title)
                );

                if (!exists) {
                    return [...prev, {
                        id: notification.id,
                        type: notification.type,
                        title: notification.title,
                        message: notification.message,
                        timestamp: notification.timestamp
                    }];
                }
                return prev;
            });
        }
    };

    // Remove notification
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    // Clear all notifications
    const clearNotifications = () => {
        setNotifications([]);
    };



    // Show browser notification
    const showBrowserNotification = (title, body) => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    tag: 'customer-notification',
                    requireInteraction: true
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, {
                            body,
                            icon: '/logo192.png',
                            badge: '/logo192.png',
                            tag: 'customer-notification',
                            requireInteraction: true
                        });
                    }
                });
            }
        }
    };

    // Request notification permission
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission;
        }
        return 'denied';
    };

    // Emit events
    const emitEvent = (eventName, data) => {
        if (socket && isConnected) {
            socket.emit(eventName, data);
        } else {
            console.warn('Cannot emit event - socket not connected:', eventName);
        }
    };

    // Join specific room
    const joinRoom = (roomName) => {
        if (socket && isConnected) {
            socket.emit('join', roomName);
        }
    };

    // Leave specific room
    const leaveRoom = (roomName) => {
        if (socket && isConnected) {
            socket.emit('leave', roomName);
        }
    };

    const value = {
        socket,
        isConnected,
        notifications,

        addNotification,
        removeNotification,
        clearNotifications,
        requestNotificationPermission,
        emitEvent,
        joinRoom,
        leaveRoom
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};