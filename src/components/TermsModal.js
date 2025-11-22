import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './TermsModal.css';

const LOCAL_KEY_PREFIX = 'accepted_terms_';

const TermsModal = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [terms, setTerms] = useState(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const hideOnPages = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'];
  const shouldHideModal = hideOnPages.includes(location.pathname);

  const localAccepted = (termsId) => {
    try {
      return !!localStorage.getItem(LOCAL_KEY_PREFIX + termsId);
    } catch (e) {
      return false;
    }
  };

  const markLocalAccepted = (termsId) => {
    try {
      localStorage.setItem(LOCAL_KEY_PREFIX + termsId, '1');
    } catch (e) {
      // ignore
    }
  };

  const fetchCurrentTerms = async () => {
    try {
      const res = await api.get('/terms/current');
      const current = res.data?.data?.terms || null;
      if (!current) return setTerms(null);

      if (user) {
        try {
          const authRes = await api.get('/auth/terms/current');
          const authTerms = authRes.data?.data?.terms || current;
          setTerms(authTerms);
          if (!authTerms.hasAccepted) setShow(true);
        } catch (e) {
          setTerms(current);
          if (!localAccepted(current._id)) setShow(true);
        }
      } else {
        setTerms(current);
        if (!localAccepted(current._id)) setShow(true);
      }
    } catch (error) {
      console.error('Failed to fetch terms:', error);
    }
  };

  useEffect(() => {
    fetchCurrentTerms();
    if (socket) {
      socket.on('newTermsCreated', () => {
        fetchCurrentTerms();
      });
    }

    return () => {
      if (socket) socket.off('newTermsCreated');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, socket]);

  const handleAccept = async () => {
    if (!terms) return;
    setLoading(true);
    try {
      if (user) {
        await api.post('/auth/terms/accept', { termsId: terms._id });
      } else {
        markLocalAccepted(terms._id);
      }
      markLocalAccepted(terms._id);
      setShow(false);
    } catch (error) {
      console.error('Accept terms failed:', error);
      alert('Failed to accept terms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (user) {
      logout();
    }
    window.location.href = '/login';
  };

  if (!terms || !show || shouldHideModal) return null;

  return (
    <div className="tm-overlay">
      <div className="tm-modal">
        <div className="tm-header">
          <div className="tm-icon">📜</div>
          <div>
            <div className="tm-header-title">PLEASE READ</div>
            <h2 className="tm-modal-title">{terms.title || 'Terms and Conditions'}</h2>
          </div>
        </div>

        <div className="tm-content-container">
          <div className="tm-content" dangerouslySetInnerHTML={{ __html: terms.content || 'No content available' }} />
        </div>

        <div className="tm-footer">
          <p className="tm-disclaimer">✓ You need to accept these terms to continue using our services</p>
          <div className="tm-button-container">
            <button onClick={handleDecline} className="tm-decline">✖ Decline & Exit</button>
            <button onClick={handleAccept} className="tm-accept" disabled={loading}>{loading ? '⏳ Processing...' : '✓ Accept & Continue'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
