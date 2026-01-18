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
            desc: 'Hyperspeed Transport',
            position: 'top-left'
        },
        {
            id: 'aero',
            name: 'Aero-Shop',
            img: '/assets/sponsor-aero.png',
            desc: 'Aerial Autonomous',
            position: 'top-right'
        },
        {
            id: 'nexus',
            name: 'Nexus Retail',
            img: '/assets/sponsor-nexus.png',
            desc: 'Global Marketplace',
            position: 'bottom-left'
        },
        {
            id: 'eco',
            name: 'Eco-Motion',
            img: '/assets/sponsor-quantum.png', // Reusing with hue-rotate
            desc: 'Sustainable Energy',
            position: 'bottom-right',
            className: 'hue-rotate-filter'
        }
    ];

    const bgStyle = {
        transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -30}px) scale(1.1)`
    };

    const text3DStyle = {
        transform: `rotateY(${mousePosition.x * 10}deg) rotateX(${mousePosition.y * -10}deg)`
    };

    return (
        <div className="omni-container" ref={containerRef}>
            <div className="omni-bg" style={bgStyle}></div>
            <div className="omni-overlay"></div>

            {/* Header (Avatar Only) */}
            <div className="corner-user-profile" onClick={handleLogout}>
                <div className="user-avatar-glitch" data-initial={user?.name?.charAt(0) || 'U'}></div>
                <span className="logout-tooltip">LOGOUT</span>
            </div>

            {/* Main Centerpiece */}
            <main className="omni-main">
                <div className="brand-assembly" style={text3DStyle} onClick={() => navigate('/')}>
                    <h1 className="mega-brand" data-text="DELHIVERYWAY">DELHIVERYWAY</h1>
                    <div className="brand-subtitle">ENTER THE FUTURE OF LOGISTICS</div>
                    <div className="click-indicator">CLICK TO ENTER</div>
                </div>
            </main>

            {/* 4 Corner Sponsors */}
            <div className="corner-sponsors">
                {sponsors.map((sponsor) => (
                    <div key={sponsor.id} className={`floating-orb ${sponsor.position}`}>
                        <div className="orb-glass-circle">
                            <img
                                src={sponsor.img}
                                alt={sponsor.name}
                                className={`orb-img ${sponsor.className || ''}`}
                            />
                            <div className="orb-shine"></div>
                        </div>
                        <div className="orb-tooltip">
                            <h4>{sponsor.name}</h4>
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
