import React, { useEffect, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
    const { clearCart } = useContext(CartContext);

    useEffect(() => {
        clearCart();
        localStorage.removeItem('checkoutItems');
        localStorage.removeItem('checkoutAddress');
    }, [clearCart]);

    const handleBackToHome = () => {
        window.location.href = '/'; // ✅ Force full reload on home
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
