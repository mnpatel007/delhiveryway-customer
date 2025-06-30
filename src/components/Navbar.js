import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMenuOpen(false);
    };

    const toggleMenu = () => setMenuOpen(prev => !prev);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="logo" aria-label="DelhiveryWay Homepage">
                    <span className="logo-glow">DelhiveryWay</span>
                </Link>

                <button
                    className={`menu-toggle ${menuOpen ? 'open' : ''}`}
                    onClick={toggleMenu}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                >
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </button>

                <ul className={`nav-links ${menuOpen ? 'show' : ''}`}>
                    {user ? (
                        <>
                            <li>
                                <NavLink to="/" exact="true" className="nav-item" activeclassname="active" onClick={() => setMenuOpen(false)}>
                                    Home
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/cart" className="nav-item" activeclassname="active" onClick={() => setMenuOpen(false)}>
                                    Cart
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/orders" className="nav-item" activeclassname="active" onClick={() => setMenuOpen(false)}>
                                    My Orders
                                </NavLink>
                            </li>
                            <li>
                                <button className="nav-logout-btn" onClick={handleLogout}>
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <NavLink to="/login" className="nav-item" activeclassname="active" onClick={() => setMenuOpen(false)}>
                                    Login
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/signup" className="nav-item" activeclassname="active" onClick={() => setMenuOpen(false)}>
                                    Signup
                                </NavLink>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;