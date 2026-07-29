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
        setMessage('Secure password reset link has been sent to your email.');
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
                <div className="feature-icon">
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <circle cx="6" cy="17" r="2" />
                    <circle cx="18" cy="17" r="2" />
                    <path d="M6 17H3V6h11v11M14 9h4l3 3v5h-3" />
                  </svg>
                </div>
                <span>Fast Delivery</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <circle cx="9" cy="20" r="1.5" />
                    <circle cx="18" cy="20" r="1.5" />
                    <path d="M2 3h3l2.4 12.4a1.5 1.5 0 001.5 1.2h8.7a1.5 1.5 0 001.5-1.2L22 7H6" />
                  </svg>
                </div>
                <span>Personal Shopper</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                </div>
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
              <p className="login-subtitle">
                No worries! Enter your email and we'll send you a reset link.
              </p>
            </div>

            {error && (
              <div className="error-banner">
                <div className="error-icon">
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                  </svg>
                </div>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="success-banner">
                <div className="success-icon">
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 12l3 3 5-5" />
                  </svg>
                </div>
                <span>{message}</span>
              </div>
            )}

            <form className="modern-login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <div className="input-wrapper">
                  <div className="input-icon">
                    <svg className="auth-svg" viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M3 7l9 6 9-6" />
                    </svg>
                  </div>
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
                <svg className="auth-svg" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
