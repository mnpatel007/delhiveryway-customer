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
        const handleMouseMove = (e) => {
            const { innerWidth, innerHeight } = window;
            // Calculate normalized coordinates (-1 to 1)
            const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
            const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
            setMousePosition({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const sponsors = [
        {
            id: 'quantum',
            name: 'Quantum Logistics',
            img: '/assets/sponsor-quantum.png',
            desc: 'Hyperspeed Transport Network'
        },
        {
            id: 'aero',
            name: 'Aero-Shop',
            img: '/assets/sponsor-aero.png',
            desc: 'Autonomous Aerial Delivery'
        },
        {
            id: 'nexus',
            name: 'Nexus Retail',
            img: '/assets/sponsor-nexus.png',
            desc: 'Global Digital Marketplace'
        }
    ];

    // Compute parallax styles based on mouse position
    const bgStyle = {
        transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px) scale(1.1)`
    };

    const portalStyle = {
        transform: `rotateY(${mousePosition.x * 20}deg) rotateX(${mousePosition.y * -20}deg)`
    };

    const contentStyle = {
        transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`
    };

    return (
        <div className="omni-container" ref={containerRef}>
            {/* Parallax Background */}
            <div className="omni-bg" style={bgStyle}></div>
            <div className="omni-overlay"></div>

            {/* Omni-Header */}
            <header className="omni-header">
                <div className="user-module">
                    <span className="user-id">CMD: {user?.name}</span>
                    <button className="logout-btn-glitch" onClick={handleLogout} data-text="DISCONNECT">
                        DISCONNECT
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="omni-main">

                {/* 3D Portal Ring */}
                <div className="portal-assembly" style={portalStyle}>
                    <div className="ring ring-1"></div>
                    <div className="ring ring-2"></div>
                    <div className="ring ring-3"></div>

                    {/* Central Interaction Point */}
                    <div className="portal-core" onClick={() => navigate('/')}>
                        <div className="core-energy"></div>
                        <span className="enter-text">ENTER UNIVERSE</span>
                    </div>
                </div>

                {/* Floating Sponsor Orbs */}
                <div className="sponsor-orbit" style={contentStyle}>
                    {sponsors.map((sponsor, index) => (
                        <div key={sponsor.id} className={`orb-container orb-${index}`}>
                            <div className="orb-visual">
                                <img src={sponsor.img} alt={sponsor.name} className="sponsor-img" />
                                <div className="orb-glow"></div>
                            </div>
                            <div className="orb-label">
                                <h3>{sponsor.name}</h3>
                                <p>{sponsor.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hud-overlay">
                    <div className="hud-corner top-left"></div>
                    <div className="hud-corner top-right"></div>
                    <div className="hud-corner bottom-left"></div>
                    <div className="hud-corner bottom-right"></div>
                    <div className="tracking-line"></div>
                </div>

            </main>
        </div>
    );
};

export default LandingPage;
