import React, { useState, useEffect } from 'react';
import { apiCall, api } from '../services/api';
import './NoticeAlert.css';

const NoticeAlert = () => {
    const [notices, setNotices] = useState([]);
    const [dismissedNotices, setDismissedNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveNotices();

        // Load dismissed notices from localStorage
        const dismissed = JSON.parse(localStorage.getItem('dismissedNotices') || '[]');
        setDismissedNotices(dismissed);
    }, []);

    const fetchActiveNotices = async () => {
        try {
            const response = await api.get('/notices/active');
            if (response.data.success) {
                setNotices(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching notices:', error);
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