import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import './CheckoutPage.css';

const stripePromise = loadStripe('pk_test_51RdZkxRvhEVshUODDQprocdR1VZc3ANHK3sXO8CBX2R15UGdHybkDJ2LO0qqoHYTfghWvaghMbOfqP3lBWLgrMzz009Sc0sv3a');

const FinalCheckoutPage = () => {
    const { user } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);
    const [finalOrder, setFinalOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [shops, setShops] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('finalCheckoutOrder');
        if (!saved) {
            console.error('❌ No finalCheckoutOrder found in localStorage');
            return;
        }

        console.log('📦 Raw saved data:', saved);
        const parsed = JSON.parse(saved);
        console.log('📦 Parsed data:', parsed);

        const { items, address, deliveryCharge, totalAmount } = parsed;

        const fetchProductDetails = async () => {
            try {
                const fullItems = [];
                console.log('🔍 Processing items:', items);

                for (const item of items) {
                    if (!item.productId) {
                        console.warn('⚠️ Skipping item with missing productId:', item);
                        continue;
                    }

                    try {
                        const res = await axios.get(
                            `${process.env.REACT_APP_BACKEND_URL}/api/products/${item.productId}`,
                            {
                                headers: { Authorization: `Bearer ${user.token}` }
                            }
                        );

                        if (res.data) {
                            console.log('✅ Product fetched:', res.data);
                            fullItems.push({
                                product: res.data,
                                quantity: item.quantity,
                                shopId: res.data.shopId
                            });
                        }

                    } catch (err) {
                        console.warn(`⚠️ Failed to fetch product ${item.productId}:`, err.message);
                        // Don't push it — skip this item silently
                    }
                }

                console.log('📋 Final items array:', fullItems);

                // If no items were successfully fetched, try different fallback strategies
                if (fullItems.length === 0) {
                    console.log('⚠️ No items found, trying fallback strategies...');

                    // Strategy 1: Use cart data as fallback
                    if (cartItems && cartItems.length > 0) {
                        console.log('🔄 Using cart items as fallback');
                        const cartBasedItems = cartItems.map(item => ({
                            product: {
                                _id: item._id,
                                name: item.name,
                                price: item.price,
                                shopId: item.shopId
                            },
                            quantity: item.quantity,
                            shopId: item.shopId
                        }));

                        setFinalOrder({
                            items: cartBasedItems,
                            address: address || 'Address not provided',
                            deliveryCharge: deliveryCharge || 30,
                            totalAmount
                        });
                    }
                    // Strategy 2: If we have an orderId, fetch the order details directly
                    else if (parsed.orderId) {
                        console.log('🔄 Fetching order details from backend...');
                        try {
                            const orderRes = await axios.get(
                                `${process.env.REACT_APP_BACKEND_URL}/api/orders/${parsed.orderId}`,
                                {
                                    headers: { Authorization: `Bearer ${user.token}` }
                                }
                            );

                            if (orderRes.data && orderRes.data.items && orderRes.data.items.length > 0) {
                                console.log('✅ Order details fetched:', orderRes.data);
                                const orderItems = orderRes.data.items.map(item => ({
                                    product: item.product || item,
                                    quantity: item.quantity,
                                    shopId: item.shopId || (item.product && item.product.shopId)
                                }));

                                setFinalOrder({
                                    items: orderItems,
                                    address: orderRes.data.address || address,
                                    deliveryCharge: orderRes.data.deliveryCharge || deliveryCharge || 30,
                                    totalAmount: orderRes.data.totalAmount || totalAmount
                                });
                            } else {
                                // Strategy 3: Set empty order with just delivery charge
                                console.log('⚠️ No items found anywhere, setting minimal order');
                                setFinalOrder({
                                    items: [],
                                    address: address || 'Address not provided',
                                    deliveryCharge: deliveryCharge || 30,
                                    totalAmount: totalAmount || (deliveryCharge || 30)
                                });
                            }
                        } catch (orderErr) {
                            console.error('❌ Failed to fetch order details:', orderErr);
                            setFinalOrder({
                                items: [],
                                address: address || 'Address not provided',
                                deliveryCharge: deliveryCharge || 30,
                                totalAmount: totalAmount || (deliveryCharge || 30)
                            });
                        }
                    } else {
                        // Strategy 3: Set empty order with just delivery charge
                        setFinalOrder({
                            items: [],
                            address: address || 'Address not provided',
                            deliveryCharge: deliveryCharge || 30,
                            totalAmount: totalAmount || (deliveryCharge || 30)
                        });
                    }
                } else {
                    setFinalOrder({ items: fullItems, address, deliveryCharge, totalAmount });
                }

            } catch (err) {
                console.error('❌ Failed to load product details:', err);
            }
        };

        fetchProductDetails();
    }, [user.token, cartItems]);

    useEffect(() => {
        axios
            .get(`${process.env.REACT_APP_BACKEND_URL}/api/shops`)
            .then(res => {
                const data = res.data;
                if (Array.isArray(data)) setShops(data);
                else if (Array.isArray(data.shops)) setShops(data.shops);
            })
            .catch(err => console.error('Failed to load shops:', err));
    }, []);

    const getShopName = (shopId) => {
        const id = typeof shopId === 'object' ? shopId._id : shopId;
        const match = shops.find((shop) => shop._id === id);
        return match ? match.name : 'Unknown Shop';
    };



    const groupByShop = () => {
        if (!finalOrder?.items) return {};

        return finalOrder.items.reduce((acc, item) => {
            const shopId =
                typeof item.shopId === 'object' ? item.shopId._id : item.shopId;

            if (!acc[shopId]) acc[shopId] = [];
            acc[shopId].push(item);
            return acc;
        }, {});
    };

    const handleStripePayment = async () => {
        const stripe = await stripePromise;
        try {
            setLoading(true);

            const formattedItems = finalOrder.items.map(item => ({
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    price: item.product.price,
                    shopId: item.product.shopId
                },
                quantity: item.quantity
            }));

            // Store order amount for success page
            localStorage.setItem('lastOrderAmount', finalOrder.totalAmount);

            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/payment/create-checkout-session`,
                {
                    items: formattedItems,
                    address: finalOrder.address,
                    deliveryCharge: deliveryCharge
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );

            const result = await stripe.redirectToCheckout({
                sessionId: response.data.id
            });

            if (result.error) {
                alert(result.error.message);
            }
        } catch (err) {
            console.error('Payment error:', err);
            alert('Payment failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    // Debug function to create test data
    const createTestData = () => {
        const testData = {
            items: [
                {
                    productId: "test-product-1",
                    quantity: 2
                }
            ],
            address: "Test Address, Test City, Test State",
            deliveryCharge: 30,
            totalAmount: 100
        };
        localStorage.setItem('finalCheckoutOrder', JSON.stringify(testData));
        window.location.reload();
    };

    if (!finalOrder) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading final order...</p>
                {process.env.NODE_ENV === 'development' && (
                    <button onClick={createTestData} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Create Test Data (Dev Only)
                    </button>
                )}
            </div>
        );
    }

    const itemTotal = finalOrder.items.reduce((sum, item) => {
        const price = parseFloat(item.product.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        const itemSubtotal = price * quantity;
        console.log(`💰 Item: ${item.product.name}, Price: ₹${price}, Qty: ${quantity}, Subtotal: ₹${itemSubtotal}`);
        return sum + itemSubtotal;
    }, 0);

    console.log('💰 Total item cost:', itemTotal);

    const gst = itemTotal * 0.05;
    const platformFee = itemTotal * 0.029;
    const tax = gst + platformFee;

    // Use delivery charge from finalOrder (calculated dynamically) or fallback to 30
    const deliveryCharge = finalOrder.deliveryCharge || 30;
    const grandTotal = itemTotal + tax + deliveryCharge;

    console.log('💰 Final totals:', { itemTotal, tax, deliveryCharge, grandTotal });


    return (
        <div className="checkout-container">
            <div className="checkout-wrapper">
                <div className="checkout-header">
                    <h2>Final Checkout</h2>
                    <p>This is the final version of your order confirmed by the vendor.</p>
                </div>

                <div className="checkout-content">
                    <div className="checkout-user-details">
                        <h3>Customer</h3>
                        <div className="user-info">
                            <p><span className="info-label">Name:</span> {user.user.name}</p>
                            <p><span className="info-label">Email:</span> {user.user.email}</p>
                        </div>
                    </div>

                    <div className="checkout-address">
                        <h3>Delivery Address</h3>
                        <p style={{ background: '#f5f5f5', padding: '10px', borderRadius: '6px' }}>
                            {finalOrder.address}
                        </p>
                    </div>

                    <div className="checkout-order-summary">
                        <h3>Order Summary</h3>

                        {Object.entries(groupByShop()).map(([shopId, items]) => (
                            <div key={shopId} className="shop-order-section">
                                <h4 className="shop-name">{getShopName(shopId)}</h4>
                                {items.map((item, i) => (
                                    <div key={i} className="order-item">
                                        <div className="order-item-details">
                                            <span className="product-name">{item.product.name}</span>
                                            <span className="product-quantity">x {item.quantity}</span>
                                        </div>
                                        <span className="product-price">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <div className="order-total-breakdown">
                            <div className="total-row">
                                <span>Items Total</span>
                                <span>₹{itemTotal.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Taxes and Other Charges</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Delivery Charge</span>
                                <span>₹{deliveryCharge.toFixed(2)}</span>
                            </div>
                            <div className="total-row total-grand">
                                <span><strong>Grand Total</strong></span>
                                <span><strong>₹{grandTotal.toFixed(2)}</strong></span>
                            </div>
                        </div>

                    </div>

                    <button
                        className="place-order-btn"
                        onClick={handleStripePayment}
                        disabled={loading}
                    >
                        {loading ? 'Redirecting...' : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinalCheckoutPage;
//i think that's all