import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authAPI, apiCall } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import './LoginPage.css';

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '117679354054-t7tsl5najnu2kab80ffls6flkau21idl.apps.googleusercontent.com';

if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
    console.warn('⚠️ Google Client ID not found in environment variables. Using fallback ID.');
}

const LoginPage = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email || !password) {
            setError('Please enter both email and password');
            setIsLoading(false);
            return;
        }

        try {
            const result = await apiCall(authAPI.login, { email, password });

            if (!result.success) {
                setError(result.message || 'Login failed');
                setIsLoading(false);
                return;
            }

            const userData = result.data.data?.user || result.data.user;
            if (userData.role !== 'customer') {
                setError('This account is not registered as a customer. Please use the correct app.');
                setIsLoading(false);
                return;
            }

            login(result.data);
            navigate('/');
        } catch (err) {
            console.error('❌ Login error:', err);

            if (err.code === 'NETWORK_ERROR' || !err.response) {
                setError('Cannot connect to server. Please check your internet connection.');
            } else if (err.response?.status === 423) {
                setError('Account temporarily locked. Please try again later.');
            } else if (err.response?.status === 403) {
                setError('Please verify your email before logging in.');
            } else {
                setError(err.response?.data?.message || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setIsLoading(true);
        try {
            const googleUser = jwtDecode(credentialResponse.credential);
            const { email, name, sub: googleId } = googleUser;

            const result = await apiCall(authAPI.googleLogin, {
                email,
                name,
                googleId,
                role: 'customer',
            });

            if (!result.success) {
                setError(result.message || 'Google login failed');
                setIsLoading(false);
                return;
            }

            const userData = result.data.data?.user || result.data.user;
            if (userData.role !== 'customer') {
                setError('This account is not registered as a customer. Please use the correct app.');
                setIsLoading(false);
                return;
            }

            login(result.data);
            navigate('/');
        } catch (err) {
            console.error('❌ Google login error:', err);
            setError(err.response?.data?.message || 'Google login failed. Try regular login.');
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        console.log('Google login cancelled or failed');
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
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
                                    <div className="feature-icon">💳</div>
                                    <span>Secure Payment</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="form-section">
                        <div className="form-container">
                            <div className="form-header">
                                <h2 className="welcome-text">Welcome Back!</h2>
                                <p className="login-subtitle">Sign in to continue your shopping journey</p>
                            </div>

                            {error && (
                                <div className="error-banner">
                                    <div className="error-icon">⚠️</div>
                                    <span>{error}</span>
                                </div>
                            )}

                            <form className="modern-login-form" onSubmit={handleLogin}>
                                <div className="input-group">
                                    <div className="input-wrapper">
                                        <div className="input-icon">📧</div>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="modern-input"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div className="input-wrapper">
                                        <div className="input-icon">🔒</div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="modern-input"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <a href="/forgot-password" className="forgot-link">
                                        Forgot Password?
                                    </a>
                                </div>

                                <button
                                    type="submit"
                                    className={`login-button ${isLoading ? 'loading' : ''}`}
                                    disabled={isLoading || !email || !password}
                                >
                                    {isLoading ? (
                                        <div className="button-loader">
                                            <div className="spinner"></div>
                                            <span>Signing In...</span>
                                        </div>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>

                            <div className="divider">
                                <span>or continue with</span>
                            </div>

                            <div className="social-login">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    useOneTap={false}
                                    width="100%"
                                    theme="outline"
                                    size="large"
                                    text="signin_with"
                                    shape="rectangular"
                                />
                            </div>

                            <div className="signup-prompt">
                                <span>Don't have an account?</span>
                                <a href="/signup" className="signup-link">Create Account</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default LoginPage;