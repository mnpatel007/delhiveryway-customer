import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Ico = ({ d, ...p }) => (
  <svg viewBox="0 0 24 24" className="nv-ic" {...p}>
    {d}
  </svg>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [q, setQ] = useState(queryParam);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setQ(queryParam);
  }, [queryParam]);

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleSearchChange = (val) => {
    setQ(val);
    const trimmed = val.trim();
    const isSearchPage = location.pathname === '/search';
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: isSearchPage });
    } else {
      if (isSearchPage) {
        navigate('/', { replace: true });
      }
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const toggleMenu = () => {
    const next = !isMenuOpen;
    setIsMenuOpen(next);
    window.dispatchEvent(new CustomEvent('mobileMenuToggle', { detail: { isOpen: next } }));
  };

  return (
    <header className="nv-header">
      <div className="nv-bar">
        <Link to="/" className="nv-logo">
          <span className="nv-logo-dot">
            <Ico
              d={
                <>
                  <path d="M3 7l9-4 9 4-9 4-9-4z" />
                  <path d="M3 7v10l9 4 9-4V7" />
                </>
              }
            />
          </span>
          Delhivery<b>Way</b>
        </Link>

        <button
          className="nv-addr"
          onClick={() => navigate('/profile')}
          title="Manage delivery address"
        >
          <Ico
            className="nv-ic nv-pin"
            d={
              <>
                <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </>
            }
          />
          <span className="nv-addr-txt">
            <span className="nv-addr-lbl">Deliver to</span>
            <span className="nv-addr-val">
              {user?.name ? `${user.name.split(' ')[0]}'s location` : 'Set your location'}
              <Ico className="nv-ic nv-chev" d={<path d="M6 9l6 6 6-6" />} />
            </span>
          </span>
        </button>

        <form className="nv-search" onSubmit={submitSearch}>
          <Ico
            d={
              <>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </>
            }
          />
          <input
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search 'biryani', 'fresh milk', 'paracetamol'…"
            aria-label="Search"
          />
        </form>

        <Link to="/orders" className="nv-btn" aria-label="Orders" title="Orders">
          <Ico
            d={
              <>
                <path d="M3 7l9-4 9 4-9 4-9-4z" />
                <path d="M3 7v10l9 4 9-4V7" />
                <path d="M12 11v10" />
              </>
            }
          />
        </Link>

        <Link to="/cart" className="nv-btn" aria-label="Cart" title="Cart">
          <Ico
            d={
              <>
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M2 3h3l2.4 12.4a1.5 1.5 0 001.5 1.2h8.7a1.5 1.5 0 001.5-1.2L22 7H6" />
              </>
            }
          />
          {cartItemCount > 0 && <span className="nv-badge">{cartItemCount}</span>}
        </Link>

        {user ? (
          <div className="nv-user">
            <Link to="/profile" className="nv-avatar" title={user.name}>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </Link>
            <button onClick={handleLogout} className="nv-logout">
              Logout
            </button>
          </div>
        ) : (
          <div className="nv-auth">
            <Link to="/login" className="nv-login">
              Login
            </Link>
            <Link to="/signup" className="nv-signup">
              Sign up
            </Link>
          </div>
        )}

        <button className="nv-hamburger" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={isMenuOpen ? 'open' : ''}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      <div className={`nv-mobile ${isMenuOpen ? 'open' : ''}`}>
        <form
          className="nv-search nv-search-m"
          onSubmit={(e) => {
            submitSearch(e);
            setIsMenuOpen(false);
          }}
        >
          <Ico
            d={
              <>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </>
            }
          />
          <input
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search dishes, shops…"
            aria-label="Search"
          />
        </form>
        <Link
          to="/"
          className={`nv-mlink ${isActive('/') ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Home
        </Link>
        {user && (
          <Link
            to="/orders"
            className={`nv-mlink ${isActive('/orders') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Orders
          </Link>
        )}
        {user && (
          <Link
            to="/cart"
            className={`nv-mlink ${isActive('/cart') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Cart{' '}
            {cartItemCount > 0 && <span className="nv-badge nv-badge-inline">{cartItemCount}</span>}
          </Link>
        )}
        <Link
          to="/community"
          className={`nv-mlink ${isActive('/community') ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Community
        </Link>
        {user ? (
          <>
            <Link to="/profile" className="nv-mlink" onClick={() => setIsMenuOpen(false)}>
              My profile
            </Link>
            <button onClick={handleLogout} className="nv-mlogout">
              Logout
            </button>
          </>
        ) : (
          <div className="nv-mauth">
            <Link to="/login" className="nv-login" onClick={() => setIsMenuOpen(false)}>
              Login
            </Link>
            <Link to="/signup" className="nv-signup" onClick={() => setIsMenuOpen(false)}>
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
