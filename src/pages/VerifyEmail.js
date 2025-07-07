import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('Verifying...');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (!token || !email) {
            setMessage('Invalid verification link.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify-email`, {
                    params: { token, email }
                });

                setMessage('✅ Email verified successfully! Redirecting...');
                setSuccess(true);

                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (err) {
                setMessage(err.response?.data?.message || '❌ Verification failed.');
                setSuccess(false);
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f2f2f2',
            flexDirection: 'column',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#fff',
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '500px'
            }}>
                <h2 style={{ color: success ? '#4caf50' : '#f44336' }}>
                    {success ? '✅ Verified!' : '⚠️ Verification'}
                </h2>
                <p style={{ fontSize: '18px', marginTop: '10px' }}>{message}</p>
            </div>
        </div>
    );
};

export default VerifyEmail;
