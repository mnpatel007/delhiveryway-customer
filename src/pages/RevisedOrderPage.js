import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CheckoutPage.css';

// Format price with Indian Rupee symbol and proper formatting
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
};

const RevisedOrderPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await api.get(`/orders/${orderId}`);
                if (response.data.success) {
                    const orderData = response.data.data.order;
                    if (orderData.status === 'customer_reviewing_revision' || orderData.status === 'shopper_revised_order') {
                        setOrder(orderData);
                    } else {
                        setError('Order is not in revision state');
                    }
                } else {
                    setError('Order not found');
                }
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    const handleApproveRevision = async () => {
        try {
            setApproving(true);
            const response = await api.post(`/orders/${orderId}/approve-revision`);
            
            if (response.data.success) {
                // Navigate to order tracking page
                navigate(`/orders/${orderId}`, {
                    state: { message: 'Revised order approved! Your shopper will proceed with final shopping.' }
                });
            } else {
                alert('Failed to approve revision. Please try again.');
            }
        } catch (err) {
            console.error('Error approving revision:', err);
            alert(err.response?.data?.message || 'Failed to approve revision. Please try again.');
        } finally {
            setApproving(false);
        }
    };

    const getOriginalTotal = () => {
        return order?.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
    };

    const getRevisedTotal = () => {
        return order?.items?.reduce((total, item) => {
            if (item.isAvailable && item.revisedQuantity > 0) {
                return total + ((item.revisedPrice || item.price) * item.revisedQuantity);
            }
            return total;
        }, 0) || 0;
    };

    if (loading) {
        return (
            <div className="checkout-container">
                <div className="checkout-wrapper">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading order revision...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="checkout-container">
                <div className="checkout-wrapper">
                    <div className="error-state">
                        <h2>❌ Error</h2>
                        <p>{error}</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/orders')}
                        >
                            View My Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const originalSubtotal = getOriginalTotal();
    const revisedSubtotal = getRevisedTotal();
    const deliveryFee = order?.orderValue?.deliveryFee || 0;
    const taxes = Math.round(revisedSubtotal * 0.05);
    const revisedTotal = revisedSubtotal + deliveryFee + taxes;

    return (
        <div className="checkout-container">
            <div className="checkout-wrapper">
                <div className="checkout-header">
                    <div className="revision-icon">🔄</div>
                    <h2>Order Revised by Shopper</h2>
                    <p>Your personal shopper has checked item availability and made some adjustments to your order.</p>
                </div>

                <div className="checkout-content">
                    <div className="order-confirmation-details">
                        <div className="confirmation-section">
                            <h3>Order Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Order Number:</span>
                                    <span className="info-value">{order?.orderNumber}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Shopper:</span>
                                    <span className="info-value">{order?.personalShopperId?.name || 'Assigned'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Original Total:</span>
                                    <span className="info-value">{formatPrice(originalSubtotal + deliveryFee + Math.round(originalSubtotal * 0.05))}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Revised Total:</span>
                                    <span className="info-value revised-total">{formatPrice(revisedTotal)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="confirmation-section">
                            <h3>Item Changes</h3>
                            <div className="items-comparison">
                                {order?.items?.map((item, index) => {
                                    const hasChanges = item.revisedQuantity !== item.quantity || 
                                                     item.revisedPrice !== item.price || 
                                                     !item.isAvailable;
                                    
                                    return (
                                        <div key={index} className={`item-comparison ${hasChanges ? 'has-changes' : ''}`}>
                                            <div className="item-header">
                                                <h4>{item.name}</h4>
                                                {!item.isAvailable && <span className="unavailable-badge">Unavailable</span>}
                                                {item.isAvailable && hasChanges && <span className="changed-badge">Modified</span>}
                                                {item.isAvailable && !hasChanges && <span className="unchanged-badge">No Changes</span>}
                                            </div>
                                            
                                            <div className="item-details">
                                                <div className="detail-row">
                                                    <span className="detail-label">Quantity:</span>
                                                    <div className="detail-comparison">
                                                        <span className={item.quantity !== item.revisedQuantity ? 'original-value crossed' : 'original-value'}>
                                                            {item.quantity}
                                                        </span>
                                                        {item.quantity !== item.revisedQuantity && (
                                                            <span className="revised-value">→ {item.revisedQuantity || 0}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="detail-row">
                                                    <span className="detail-label">Price per unit:</span>
                                                    <div className="detail-comparison">
                                                        <span className={item.price !== item.revisedPrice ? 'original-value crossed' : 'original-value'}>
                                                            ₹{item.price?.toFixed(2)}
                                                        </span>
                                                        {item.price !== item.revisedPrice && (
                                                            <span className="revised-value">→ ₹{(item.revisedPrice || 0).toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="detail-row">
                                                    <span className="detail-label">Total:</span>
                                                    <div className="detail-comparison">
                                                        <span className={hasChanges ? 'original-value crossed' : 'original-value'}>
                                                            ₹{(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                        {hasChanges && (
                                                            <span className="revised-value">
                                                                → ₹{item.isAvailable ? ((item.revisedPrice || item.price) * (item.revisedQuantity || 0)).toFixed(2) : '0.00'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {item.shopperNotes && (
                                                    <div className="shopper-notes">
                                                        <strong>Shopper's Note:</strong> {item.shopperNotes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

if (error) {
return (
    <div className="checkout-container">
        <div className="checkout-wrapper">
            <div className="error-state">
                <h2>❌ Error</h2>
                <p>{error}</p>
                <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/orders')}
                >
                    View My Orders
                </button>
            </div>
        </div>
    </div>
);
}

const originalSubtotal = getOriginalTotal();
const revisedSubtotal = getRevisedTotal();
const deliveryFee = order?.orderValue?.deliveryFee || 0;
const taxes = Math.round(revisedSubtotal * 0.05);
const revisedTotal = revisedSubtotal + deliveryFee + taxes;

return (
    <div className="checkout-container">
        <div className="checkout-wrapper">
            <div className="checkout-header">
                <div className="revision-icon">🔄</div>
                <h2>Order Revised by Shopper</h2>
                <p>Your personal shopper has checked item availability and made some adjustments to your order.</p>
            </div>

            <div className="checkout-content">
                <div className="order-confirmation-details">
                    <div className="confirmation-section">
                        <h3>Order Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Order Number:</span>
                                <span className="info-value">{order?.orderNumber}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Shopper:</span>
                                <span className="info-value">{order?.personalShopperId?.name || 'Assigned'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Original Total:</span>
                                <span className="info-value">{formatPrice(originalSubtotal + deliveryFee + Math.round(originalSubtotal * 0.05))}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Revised Total:</span>
                                <span className="info-value revised-total">{formatPrice(revisedTotal)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="confirmation-section">
                        <h3>Item Changes</h3>
                        <div className="items-comparison">
                            {order?.items?.map((item, index) => {
                                const hasChanges = item.revisedQuantity !== item.quantity || 
                                                 item.revisedPrice !== item.price || 
                                                 !item.isAvailable;
                                
                                return (
                                    <div key={index} className={`item-comparison ${hasChanges ? 'has-changes' : ''}`}>
                                        <div className="item-header">
                                            <h4>{item.name}</h4>
                                            {!item.isAvailable && <span className="unavailable-badge">Unavailable</span>}
                                            {item.isAvailable && hasChanges && <span className="changed-badge">Modified</span>}
                                            {item.isAvailable && !hasChanges && <span className="unchanged-badge">No Changes</span>}
                                        </div>
                                        
                                        <div className="item-details">
                                            <div className="detail-row">
                                                <span className="detail-label">Quantity:</span>
                                                <div className="detail-comparison">
                                                    <span className={item.quantity !== item.revisedQuantity ? 'original-value crossed' : 'original-value'}>
                                                        {item.quantity}
                                                    </span>
                                                    {item.quantity !== item.revisedQuantity && (
                                                        <span className="revised-value">→ {item.revisedQuantity || 0}</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="detail-row">
                                                <span className="detail-label">Price per unit:</span>
                                                <div className="detail-comparison">
                                                    <span className={item.price !== item.revisedPrice ? 'original-value crossed' : 'original-value'}>
                                                        ₹{item.price?.toFixed(2)}
                                                    </span>
                                                    {item.price !== item.revisedPrice && (
                                                        <span className="revised-value">→ ₹{(item.revisedPrice || 0).toFixed(2)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="detail-row">
                                                <span className="detail-label">Total:</span>
                                                <div className="detail-comparison">
                                                    <span className={hasChanges ? 'original-value crossed' : 'original-value'}>
                                                        ₹{(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                    {hasChanges && (
                                                        <span className="revised-value">
                                                            → ₹{item.isAvailable ? ((item.revisedPrice || item.price) * (item.revisedQuantity || 0)).toFixed(2) : '0.00'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {item.shopperNotes && (
                                                <div className="shopper-notes">
                                                    <strong>Shopper's Note:</strong> {item.shopperNotes}
                                                </div>
                                            )}
                                        </div>
                                {revisedTotal !== (originalSubtotal + deliveryFee + Math.round(originalSubtotal * 0.1)) && (
                                    <div className="savings-info">
                                        <span className="savings-label">
                                            {revisedTotal < (originalSubtotal + deliveryFee + Math.round(originalSubtotal * 0.1)) ? 'You Save:' : 'Additional Amount:'}
                                        </span>
                                        <span className={`savings-amount ${revisedTotal < (originalSubtotal + deliveryFee + Math.round(originalSubtotal * 0.1)) ? 'positive' : 'negative'}`}>
                                            ₹{Math.abs(revisedTotal - (originalSubtotal + deliveryFee + Math.round(originalSubtotal * 0.1))).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="confirmation-actions">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => navigate('/orders')}
                                disabled={approving}
                            >
                                Cancel Order
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleApproveRevision}
                                disabled={approving}
                            >
                                {approving ? 'Approving...' : '✅ Approve Revised Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevisedOrderPage;
