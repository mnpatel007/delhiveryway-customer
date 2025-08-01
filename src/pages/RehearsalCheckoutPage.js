import React, { useContext, useState, useEffect } from 'react';
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
    const [deliveryCharges, setDeliveryCharges] = useState({});
    const [calculatingCharges, setCalculatingCharges] = useState(false);

    const calculateItemsTotal = () => {
        return selectedItems.reduce((total, { product, quantity }) =>
            total + (product.price * quantity), 0);
    };

    const calculateDeliveryTotal = () => {
        return Object.values(deliveryCharges).reduce((total, charge) => total + charge.charge, 0);
    };

    const calculateGrandTotal = () => {
        return calculateItemsTotal() + calculateDeliveryTotal();
    };

    const calculateDeliveryCharges = async (customerAddress) => {
        if (!customerAddress.trim() || customerAddress.length < 5) {
            return;
        }

        try {
            setCalculatingCharges(true);

            // Get unique shop IDs from selected items
            const shopIds = [...new Set(selectedItems.map(item => item.product.shopId))];

            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/delivery/calculate-charges`,
                {
                    address: customerAddress,
                    shopIds: shopIds
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );

            setDeliveryCharges(response.data.deliveryCharges);
        } catch (error) {
            console.error('Error calculating delivery charges:', error);
            // Set default charges if calculation fails
            const shopIds = [...new Set(selectedItems.map(item => item.product.shopId))];
            const defaultCharges = {};
            shopIds.forEach(shopId => {
                defaultCharges[shopId] = {
                    shopName: 'Shop',
                    distance: 0,
                    charge: 30 // Default charge
                };
            });
            setDeliveryCharges(defaultCharges);
        } finally {
            setCalculatingCharges(false);
        }
    };

    // Debounced effect to calculate delivery charges when address changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (address.trim() && address.length >= 5) {
                calculateDeliveryCharges(address);
            } else {
                setDeliveryCharges({});
            }
        }, 1000); // 1 second delay

        return () => clearTimeout(timeoutId);
    }, [address]);

    const handleConfirm = async () => {
        // Validate address
        if (!address.trim()) {
            setAddressError('Please enter a complete delivery address');
            return;
        }

        if (address.length < 5) {
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
                    totalAmount: calculateGrandTotal(),
                    deliveryCharges: deliveryCharges
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
                    totalAmount: calculateGrandTotal()
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
                    <div className="rehearsal-order-breakdown">
                        <div className="breakdown-row">
                            <span>Items Total:</span>
                            <span>₹{calculateItemsTotal()}</span>
                        </div>

                        {Object.keys(deliveryCharges).length > 0 && (
                            <>
                                <div className="delivery-charges-section">
                                    <h4>Delivery Charges:</h4>
                                    {Object.entries(deliveryCharges).map(([shopId, charge]) => (
                                        <div key={shopId} className="breakdown-row delivery-charge">
                                            <span>
                                                {charge.shopName}
                                                {charge.distance > 0 && (
                                                    <small> ({charge.distance}km)</small>
                                                )}
                                            </span>
                                            <span>₹{charge.charge}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="breakdown-row">
                                    <span>Total Delivery:</span>
                                    <span>₹{calculateDeliveryTotal()}</span>
                                </div>
                            </>
                        )}

                        {calculatingCharges && (
                            <div className="breakdown-row">
                                <span>Calculating delivery charges...</span>
                                <span>⏳</span>
                            </div>
                        )}
                    </div>

                    <div className="rehearsal-order-total">
                        <strong>Grand Total:</strong>
                        <strong>₹{calculateGrandTotal()}</strong>
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