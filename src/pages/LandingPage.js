import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [activeSponsor, setActiveSponsor] = useState(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX - innerWidth / 2) / 25; // Sensitivity
            const y = (e.clientY - innerHeight / 2) / 25;
            setMousePosition({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSponsorClick = (id) => {
        setActiveSponsor(id === activeSponsor ? null : id);
    };

    const sponsors = [
        {
            id: 1,
            name: 'Quantum Logistics',
            role: 'SPEED BOOSTER',
            perk: 'FREE EXPRESS UPGRADE',
            desc: 'Activate for hyper-speed processing on your next order.',
            color: '#00f2ff',
            icon: '⚡'
        },
        {
            id: 2,
            name: 'Aero-Shop',
            role: 'SKYNET PARTNER',
            perk: '15% DRONE DISCOUNT',
            desc: 'Unlock exclusive aerial delivery rates today.',
            color: '#bc13fe',
            icon: '🛸'
        },
        {
            id: 3,
            name: 'Nexus Retail',
            role: 'GLOBAL LINK',
            perk: 'VIP ACCESS PASS',
            desc: 'Early access to international flash sales.',
            color: '#01ff89',
            icon: '🌐'
        }
    ];

    return (
        <div className="gateway-container" ref={containerRef}>
            {/* Holographic Grid Background */}
            <div className="holo-grid-plane top"></div>
            <div className="holo-grid-plane bottom"></div>

            {/* Particles */}
            <div className="particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className={`particle p${i}`}></div>
                ))}
            </div>

            <div
                className="gateway-content"
                style={{
                    transform: `rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`
                }}
            >
                {/* HUD Header */}
                <div className="hud-header">
                    <div className="hud-corner-tl"></div>
                    <div className="hud-corner-tr"></div>
                    <div className="brand-scanner">
                        <div className="scan-line"></div>
                        <span>SYSTEM: ONLINE</span>
                        <span>USER: AUTHENTICATED</span>
                    </div>
                    <h1>DELHIVERY<span className="hightlight">WAY</span></h1>
                    <div className="sub-branding">ADVANCED LOGISTICS PROTOCOL</div>
                </div>

                {/* Main Deck */}
                <div className="deck-layout">
                    {/* Left Panel: Portal */}
                    <div className="portal-panel">
                        <div className="portal-ring-outer"></div>
                        <div className="portal-ring-inner"></div>
                        <div className="portal-core">
                            <button className="hyper-jump-btn" onClick={() => navigate('/')}>
                                <span className="btn-glitch-text" data-text="INITIATE JUMP">INITIATE JUMP</span>
                            </button>
                        </div>
                        <div className="portal-status">
                            <span>DESTINATION: MAIN HUB</span>
                            <span>LATENCY: 0.1ms</span>
                        </div>
                    </div>

                    {/* Right Panel: Sponsor Modules */}
                    <div className="modules-panel">
                        <h2 className="modules-title">ACTIVE POWER-UPS <span className="blink">_</span></h2>
                        <div className="modules-grid">
                            {sponsors.map(sponsor => (
                                <div
                                    key={sponsor.id}
                                    className={`module-card ${activeSponsor === sponsor.id ? 'active' : ''}`}
                                    onClick={() => handleSponsorClick(sponsor.id)}
                                    style={{ '--accent': sponsor.color }}
                                >
                                    <div className="module-header">
                                        <span className="module-icon">{sponsor.icon}</span>
                                        <div className="module-id">
                                            <span className="name">{sponsor.name}</span>
                                            <span className="role">{sponsor.role}</span>
                                        </div>
                                        <div className="status-light"></div>
                                    </div>
                                    <div className="module-body">
                                        <div className="perk-box">
                                            <span className="perk-label">REWARD DETECTED</span>
                                            <span className="perk-value">{sponsor.perk}</span>
                                        </div>
                                        <p className="perk-desc">{sponsor.desc}</p>
                                        <div className="activate-btn">
                                            {activeSponsor === sponsor.id ? '>> PERK ACTIVE <<' : 'CLICK TO ACTIVATE'}
                                        </div>
                                    </div>
                                    <div className="scan-overlay"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* HUD Footer */}
                <div className="hud-footer">
                    <div className="data-stream">
                        <span>LIVE TRAFFIC: 14,203 PACKETS</span> | <span>SECTOR 7: OPTIMAL</span> | <span>DRONE FLEET: AIRBORNE</span>
                    </div>
                    <div className="hud-corner-bl"></div>
                    <div className="hud-corner-br"></div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
