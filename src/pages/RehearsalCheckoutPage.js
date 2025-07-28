import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './RehearsalCheckoutPage.css';

const RehearsalCheckoutPage = () => {
    const { cart, clearCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const selectedItems = location.state?.selectedItems || cart;

    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [addressError, setAddressError] = useState('');

    const calculateTotal = () => {
        return selectedItems.reduce((total, { product, quantity }) =>
            total + (product.price * quantity), 0);
    };

    const handleConfirm = async () => {
        // Validate address
        if (!address.trim()) {
            setAddressError('Please enter a complete delivery address');
            return;
        }

        if (address.length < 6) {
            setAddressError('Address seems too short. Please provide more details.');
            return;
        }

        const formattedItems = selectedItems.map(item => ({
            productId: item.product._id,
            quantity: item.quantity
        }));

        try {
            setLoading(true);
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/temp-orders`,
                {
                    items: formattedItems,
                    address,
                    totalAmount: calculateTotal()
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );

            // Clear cart after successful order
            clearCart();

            // Navigate to awaiting page
            navigate('/awaiting-vendor-review', {
                state: {
                    orderId: response.data._id,
                    totalAmount: calculateTotal()
                }
            });
        } catch (err) {
            console.error('❌ Failed to create rehearsal order:', err);
            alert('Failed to create order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rehearsal-checkout-container">
            <div className="rehearsal-checkout-wrapper">
                <div className="rehearsal-checkout-header">
                    <h2>Rehearsal Checkout</h2>
                    <p>Create a temporary order for vendor review</p>
                </div>

                <div className="rehearsal-address-section">
                    <h3>Delivery Address</h3>
                    <textarea
                        placeholder="Enter complete delivery address (including landmark)"
                        value={address}
                        onChange={(e) => {
                            setAddress(e.target.value);
                            setAddressError('');
                        }}
                        rows={4}
                    />
                    {addressError && (
                        <div className="rehearsal-error-message">{addressError}</div>
                    )}
                </div>

                <div className="rehearsal-order-summary">
                    <h3>Order Summary</h3>
                    <div className="rehearsal-order-items">
                        {selectedItems.map(({ product, quantity }) => (
                            <div key={product._id} className="rehearsal-order-item">
                                <span className="item-name">{product.name}</span>
                                <span className="item-details">
                                    {quantity} × ₹{product.price} = ₹{product.price * quantity}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="rehearsal-order-total">
                        <strong>Total Amount:</strong>
                        <strong>₹{calculateTotal()}</strong>
                    </div>
                </div>

                <div className="checkout-actions">
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`rehearsal-confirm-button ${loading ? 'loading' : ''}`}
                    >
                        {loading ? (
                            <div className="rehearsal-spinner"></div>
                        ) : (
                            'Confirm Order'
                        )}
                    </button>
                </div>

                <div className="rehearsal-checkout-note">
                    <p>🔒 Secure Checkout</p>
                    <p>💡 Vendor will review your order before final confirmation</p>
                </div>
            </div>
        </div>
    );
};

export default RehearsalCheckoutPage;