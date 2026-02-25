import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { clearProblematicStorage } from './utils/clearStorage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { SearchProvider } from './context/SearchContext';

import ErrorBoundary from './modules/core/ErrorBoundary';
import Navbar from './modules/core/Navbar';
import NotificationCenter from './modules/core/NotificationCenter';
import NoticeAlert from './modules/core/NoticeAlert';
import TermsModal from './modules/core/TermsModal';

import SocketDebugPanel from './modules/core/SocketDebugPanel';
import HomePage from './modules/home/HomePage';
import LoginPage from './modules/auth/LoginPage';
import SignupPage from './modules/auth/SignupPage';
import ShopPage from './modules/shop/ShopPage';
import SearchPage from './modules/home/SearchPage';
import CartPage from './modules/cart/CartPage';
import OrderSuccessPage from './modules/cart/OrderSuccessPage';
import CheckoutPage from './modules/cart/FinalCheckoutPage';
import OrderConfirmationPage from './modules/orders/OrderConfirmationPage';
import RevisedOrderPage from './modules/orders/RevisedOrderPage';
import OrderHistoryPage from './modules/orders/OrderHistoryPage';
import CustomerSocketHandler from './modules/orders/CustomerSocketHandler';
import CommunityPage from './modules/user/CommunityPage';
import ProfilePage from './modules/user/ProfilePage';

import VerifyEmail from './modules/auth/VerifyEmail';
import ForgotPasswordPage from './modules/auth/ForgotPasswordPage';
import ResetPasswordPage from './modules/auth/ResetPasswordPage';
import MidnightLogoutHandler from './modules/auth/MidnightLogoutHandler';


// Private route
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
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
      <MidnightLogoutHandler />
      {!shouldHideNavbar && <Navbar />}
      {!shouldHideNavbar && <NotificationCenter />}
      {!shouldHideNavbar && <NoticeAlert />}
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
          <TermsModal />
          <Routes>
            <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
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
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/community" element={<CommunityPage />} />

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
            <SearchProvider>
              <AppContent />
            </SearchProvider>
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;