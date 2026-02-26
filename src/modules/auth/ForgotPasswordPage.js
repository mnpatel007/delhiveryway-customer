import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, apiCall } from '../../services/api';
import './LoginPage.css'; // Reusing the premium login styles

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsLoading(true);

        if (!email) {
            setError('Please enter your email address');
            setIsLoading(false);
            return;
        }

        try {
            const result = await apiCall(authAPI.forgotPassword, { email });
            if (result.success) {
                setMessage('✅ Secure password reset link has been sent to your email.');
                setEmail(''); // clear the field
            } else {
                setError(result.message || 'Failed to send reset link. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modern-login-container">
            {/* Background Elements */}
            <div className="floating-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
            </div>

            {/* Main Content */}
            <div className="login-content">
                {/* Left Side - Branding */}
                <div className="branding-section">
                    <div className="brand-content">
                        <div className="logo-container">
                            <div className="logo-icon">
                                <span className="logo-text">DW</span>
                            </div>
                        </div>
                        <h1 className="brand-title">DelhiveryWay</h1>
                        <p className="brand-subtitle">Your Personal Shopping Companion</p>
                        <div className="brand-features">
                            <div className="feature-item">
                                <div className="feature-icon">🚚</div>
                                <span>Fast Delivery</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🛒</div>
                                <span>Personal Shopper</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🔒</div>
                                <span>Secure Account</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form Section */}
                <div className="form-section">
                    <div className="form-container">
                        <div className="form-header">
                            <h2 className="welcome-text">Forgot Password?</h2>
                            <p className="login-subtitle">No worries! Enter your email and we'll send you a reset link.</p>
                        </div>

                        {error && (
                            <div className="error-banner">
                                <div className="error-icon">⚠️</div>
                                <span>{error}</span>
                            </div>
                        )}

                        {message && (
                            <div className="error-banner" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <div className="error-icon">✨</div>
                                <span>{message}</span>
                            </div>
                        )}

                        <form className="modern-login-form" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <div className="input-icon">📧</div>
                                    <input
                                        type="email"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="modern-input"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`login-button ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading || !email}
                            >
                                {isLoading ? (
                                    <div className="button-loader">
                                        <div className="spinner"></div>
                                        <span>Sending Link...</span>
                                    </div>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>

                        <div className="divider">
                            <span>or</span>
                        </div>

                        <div className="social-login" style={{ textAlign: 'center' }}>
                            <button
                                type="button"
                                className="google-btn"
                                onClick={() => navigate('/login')}
                                style={{ justifyContent: 'center' }}
                            >
                                🔙 Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ForgotPasswordPage;