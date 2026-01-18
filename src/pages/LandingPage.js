import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const containerRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    useEffect(() => {
        // Lock scroll and set background only for Landing Page
        document.body.style.overflow = 'hidden';
        document.body.style.background = '#000';

        return () => {
            // Cleanup: Restore default styles when leaving
            document.body.style.overflow = 'auto';
            document.body.style.background = '';
        };
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
            const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
            setMousePosition({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const leftSponsors = [
        { id: 'quantum', name: 'Quantum Logistics', img: '/assets/sponsor-quantum.png', desc: 'Hyperspeed Transport' },
        { id: 'nexus', name: 'Nexus Retail', img: '/assets/sponsor-nexus.png', desc: 'Global Marketplace' }
    ];

    const rightSponsors = [
        { id: 'aero', name: 'Aero-Shop', img: '/assets/sponsor-aero.png', desc: 'Aerial Systems' },
        { id: 'eco', name: 'Eco-Motion', img: '/assets/sponsor-quantum.png', desc: 'Sustainable Power', className: 'hue-rotate-filter' }
    ];

    const stories = [
        { id: 1, label: 'DIRECT PICKUP', text: 'We collect directly from localized partners.', img: '/assets/story-pickup-v2.png' },
        { id: 2, label: 'SWIFT TRANSIT', text: 'Hyper-local fleet guarantees speed.', img: '/assets/story-scooter.png' },
        { id: 3, label: 'DOORSTEP DELIGHT', text: 'Verified safe delivery to your home.', img: '/assets/story-customer.png' }
    ];

    const bgStyle = {
        transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px) scale(1.1)`
    };

    const text3DStyle = {
        transform: `rotateY(${mousePosition.x * 5}deg) rotateX(${mousePosition.y * -5}deg)`
    };

    return (
        <div className="omni-container" ref={containerRef}>
            <div className="omni-bg" style={bgStyle}></div>
            <div className="omni-overlay"></div>

            {/* Header */}
            <header className="omni-header">
                <div className="user-module">
                    <span className="user-id">CMD: {user?.name}</span>
                    <button className="logout-btn-glitch" onClick={handleLogout} data-text="DISCONNECT">
                        DISCONNECT
                    </button>
                </div>
            </header>

            {/* LEFT PILLAR */}
            <div className="side-pillar left-pillar">
                <div className="pillar-header">PROUD SPONSORS</div>
                {leftSponsors.map((sponsor) => (
                    <div key={sponsor.id} className="sponsor-rect glass-panel">
                        <div className="rect-content">
                            <img src={sponsor.img} alt={sponsor.name} className={`rect-img ${sponsor.className || ''}`} />
                            <h3>{sponsor.name}</h3>
                            <p>{sponsor.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* CENTER STAGE */}
            <main className="omni-main-center">
                <div className="center-stack" style={text3DStyle}>
                    <h1 className="mega-brand" data-text="DELHIVERYWAY">DELHIVERYWAY</h1>
                    <div className="brand-subtitle">HYPER-LOCAL • HYPER-FAST • AUTHENTIC</div>

                    <div className="story-deck-inline">
                        {stories.map((story) => (
                            <div key={story.id} className="story-card">
                                <div className="story-img-frame">
                                    <img src={story.img} alt={story.label} />
                                </div>
                                <div className="story-content">
                                    <h3>{story.label}</h3>
                                    <p>{story.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="enter-btn-wrapper" onClick={() => navigate('/')}>
                        <button className="vibrant-enter-btn">
                            ENTER THE FUTURE
                            <div className="btn-glow"></div>
                        </button>
                    </div>
                </div>
            </main>

            {/* RIGHT PILLAR */}
            <div className="side-pillar right-pillar">
                <div className="pillar-header">PROUD SPONSORS</div>
                {rightSponsors.map((sponsor) => (
                    <div key={sponsor.id} className="sponsor-rect glass-panel">
                        <div className="rect-content">
                            <img src={sponsor.img} alt={sponsor.name} className={`rect-img ${sponsor.className || ''}`} />
                            <h3>{sponsor.name}</h3>
                            <p>{sponsor.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="vignette-overlay"></div>
        </div>
    );
};

export default LandingPage;
