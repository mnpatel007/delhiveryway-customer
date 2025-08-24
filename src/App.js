import React, { useEffect, useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { clearProblematicStorage } from './utils/clearStorage';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider, useSocket } from './context/SocketContext';

import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import NotificationCenter from './components/NotificationCenter';

import SocketDebugPanel from './components/SocketDebugPanel';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import CheckoutPage from './pages/FinalCheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import RevisedOrderPage from './pages/RevisedOrderPage';
import OrderHistoryPage from './pages/OrderHistoryPage';

import VerifyEmail from './pages/VerifyEmail';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';


// Private route
const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

// Global customer alert: order cancelled
const GlobalCustomerAlert = () => {
  const { notifications } = useSocket();
  const [cancelAlert, setCancelAlert] = useState(null);

  // Listen for order cancellation notifications
  useEffect(() => {
    const cancelNotification = notifications.find(notif =>
      notif.type === 'status_update' &&
      notif.data?.status === 'cancelled'
    );

    if (cancelNotification && !cancelAlert) {
      setCancelAlert(cancelNotification.data);
    }
  }, [notifications, cancelAlert]);

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
      💬 Reason: {cancelAlert.reason || 'No reason provided'}<br />
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
      {!shouldHideNavbar && <NotificationCenter />}
      <SocketDebugPanel />
      {children}
    </>
  );
};

// App content wrapper to use socket inside provider
const AppContent = () => {
  return (
    <>
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
            <Route path="/order-confirmation" element={<PrivateRoute><OrderConfirmationPage /></PrivateRoute>} />
            <Route path="/order-confirmation/:orderId" element={<PrivateRoute><OrderConfirmationPage /></PrivateRoute>} />
            <Route path="/revised-order/:orderId" element={<PrivateRoute><RevisedOrderPage /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><OrderHistoryPage /></PrivateRoute>} />

            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
};

function App() {
  // Clean storage on app start
  useEffect(() => {
    clearProblematicStorage();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
