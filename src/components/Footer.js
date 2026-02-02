import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-container">
            <div className="footer-content">
                {/* Promotional Banner */}
                <div className="footer-promo">
                    <div className="promo-content">
                        <h2 className="promo-title">
                            Experience the best of shopping with <span>DelhiveryWay</span>
                        </h2>
                        <p className="promo-description">
                            Your personal shopping companion fits right in your browser.
                            Browse thousands of products, track orders in real-time, and get everything delivered to your doorstep.
                        </p>
                        <div className="promo-actions">
                            <Link to="/signup" className="promo-btn primary">
                                <span>🚀</span> Get Started For Free
                            </Link>
                            <Link to="/about" className="promo-btn secondary">
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Links Section */}
                <div className="footer-links-grid">
                    <div className="footer-column">
                        <h4>Company</h4>
                        <ul>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/careers">Careers</Link></li>
                            <li><Link to="/blog">Blog</Link></li>
                            <li><Link to="/press">Press</Link></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>Support</h4>
                        <ul>
                            <li><Link to="/help">Help Center</Link></li>
                            <li><Link to="/contact">Contact Us</Link></li>
                            <li><Link to="/safety">Safety Center</Link></li>
                            <li><Link to="/guidelines">Community Guidelines</Link></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>Legal</h4>
                        <ul>
                            <li><Link to="/terms">Terms of Service</Link></li>
                            <li><Link to="/privacy">Privacy Policy</Link></li>
                            <li><Link to="/cookies">Cookie Policy</Link></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>Locations</h4>
                        <ul>
                            <li><Link to="/mumbai">Mumbai</Link></li>
                            <li><Link to="/delhi">Delhi</Link></li>
                            <li><Link to="/bangalore">Bangalore</Link></li>
                            <li><Link to="/all-cities">All Cities</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="footer-bottom">
                    <div className="brand-section">
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>DW</span>
                        <div className="copyright">
                            © {currentYear} DelhiveryWay. All rights reserved.
                        </div>
                    </div>

                    <div className="social-links">
                        <a href="mailto:contact@delhiveryway.com" className="social-link" title="Email Us">
                            📧
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                            📸
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Twitter">
                            🐦
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                            💼
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
