import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import UPIPaymentModal from './UPIPaymentModal';
import { api } from '../services/api';

const UPINotificationHandler = () => {
    const { notifications } = useSocket();
    const [showUPIModal, setShowUPIModal] = useState(false);
    const [upiOrderData, setUpiOrderData] = useState(null);

    useEffect(() => {
        // Check for UPI payment required notifications
        const upiNotification = notifications.find(
            notification => notification.type === 'upi_payment_required' && notification.urgent
        );

        if (upiNotification && !showUPIModal) {
            setUpiOrderData(upiNotification.orderData);
            setShowUPIModal(true);
        }
    }, [notifications, showUPIModal]);

    const handlePaymentConfirm = async (transactionId) => {
        try {
            const response = await api.post('/orders/confirm-payment', {
                orderId: upiOrderData.orderId,
                upiTransactionId: transactionId
            });

            if (response.data.success) {
                setShowUPIModal(false);
                setUpiOrderData(null);
                alert('✅ Payment confirmed successfully! Your shopper will now proceed with your order.');
            } else {
                throw new Error(response.data.message || 'Failed to confirm payment');
            }
        } catch (error) {
            console.error('Payment confirmation error:', error);
            throw error;
        }
    };

    const handleCloseModal = () => {
        setShowUPIModal(false);
        // Don't clear upiOrderData immediately in case user wants to reopen
    };

    return (
        <UPIPaymentModal
            isOpen={showUPIModal}
            onClose={handleCloseModal}
            orderData={upiOrderData}
            onPaymentConfirm={handlePaymentConfirm}
        />
    );
};

export default UPINotificationHandler;