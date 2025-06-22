import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
            {user ? (
                <>
                    <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
                    <Link to="/cart" style={{ marginRight: '1rem' }}>Cart</Link>
                    <Link to="/orders" style={{ marginRight: '1rem' }}>My Orders</Link>
                    <button onClick={handleLogout}>Logout</button>
                </>
            ) : (
                <>
                    <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
                    <Link to="/signup">Signup</Link>
                </>
            )}
        </nav>
    );
};

export default Navbar;
