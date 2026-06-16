import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, apiCall } from '../../services/api';
import './LoginPage.css';

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const token = params.get('token');
  const email = params.get('email');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      const result = await apiCall(authAPI.resetPassword, { token, email, newPassword });
      if (result.success) {
        setMessage('Password reset successful. Redirecting to login…');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(result.message || 'Reset failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="modern-login-container">
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      <div className="auth-card">
        <div className="form-header">
          <h2 className="welcome-text">Reset your password</h2>
          <p className="login-subtitle">Choose a new password for your account.</p>
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

        <form className="modern-login-form" onSubmit={handleReset}>
          <div className="input-group">
            <div className="input-wrapper">
              <div className="input-icon">
                <svg className="auth-svg" viewBox="0 0 24 24">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 018 0v3" />
                </svg>
              </div>
              <input
                type={show ? 'text' : 'password'}
                className="modern-input"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShow(!show)}
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? (
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a3 3 0 004.2 4.2" />
                    <path d="M9.9 4.6A10.8 10.8 0 0112 4c6 0 10 7 10 7a17 17 0 01-3.3 3.9M6.6 6.6A17 17 0 002 11s4 7 10 7a10.8 10.8 0 003.3-.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="input-group">
            <div className="input-wrapper">
              <div className="input-icon">
                <svg className="auth-svg" viewBox="0 0 24 24">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 018 0v3" />
                  <path d="M9.5 16l1.5 1.5 3-3" />
                </svg>
              </div>
              <input
                type={show ? 'text' : 'password'}
                className="modern-input"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="login-button" disabled={!newPassword || !confirm}>
            Reset password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
