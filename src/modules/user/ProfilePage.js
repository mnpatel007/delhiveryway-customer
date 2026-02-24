import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        countryCode: '+91',
        phone: '',
        address: ''
    });

    // Loading and message states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // To guarantee we have the freshest data, fetch it explicitly
                const response = await authAPI.getProfile();
                if (response.data && response.data.success) {
                    const profileData = response.data.data.user;
                    const phoneVal = profileData.phone;
                    setFormData({
                        name: profileData.name || '',
                        countryCode: profileData.countryCode || '+91',
                        phone: (phoneVal === '0000000000' || !phoneVal) ? '' : phoneVal,
                        address: profileData.address?.street || ''
                    });
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                setError("Failed to load profile data.");
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchProfile();
        } else {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear styling/messages on input change
        if (message) setMessage('');
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSaving(true);

        // Validation - enforce 10 digit phone number early
        const phoneRegex = /^[0-9]{10}$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            setError('Please provide a valid 10-digit phone number.');
            setIsSaving(false);
            return;
        }
        if (!formData.name.trim()) {
            setError('Name is required.');
            setIsSaving(false);
            return;
        }

        try {
            const updatePayload = {
                name: formData.name,
                countryCode: formData.countryCode,
                phone: formData.phone,
                // Nested inside the `address` object and specifically setting `street`
                address: {
                    street: formData.address
                }
            };

            const response = await authAPI.updateProfile(updatePayload);

            if (response.data && response.data.success) {
                setMessage('Profile updated successfully!');

                // Update context globally so the Navbar reflects any name changes immediately
                if (response.data.data && response.data.data.user) {
                    setUser(response.data.data.user);
                }
            } else {
                setError(response.data?.message || 'Failed to update profile.');
            }
        } catch (err) {
            console.error("Update profile error:", err);
            setError(err.response?.data?.message || 'An error occurred while updating your profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="profile-page-container">
                <div className="profile-loading">Loading your profile...</div>
            </div>
        );
    }

    return (
        <div className="profile-page-container fade-in">
            <div className="profile-card">
                <div className="profile-header">
                    <h2>My Profile</h2>
                    <p>Manage your account personal details.</p>
                </div>

                <form className="profile-form" onSubmit={handleSubmit}>
                    {/* Name */}
                    <div className="form-group">
                        <label htmlFor="name">Full Name <span className="required-asterisk">*</span></label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    {/* Permanent Contact Number */}
                    <div className="form-group">
                        <label htmlFor="phone">Permanent Contact Number <span className="required-asterisk">*</span></label>
                        <div className="phone-input-container">
                            <select
                                name="countryCode"
                                value={formData.countryCode}
                                onChange={handleChange}
                                className="country-code-select"
                            >
                                <option value="+91">IN (+91)</option>
                                <option value="+1">US (+1)</option>
                                <option value="+44">UK (+44)</option>
                                <option value="+61">AU (+61)</option>
                                <option value="+971">AE (+971)</option>
                            </select>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="10-digit mobile number"
                                maxLength="10"
                                required
                                className="phone-number-input"
                            />
                        </div>
                        <small className="field-hint">Used for order updates and delivery coordination.</small>
                    </div>

                    {/* Permanent Address */}
                    <div className="form-group">
                        <label htmlFor="address">Permanent Address</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter your full permanent address (Street, City, Zip, etc.)"
                            rows="4"
                        />
                        <small className="field-hint">Your primary address for billing and delivery reference.</small>
                    </div>

                    {/* Feedback Messages */}
                    {message && <div className="profile-success-message">{message}</div>}
                    {error && <div className="profile-error-message">{error}</div>}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn btn-primary profile-submit-btn"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving Changes...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
