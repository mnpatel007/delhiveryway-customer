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
        { id: 'quantum', name: 'Quantum Logistics', img: '/assets/sponsor-quantum.png', position: 'top-left' },
        { id: 'aero', name: 'Aero-Shop', img: '/assets/sponsor-aero.png', position: 'top-right' },
        { id: 'nexus', name: 'Nexus Retail', img: '/assets/sponsor-nexus.png', position: 'bottom-left' },
        { id: 'eco', name: 'Eco-Motion', img: '/assets/sponsor-quantum.png', position: 'bottom-right', className: 'hue-rotate-filter' }
    ];

    const stories = [
        {
            id: 1,
            label: 'DIRECT PICKUP',
            text: 'We collect directly from localized partners.',
            img: '/assets/story-pickup-v2.png'
        },
        {
            id: 2,
            label: 'SWIFT TRANSIT',
            text: 'Hyper-local fleet guarantees speed.',
            img: '/assets/story-scooter.png'
        },
        {
            id: 3,
            label: 'DOORSTEP DELIGHT',
            text: 'Verified safe delivery to your home.',
            img: '/assets/story-customer.png'
        }
    ];

    const bgStyle = {
        transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -30}px) scale(1.1)`
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

            {/* Labels */}
            <h2 className="sponsor-label label-left">PROUD<br />SPONSORS</h2>
            <h2 className="sponsor-label label-right">PROUD<br />SPONSORS</h2>

            {/* Main Centerpiece (Scrollable container if needed on small screens) */}
            <main className="omni-main">
                <div className="center-stack" style={text3DStyle}>

                    {/* 1. Title */}
                    <h1 className="mega-brand" data-text="DELHIVERYWAY">DELHIVERYWAY</h1>
                    <div className="brand-subtitle">HYPER-LOCAL • HYPER-FAST • AUTHENTIC</div>

                    {/* 2. Story Deck (Above Button) */}
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

                    {/* 3. The Big Vibrant Button */}
                    <div className="enter-btn-wrapper" onClick={() => navigate('/')}>
                        <button className="vibrant-enter-btn">
                            ENTER THE FUTURE
                            <div className="btn-glow"></div>
                        </button>
                    </div>

                </div>
            </main>

            {/* 4 Corner Sponsors (Fixed Absolute) */}
            <div className="corner-sponsors">
                {sponsors.map((sponsor) => (
                    <div key={sponsor.id} className={`floating-orb ${sponsor.position}`}>
                        <div className="orb-glass-circle">
                            <img
                                src={sponsor.img}
                                alt={sponsor.name}
                                className={`orb-img ${sponsor.className || ''}`}
                            />
                        </div>
                        <div className="orb-tooltip-fixed">
                            <h4>{sponsor.name}</h4>
                        </div>
                    </div>
                ))}
            </div>

            <div className="vignette-overlay"></div>
        </div>
    );
};

export default LandingPage;
