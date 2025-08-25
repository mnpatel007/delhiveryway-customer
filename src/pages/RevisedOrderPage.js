import React, { useEffect, useState, useMemo } from 'react';
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
    }).format(Number.isFinite(price) ? price : 0);
};

const RevisedOrderPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [error, setError] = useState('');

    // --- Helpers ----------------------------------------------------------------
    const safeNumber = (n, fallback = 0) =>
        Number.isFinite(Number(n)) ? Number(n) : fallback;

    const getOriginalSubtotal = (ord) => {
        if (!ord?.items?.length) return 0;
        return ord.items.reduce(
            (total, item) => total + safeNumber(item.price) * safeNumber(item.quantity),
            0
        );
    };

    const getRevisedSubtotal = (ord) => {
        if (!ord?.items?.length) return 0;
        return ord.items.reduce((total, item) => {
            // Only count available items with a positive revised quantity
            if (item?.isAvailable === false) return total;

            const qty =
                safeNumber(item.revisedQuantity, undefined) !== undefined
                    ? safeNumber(item.revisedQuantity)
                    : safeNumber(item.quantity);

            if (qty <= 0) return total;

            const unit =
                safeNumber(item.revisedPrice, undefined) !== undefined
                    ? safeNumber(item.revisedPrice)
                    : safeNumber(item.price);

            return total + unit * qty;
        }, 0);
    };

    // --- Data Fetch -------------------------------------------------------------
    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            setError('');
            try {
                // Use the API route with /api prefix consistently
                const response = await api.get(`/api/orders/${orderId}`);

                // Support both shapes:
                // 1) { success: true, data: { order: {...} } }
                // 2) { ...orderFields }
                let orderData = null;
                if (response?.data?.success && response?.data?.data?.order) {
                    orderData = response.data.data.order;
                } else if (response?.data && !response.data.success) {
                    // If API returns {success:false}
                    throw new Error(response.data.message || 'Order not found');
                } else {
                    orderData = response.data;
                }

                if (!orderData) throw new Error('Order not found');

                setOrder(orderData);
            } catch (err) {
                console.error('Error fetching order:', err);
                setError(err?.message || 'Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchOrder();
    }, [orderId]);

    // --- Derived Totals ---------------------------------------------------------
    const originalSubtotal = useMemo(() => getOriginalSubtotal(order), [order]);
    const revisedSubtotal = useMemo(() => getRevisedSubtotal(order), [order]);

    const deliveryFee =
        safeNumber(order?.orderValue?.deliveryFee, undefined) !== undefined
            ? safeNumber(order?.orderValue?.deliveryFee)
            : safeNumber(order?.deliveryFee);

    const taxRate =
        safeNumber(order?.orderValue?.taxRate, undefined) !== undefined
            ? safeNumber(order?.orderValue?.taxRate)
            : 0.05; // default 5%

    const originalTaxes = Math.round(originalSubtotal * taxRate);
    const revisedTaxes = Math.round(revisedSubtotal * taxRate);

    const originalTotal = originalSubtotal + deliveryFee + originalTaxes;
    const revisedTotal = revisedSubtotal + deliveryFee + revisedTaxes;

    // --- Actions ----------------------------------------------------------------
    const handleApproveRevision = async () => {
        try {
            setApproving(true);
            // Use a single consistent endpoint and method
            const response = await api.post(`/api/orders/${orderId}/approve-revision`);
            if (response?.data?.success === false) {
                throw new Error(response?.data?.message || 'Failed to approve revision');
            }

            navigate(`/orders/${orderId}`, {
                state: {
                    message:
                        'Revised order approved! Your shopper will proceed with final shopping.'
                }
            });
        } catch (err) {
            console.error('Error approving revision:', err);
            setError(err?.message || 'Failed to approve order changes');
            setApproving(false);
        }
    };

    // --- UI States --------------------------------------------------------------
    if (loading) {
        return (
            <div className="checkout-container">
                <div className="checkout-wrapper">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading order details...</p>
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
                        <button className="btn btn-primary" onClick={() => navigate('/orders')}>
                            View My Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="checkout-container">
                <div className="checkout-wrapper">
                    <div className="error-state">
                        <h2>Order Not Found</h2>
                        <p>The requested order could not be found.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/orders')}>
                            View My Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const showDelta = revisedTotal !== originalTotal;
    const delta = Math.abs(revisedTotal - originalTotal);
    const deltaIsSaving = revisedTotal < originalTotal;

    return (
        <div className="checkout-container">
            <div className="checkout-wrapper">
                <div className="checkout-header">
                    <div className="revision-icon">🔄</div>
                    <h2>Order Revised by Shopper</h2>
                    <p>
                        Your personal shopper has checked item availability and made some
                        adjustments to your order.
                    </p>
                </div>

                <div className="checkout-content">
                    <div className="order-confirmation-details">
                        <div className="confirmation-section">
                            <h3>Order Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Order Number:</span>
                                    <span className="info-value">{order?.orderNumber || order?._id}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Shopper:</span>
                                    <span className="info-value">
                                        {order?.personalShopperId?.name || 'Assigned'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Original Total:</span>
                                    <span className="info-value">
                                        {formatPrice(originalTotal)}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Revised Total:</span>
                                    <span className="info-value revised-total">
                                        {formatPrice(revisedTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="confirmation-section">
                            <h3>Item Changes</h3>
                            <div className="items-comparison">
                                {order?.items?.map((item, index) => {
                                    const qty = safeNumber(item.quantity);
                                    const revQty =
                                        safeNumber(item.revisedQuantity, undefined) !== undefined
                                            ? safeNumber(item.revisedQuantity)
                                            : qty;

                                    const price = safeNumber(item.price);
                                    const revPrice =
                                        safeNumber(item.revisedPrice, undefined) !== undefined
                                            ? safeNumber(item.revisedPrice)
                                            : price;

                                    const isUnavailable = item?.isAvailable === false;
                                    const hasQtyChange = qty !== revQty;
                                    const hasPriceChange = price !== revPrice;
                                    const hasChanges = isUnavailable || hasQtyChange || hasPriceChange;

                                    const originalLine = price * qty;
                                    const revisedLine = isUnavailable || revQty <= 0 ? 0 : revPrice * revQty;

                                    return (
                                        <div
                                            key={index}
                                            className={`item-comparison ${hasChanges ? 'has-changes' : ''}`}
                                        >
                                            <div className="item-header">
                                                <h4>{item.name}</h4>
                                                {isUnavailable && (
                                                    <span className="unavailable-badge">Unavailable</span>
                                                )}
                                                {!isUnavailable && hasChanges && (
                                                    <span className="changed-badge">Modified</span>
                                                )}
                                                {!isUnavailable && !hasChanges && (
                                                    <span className="unchanged-badge">No Changes</span>
                                                )}
                                            </div>

                                            <div className="item-details">
                                                <div className="detail-row">
                                                    <span className="detail-label">Quantity:</span>
                                                    <div className="detail-comparison">
                                                        <span
                                                            className={
                                                                hasQtyChange ? 'original-value crossed' : 'original-value'
                                                            }
                                                        >
                                                            {qty}
                                                        </span>
                                                        {hasQtyChange && (
                                                            <span className="revised-value">→ {Math.max(0, revQty)}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">Price per unit:</span>
                                                    <div className="detail-comparison">
                                                        <span
                                                            className={
                                                                hasPriceChange
                                                                    ? 'original-value crossed'
                                                                    : 'original-value'
                                                            }
                                                        >
                                                            ₹{price.toFixed(2)}
                                                        </span>
                                                        {hasPriceChange && (
                                                            <span className="revised-value">
                                                                → ₹{revPrice.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="detail-row">
                                                    <span className="detail-label">Total:</span>
                                                    <div className="detail-comparison">
                                                        <span
                                                            className={hasChanges ? 'original-value crossed' : 'original-value'}
                                                        >
                                                            ₹{originalLine.toFixed(2)}
                                                        </span>
                                                        {hasChanges && (
                                                            <span className="revised-value">
                                                                → ₹{revisedLine.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {item?.shopperNotes && (
                                                    <div className="shopper-notes">
                                                        <strong>Shopper&apos;s Note:</strong> {item.shopperNotes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {showDelta && (
                            <div className="savings-info">
                                <span className="savings-label">
                                    {deltaIsSaving ? 'You Save:' : 'Additional Amount:'}
                                </span>
                                <span className={`savings-amount ${deltaIsSaving ? 'positive' : 'negative'}`}>
                                    {formatPrice(delta)}
                                </span>
                            </div>
                        )}

                        <div className="order-summary">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>Items ({order?.items?.length || 0})</span>
                                <span>{formatPrice(revisedSubtotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Delivery Fee</span>
                                <span>{formatPrice(deliveryFee)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Taxes ({Math.round(taxRate * 100)}%)</span>
                                <span>{formatPrice(revisedTaxes)}</span>
                            </div>
                            <div className="summary-divider"></div>
                            <div className="summary-row total-row">
                                <span>Total Amount</span>
                                <span>{formatPrice(revisedTotal)}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="error-message">
                                <h3>❌ Error</h3>
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    <div className="confirmation-actions">
                        <button className="btn btn-secondary" onClick={() => navigate('/orders')}>
                            View All Orders
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleApproveRevision}
                            disabled={approving}
                        >
                            {approving ? 'Processing...' : 'Approve Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevisedOrderPage;
