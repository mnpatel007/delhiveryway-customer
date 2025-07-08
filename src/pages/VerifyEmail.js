import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './VerifyEmail.css';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('Verifying your email...');
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
            setMessage('Invalid verification link. Please check your email again.');
            setSuccess(false);
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify-email`, {
                    params: { token, email }
                });

                setMessage('Email verified successfully!');
                setSuccess(true);

                // Start countdown
                const countdownInterval = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(countdownInterval);
                            navigate('/login');
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                return () => clearInterval(countdownInterval);
            } catch (err) {
                setMessage(err.response?.data?.message || 'Verification failed. Please try again.');
                setSuccess(false);
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="verify-email-container">
            <div className={`verify-email-card ${success ? 'success' : 'error'}`}>
                <div className="verify-email-icon">
                    {success ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    )}
                </div>

                <h2>{success ? 'Email Verified' : 'Verification Failed'}</h2>

                <p className="verify-email-message">{message}</p>

                {success && (
                    <div className="redirect-countdown">
                        Redirecting to login in {countdown} seconds...
                    </div>
                )}

                {!success && (
                    <div className="verify-email-actions">
                        <button
                            onClick={() => navigate('/login')}
                            className="btn-back-to-login"
                        >
                            Back to Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn-resend-verification"
                        >
                            Resend Verification
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;