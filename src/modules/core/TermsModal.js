import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiCall, configAPI, api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
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
      // 1. Fetch public terms (for guests or fallback)
      let publicTerms = null;
      try {
        const res = await api.get('/terms/current');
        publicTerms = res.data?.data?.terms || null;
      } catch (e) {
        console.warn('Failed to fetch public terms', e);
      }

      // 2. If user is logged in, fetch authenticated terms (includes testing mode terms)
      if (user) {
        try {
          const authRes = await api.get('/auth/terms/current');
          const authTerms = authRes.data?.data?.terms;

          if (authTerms) {
            setTerms(authTerms);
            if (!authTerms.hasAccepted) setShow(true);
            return;
          }
        } catch (e) {
          console.error('Failed to fetch auth terms', e);
        }
      }

      // 3. Fallback to public terms if no auth terms found (or user not logged in)
      if (publicTerms) {
        setTerms(publicTerms);
        // Only show if not locally accepted (mostly for guests)
        if (!localAccepted(publicTerms._id)) setShow(true);
      } else {
        setTerms(null);
        setShow(false);
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
    // Clear any local acceptance
    if (terms && terms._id) {
      localStorage.removeItem(LOCAL_KEY_PREFIX + terms._id);
    }

    if (user) {
      logout();
    }

    // Force clear any other potential debris
    localStorage.removeItem('customerAuth');

    // Use replace to prevent back navigation
    window.location.replace('/login');
  };

  if (!terms || !show || shouldHideModal) return null;

  return (
    <div className="tm-overlay">
      <div className="tm-backdrop-blur"></div>
      <div className="tm-modal">
        <div className="tm-glow-effect"></div>

        <div className="tm-header">
          <div className="tm-header-decoration">
            <div className="tm-decoration-circle"></div>
            <div className="tm-decoration-circle"></div>
            <div className="tm-decoration-circle"></div>
          </div>
          <div className="tm-icon-wrapper">
            <svg className="tm-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="tm-modal-title">Terms and Conditions</h2>
          <p className="tm-subtitle">Please review our terms before continuing</p>
        </div>

        <div className="tm-content-wrapper">
          <div className="tm-scroll-indicator">
            <div className="tm-scroll-line"></div>
          </div>
          <div className="tm-content-container">
            <div className="tm-content" dangerouslySetInnerHTML={{ __html: terms.content || '<p>Please review the terms and conditions.</p>' }} />
          </div>
        </div>

        <div className="tm-footer">
          <div className="tm-notice">
            <svg className="tm-notice-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="tm-notice-text">You must accept these terms to continue using our services</p>
          </div>
          <div className="tm-button-container">
            <button onClick={handleDecline} className="tm-decline">
              <span className="tm-btn-text">Decline & Exit</span>
            </button>
            <button onClick={handleAccept} className="tm-accept" disabled={loading}>
              <span className="tm-btn-icon">
                {loading ? (
                  <svg className="tm-spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="tm-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="tm-btn-text">{loading ? 'Processing...' : 'Accept & Continue'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;