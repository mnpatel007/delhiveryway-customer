import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './ContactPage.css';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        category: 'general',
        message: '',
        priority: 'medium'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            toast.success('Your message has been sent successfully! We\'ll get back to you within 24 hours.');
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                category: 'general',
                message: '',
                priority: 'medium'
            });
        } catch (error) {
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="contact-page">
            <div className="contact-hero">
                <div className="contact-hero-content">
                    <h1>Contact Us</h1>
                    <p>We're here to help! Get in touch with our support team.</p>
                </div>
            </div>

            <div className="contact-container">
                <div className="contact-content">
                    <div className="contact-info">
                        <h2>Get in Touch</h2>
                        <p>Have questions, concerns, or feedback? We'd love to hear from you!</p>

                        <div className="contact-methods">
                            <div className="contact-method">
                                <div className="method-icon">📧</div>
                                <div className="method-details">
                                    <h3>Email Support</h3>
                                    <p>support@delhiveryway.com</p>
                                    <span>Response within 24 hours</span>
                                </div>
                            </div>

                            <div className="contact-method">
                                <div className="method-icon">📞</div>
                                <div className="method-details">
                                    <h3>Phone Support</h3>
                                    <p>+91 98765 43210</p>
                                    <span>Mon-Sat, 9 AM - 8 PM</span>
                                </div>
                            </div>

                            <div className="contact-method">
                                <div className="method-icon">💬</div>
                                <div className="method-details">
                                    <h3>Live Chat</h3>
                                    <p>Available on website</p>
                                    <span>Mon-Sat, 9 AM - 8 PM</span>
                                </div>
                            </div>

                            <div className="contact-method">
                                <div className="method-icon">📍</div>
                                <div className="method-details">
                                    <h3>Office Address</h3>
                                    <p>123 Business District<br />New Delhi, India 110001</p>
                                    <span>Visit by appointment</span>
                                </div>
                            </div>
                        </div>

                        <div className="faq-section">
                            <h3>Quick Help</h3>
                            <div className="faq-items">
                                <div className="faq-item">
                                    <strong>Order Issues:</strong> Track orders, delivery problems, refunds
                                </div>
                                <div className="faq-item">
                                    <strong>Account Help:</strong> Login issues, profile updates, password reset
                                </div>
                                <div className="faq-item">
                                    <strong>Payment Support:</strong> Payment failures, billing questions
                                </div>
                                <div className="faq-item">
                                    <strong>Shop Inquiries:</strong> Partner with us, shop registration
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="contact-form-section">
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <h2>Send us a Message</h2>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="category">Category *</label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="general">General Inquiry</option>
                                        <option value="order">Order Support</option>
                                        <option value="payment">Payment Issue</option>
                                        <option value="account">Account Help</option>
                                        <option value="technical">Technical Issue</option>
                                        <option value="partnership">Partnership</option>
                                        <option value="complaint">Complaint</option>
                                        <option value="feedback">Feedback</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="subject">Subject *</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Brief description of your inquiry"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="priority">Priority</label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Message *</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    required
                                    rows="6"
                                    placeholder="Please provide detailed information about your inquiry..."
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <span>📤</span>
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;