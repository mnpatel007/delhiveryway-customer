import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, apiCall } from '../services/api';
import './SignupPage.css';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        if (successMessage) setSuccessMessage('');
        // Clear specific error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
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
            newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
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
                role: 'customer'
            });

            if (result.success) {
                setSuccessMessage('✅ Account created successfully! Please check your email to verify your account before logging in.');
                setErrors({});
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });

                setTimeout(() => {
                    navigate('/login');
                }, 4000);
            } else {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    submit: result.message || 'Signup failed'
                }));
            }
        } catch (err) {
            const serverError = err.response?.data?.message || 'Signup failed';
            setErrors(prevErrors => ({
                ...prevErrors,
                submit: serverError
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
            color: colors[score - 1] || ''
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
                                <div className="feature-icon">🎯</div>
                                <span>Personalized Experience</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">⚡</div>
                                <span>Lightning Fast</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🛡️</div>
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
                                <div className="success-icon">🎉</div>
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {errors.submit && (
                            <div className="error-banner">
                                <div className="error-icon">⚠️</div>
                                <span>{errors.submit}</span>
                            </div>
                        )}

                        <form className="modern-signup-form" onSubmit={handleSignup}>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <div className="input-icon">👤</div>
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
                                    <div className="input-icon">📧</div>
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
                                    <div className="input-icon">📱</div>
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
                                    <div className="input-icon">🔒</div>
                                    <input
                                        type={showPassword ? "text" : "password"}
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
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
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
                                                    style={{ backgroundColor: level <= passwordStrength.score ? passwordStrength.color : '#e1e5e9' }}
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
                                        <li className={/\d/.test(formData.password) ? 'met' : 'unmet'}>
                                            One number
                                        </li>
                                        <li className={/[@$!%*?&]/.test(formData.password) ? 'met' : 'unmet'}>
                                            One special character (@$!%*?&)
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="input-group">
                                <div className="input-wrapper">
                                    <div className="input-icon">🔐</div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
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
                                    >
                                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
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
                            <a href="/login" className="login-link">Sign In</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;