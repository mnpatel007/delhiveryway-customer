import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [hoveredCard, setHoveredCard] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const sponsors = [
        {
            id: 'gold',
            tier: 'Gold Member',
            name: 'Quantum Logistics',
            perk: 'Priority Shipping',
            description: 'Complimentary express upgrade on all domestic orders.',
            style: 'card-gold'
        },
        {
            id: 'platinum',
            tier: 'Platinum Access',
            name: 'Aero-Shop',
            perk: 'Drone Delivery',
            description: 'Unlocks autonomous aerial delivery options in select cities.',
            style: 'card-platinum'
        },
        {
            id: 'black',
            tier: 'Centurion',
            name: 'Nexus Retail',
            perk: 'Concierge Service',
            description: '24/7 dedicated support team for all your shopping needs.',
            style: 'card-black'
        }
    ];

    return (
        <div className="luxury-container">
            {/* Minimal Header */}
            <header className="luxury-header">
                <div className="user-profile">
                    <div className="avatar-circle">
                        {user?.name?.charAt(0).toUpperCase() || 'M'}
                    </div>
                </div>
                <button className="logout-text-btn" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            {/* Hero Section */}
            <main className="luxury-content">
                <h1 className="hero-heading">
                    The Art of <br />
                    <span className="gold-text">Delivery.</span>
                </h1>
                <p className="hero-subtext">
                    Experience a seamless connection between luxury retail and world-class logistics.
                </p>

                <button className="cta-button" onClick={() => navigate('/')}>
                    Go to Dashboard
                </button>

                {/* Sponsor / Member Perks Section */}
                <div className="perks-section">
                    <p className="section-label">EXCLUSIVE MEMBER PRIVILEGES</p>
                    <div className="cards-grid">
                        {sponsors.map((sponsor) => (
                            <div
                                key={sponsor.id}
                                className={`member-card ${sponsor.style} ${hoveredCard === sponsor.id ? 'active' : ''}`}
                                onMouseEnter={() => setHoveredCard(sponsor.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <div className="card-chip"></div>
                                <div className="card-content">
                                    <span className="card-tier">{sponsor.tier}</span>
                                    <h3 className="card-partner">{sponsor.name}</h3>
                                    <div className="card-perk">
                                        <span className="perk-title">{sponsor.perk}</span>
                                        <p className="perk-desc">{sponsor.description}</p>
                                    </div>
                                </div>
                                <div className="card-logo-watermark">DW</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LandingPage;
