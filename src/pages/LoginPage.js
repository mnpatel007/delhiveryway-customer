import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import './LoginPage.css';

const clientId = '117679354054-t7tsl5najnu2kab80ffls6flkau21idl.apps.googleusercontent.com';

const LoginPage = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
                email,
                password
            });

            if (!res.data.success) {
                setError(res.data.message || 'Login failed');
                return;
            }

            const userData = res.data.data.user;
            if (userData.role !== 'customer') {
                setError('This account is not registered as a customer. Please use the correct app.');
                return;
            }

            login(res.data);
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
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        try {
            const googleUser = jwtDecode(credentialResponse.credential);
            const { email, name, sub: googleId } = googleUser;

            const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/google`, {
                email,
                name,
                googleId,
                role: 'customer',
            });

            if (!res.data.success) {
                setError(res.data.message || 'Google login failed');
                return;
            }

            const userData = res.data.data.user;
            if (userData.role !== 'customer') {
                setError('This account is not registered as a customer. Please use the correct app.');
                return;
            }

            login(res.data);
            navigate('/');
        } catch (err) {
            console.error('❌ Google login error:', err);
            setError(err.response?.data?.message || 'Google login failed. Please try regular login.');
        }
    };

    const handleGoogleError = () => {
        console.log('Google login cancelled or failed');
        // Don't show error for user cancellation
    };



    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="login-container">
                <div className="login-wrapper">
                    <form className="login-form" onSubmit={handleLogin}>
                        <h2 className="login-title">Welcome Back</h2>
                        <p className="login-subtitle">Login to your account</p>

                        {error && <div className="error-message">{error}</div>}

                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="forgot-password">
                            <a href="/forgot-password">Forgot Password?</a>
                        </div>

                        <button type="submit" className="login-button" disabled={!email || !password}>
                            Login
                        </button>

                        <div className="signup-link">
                            Don't have an account?
                            <a href="/signup"> Sign Up</a>
                        </div>
                    </form>

                    <div className="google-login-wrapper">
                        <p className="or-text">Or login with</p>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap={false}
                            width="320"
                        />
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default LoginPage;