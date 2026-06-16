import React, { useContext, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const SvgIcon = ({ children, size = 20, style }) => (
  <svg
    viewBox="0 0 24 24"
    style={{
      width: size,
      height: size,
      stroke: 'currentColor',
      fill: 'none',
      strokeWidth: 1.9,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...style,
    }}
  >
    {children}
  </svg>
);
const ic = {
  cart: (
    <>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.4 12.4a1.5 1.5 0 001.5 1.2h8.7a1.5 1.5 0 001.5-1.2L22 7H6" />
    </>
  ),
  bag: (
    <>
      <path d="M6 7h12l1 13H5L6 7z" />
      <path d="M9 7a3 3 0 016 0" />
    </>
  ),
  store: (
    <>
      <path d="M3 7h18l-1.4 4.2a3 3 0 01-5.7 0 3 3 0 01-5.8 0 3 3 0 01-5.7 0L3 7z" />
      <path d="M5 12v8h14v-8" />
    </>
  ),
  box: (
    <>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M6 7l1 13h10l1-13" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
};

// Format price with Indian Rupee symbol and proper formatting
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const CartPage = () => {
  const {
    cartItems,
    selectedShop,
    removeFromCart,
    updateQuantity,
    getOrderSummary,
    clearCart,
    deliveryCalculationDetails,
  } = useCart();
  const [toast, setToast] = useState('');
  const [removingItem, setRemovingItem] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    updateQuantity(productId, quantity);
    showToast('Quantity updated');
  };

  const handleRemoveItem = async (productId) => {
    const item = cartItems.find((item) => item._id === productId);
    if (!item) return;

    setRemovingItem(productId);
    showToast(`Removing ${item.name}...`);

    await new Promise((resolve) => setTimeout(resolve, 300));

    removeFromCart(productId);
    setRemovingItem(null);
    showToast(`${item.name} removed from cart`);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showToast('Your cart is empty');
      return;
    }

    // Navigate to checkout
    navigate('/final-checkout');
  };

  const orderSummary = getOrderSummary();

  return (
    <div className="cart-page-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification">
          <div className="toast-content">
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* Cart Header */}
      <div className="cart-header">
        <div className="cart-header-content">
          <div className="cart-title-section">
            <h1 className="cart-title">
              <span className="cart-icon">
                <SvgIcon size={26}>{ic.cart}</SvgIcon>
              </span>
              Shopping cart
            </h1>
            <p className="cart-subtitle">
              {cartItems.length === 0
                ? 'Your cart is empty'
                : `${orderSummary.itemCount} items${selectedShop ? ` from ${selectedShop.name}` : ''}`}
            </p>
          </div>

          {cartItems.length > 0 && (
            <div className="cart-summary">
              <div className="summary-item">
                <span>Items:</span>
                <span>{orderSummary.itemCount}</span>
              </div>
              <div className="summary-item total">
                <span>Total:</span>
                <span>₹{orderSummary.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cart Content */}
      <div className="cart-content">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <SvgIcon size={46}>{ic.cart}</SvgIcon>
            </div>
            <h2>Your cart is empty</h2>
            <p>Start shopping to add items to your cart</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              <SvgIcon size={18} style={{ stroke: '#fff' }}>
                {ic.bag}
              </SvgIcon>
              Start shopping
            </button>
          </div>
        ) : (
          <>
            {/* Shop Section */}
            {selectedShop && (
              <div className="shop-section">
                <div className="shop-header-info">
                  <div className="shop-avatar">
                    <SvgIcon size={26} style={{ stroke: '#fff' }}>
                      {ic.store}
                    </SvgIcon>
                  </div>
                  <div className="shop-details">
                    <h3>{selectedShop.name}</h3>
                    <p>
                      {cartItems.length} item{cartItems.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="shop-total">
                    <span>{formatPrice(orderSummary.subtotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="cart-items">
              {cartItems.map((item) => {
                const isRemoving = removingItem === item._id;
                const itemTotal = (item.price || 0) * (item.quantity || 1);

                return (
                  <div key={item._id} className={`cart-item ${isRemoving ? 'removing' : ''}`}>
                    <div className="item-image">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="item-placeholder"
                        style={{ display: item.images && item.images.length > 0 ? 'none' : 'flex' }}
                      >
                        <SvgIcon size={30} style={{ stroke: '#fff' }}>
                          {ic.box}
                        </SvgIcon>
                      </div>
                    </div>

                    <div className="item-details">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-description">
                        {item.description || 'No description available'}
                      </p>
                      <div className="item-price">{formatPrice(item.price || 0)} per unit</div>
                    </div>

                    <div className="item-controls">
                      <div className="quantity-controls">
                        <label>Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                          className="quantity-input"
                          disabled={isRemoving}
                        />
                      </div>

                      <div className="item-total">
                        <span>Total: {formatPrice(itemTotal)}</span>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="remove-btn"
                        disabled={isRemoving}
                      >
                        <SvgIcon size={16}>{ic.trash}</SvgIcon>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <h3>Order Summary</h3>

              <div className="summary-breakdown">
                <div className="summary-row">
                  <span>Subtotal ({orderSummary.itemCount} items)</span>
                  <span>{formatPrice(orderSummary.subtotal)}</span>
                </div>

                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>
                    {deliveryCalculationDetails?.originalDeliveryFee &&
                    deliveryCalculationDetails?.discountApplied ? (
                      <div
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
                      >
                        <span
                          style={{
                            textDecoration: 'line-through',
                            color: '#999',
                            fontSize: '0.9em',
                          }}
                        >
                          {formatPrice(deliveryCalculationDetails.originalDeliveryFee)}
                        </span>
                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                          {formatPrice(orderSummary.deliveryFee)}
                        </span>
                        <span style={{ fontSize: '0.75em', color: '#28a745' }}>
                          Saved {formatPrice(deliveryCalculationDetails.discountApplied.amount)}
                        </span>
                      </div>
                    ) : (
                      formatPrice(orderSummary.deliveryFee)
                    )}
                  </span>
                </div>

                {orderSummary.tax > 0 && (
                  <div className="summary-row">
                    <span>Tax ({selectedShop?.taxRate || 5}%)</span>
                    <span>{formatPrice(orderSummary.tax)}</span>
                  </div>
                )}

                {orderSummary.packagingCharges > 0 && (
                  <div className="summary-row">
                    <span>Packaging Charges</span>
                    <span>{formatPrice(orderSummary.packagingCharges)}</span>
                  </div>
                )}

                <div className="summary-divider"></div>

                <div className="summary-row total-row">
                  <span>Total Amount</span>
                  <span>{formatPrice(orderSummary.total)}</span>
                </div>
              </div>

              <div className="checkout-actions">
                <button onClick={() => clearCart()} className="btn btn-secondary">
                  Clear Cart
                </button>

                <button onClick={handleCheckout} className="btn btn-primary checkout-btn">
                  <SvgIcon size={18} style={{ stroke: '#fff' }}>
                    {ic.card}
                  </SvgIcon>
                  Proceed to checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;
