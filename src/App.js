import React, { useEffect, useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { AuthProvider, AuthContext } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Navbar from './components/Navbar';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import { CartProvider } from './context/CartContext';
import OrderSuccessPage from './pages/OrderSuccessPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';

const socket = io('https://delhiveryway-backend-1.onrender.com');

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const hideNavbarPaths = ['/login', '/signup'];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  const [cancelAlert, setCancelAlert] = useState(null);

  useEffect(() => {
    if (user && user.user && user.user._id) {
      socket.emit('registerCustomer', user.user._id);
    }

    socket.on('orderCancelled', (data) => {
      setCancelAlert(data);
    });

    return () => {
      socket.off('orderCancelled');
    };
  }, [user]);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      {cancelAlert && (
        <div style={{
          backgroundColor: '#ffe6e6',
          color: '#990000',
          padding: '15px',
          margin: '10px',
          borderRadius: '8px',
          border: '1px solid #cc0000',
          fontWeight: 'bold'
        }}>
          ❌ Your order was cancelled.<br />
          💬 Reason: {cancelAlert.reason}<br />
          💸 A refund has been initiated and will reflect in your account in 3–5 business days.
          <button onClick={() => setCancelAlert(null)} style={{
            float: 'right',
            background: 'none',
            border: 'none',
            color: '#990000',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            ✖
          </button>
        </div>
      )}
      {children}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/shop/:id" element={<PrivateRoute><ShopPage /></PrivateRoute>} />
              <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
              <Route path="/order-success" element={<PrivateRoute><OrderSuccessPage /></PrivateRoute>} />
              <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute><OrderHistoryPage /></PrivateRoute>} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
