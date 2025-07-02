import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const RehearsalCheckoutPage = () => {
    const { cart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const selectedItems = location.state?.selectedItems || cart;

    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!address.trim()) return alert('Please enter delivery address');

        const formattedItems = selectedItems.map(item => ({
            productId: item.product._id,
            quantity: item.quantity
        }));

        try {
            setLoading(true);
            await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/temp-orders`,
                { items: formattedItems, address },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );
            navigate('/awaiting-vendor-review');
        } catch (err) {
            console.error('❌ Failed to create rehearsal order:', err);
            alert('Failed to create order. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-container">
            <h2>Rehearsal Checkout</h2>
            <p>This is a temporary order. Vendor will review it before payment.</p>

            <textarea
                placeholder="Enter delivery address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={4}
                style={{ width: '100%', marginBottom: '1rem' }}
            />

            <h4>Items in your order:</h4>
            <ul>
                {selectedItems.map(({ product, quantity }) => (
                    <li key={product._id}>
                        {product.name} × {quantity} - ₹{product.price * quantity}
                    </li>
                ))}
            </ul>

            <button onClick={handleConfirm} disabled={loading}>
                {loading ? 'Submitting...' : 'Confirm Order'}
            </button>
        </div>
    );
};

export default RehearsalCheckoutPage;
