import React, { useEffect, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
    const { clearCart } = useContext(CartContext);
    const navigate = useNavigate();

    useEffect(() => {
        clearCart();
        localStorage.removeItem('checkoutItems');
        localStorage.removeItem('checkoutAddress');
    }, [clearCart]);

    const handleBackToHome = () => {
        // Force remount of HomePage by navigating to temp route then home
        navigate('/temp', { replace: true });
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 10); // 10ms delay to force unmount/mount
    };

    return (
        <div className="order-success-page">
            <div className="success-icon" aria-label="Payment Successful" role="img">✔️</div>
            <h2>Payment Successful</h2>
            <p>Your order has been placed and will be prepared shortly.</p>
            <button onClick={handleBackToHome} className="btn-primary">
                Back to Home
            </button>
        </div>
    );
};

export default OrderSuccessPage;
