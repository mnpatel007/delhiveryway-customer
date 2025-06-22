import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const OrderHistoryPage = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/orders/customer', {
            headers: { Authorization: `Bearer ${user.token}` }
        })
            .then(res => setOrders(res.data))
            .catch(err => console.error('Failed to load orders:', err));
    }, [user]);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleString();
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Your Order History</h2>

            {orders.length === 0 ? (
                <p>You have not placed any orders yet.</p>
            ) : (
                orders.map(order => {
                    const itemTotal = order.items.reduce((sum, i) => sum + i.productId.price * i.quantity, 0);
                    const tax = parseFloat((itemTotal * 0.05).toFixed(2));
                    const deliveryCharge = 10 * new Set(order.items.map(i => i.productId.shopId._id)).size;
                    const grandTotal = itemTotal + tax + deliveryCharge;

                    // group items by shopId
                    const grouped = {};
                    order.items.forEach(item => {
                        const shopId = item.productId.shopId._id;
                        const shopName = item.productId.shopId.name;
                        if (!grouped[shopId]) {
                            grouped[shopId] = {
                                shopName,
                                items: []
                            };
                        }
                        grouped[shopId].items.push(item);
                    });

                    const shopGroups = Object.values(grouped);

                    return (
                        <div key={order._id} style={{ border: '1px solid #ccc', margin: '1rem 0', padding: '1rem' }}>
                            <p><strong>Date:</strong> {formatDate(order.createdAt)}</p>
                            <p><strong>Status:</strong> {order.status}</p>
                            <p><strong>Delivery Address:</strong> {order.address}</p>

                            {shopGroups.length === 1 ? (
                                <>
                                    <p><strong>Shop:</strong> {shopGroups[0].shopName}</p>
                                    <ul>
                                        {shopGroups[0].items.map((item, i) => (
                                            <li key={i}>
                                                {item.productId.name} × {item.quantity} = ₹{item.productId.price * item.quantity}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                shopGroups.map((group, idx) => (
                                    <div key={idx}>
                                        <h4 style={{ marginTop: '1rem' }}>Shop: {group.shopName}</h4>
                                        <ul>
                                            {group.items.map((item, i) => (
                                                <li key={i}>
                                                    {item.productId.name} × {item.quantity} = ₹{item.productId.price * item.quantity}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            )}

                            <p><strong>Items Total:</strong> ₹{itemTotal.toFixed(2)}</p>
                            <p><strong>GST (5%):</strong> ₹{tax.toFixed(2)}</p>
                            <p><strong>Delivery Charge:</strong> ₹{deliveryCharge.toFixed(2)}</p>
                            <p><strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}</p>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default OrderHistoryPage;
