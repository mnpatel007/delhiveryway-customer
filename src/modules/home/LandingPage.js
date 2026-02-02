import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopBannerAd from '../components/TopBannerAd';
import SidebarAd from '../components/SidebarAd';
import SponsoredSection from '../components/SponsoredSection';
import HungryCTA from '../components/HungryCTA';
import Logo from '../components/Logo';
import Footer from '../core/Footer';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Scroll lock removed

    const handleShopClick = (shopId) => {
        if (shopId.startsWith('s')) {
            // For sponsored skeletons, just go to home
            navigate(`/?highlight=${shopId}`);
        } else {
            navigate(`/shop/${shopId}`);
        }
    };

    return (
        <div className="landing-layout">
            {/* 1. Navbar (Custom for Welcome Page) */}
            <header className="landing-header">
                <div className="header-container">

                    {/* Item 1: Logo */}
                    <div className="header-logo" onClick={() => navigate('/')}>
                        <Logo size="medium" showText={true} />
                    </div>

                    {/* Item 3: Shop List Button */}
                    <button className="btn-extraordinary" onClick={() => navigate('/')}>
                        Shop with DelhiveryWay
                    </button>

                    {/* Search Bar Removed as per request */}

                    {/* Item 4: Cart */}
                    <button className="nav-icon-btn" onClick={() => navigate('/cart')} title="Cart">
                        🛒
                    </button>

                    {/* Item 5: User Settings */}
                    <div className="user-settings-module">
                        {user ? (
                            <div className="user-dropdown">
                                <button className="nav-icon-btn profile-btn" style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    👤 {user.name}
                                </button>
                                <div className="dropdown-menu">
                                    <div className="user-info-sm">
                                        <strong>{user.name}</strong>
                                        <span>{user.email}</span>
                                    </div>
                                    <button onClick={() => navigate('/orders')}>Order History</button>
                                    <button onClick={() => navigate('/contact')}>Contact Us</button>
                                    <button onClick={logout} style={{ color: 'red' }}>Logout</button>
                                </div>
                            </div>
                        ) : (
                            <div className="auth-links">
                                <button onClick={() => navigate('/login')} className="btn-text">Login</button>
                                <button onClick={() => navigate('/signup')} className="btn-primary-sm">Sign Up</button>
                            </div>
                        )}
                    </div>

                </div>
            </header>

            <div className="landing-container">
                {/* 2. Top Banner Ad */}
                <TopBannerAd />

                <div className="landing-grid">
                    {/* Main Content Area */}
                    <div className="landing-main">

                        {/* 9. Featured Restaurants */}
                        <SponsoredSection onShopClick={handleShopClick} />

                        {/* 10. Hungry CTA */}
                        <HungryCTA onClick={() => navigate('/')} />

                    </div>

                    {/* 7. Sidebar Ad */}
                    <div className="landing-sidebar">
                        <SidebarAd />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default LandingPage;
