import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">🚚</div>
                    <span className="logo-text">DelhiveryWay</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-menu">
                    <Link
                        to="/"
                        className={`navbar-link ${isActive('/') ? 'active' : ''}`}
                    >
                        <span className="link-icon">🏠</span>
                        Home
                    </Link>

                    {user && (
                        <>
                            <Link
                                to="/orders"
                                className={`navbar-link ${isActive('/orders') ? 'active' : ''}`}
                            >
                                <span className="link-icon">📦</span>
                                Orders
                            </Link>

                            <Link
                                to="/cart"
                                className={`navbar-link cart-link ${isActive('/cart') ? 'active' : ''}`}
                            >
                                <span className="link-icon">🛒</span>
                                Cart
                                {cartItemCount > 0 && (
                                    <span className="cart-badge">{cartItemCount}</span>
                                )}
                            </Link>
                        </>
                    )}

                    <Link
                        to="/contact"
                        className={`navbar-link ${isActive('/contact') ? 'active' : ''}`}
                    >
                        <span className="link-icon">📞</span>
                        Contact
                    </Link>
                </div>

                {/* User Menu */}
                <div className="navbar-user">
                    {user ? (
                        <div className="user-menu">
                            <div className="user-info">
                                <div className="user-avatar">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="user-details">
                                    <span className="user-name">{user.name}</span>
                                    <span className="user-email">{user.email}</span>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn btn-secondary btn-sm">
                                Login
                            </Link>
                            <Link to="/signup" className="btn btn-primary btn-sm">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="mobile-menu-btn"
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-content">
                    <Link
                        to="/"
                        className={`mobile-link ${isActive('/') ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <span className="link-icon">🏠</span>
                        Home
                    </Link>

                    {user && (
                        <>
                            <Link
                                to="/orders"
                                className={`mobile-link ${isActive('/orders') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span className="link-icon">📦</span>
                                Orders
                            </Link>

                            <Link
                                to="/cart"
                                className={`mobile-link ${isActive('/cart') ? 'active' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span className="link-icon">🛒</span>
                                Cart
                                {cartItemCount > 0 && (
                                    <span className="cart-badge">{cartItemCount}</span>
                                )}
                            </Link>
                        </>
                    )}

                    <Link
                        to="/contact"
                        className={`mobile-link ${isActive('/contact') ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <span className="link-icon">📞</span>
                        Contact
                    </Link>

                    {user ? (

                            <div className="mobile-user-info">
                                <div className="user-avatar">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="user-details">
                                    <span className="user-name">{user.name}</span>
                                    <span className="user-email">{user.email}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary mobile-logout-btn"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <div className="mobile-auth-buttons">
                            <Link
                                to="/login"
                                className="btn btn-secondary"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="btn btn-primary"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;