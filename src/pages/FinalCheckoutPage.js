import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import './CheckoutPage.css';

const stripePromise = loadStripe('pk_test_51RdZkxRvhEVshUODDQprocdR1VZc3ANHK3sXO8CBX2R15UGdHybkDJ2LO0qqoHYTfghWvaghMbOfqP3lBWLgrMzz009Sc0sv3a');

const CheckoutPage = () => {
    const { user } = useContext(AuthContext);
    const { cart, setCart } = useContext(CartContext);
    const navigate = useNavigate();
    const location = useLocation();

    const selectedItems = location.state?.selectedItems || cart;

    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [shopCount, setShopCount] = useState(0);
    const [total, setTotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [shops, setShops] = useState([]);

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/shops`)
            .then(res => {
                const data = res.data;
                if (Array.isArray(data)) {
                    setShops(data);
                } else if (Array.isArray(data.shops)) {
                    setShops(data.shops);
                } else {
                    console.error("Unexpected API response format:", data);
                    setShops([]);
                }
            })
            .catch(err => console.error('Failed to load shops:', err));
    }, []);

    useEffect(() => {
        const shopSet = new Set();
        let itemTotal = 0;
        selectedItems.forEach(item => {
            shopSet.add(item.shopId);
            itemTotal += item.product.price * item.quantity;
        });

        const shops = shopSet.size;
        const calculatedTax = parseFloat((itemTotal * 0.05).toFixed(2));
        const delivery = shops * 10;
        const grand = itemTotal + calculatedTax + delivery;

        setShopCount(shops);
        setTotal(itemTotal);
        setTax(calculatedTax);
        setDeliveryCharge(delivery);
        setGrandTotal(grand);
    }, [selectedItems]);

    const getShopName = (shopId) => {
        const shop = Array.isArray(shops) ? shops.find(s => s._id === shopId) : null;
        return shop ? shop.name : 'Unknown Shop';
    };

    const handleStripePayment = async () => {
        if (!address.trim()) {
            alert("Please enter a delivery address.");
            return;
        }

        const stripe = await stripePromise;

        try {
            setLoading(true);

            const formattedItems = selectedItems.map(item => ({
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    price: item.product.price
                },
                quantity: item.quantity
            }));

            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/payment/create-checkout-session`,
                {
                    items: formattedItems,
                    address
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );

            localStorage.setItem('checkoutAddress', address);
            localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));

            const result = await stripe.redirectToCheckout({
                sessionId: response.data.id
            });

            if (result.error) {
                alert(result.error.message);
            }
        } catch (err) {
            console.error('Payment error:', err);
            alert("Payment failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-container">
            <div className="checkout-wrapper">
                <div className="checkout-header">
                    <h2>Checkout</h2>
                </div>

                <div className="checkout-content">
                    <div className="checkout-user-details">
                        <h3>Customer Details</h3>
                        <div className="user-info">
                            <p><span className="info-label">Name:</span>{user.user.name}</p>
                            <p><span className="info-label">Email:</span>{user.user.email}</p>
                        </div>
                    </div>

                    <div className="checkout-address">
                        <h3>Delivery Address</h3>
                        <textarea
                            className="address-input"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            rows={4}
                            placeholder="Enter your full delivery address"
                        />
                    </div>

                    <div className="checkout-order-summary">
                        <h3>Order Summary</h3>

                        {Object.entries(Object.groupBy(selectedItems, item => item.shopId)).map(([shopId, items]) => (
                            <div key={shopId} className="shop-order-section">
                                <h4 className="shop-name">{getShopName(shopId)}</h4>
                                {items.map(({ product, quantity }) => (
                                    <div key={product._id} className="order-item">
                                        <div className="order-item-details">
                                            <span className="product-name">{product.name}</span>
                                            <span className="product-quantity">x {quantity}</span>
                                        </div>
                                        <span className="product-price">₹{(product.price * quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <div className="order-total-breakdown">
                            <div className="total-row">
                                <span>Items Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>GST (5%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Delivery Charge</span>
                                <span>₹{deliveryCharge.toFixed(2)}</span>
                            </div>
                            <div className="total-row grand-total">
                                <strong>Grand Total</strong>
                                <strong>₹{grandTotal.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>

                    <button
                        className="place-order-btn"
                        onClick={handleStripePayment}
                        disabled={loading || !address.trim()}
                    >
                        {loading ? 'Redirecting...' : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
