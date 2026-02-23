import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MidnightLogoutHandler = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Track the date when the component mounts or when a new day starts
    const currentDayRef = useRef(new Date().getDate());

    useEffect(() => {
        // Only run if user is logged in
        if (!user) return;

        // Reset the tracker if the user logging in on a new day
        currentDayRef.current = new Date().getDate();

        const checkAndLogout = () => {
            const now = new Date();

            // Check if the actual date has changed vs what we stored
            if (now.getDate() !== currentDayRef.current) {
                console.log('🌑 Date boundary crossed (midnight). Logging out user...');
                logout();
                navigate('/login');
                return true; // Logout triggered
            }
            return false;
        };

        // Initial check on mount
        if (checkAndLogout()) return;

        // Calculate time until next exact midnight for the timeout
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0); // Next midnight
        const timeToMidnight = midnight.getTime() - now.getTime();

        console.log(`⏳ Auto-logout roughly scheduled in ${(timeToMidnight / 1000 / 60 / 60).toFixed(2)} hours`);

        // Timeout fires exactly at midnight if the computer stays awake
        const timeoutId = setTimeout(() => {
            console.log('🌑 Midnight timeout triggered');
            checkAndLogout(); // Verify date has actually changed
        }, timeToMidnight);

        // Robust interval check: fires every 1 minute
        // This instantly catches if the computer wakes up from sleep AFTER midnight
        const intervalId = setInterval(() => {
            checkAndLogout();
        }, 60000);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [user, logout, navigate]);

    return null; // This component renders nothing
};

export default MidnightLogoutHandler;
