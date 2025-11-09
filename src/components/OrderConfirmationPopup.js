import React from 'react';
import './OrderConfirmationPopup.css';

const OrderConfirmationPopup = ({ isOpen, onConfirm, onCancel }) => {
    console.log('🔥 OrderConfirmationPopup render - isOpen:', isOpen);
    if (!isOpen) {
        console.log('🔥 Popup not open, returning null');
        return null;
    }
    console.log('🔥 Popup is open, rendering popup');

    return (
        <div className="order-confirmation-overlay">
            <div className="order-confirmation-popup">
                <div className="popup-header">
                    <h3>📋 Order Confirmation</h3>
                </div>

                <div className="popup-content">
                    <div className="info-icon">ℹ️</div>
                    <div className="popup-message">
                        <h4>Important Payment Information</h4>
                        <p>
                            Once the shopper accepts your order, you will get a QR code from the shopper
                            where you need to make the payment. Otherwise, your order won't proceed ahead
                            and will be cancelled automatically.
                        </p>
                        <div className="payment-steps">
                            <div className="step">
                                <span className="step-number">1</span>
                                <span>Shopper accepts your order</span>
                            </div>
                            <div className="step">
                                <span className="step-number">2</span>
                                <span>You receive UPI payment QR code</span>
                            </div>
                            <div className="step">
                                <span className="step-number">3</span>
                                <span>Complete payment to proceed</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="popup-actions">
                    <button
                        className="cancel-btn"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="confirm-btn"
                        onClick={onConfirm}
                    >
                        I Understand, Place Order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationPopup;