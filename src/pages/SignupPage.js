import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SignupPage.css'; // Your existing CSS with small additions below

const SignupPage = () => {

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        if (successMessage) setSuccessMessage('');
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

        if (!validateForm()) return;

        try {
            const { confirmPassword, ...signupData } = formData;
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/signup`, {
                ...signupData,
                role: 'customer'
            });

            setSuccessMessage(' ✅ Signup successful! Please check your email to verify your account before logging in.');
            setErrors({});
            setFormData({ name: '', email: '', password: '', confirmPassword: '' });

            setTimeout(() => {
                navigate('/login');
            }, 4000);

        } catch (err) {
            const serverError = err.response?.data?.message || 'Signup failed';
            setErrors(prevErrors => ({
                ...prevErrors,
                submit: serverError
            }));
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-wrapper">
                <form className="signup-form" onSubmit={handleSignup}>
                    <h2 className="signup-title">Create Account</h2>
                    <p className="signup-subtitle">Sign up to get started</p>

                    {successMessage && (
                        <div className="success-message">{successMessage}</div>
                    )}

                    {errors.submit && (
                        <div className="error-message">{errors.submit}</div>
                    )}

                    <div className="input-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                        {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        {errors.password && <span className="error-text">{errors.password}</span>}
                        <div className="password-requirements">
                            Password must:
                            <ul>
                                <li>Be at least 8 characters</li>
                                <li>Include uppercase and lowercase letters</li>
                                <li>Include a number and special character</li>
                            </ul>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                    </div>

                    <button
                        type="submit"
                        className="signup-button"
                    >
                        Create Account
                    </button>

                    <div className="login-link">
                        Already have an account?
                        <a href="/login"> Log In</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;