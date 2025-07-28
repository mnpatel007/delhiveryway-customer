import React, { useEffect, useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import CheckoutPage from './pages/FinalCheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import RehearsalCheckoutPage from './pages/RehearsalCheckoutPage';
import AwaitingVendorReviewPage from './pages/AwaitingVendorReviewPage';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';


// Connect Socket.IO globally
const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');

// Private route
const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

// Global customer alert: order cancelled
const GlobalCustomerAlert = () => {
  const { user } = useContext(AuthContext);
  const [cancelAlert, setCancelAlert] = useState(null);

  useEffect(() => {
    if (user?.user?._id) {
      console.log(`🔌 Registering customer ${user.user._id} with socket`);
      socket.emit('registerCustomer', user.user._id);
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Socket connection status
    socket.on('connect', () => {
      console.log('🔌 Customer socket connected');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Customer socket disconnected');
    });

    socket.on('orderCancelled', (data) => {
      setCancelAlert(data);
    });

    socket.on('vendorConfirmedOrder', (data) => {
      // Store the final version for /final-checkout
      localStorage.setItem('finalCheckoutOrder', JSON.stringify(data));
      window.location.href = '/final-checkout';
    });

    // Handle OTP notifications for delivery
    socket.on('orderStatusUpdate', (data) => {
      console.log('🔔 Customer received order status update:', data);

      // Show OTP notification if order is picked up
      if (data.status === 'picked_up' && data.deliveryOTP) {
        console.log(`🔐 Received OTP: ${data.deliveryOTP} for order ${data.orderId}`);

        // Show a prominent notification with the OTP
        const otpMessage = `🚚 Your order has been picked up!\n\n🔐 Your delivery OTP is: ${data.deliveryOTP}\n\nPlease share this OTP with the delivery person when they arrive.`;

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('Order Picked Up - OTP Required', {
            body: `Your delivery OTP is: ${data.deliveryOTP}`,
            icon: '/favicon.ico',
            tag: 'delivery-otp'
          });
        }

        // Show alert as fallback
        alert(otpMessage);
      }
    });

    return () => {
      socket.off('orderCancelled');
      socket.off('vendorConfirmedOrder');
      socket.off('orderStatusUpdate');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [user]);

  if (!cancelAlert) return null;

  return (
    <div style={{
      backgroundColor: '#ffe6e6',
      color: '#990000',
      padding: '15px',
      textAlign: 'center',
      fontWeight: 'bold',
      borderBottom: '1px solid #cc0000'
    }}>
      ❌ Your order was cancelled.<br />
      💬 Reason: {cancelAlert.reason}<br />
      💸 A refund has been initiated and will reflect in your bank account in 3–5 business days.
      <button onClick={() => setCancelAlert(null)} style={{
        marginLeft: '20px',
        background: 'none',
        border: 'none',
        color: '#990000',
        fontWeight: 'bold',
        fontSize: '16px',
        cursor: 'pointer'
      }}>✖</button>
    </div>
  );
};

// Hide navbar on login/signup
const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/signup'];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      {children}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <GlobalCustomerAlert />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/shop/:id" element={<PrivateRoute><ShopPage /></PrivateRoute>} />
              <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
              <Route path="/order-success" element={<PrivateRoute><OrderSuccessPage /></PrivateRoute>} />
              <Route path="/final-checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute><OrderHistoryPage /></PrivateRoute>} />
              <Route path="/rehearsal-checkout" element={<PrivateRoute><RehearsalCheckoutPage /></PrivateRoute>} />
              <Route path="/awaiting-vendor-review" element={<PrivateRoute><AwaitingVendorReviewPage /></PrivateRoute>} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
