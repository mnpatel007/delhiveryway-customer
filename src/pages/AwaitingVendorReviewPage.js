import React from 'react';

const AwaitingVendorReviewPage = () => {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Awaiting Vendor Review</h2>
            <p>Your order has been sent to the vendor for confirmation.</p>
            <p>Please wait while they review and finalize your items.</p>
            <p>Once confirmed, you'll be redirected to the final payment step.</p>
        </div>
    );
};

export default AwaitingVendorReviewPage;
