import React, { useEffect } from 'react';
import './AwaitingVendorReviewPage.css';

const AwaitingVendorReviewPage = () => {
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Redirect to shop or show a message about placing a new order
            window.location.href = '/';
            alert('Order review timed out. Please place a new order.');
        }, 2 * 60 * 1000); // 2 minutes

        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <div className="awaiting-vendor-review-container">
            <div className="review-card">
                <h2>Awaiting Vendor Review</h2>
                <p className="review-subtitle">Your order has been sent to the vendor for confirmation.</p>
                <div className="review-details">
                    <p>Please wait while they review and finalize your items.</p>
                    <p>Once confirmed, you'll be redirected to the final payment step.</p>
                </div>
                <div className="timeout-warning">
                    ⏰ If not redirected within 2 minutes, please place a new order.
                </div>
                <div className="loading-spinner"></div>
            </div>
        </div>
    );
};

export default AwaitingVendorReviewPage;