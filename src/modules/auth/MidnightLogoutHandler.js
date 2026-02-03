import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MidnightLogoutHandler = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Only run if user is logged in
        if (!user) return;

        const checkAndLogout = () => {
            const now = new Date();
            // Check if it's midnight (00:00) with a small buffer (e.g., first minute of the day)
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                console.log('🌑 Midnight reached. Logging out user...');
                logout();
                navigate('/login');
                return true; // Logout triggered
            }
            return false;
        };

        // Initial check on mount
        if (checkAndLogout()) return;

        // Calculate time until next midnight
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0); // Set to next midnight
        const timeToMidnight = midnight.getTime() - now.getTime();

        console.log(`⏳ Auto-logout scheduled in ${(timeToMidnight / 1000 / 60).toFixed(1)} minutes`);

        // Set timeout to trigger exactly at midnight
        const timeoutId = setTimeout(() => {
            console.log('🌑 Midnight timeout triggered');
            logout();
            navigate('/login');
        }, timeToMidnight);

        // Also set an interval to check every minute as a fallback 
        // (in case the device creates drift or wakes from sleep after the timeout passed)
        const intervalId = setInterval(() => {
            checkAndLogout();
        }, 60000); // Check every minute

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [user, logout, navigate]);

    return null; // This component renders nothing
};

export default MidnightLogoutHandler;
