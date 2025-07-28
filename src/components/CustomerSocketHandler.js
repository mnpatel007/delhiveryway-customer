import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const socket = io('http://localhost:5000');

export default function CustomerSocketHandler({ onUpdate }) {
    const { user } = useContext(AuthContext);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!user?.user?._id) return;
        socket.emit('registerCustomer', user.user._id);

        socket.on('orderStatusUpdate', (data) => {
            console.log('Order status update received:', data);

            // Show OTP notification if order is picked up
            if (data.status === 'picked_up' && data.deliveryOTP) {
                // Show a prominent notification with the OTP
                const otpMessage = `🚚 Your order has been picked up!\n\n🔐 Your delivery OTP is: ${data.deliveryOTP}\n\nPlease share this OTP with the delivery person when they arrive.`;

                // Show browser notification if permission granted
                if (Notification.permission === 'granted') {
                    new Notification('Order Picked Up - OTP Required', {
                        body: `Your delivery OTP is: ${data.deliveryOTP}`,
                        icon: '/favicon.ico',
                        tag: 'delivery-otp'
                    });
                }

                // Show alert as fallback
                alert(otpMessage);
            }

            // Call the original update handler
            if (onUpdate) {
                onUpdate(data);
            }
        });

        // Keep backward compatibility
        socket.on('orderStatusUpdated', data => onUpdate && onUpdate(data));

        return () => {
            socket.off('orderStatusUpdate');
            socket.off('orderStatusUpdated');
        };
    }, [user, onUpdate]);

    return null;
}
