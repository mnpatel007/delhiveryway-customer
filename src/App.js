import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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




const PrivateRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
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
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
