import React, { useEffect, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
    const { clearCart } = useContext(CartContext);

    useEffect(() => {
        clearCart(); // Clear cart on page load
        localStorage.removeItem('checkoutItems');
        localStorage.removeItem('checkoutAddress');
    }, [clearCart]);

    return (
        <div className="order-success-page">
            <div className="success-icon" aria-label="Payment Successful" role="img">✔️</div>
            <h2>Payment Successful</h2>
            <p>Your order has been placed and will be prepared shortly.</p>
            <Link to="/" className="btn-primary">
                Back to Home
            </Link>
        </div>
    );
};

export default OrderSuccessPage;