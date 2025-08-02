import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [lastActivity, setLastActivity] = useState(Date.now());

    // Track user activity to maintain connection
    useEffect(() => {
        const updateActivity = () => {
            setLastActivity(Date.now());
            if (socket && !isConnected) {
                console.log('🔄 User activity detected, attempting reconnection...');
                socket.connect();
            }
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
                    userId: user?.user?._id,
                    userType: 'customer'
                });
                console.log('💓 Customer heartbeat sent');
            }
        }, 25000); // Every 25 seconds

        return () => clearInterval(heartbeat);
    }, [socket, isConnected, user]);

    // Page visibility change handler to reconnect when page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && socket && !isConnected) {
                console.log('👁️ Page became visible, attempting reconnection...');
                socket.connect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [socket, isConnected]);

    // Window focus handler
    useEffect(() => {
        const handleFocus = () => {
            if (socket && !isConnected) {
                console.log('🎯 Window focused, attempting reconnection...');
                socket.connect();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [socket, isConnected]);

    useEffect(() => {
        if (user?.user?._id) {
            console.log('🔌 Initializing customer socket connection...');

            // Initialize socket connection with better options
            const newSocket = io(BACKEND_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
                timeout: 20000,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                maxReconnectionAttempts: 10,
                forceNew: true
            });

            newSocket.on('connect', () => {
                console.log('🟢 Customer socket connected:', newSocket.id);
                setIsConnected(true);
                setReconnectAttempts(0);

                // Register as customer
                newSocket.emit('registerCustomer', user.user._id);
                console.log('📝 Registered as customer:', user.user._id);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔴 Customer socket disconnected:', reason);
                setIsConnected(false);

                if (reason === 'io server disconnect') {
                    // Server disconnected, try to reconnect
                    setTimeout(() => newSocket.connect(), 1000);
                }
            });

            newSocket.on('connect_error', (error) => {
                console.error('❌ Customer socket connection error:', error);
                setIsConnected(false);
                setReconnectAttempts(prev => prev + 1);
            });

            newSocket.on('reconnect', (attemptNumber) => {
                console.log('🔄 Customer socket reconnected after', attemptNumber, 'attempts');
                setIsConnected(true);
                setReconnectAttempts(0);
                // Re-register after reconnection
                newSocket.emit('registerCustomer', user.user._id);
            });

            newSocket.on('reconnect_attempt', (attemptNumber) => {
                console.log('🔄 Customer socket reconnection attempt:', attemptNumber);
                setReconnectAttempts(attemptNumber);
            });

            newSocket.on('reconnect_failed', () => {
                console.error('❌ Customer socket reconnection failed');
                setIsConnected(false);
            });

            // Listen for order status updates
            newSocket.on('orderStatusUpdate', (data) => {
                console.log('📋 Order status update received:', data);

                addNotification({
                    id: Date.now(),
                    type: 'status_update',
                    title: 'Order Status Updated',
                    message: getStatusMessage(data.status, data),
                    data: data,
                    timestamp: new Date().toISOString()
                });

                // Handle specific status updates
                handleStatusUpdate(data);

                // Play notification sound
                playNotificationSound();

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
                    data: data,
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
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification('Final Checkout Update', `Your final checkout has been ${data.status}`);
            });

            // Listen for vendor responses
            newSocket.on('vendorResponse', (data) => {
                console.log('🏪 Vendor response:', data);

                addNotification({
                    id: Date.now(),
                    type: 'vendor_response',
                    title: 'Vendor Response',
                    message: data.accepted ? 'Your order has been accepted!' : `Order rejected: ${data.reason}`,
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification(
                    'Vendor Response',
                    data.accepted ? 'Your order has been accepted!' : `Order rejected: ${data.reason}`
                );
            });

            // Listen for vendor confirmed order (for final checkout)
            newSocket.on('vendorConfirmedOrder', (data) => {
                console.log('✅ Vendor confirmed order for final checkout:', data);

                // Store the final version for /final-checkout
                localStorage.setItem('finalCheckoutOrder', JSON.stringify(data));

                addNotification({
                    id: Date.now(),
                    type: 'final_checkout_ready',
                    title: '🎉 Ready for Final Checkout!',
                    message: 'Vendor has confirmed your order. You can now proceed to final checkout.',
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification(
                    '🎉 Ready for Final Checkout!',
                    'Vendor has confirmed your order. Click to proceed to final checkout.'
                );

                // Auto-redirect to final checkout based on current page
                setTimeout(() => {
                    const currentPath = window.location.pathname;

                    // If user is on awaiting vendor page, redirect automatically
                    if (currentPath === '/awaiting-vendor' || currentPath.includes('awaiting')) {
                        console.log('🔄 User on awaiting vendor page, auto-redirecting to final checkout...');
                        window.location.href = '/final-checkout';
                    }
                    // If user is on other pages, show confirmation dialog
                    else {
                        const userConfirmed = window.confirm('🎉 Your order has been confirmed by the vendor!\n\nWould you like to proceed to final checkout now?');
                        if (userConfirmed) {
                            window.location.href = '/final-checkout';
                        } else {
                            // User declined, optionally cancel the order
                            const shouldCancel = window.confirm('Would you like to cancel this order instead?');
                            if (shouldCancel) {
                                // TODO: Implement order cancellation
                                console.log('User chose to cancel order after declining final checkout');
                            }
                        }
                    }
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
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
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
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
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
                    data: data,
                    timestamp: new Date().toISOString()
                });

                playNotificationSound();
                showBrowserNotification('🚚 Delivery Partner Assigned!', `${data.deliveryPartner?.name || 'A delivery partner'} will deliver your order`);
            });

            setSocket(newSocket);

            return () => {
                console.log('🔌 Cleaning up customer socket connection...');
                newSocket.disconnect();
                setSocket(null);
                setIsConnected(false);
            };
        }
    }, [user?.user?._id]);

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

            return [notification, ...prev.slice(0, 49)]; // Keep last 50 notifications
        });
    };

    // Remove notification
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    // Clear all notifications
    const clearNotifications = () => {
        setNotifications([]);
    };

    // Play notification sound
    const playNotificationSound = () => {
        try {
            // Try to play MP3 file first
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(error => {
                console.log('MP3 not available, generating sound:', error);
                // Fallback: Generate a simple notification sound using Web Audio API
                generateNotificationSound();
            });
        } catch (error) {
            console.log('Audio not available:', error);
            generateNotificationSound();
        }
    };

    // Generate notification sound using Web Audio API
    const generateNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create a simple notification sound (two-tone beep)
            const playTone = (frequency, duration, delay = 0) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + duration);
                }, delay);
            };

            // Play two-tone notification
            playTone(800, 0.2, 0);     // First tone
            playTone(600, 0.3, 250);   // Second tone

        } catch (error) {
            console.log('Web Audio API not available:', error);
        }
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
        reconnectAttempts,
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

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};