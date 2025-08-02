import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import './AwaitingVendorReviewPage.css';

const AwaitingVendorReviewPage = () => {
    const navigate = useNavigate();
    const { notifications } = useContext(SocketContext);
    const [isReadyForCheckout, setIsReadyForCheckout] = useState(false);
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds

    // Check if final checkout is ready
    useEffect(() => {
        const checkFinalCheckoutReady = () => {
            const finalCheckoutOrder = localStorage.getItem('finalCheckoutOrder');
            if (finalCheckoutOrder) {
                setIsReadyForCheckout(true);
                return true;
            }

            // Also check notifications for final checkout ready
            const hasCheckoutNotification = notifications.some(
                notif => notif.type === 'final_checkout_ready'
            );
            if (hasCheckoutNotification) {
                setIsReadyForCheckout(true);
                return true;
            }

            return false;
        };

        // Check immediately
        if (checkFinalCheckoutReady()) {
            return;
        }

        // Check every 2 seconds
        const checkInterval = setInterval(checkFinalCheckoutReady, 2000);

        return () => clearInterval(checkInterval);
    }, [notifications]);

    // Countdown timer
    useEffect(() => {
        if (isReadyForCheckout) return; // Stop countdown if ready

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up, redirect to home
                    navigate('/');
                    alert('Order review timed out. Please place a new order.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isReadyForCheckout, navigate]);

    const handleProceedToCheckout = () => {
        navigate('/final-checkout');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="awaiting-vendor-review-container">
            <div className="review-card">
                <h2>Awaiting Vendor Review</h2>
                <p className="review-subtitle">Your order has been sent to the vendor for confirmation.</p>

                {isReadyForCheckout ? (
                    <div className="checkout-ready-section">
                        <div className="success-message">
                            <span className="success-icon">🎉</span>
                            <h3>Order Confirmed!</h3>
                            <p>Your vendor has confirmed your order. You can now proceed to final checkout.</p>
                        </div>
                        <button
                            className="proceed-checkout-btn"
                            onClick={handleProceedToCheckout}
                        >
                            Proceed to Final Checkout
                        </button>
                    </div>
                ) : (
                    <div className="waiting-section">
                        <div className="review-details">
                            <p>Please wait while they review and finalize your items.</p>
                            <p>Once confirmed, you'll be redirected to the final payment step.</p>
                        </div>
                        <div className="timeout-warning">
                            ⏰ Time remaining: {formatTime(timeLeft)}
                        </div>
                        <div className="loading-spinner"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AwaitingVendorReviewPage;