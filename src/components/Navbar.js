import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useSearch } from '../context/SearchContext';
import Logo from './Logo';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
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
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { indexLoaded, searchLocal } = useSearch();
    const inputRef = useRef(null);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const q = (searchTerm || '').trim();
        if (!q) return;
        navigate(`/search?q=${encodeURIComponent(q)}`);
        setSearchTerm('');
    };

    // Instant suggestions (local Fuse) with tiny debounce
    useEffect(() => {
        if (!searchTerm || searchTerm.trim().length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        let cancelled = false;
        const t = setTimeout(() => {
            if (indexLoaded) {
                const local = searchLocal(searchTerm, 6);
                if (cancelled) return;
                setSuggestions(local);
                setShowSuggestions(true);
            } else {
                // no local index yet - don't call server per keystroke
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 120);

        return () => { cancelled = true; clearTimeout(t); };
    }, [searchTerm, indexLoaded]);

    const handleSuggestionClick = (item) => {
        // navigate to shop page and highlight product
        if (item.shopId && item.shopId._id) {
            navigate(`/shop/${item.shopId._id}?highlight=${encodeURIComponent(item._id)}`);
        } else if (item.shopId && item.shopId) {
            navigate(`/shop/${item.shopId}?highlight=${encodeURIComponent(item._id)}`);
        } else {
            navigate(`/search?q=${encodeURIComponent(item.name)}`);
        }
        setSearchTerm('');
        setShowSuggestions(false);
    };

    const toggleMenu = () => {
        const newMenuState = !isMenuOpen;
        setIsMenuOpen(newMenuState);

        // Dispatch custom event for mobile menu state change
        window.dispatchEvent(new CustomEvent('mobileMenuToggle', {
            detail: { isOpen: newMenuState }
        }));
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <Logo size="large" showText={true} />
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-menu">
                    <form className="navbar-search" onSubmit={handleSearchSubmit}>
                        <input
                            type="search"
                            placeholder="Search for products or shops (e.g. 'dal tadka')"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            ref={inputRef}
                            aria-label="Search"
                        />
                        <button type="submit" className="btn btn-primary btn-sm">Search</button>
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="navbar-search-suggestions" role="listbox">
                                {suggestions.map(s => (
                                    <div key={s._id} role="option" tabIndex={0} className="suggestion-item" onClick={() => handleSuggestionClick(s)}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            {s.images?.[0] && <img src={s.images[0]} alt={s.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />}
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{s.name}</div>
                                                <div style={{ fontSize: 12, color: '#666' }}>{s.shopId?.name || ''} • ₹{s.price}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </form>
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
                        <>
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