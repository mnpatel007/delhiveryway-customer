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
                            <Link to="/" className="promo-btn primary">
                                <span>🚀</span> Get Started For Free
                            </Link>
                        </div>
                    </div>
                    <div className="promo-images">
                        <img src="/assets/story-scooter.png" alt="Delivery Scooter" className="promo-img img-scooter" />
                        <img src="/assets/story-pickup-v2.png" alt="Pickup" className="promo-img img-pickup" />
                        <img src="/assets/story-customer.png" alt="Happy Customer" className="promo-img img-customer" />
                    </div>
                </div>

                {/* Links Section */}
                <div className="footer-links-grid">
                    <div className="footer-column">
                        <h4>Company</h4>
                        <ul>
                            <li><span>About Us</span></li>
                            <li><span>Careers</span></li>
                            <li><span>Blog</span></li>
                            <li><span>Press</span></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>Support</h4>
                        <ul>
                            <li><span>Help Center</span></li>
                            <li><span>Contact Us</span></li>
                            <li><span>Safety Center</span></li>
                            <li><span>Community Guidelines</span></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>Legal</h4>
                        <ul>
                            <li><span>Terms of Service</span></li>
                            <li><span>Privacy Policy</span></li>
                            <li><span>Cookie Policy</span></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>Locations</h4>
                        <ul>
                            <li><span>Mumbai</span></li>
                            <li><span>Delhi</span></li>
                            <li><span>Bangalore</span></li>
                            <li><span>All Cities</span></li>
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
                        <div className="social-link" title="Email Us">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                            </svg>
                        </div>
                        <div className="social-link" title="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                        </div>
                        <div className="social-link" title="Twitter">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                            </svg>
                        </div>
                        <div className="social-link" title="LinkedIn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                <rect x="2" y="9" width="4" height="12"></rect>
                                <circle cx="4" cy="4" r="2"></circle>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
