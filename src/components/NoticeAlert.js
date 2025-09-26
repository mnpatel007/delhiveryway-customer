import React, { useState, useEffect } from 'react';
import { apiCall, api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import './NoticeAlert.css';

const NoticeAlert = () => {
    const [notices, setNotices] = useState([]);
    const [dismissedNotices, setDismissedNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();

    console.log('📢 NoticeAlert component rendered');

    useEffect(() => {
        fetchActiveNotices();

        // Load dismissed notices from localStorage
        const dismissed = JSON.parse(localStorage.getItem('dismissedNotices') || '[]');
        setDismissedNotices(dismissed);

        // Listen for new notices in real-time
        const handleNewNotice = (event) => {
            const { notice } = event.detail;
            // Only handle one-time notices here
            if (notice.displayType === 'one-time') {
                const dismissedNotices = JSON.parse(localStorage.getItem('dismissedNotices') || '[]');
                if (!dismissedNotices.includes(notice._id)) {
                    setNotices(prev => {
                        // Check if notice already exists
                        const exists = prev.some(n => n._id === notice._id);
                        if (!exists) {
                            return [...prev, notice];
                        }
                        return prev;
                    });
                }
            }
        };

        window.addEventListener('new-notice', handleNewNotice);
        return () => window.removeEventListener('new-notice', handleNewNotice);
    }, []);

    // Listen for new notices via socket
    useEffect(() => {
        if (socket) {
            const handleNewNotice = (data) => {
                console.log('📢 NoticeAlert: New notice received, refreshing...');
                fetchActiveNotices(); // Refresh the notices list
            };

            const handleRefreshNotice = (data) => {
                console.log('🔄 NoticeAlert: Notice refresh received, clearing dismissals and refreshing...');

                // Clear dismissal for this specific notice
                const dismissed = JSON.parse(localStorage.getItem('dismissedNotices') || '[]');
                const updatedDismissed = dismissed.filter(id => id !== data.id);
                localStorage.setItem('dismissedNotices', JSON.stringify(updatedDismissed));
                setDismissedNotices(updatedDismissed);

                // Refresh the notices list
                fetchActiveNotices();
            };

            socket.on('newNotice', handleNewNotice);
            socket.on('refreshNotice', handleRefreshNotice);

            return () => {
                socket.off('newNotice', handleNewNotice);
                socket.off('refreshNotice', handleRefreshNotice);
            };
        }
    }, [socket]);

    const fetchActiveNotices = async () => {
        try {
            console.log('📢 NoticeAlert: Fetching active notices...');
            const response = await api.get('/notices/active');
            console.log('📢 NoticeAlert: API response:', response.data);

            if (response.data.success) {
                const notices = response.data.data || [];
                // Filter only one-time notices
                const oneTimeNotices = notices.filter(notice =>
                    notice.displayType === 'one-time' || !notice.displayType // backward compatibility
                );
                console.log('📢 NoticeAlert: Setting one-time notices:', oneTimeNotices);
                setNotices(oneTimeNotices);
            } else {
                console.log('📢 NoticeAlert: API returned success=false');
            }
        } catch (error) {
            console.error('📢 NoticeAlert: Error fetching notices:', error);
        } finally {
            setLoading(false);
        }
    };

    const dismissNotice = async (noticeId) => {
        try {
            // Mark as viewed on server (if user is authenticated)
            try {
                await api.post(`/notices/${noticeId}/view`);
            } catch (error) {
                // Ignore auth errors for non-authenticated users
                console.log('Notice view tracking skipped (user not authenticated)');
            }

            // Add to dismissed list
            const newDismissed = [...dismissedNotices, noticeId];
            setDismissedNotices(newDismissed);
            localStorage.setItem('dismissedNotices', JSON.stringify(newDismissed));
        } catch (error) {
            console.error('Error dismissing notice:', error);
        }
    };

    const getAlertClass = (type, priority) => {
        let baseClass = 'notice-alert';

        // Add type class
        baseClass += ` notice-${type}`;

        // Add priority class
        baseClass += ` priority-${priority}`;

        return baseClass;
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            case 'info': return 'ℹ️';
            default: return 'ℹ️';
        }
    };

    if (loading) return null;

    // Filter out dismissed notices
    const visibleNotices = notices.filter(notice =>
        !dismissedNotices.includes(notice._id)
    );

    if (visibleNotices.length === 0) return null;

    return (
        <div className="notice-alerts-container">
            {visibleNotices.map(notice => (
                <div
                    key={notice._id}
                    className={getAlertClass(notice.type, notice.priority)}
                >
                    <div className="notice-content">
                        <div className="notice-icon">
                            {getAlertIcon(notice.type)}
                        </div>
                        <div className="notice-text">
                            <div className="notice-title">{notice.title}</div>
                            <div className="notice-message">{notice.message}</div>
                        </div>
                    </div>
                    <button
                        className="notice-dismiss"
                        onClick={() => dismissNotice(notice._id)}
                        aria-label="Dismiss notice"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NoticeAlert;