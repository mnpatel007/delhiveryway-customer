import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import io from 'socket.io-client';
import './AwaitingVendorReviewPage.css';

const AwaitingVendorReviewPage = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [countdown, setCountdown] = useState(120); // 2 minutes
    const [orderDetails, setOrderDetails] = useState(null);
    const [vendorStatus, setVendorStatus] = useState('Reviewing Order');
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io('https://delhiveryway-backend-1.onrender.com');
        setSocket(newSocket);

        // Retrieve order details from local storage
        try {
            const storedOrder = JSON.parse(localStorage.getItem('pending_vendor'));
            if (!storedOrder) {
                navigate('/', {
                    state: {
                        error: 'No pending order found. Please place a new order.',
                    },
                });
                return;
            }
            setOrderDetails(storedOrder);

            // Subscribe to customer room
            newSocket.emit('subscribeToCustomerRoom', storedOrder.customerId);

        } catch (err) {
            console.error('Invalid localStorage data for pending_vendor:', err);
            navigate('/', {
                state: {
                    error: 'Order could not be loaded. Please try again.',
                },
            });
        }

        // Countdown timer
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeoutRedirect();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Socket listeners
        newSocket.on('vendorConfirmedOrder', handleVendorConfirmation);
        newSocket.on('vendorRejectedOrder', handleVendorRejection);

        // Cleanup
        return () => {
            clearInterval(timer);
            newSocket.disconnect();
        };
    }, [navigate]);

    const handleVendorConfirmation = (confirmedOrder) => {
        localStorage.setItem('finalCheckoutOrder', JSON.stringify(confirmedOrder));
        localStorage.removeItem('pending_vendor');
        navigate('/final-checkout');
    };

    const handleVendorRejection = (rejectionDetails) => {
        localStorage.removeItem('pending_vendor');
        navigate('/', {
            state: {
                rejectionReason: rejectionDetails.reason,
            },
        });
    };

    const handleTimeoutRedirect = () => {
        localStorage.removeItem('pending_vendor');
        navigate('/', {
            state: {
                timeoutMessage: 'Order review timed out. Please place a new order.',
            },
        });
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    if (!orderDetails) return <div className="awaiting-vendor-review-container">Loading...</div>;

    return (
        <div className="awaiting-vendor-review-container">
            <div className="review-card">
                <div className="spinner"></div>
                <h2>Awaiting Vendor Review</h2>

                <div className="order-summary">
                    <h3>Order Details</h3>
                    <div className="order-info">
                        <p><strong>Restaurant:</strong> {orderDetails.restaurantName || 'N/A'}</p>
                        <p><strong>Total Items:</strong> {orderDetails.totalItems || orderDetails.items?.length || 0}</p>
                        <p><strong>Total Amount:</strong> ₹{orderDetails.totalAmount || orderDetails.items?.reduce((acc, item) => acc + item.quantity * item.product.price, 0)}</p>
                    </div>
                </div>

                <div className="vendor-status">
                    <h3>Current Status</h3>
                    <p>{vendorStatus}</p>
                </div>

                <div className="countdown-timer">
                    <h3>Time Remaining</h3>
                    <div className="timer">{formatTime(countdown)}</div>
                    <p className="timer-note">
                        If not redirected within 2 minutes, you'll be guided to place a new order.
                    </p>
                </div>

                <div className="additional-info">
                    <p>🕒 Our vendor is carefully reviewing your order.</p>
                    <p>💡 Sit tight! We're working to get your delicious meal confirmed.</p>
                </div>
            </div>
        </div>
    );
};

export default AwaitingVendorReviewPage;
