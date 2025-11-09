import React, { useState, useEffect } from 'react';
import './UPIPaymentModal.css';

const UPIPaymentModal = ({
    isOpen,
    onClose,
    orderData,
    onPaymentConfirm
}) => {
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Generate UPI payment URL for QR code
    const generateUPIUrl = () => {
        if (!orderData?.shopperUpiId || !orderData?.paymentAmount) return '';

        const params = new URLSearchParams({
            pa: orderData.shopperUpiId, // Payee address (UPI ID)
            pn: orderData.shopperName || 'DelhiveryWay Shopper', // Payee name
            am: orderData.paymentAmount.toString(), // Amount
            cu: 'INR', // Currency
            tn: `Order ${orderData.orderNumber}` // Transaction note
        });

        return `upi://pay?${params.toString()}`;
    };

    const handlePaymentConfirm = async () => {
        if (!transactionId.trim()) {
            setError('Please enter the UPI transaction ID');
            return;
        }

        // Allow "0000" as test transaction ID for testing purposes
        const isTestTransaction = transactionId.trim() === '0000';
        if (!isTestTransaction && transactionId.trim().length < 8) {
            setError('Transaction ID should be at least 8 characters long');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await onPaymentConfirm(transactionId.trim());
            setTransactionId('');
        } catch (err) {
            setError(err.message || 'Failed to confirm payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openUPIApp = () => {
        const upiUrl = generateUPIUrl();
        if (upiUrl) {
            window.location.href = upiUrl;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="upi-modal-overlay">
            <div className="upi-modal">
                <div className="upi-modal-header">
                    <h3>🏦 Complete UPI Payment</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="upi-modal-content">
                    <div className="payment-info">
                        <div className="order-details">
                            <h4>Order #{orderData?.orderNumber}</h4>
                            <p><strong>Amount:</strong> ₹{orderData?.paymentAmount}</p>
                            <p><strong>Shopper:</strong> {orderData?.shopperName}</p>
                        </div>

                        <div className="upi-payment-section">
                            <div className="upi-id-display">
                                <label>Pay to UPI ID:</label>
                                <div className="upi-id">
                                    <span>{orderData?.shopperUpiId}</span>
                                    <button
                                        className="copy-btn"
                                        onClick={() => {
                                            navigator.clipboard.writeText(orderData?.shopperUpiId);
                                            alert('UPI ID copied!');
                                        }}
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                            </div>

                            <div className="payment-methods">
                                <h4>Choose Payment Method:</h4>

                                <button
                                    className="upi-app-btn phonepe"
                                    onClick={openUPIApp}
                                >
                                    📱 Pay with UPI App
                                    <small>PhonePe, Google Pay, Paytm, etc.</small>
                                </button>

                                <div className="manual-payment">
                                    <p><strong>Manual Payment Steps:</strong></p>
                                    <ol>
                                        <li>Open your UPI app (PhonePe, Google Pay, Paytm, etc.)</li>
                                        <li>Send ₹{orderData?.paymentAmount} to: <strong>{orderData?.shopperUpiId}</strong></li>
                                        <li>Add note: "Order {orderData?.orderNumber}"</li>
                                        <li>Complete the payment</li>
                                        <li>Enter the transaction ID below</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="transaction-confirmation">
                            <h4>After Payment Completion:</h4>
                            <div className="input-group">
                                <label>UPI Transaction ID:</label>
                                <input
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    placeholder="Enter 12-digit transaction ID"
                                    className="transaction-input"
                                />
                                <small>You'll find this in your UPI app's transaction history</small>
                            </div>

                            {error && (
                                <div className="error-message">
                                    ❌ {error}
                                </div>
                            )}

                            <button
                                className="confirm-payment-btn"
                                onClick={handlePaymentConfirm}
                                disabled={isSubmitting || !transactionId.trim()}
                            >
                                {isSubmitting ? 'Confirming...' : '✅ Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="upi-modal-footer">
                    <p className="security-note">
                        🔒 Your payment is secure. Only pay to the UPI ID shown above.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UPIPaymentModal;