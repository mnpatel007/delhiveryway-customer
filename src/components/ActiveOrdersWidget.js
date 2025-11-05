import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, apiCall } from '../services/api';
import InquiryButton from './InquiryButton';
import './ActiveOrdersWidget.css';

const ActiveOrdersWidget = () => {
    const { user } = useAuth();
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchActiveOrders = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const result = await apiCall(ordersAPI.getCustomerOrders);

                if (result.success) {
                    const ordersArray = result.data.data || result.data || [];

                    // Filter for active orders (not delivered or cancelled)
                    const activeOrdersFiltered = ordersArray.filter(order =>
                        !['delivered', 'cancelled'].includes(order.status)
                    );

                    // Sort by most recent first
                    const sortedOrders = activeOrdersFiltered.sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    );

                    setActiveOrders(sortedOrders);
                    setError(null);
                } else {
                    setError(result.message || 'Failed to load orders');
                }
            } catch (err) {
                console.error('Failed to load active orders:', err);
                setError('Failed to load orders');
            } finally {
                setLoading(false);
            }
        };

        fetchActiveOrders();
    }, [user]);

    const getStatusDisplayName = (status) => {
        const statusMap = {
            'pending_shopper': 'Finding Personal Shopper',
            'accepted_by_shopper': 'Personal Shopper Assigned',
            'shopper_at_shop': 'Shopper at Store',
            'shopping_in_progress': 'Shopping in Progress',
            'shopper_revised_order': 'Order Revised - Please Review',
            'customer_reviewing_revision': 'Order Revised - Please Review',
            'customer_approved_revision': 'Revision Approved',
            'bill_uploaded': 'Bill Ready for Approval',
            'bill_sent': 'Bill Sent for Approval',
            'bill_approved': 'Bill Approved - Preparing Delivery',
            'confirmed': 'Confirmed',
            'preparing': 'Preparing',
            'ready': 'Ready for Pickup',
            'picked_up': 'Picked Up',
            'out_for_delivery': 'Out for Delivery'
        };
        return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'pending_shopper': '#ffc107',
            'accepted_by_shopper': '#28a745',
            'shopper_at_shop': '#17a2b8',
            'shopping_in_progress': '#fd7e14',
            'shopper_revised_order': '#dc3545',
            'customer_reviewing_revision': '#dc3545',
            'customer_approved_revision': '#28a745',
            'bill_uploaded': '#6f42c1',
            'bill_sent': '#6f42c1',
            'bill_approved': '#28a745',
            'confirmed': '#28a745',
            'preparing': '#ffc107',
            'ready': '#17a2b8',
            'picked_up': '#fd7e14',
            'out_for_delivery': '#6f42c1'
        };
        return colorMap[status] || '#6c757d';
    };

    // Don't show widget if user is not logged in
    if (!user) {
        return null;
    }

    // Don't show widget if loading or no active orders
    if (loading || activeOrders.length === 0) {
        return null;
    }

    if (error) {
        return null; // Silently fail for better UX
    }

    return (
        <div className="active-orders-widget">
            <div className="widget-header">
                <h3>📦 Your Active Orders</h3>
                <span className="orders-count">{activeOrders.length} active</span>
            </div>

            <div className="active-orders-list">
                {activeOrders.slice(0, 3).map(order => (
                    <div key={order._id} className="active-order-item">
                        <div className="order-info">
                            <div className="order-header">
                                <span className="order-number">
                                    Order #{order.orderNumber || order._id?.slice(-8)}
                                </span>
                                <span
                                    className="order-status-badge"
                                    style={{ backgroundColor: getStatusColor(order.status) }}
                                >
                                    {getStatusDisplayName(order.status)}
                                </span>
                            </div>

                            <div className="order-details">
                                <span className="order-time">
                                    {new Date(order.createdAt).toLocaleString()}
                                </span>
                                {order.shopId && (
                                    <span className="order-shop">
                                        🏪 {order.shopId.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="order-actions">
                            <InquiryButton order={order} />
                        </div>
                    </div>
                ))}
            </div>

            {activeOrders.length > 3 && (
                <div className="widget-footer">
                    <button
                        className="view-all-btn"
                        onClick={() => window.location.href = '/order-history'}
                    >
                        View All Orders ({activeOrders.length})
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActiveOrdersWidget;