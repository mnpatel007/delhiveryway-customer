import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const CheckoutPage = () => {
    const { user } = useContext(AuthContext);
    const { cart, clearCart, setCart } = useContext(CartContext);
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

    const handlePlaceOrder = async () => {
        if (!address.trim()) {
            alert("Please enter a delivery address.");
            return;
        }

        const items = selectedItems.map(item => ({
            productId: item.product._id,
            quantity: item.quantity
        }));

        try {
            setLoading(true);
            await axios.post('http://localhost:5000/api/orders', {
                items,
                address
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            const remaining = cart.filter(
                cartItem => !selectedItems.some(si => si.product._id === cartItem.product._id)
            );
            setCart(remaining);
            localStorage.setItem('cart', JSON.stringify(remaining));

            navigate('/order-success');
        } catch (err) {
            console.error('Order failed:', err);
            alert("Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Checkout</h2>

            <p><strong>Name:</strong> {user.user.name}</p>
            <p><strong>Email:</strong> {user.user.email}</p>

            <label>
                <strong>Delivery Address:</strong><br />
                <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={3}
                    style={{ width: '100%', maxWidth: '400px' }}
                />
            </label>

            <h3>Order Summary</h3>
            <p><strong>Items Total:</strong> ₹{total.toFixed(2)}</p>
            <p><strong>GST (5%):</strong> ₹{tax.toFixed(2)}</p>
            <p><strong>Delivery Charge:</strong> ₹{deliveryCharge.toFixed(2)}</p>
            <p><strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}</p>

            <button onClick={handlePlaceOrder} disabled={loading}>
                {loading ? 'Placing Order...' : 'Place Order'}
            </button>
        </div>
    );
};

export default CheckoutPage;
