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
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, { email, password });

            if (res.data.user.role !== 'customer') {
                setError('Not a customer account');
                return;
            }

            login(res.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        try {
            const googleUser = jwtDecode(credentialResponse.credential);
            const { email, name, sub: googleId } = googleUser;

            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, {
                email,
                name,
                googleId,
                role: 'customer',
            });

            if (res.data.user.role !== 'customer') {
                setError('Not a customer account');
                return;
            }

            login(res.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Google login failed');
        }
    };

    const handleGoogleFailure = () => {
        setError('Google login was unsuccessful. Please try again.');
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
                            onError={handleGoogleFailure}
                            useOneTap={true}
                            width="320"
                        />
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default LoginPage;