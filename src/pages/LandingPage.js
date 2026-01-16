import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 20 - 10,
                y: (e.clientY / window.innerHeight) * 20 - 10
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const sponsors = [
        { id: 1, name: 'Quantum Logistics', tagline: 'Future of Freight', color: '#00f2ff' },
        { id: 2, name: 'Aero-Shop', tagline: 'Sky-High Shopping', color: '#bc13fe' },
        { id: 3, name: 'Nexus Retail', tagline: 'Connecting Worlds', color: '#01ff89' }
    ];

    return (
        <div className="landing-container">
            {/* Dynamic Background */}
            <div className="landing-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="grid-overlay"></div>
            </div>

            <div className="landing-content" style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}>
                {/* Hero Section */}
                <div className="hero-section">
                    <div className="brand-pill">DelhiveryWay Exclusive</div>
                    <h1 className="hero-title">Experience the <span className="gradient-text">Future</span></h1>
                    <p className="hero-subtitle">
                        Smart Logistics. Seamless Shopping. Sustainable Tomorrow.
                    </p>

                    <button className="enter-portal-btn" onClick={() => navigate('/')}>
                        <span className="btn-text">ENTER PORTAL</span>
                        <div className="btn-glow"></div>
                    </button>

                    <div className="scroll-indicator">
                        <span>Explore Partners</span>
                        <div className="arrow-down"></div>
                    </div>
                </div>

                {/* Right Panel - Sponsor Spotlight (Desktop) / Bottom (Mobile) */}
                <div className="sponsor-section">
                    <h2 className="section-title">Premium Partners</h2>
                    <div className="sponsor-grid">
                        {sponsors.map(sponsor => (
                            <div key={sponsor.id} className="sponsor-card" style={{ '--accent-color': sponsor.color }}>
                                <div className="sponsor-icon-placeholder">
                                    <div className="inner-icon"></div>
                                </div>
                                <div className="sponsor-info">
                                    <h3>{sponsor.name}</h3>
                                    <p>{sponsor.tagline}</p>
                                </div>
                                <div className="shine-effect"></div>
                            </div>
                        ))}
                    </div>

                    <div className="about-preview">
                        <div className="stat-item">
                            <span className="stat-number">10k+</span>
                            <span className="stat-label">Happy Shoppers</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">99%</span>
                            <span className="stat-label">On-Time Delivery</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">24/7</span>
                            <span className="stat-label">AI Support</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
