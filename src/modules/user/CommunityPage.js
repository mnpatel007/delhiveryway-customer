import React, { useState } from 'react';
import './CommunityPage.css';
import { contactAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CommunityPage = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFocus = (field) => setFocusedField(field);
    const handleBlur = () => setFocusedField(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            alert('Please fill in your name, email, and message.');
            return;
        }
        setIsSubmitting(true);

        try {
            const res = await contactAPI.send({
                name: formData.name.trim(),
                email: formData.email.trim(),
                subject: formData.subject.trim(),
                message: formData.message.trim(),
            });

            if (res?.data?.success || res?.success) {
                alert('✅ Message sent successfully. We will get back to you soon.');
                setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    subject: '',
                    message: ''
                });
            } else {
                const msg = res?.data?.message || res?.message || 'Failed to send your message. Please try again later.';
                alert(`❌ ${msg}`);
            }
        } catch (error) {
            alert('❌ Failed to send your message. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="community-page">
            {/* Animated Background Elements */}
            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>
            <div className="bg-shape shape-3"></div>

            <div className="community-hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        <span className="gradient-text">Join the</span> DelhiveryWay<br />
                        <span className="highlight-text">Community</span>
                    </h1>
                    <p className="hero-subtitle">
                        Connect with us, share your experiences, and stay updated with the latest from your personal shopping companion!
                    </p>
                </div>
            </div>

            <div className="community-container">
                {/* Direct Contact Form Section */}
                <div className="contact-wrapper">
                    <div className="contact-glass-panel">
                        <div className="contact-header">
                            <h2>Write to Us</h2>
                            <p>Have an incredible idea, a question, or just want to say hi? Drop us a message!</p>
                        </div>

                        <form className="modern-contact-form" onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className={`modern-form-group ${formData.name ? 'has-value' : ''} ${focusedField === 'name' ? 'is-focused' : ''}`}>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        onFocus={() => handleFocus('name')}
                                        onBlur={handleBlur}
                                        required
                                        className="modern-input"
                                    />
                                    <label htmlFor="name" className="modern-label">Full Name</label>
                                    <span className="input-highlight"></span>
                                </div>

                                <div className={`modern-form-group ${formData.email ? 'has-value' : ''} ${focusedField === 'email' ? 'is-focused' : ''}`}>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        onFocus={() => handleFocus('email')}
                                        onBlur={handleBlur}
                                        required
                                        className="modern-input"
                                    />
                                    <label htmlFor="email" className="modern-label">Email Address</label>
                                    <span className="input-highlight"></span>
                                </div>
                            </div>

                            <div className={`modern-form-group ${formData.subject ? 'has-value' : ''} ${focusedField === 'subject' ? 'is-focused' : ''}`}>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    onFocus={() => handleFocus('subject')}
                                    onBlur={handleBlur}
                                    className="modern-input"
                                />
                                <label htmlFor="subject" className="modern-label">Subject</label>
                                <span className="input-highlight"></span>
                            </div>

                            <div className={`modern-form-group text-area-group ${formData.message ? 'has-value' : ''} ${focusedField === 'message' ? 'is-focused' : ''}`}>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    onFocus={() => handleFocus('message')}
                                    onBlur={handleBlur}
                                    required
                                    rows="5"
                                    className="modern-textarea"
                                ></textarea>
                                <label htmlFor="message" className="modern-label">Your Message</label>
                                <span className="input-highlight"></span>
                            </div>

                            <button
                                type="submit"
                                className={`modern-submit-btn ${isSubmitting ? 'submitting' : ''}`}
                                disabled={isSubmitting}
                            >
                                <span className="btn-text">
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </span>
                                <div className="btn-icon">
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </div>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Social Connect Section */}
                <div className="social-section">
                    <h2 className="section-heading">Connect & Follow</h2>
                    <div className="social-cards">
                        <a href="https://instagram.com/delhiveryway" target="_blank" rel="noopener noreferrer" className="social-card instagram-card">
                            <div className="card-bg"></div>
                            <div className="card-content">
                                <div className="social-icon">
                                    <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                    </svg>
                                </div>
                                <h3>Instagram</h3>
                                <p>@delhiveryway</p>
                                <span className="action-text">Follow Us ➔</span>
                            </div>
                        </a>

                        <a href="https://facebook.com/delhiveryway" target="_blank" rel="noopener noreferrer" className="social-card facebook-card">
                            <div className="card-bg"></div>
                            <div className="card-content">
                                <div className="social-icon">
                                    <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                    </svg>
                                </div>
                                <h3>Facebook</h3>
                                <p>DelhiveryWay</p>
                                <span className="action-text">Like our Page ➔</span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPage;
