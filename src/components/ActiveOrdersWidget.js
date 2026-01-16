import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, apiCall } from '../services/api';
import { useSocket } from '../context/SocketContext';
import InquiryButton from './InquiryButton';
import OrderTrackingMap from './OrderTrackingMap';
import './ActiveOrdersWidget.css';

const ActiveOrdersWidget = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [driverLocations, setDriverLocations] = useState({});
    const [expandedMapOrderId, setExpandedMapOrderId] = useState(null);

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

                console.log('Active orders loaded:', sortedOrders);

                const initialDriverLocations = {};
                sortedOrders.forEach(order => {
                    if (order.personalShopperId?.currentLocation) {
                        initialDriverLocations[order._id] = order.personalShopperId.currentLocation;
                    } else if (order.shopperLocation) {
                        initialDriverLocations[order._id] = order.shopperLocation;
                    } else if (order.shopId?.address?.coordinates) {
                        // MOCK FOR TESTING: If no driver location, simulate them near the shop
                        // Add a small random offset (approx 500m) to show distinct marker
                        const lat = parseFloat(order.shopId.address.coordinates.lat);
                        const lng = parseFloat(order.shopId.address.coordinates.lng);
                        initialDriverLocations[order._id] = {
                            latitude: lat + 0.005,
                            longitude: lng + 0.005
                        };
                    }
                });
                setDriverLocations(prev => ({ ...prev, ...initialDriverLocations }));

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

    useEffect(() => {
        fetchActiveOrders();
    }, [user]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket || !user) return;

        const handleOrderUpdate = (data) => {
            console.log('Socket order update received:', data);

            try {
                // Validate the incoming data
                if (!data || !data.orderId) {
                    console.warn('Invalid socket data received:', data);
                    return;
                }

                // Update the specific order in the active orders list
                setActiveOrders(prevOrders => {
                    const updatedOrders = prevOrders.map(order => {
                        if (order._id === data.orderId) {
                            // Only update fields that are provided in the socket data
                            const updatedOrder = { ...order };
                            if (data.status) updatedOrder.status = data.status;
                            if (data.personalShopperId) updatedOrder.personalShopperId = data.personalShopperId;
                            if (data.estimatedDeliveryTime) updatedOrder.estimatedDeliveryTime = data.estimatedDeliveryTime;

                            console.log('Updated order:', updatedOrder);
                            return updatedOrder;
                        }
                        return order;
                    });

                    return updatedOrders;
                });
            } catch (error) {
                console.error('Error handling socket order update:', error);
            }
        };

        const handleLocationUpdate = (data) => {
            console.log('Source Location update received:', data);
            if (data && data.orderId && data.location) {
                setDriverLocations(prev => ({
                    ...prev,
                    [data.orderId]: data.location
                }));
            }
        };

        // Listen for various order update events
        socket.on('orderStatusUpdate', handleOrderUpdate);
        socket.on('orderUpdate', handleOrderUpdate);
        socket.on('shopperAction', handleOrderUpdate);
        socket.on('shopperLocationUpdate', handleLocationUpdate);
        socket.on('shopperLocation', handleLocationUpdate); // Listen to legacy alias as well if any

        return () => {
            socket.off('orderStatusUpdate', handleOrderUpdate);
            socket.off('orderUpdate', handleOrderUpdate);
            socket.off('shopperAction', handleOrderUpdate);
            socket.off('shopperLocationUpdate', handleLocationUpdate);
            socket.off('shopperLocation', handleLocationUpdate);


        };
    }, [socket, user]);

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

    // Helper to determine if map should be shown
    const shouldShowMap = (status) => {
        const showMapStatuses = [
            'accepted_by_shopper',
            'shopper_at_shop',
            'shopping_in_progress',
            'shopper_revised_order',
            'customer_reviewing_revision',
            'customer_approved_revision',
            'bill_uploaded',
            'bill_sent',
            'bill_approved',
            'picked_up',
            'out_for_delivery',
            'final_shopping'
        ];
        return showMapStatuses.includes(status);
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
        // Show a retry button instead of silently failing
        return (
            <div className="active-orders-widget error-state">
                <div className="widget-header">
                    <h3>📦 Your Active Orders</h3>
                    <button
                        className="refresh-btn"
                        onClick={fetchActiveOrders}
                        title="Try again"
                    >
                        🔄 Try Again
                    </button>
                </div>
                <div className="error-message">
                    <p>Something went wrong loading your orders.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="active-orders-widget">
            <div className="widget-header">
                <h3>📦 Your Active Orders</h3>
                <div className="header-actions">
                    <span className="orders-count">{activeOrders.length} active</span>
                    <button
                        className="refresh-btn"
                        onClick={fetchActiveOrders}
                        title="Refresh orders"
                    >
                        🔄
                    </button>
                </div>
            </div>

            <div className="active-orders-list">
                {activeOrders.slice(0, 3).map(order => {
                    // Add safety checks for each order
                    if (!order || !order._id) {
                        console.warn('Invalid order data:', order);
                        return null;
                    }

                    const showMap = shouldShowMap(order.status);
                    const isMapExpanded = expandedMapOrderId === order._id;

                    try {
                        return (
                            <div key={order._id} className="active-order-item">
                                <div className="order-info">
                                    <div className="order-header">
                                        <span className="order-number">
                                            Order #{order.orderNumber || order._id?.slice(-8) || 'Unknown'}
                                        </span>
                                        <span
                                            className="order-status-badge"
                                            style={{ backgroundColor: getStatusColor(order.status || 'pending') }}
                                        >
                                            {getStatusDisplayName(order.status || 'pending')}
                                        </span>
                                    </div>

                                    <div className="order-details">
                                        <span className="order-time">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown time'}
                                        </span>
                                        {order.shopId && order.shopId.name && (
                                            <span className="order-shop">
                                                🏪 {order.shopId.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Map Integration */}
                                    {showMap && (
                                        <OrderTrackingMap
                                            order={order}
                                            driverLocation={driverLocations[order._id]}
                                            isExpanded={isMapExpanded}
                                            onToggleExpand={() => setExpandedMapOrderId(isMapExpanded ? null : order._id)}
                                        />
                                    )}
                                </div>

                                <div className="order-actions">
                                    <InquiryButton order={order} />
                                </div>
                            </div>
                        );
                    } catch (orderError) {
                        console.error('Error rendering order:', orderError, order);
                        return null;
                    }
                }).filter(Boolean)}
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

            {/* Render Expanded Map Modal if needed outside the list to avoid z-index issues, 
                but CSS 'fixed' position handles that usually. 
                However, to be clean, we can render the expanded map here if we want only one active at a time.
                But the component handles its own expansion state visually. 
                Let's stick to rendering it inside the list item for context, but using the portal or fixed position css.
            */}
        </div>
    );
};

export default ActiveOrdersWidget;