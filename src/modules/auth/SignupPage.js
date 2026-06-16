import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, apiCall } from '../../services/api';

import './LoginPage.css';
import './SignupPage.css';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    if (successMessage) setSuccessMessage('');
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password =
        'Password must include uppercase, lowercase, number, and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...signupData } = formData;
      const result = await apiCall(authAPI.signup, {
        ...signupData,
        role: 'customer',
      });

      if (result.success) {
        // Use the backend's message so it stays accurate across environments
        // (in development accounts are auto-verified and no email is sent).
        const backendMessage = result.data?.message;
        setSuccessMessage(backendMessage || 'Account created successfully! You can now sign in.');
        setErrors({});
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });

        setTimeout(() => {
          navigate('/login');
        }, 4000);
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          submit: result.message || 'Signup failed',
        }));
      }
    } catch (err) {
      const serverError = err.response?.data?.message || 'Signup failed';
      setErrors((prevErrors) => ({
        ...prevErrors,
        submit: serverError,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ff4444', '#ff8800', '#ffbb33', '#00C851', '#007E33'];

    return {
      score: Math.min(score, 5),
      label: labels[score - 1] || '',
      color: colors[score - 1] || '',
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="modern-signup-container">
      {/* Background Elements */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Main Content */}
      <div className="signup-content">
        {/* Left Side - Branding */}
        <div className="branding-section">
          <div className="brand-content">
            <div className="logo-container">
              <div className="logo-icon">
                <span className="logo-text">DW</span>
              </div>
            </div>
            <h1 className="brand-title">Join DelhiveryWay</h1>
            <p className="brand-subtitle">Start your personal shopping journey today</p>
            <div className="brand-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="12" cy="12" r="1" />
                  </svg>
                </div>
                <span>Personalized Experience</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" />
                  </svg>
                </div>
                <span>Lightning Fast</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <span>100% Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="form-section">
          <div className="form-container">
            <div className="form-header">
              <h2 className="welcome-text">Create Account</h2>
              <p className="signup-subtitle">Join thousands of happy customers</p>
            </div>

            {successMessage && (
              <div className="success-banner">
                <div className="success-icon">
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 12l3 3 5-5" />
                  </svg>
                </div>
                <span>{successMessage}</span>
              </div>
            )}

            {errors.submit && (
              <div className="error-banner">
                <div className="error-icon">
                  <svg className="auth-svg" viewBox="0 0 24 24">
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                  </svg>
                </div>
                <span>{errors.submit}</span>
              </div>
            )}

            <form className="modern-signup-form" onSubmit={handleSignup}>
              <div className="input-group">
                <div className="input-wrapper">
                  <div className="input-icon">
                    <svg className="auth-svg" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21a8 8 0 0116 0" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`modern-input ${errors.name ? 'error' : ''}`}
                    required
                  />
                </div>
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

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
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`modern-input ${errors.email ? 'error' : ''}`}
                    required
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="input-group">
                <div className="input-wrapper">
                  <div className="input-icon">
                    <svg className="auth-svg" viewBox="0 0 24 24">
                      <rect x="7" y="2" width="10" height="20" rx="2" />
                      <path d="M11 18h2" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter your 10-digit phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`modern-input ${errors.phone ? 'error' : ''}`}
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    inputMode="numeric"
                  />
                </div>
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              <div className="input-group">
                <div className="input-wrapper">
                  <div className="input-icon">
                    <svg className="auth-svg" viewBox="0 0 24 24">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V8a4 4 0 018 0v3" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`modern-input ${errors.password ? 'error' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
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
                {errors.password && <span className="error-text">{errors.password}</span>}

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`strength-bar ${level <= passwordStrength.score ? 'active' : ''}`}
                          style={{
                            backgroundColor:
                              level <= passwordStrength.score ? passwordStrength.color : '#e1e5e9',
                          }}
                        ></div>
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}

                <div className="password-requirements">
                  <h4>Password Requirements:</h4>
                  <ul>
                    <li className={formData.password.length >= 8 ? 'met' : 'unmet'}>
                      At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'met' : 'unmet'}>
                      One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(formData.password) ? 'met' : 'unmet'}>
                      One lowercase letter
                    </li>
                    <li className={/\d/.test(formData.password) ? 'met' : 'unmet'}>One number</li>
                    <li className={/[@$!%*?&]/.test(formData.password) ? 'met' : 'unmet'}>
                      One special character (@$!%*?&)
                    </li>
                  </ul>
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`modern-input ${errors.confirmPassword ? 'error' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
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
                {errors.confirmPassword && (
                  <span className="error-text">{errors.confirmPassword}</span>
                )}
              </div>

              <button
                type="submit"
                className={`signup-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="button-loader">
                    <div className="spinner"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="login-prompt">
              <span>Already have an account?</span>
              <a href="/login" className="login-link">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
