import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import axios from 'axios';

const TermsContext = createContext();

export const TermsProvider = ({ children }) => {
    const [currentTerms, setCurrentTerms] = useState(null);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { user, isAuthenticated } = useAuth();
    const { socket } = useSocket();

    // Fetch current terms
    const fetchCurrentTerms = async () => {
        if (!isAuthenticated()) return;

        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('/api/terms/current');

            if (response.data.success && response.data.data.terms) {
                const terms = response.data.data.terms;
                setCurrentTerms(terms);

                // Show modal if user hasn't accepted current terms
                if (!terms.hasAccepted) {
                    setShowTermsModal(true);
                }
            } else {
                setCurrentTerms(null);
            }
        } catch (error) {
            console.error('Failed to fetch terms:', error);
            setError('Failed to load terms and conditions');
        } finally {
            setLoading(false);
        }
    };

    // Accept terms
    const acceptTerms = async () => {
        if (!currentTerms) return false;

        try {
            setLoading(true);
            setError(null);

            const response = await axios.post('/api/terms/accept', {
                termsId: currentTerms._id
            });

            if (response.data.success) {
                setCurrentTerms(prev => ({ ...prev, hasAccepted: true }));
                setShowTermsModal(false);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Failed to accept terms:', error);
            setError('Failed to accept terms and conditions');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Handle terms decline
    const declineTerms = () => {
        // Force logout when terms are declined
        setShowTermsModal(false);
        // The auth context will handle the logout
        window.location.href = '/login?message=Terms and conditions must be accepted to use the service';
    };

    // Listen for new terms via socket
    useEffect(() => {
        if (socket && isAuthenticated()) {
            const handleNewTerms = (data) => {
                console.log('📋 New terms created:', data);
                // Fetch the new terms and show modal
                fetchCurrentTerms();
            };

            socket.on('newTermsCreated', handleNewTerms);

            return () => {
                socket.off('newTermsCreated', handleNewTerms);
            };
        }
    }, [socket, isAuthenticated]);

    // Fetch terms when user logs in
    useEffect(() => {
        if (isAuthenticated() && user) {
            fetchCurrentTerms();
        } else {
            setCurrentTerms(null);
            setShowTermsModal(false);
        }
    }, [user, isAuthenticated]);

    const value = {
        currentTerms,
        showTermsModal,
        loading,
        error,
        acceptTerms,
        declineTerms,
        fetchCurrentTerms,
        setError
    };

    return (
        <TermsContext.Provider value={value}>
            {children}
        </TermsContext.Provider>
    );
};

export const useTerms = () => {
    const context = useContext(TermsContext);
    if (!context) {
        throw new Error('useTerms must be used within a TermsProvider');
    }
    return context;
};