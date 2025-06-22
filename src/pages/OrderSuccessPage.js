
import React from 'react';
import { Link } from 'react-router-dom';

const OrderSuccessPage = () => {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>🎉 Order Confirmed!</h2>
            <p>Your order has been successfully placed.</p>
            <p>You'll receive a notification once it's out for delivery.</p>

            <Link to="/">
                <button style={{ marginTop: '1rem' }}>Back to Home</button>
            </Link>
        </div>
    );
};

export default OrderSuccessPage;
