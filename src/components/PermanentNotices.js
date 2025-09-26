import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './PermanentNotices.css';

const PermanentNotices = () => {
    const [permanentNotices, setPermanentNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPermanentNotices = async () => {
        try {
            const response = await api.get('/notices/active');
            if (response.data.success) {
                const notices = response.data.data || [];
                // Filter only permanent notices
                const permanent = notices.filter(notice => notice.displayType === 'permanent');
                setPermanentNotices(permanent);
            }
        } catch (error) {
            console.error('Error fetching permanent notices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermanentNotices();

        // Listen for new notices
        const handleNewNotice = (event) => {
            const { notice } = event.detail;
            if (notice.displayType === 'permanent') {
                setPermanentNotices(prev => {
                    // Check if notice already exists
                    const exists = prev.some(n => n._id === notice._id);
                    if (!exists) {
                        return [...prev, notice];
                    }
                    return prev;
                });
            }
        };

        window.addEventListener('new-notice', handleNewNotice);
        return () => window.removeEventListener('new-notice', handleNewNotice);
    }, []);

    if (loading || permanentNotices.length === 0) {
        return null;
    }

    return (
        <div className="permanent-notices">
            {permanentNotices.map(notice => (
                <div
                    key={notice._id}
                    className={`permanent-notice ${notice.type} ${notice.priority}`}
                >
                    <div className="notice-icon">
                        {notice.type === 'info' && '📢'}
                        {notice.type === 'warning' && '⚠️'}
                        {notice.type === 'success' && '✅'}
                        {notice.type === 'error' && '❌'}
                    </div>
                    <div className="notice-content">
                        <span className="notice-title">{notice.title}</span>
                        <span className="notice-message">{notice.message}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PermanentNotices;