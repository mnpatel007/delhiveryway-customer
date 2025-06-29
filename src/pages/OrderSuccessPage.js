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
        // Navigate to dummy route, then to home to force remount
        navigate('/refresh-temp', { replace: true });
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 0);
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
