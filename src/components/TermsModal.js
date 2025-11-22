import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Add animation styles
const styles = `
  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const LOCAL_KEY_PREFIX = 'accepted_terms_';

const TermsModal = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [terms, setTerms] = useState(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Don't show on login/signup/verify-email/forgot-password/reset-password pages
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

      // If user is logged in, ask protected endpoint to know if they've accepted
      if (user) {
        try {
          const authRes = await api.get('/auth/terms/current');
          const authTerms = authRes.data?.data?.terms || current;
          setTerms(authTerms);
          if (!authTerms.hasAccepted) setShow(true);
        } catch (e) {
          // fallback
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
    // Listen for new terms created (if socket available)
    if (socket) {
      socket.on('newTermsCreated', (data) => {
        // Force re-fetch and show modal
        fetchCurrentTerms();
      });
    }

    return () => {
      if (socket) {
        socket.off('newTermsCreated');
      }
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
        // For anonymous users, acceptance is stored client-side
        markLocalAccepted(terms._id);
      }

      // Mark local as accepted too
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
    // If logged in, log out user and redirect to login
    if (user) {
      logout();
    }
    // force redirect to login page
    window.location.href = '/login';
  };

  if (!terms || !show || shouldHideModal) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header with gradient */}
        <div style={headerStyle}>
          <div style={iconStyle}>📜</div>
          <div>
            <div style={headerTitleStyle}>PLEASE READ</div>
            <h2 style={modalTitleStyle}>{terms.title || 'Terms and Conditions'}</h2>
          </div>
        </div>

        {/* Content area with scrolling */}
        <div style={contentContainerStyle}>
          <div style={contentStyle} dangerouslySetInnerHTML={{ __html: terms.content || 'No content available' }} />
        </div>

        {/* Footer with buttons */}
        <div style={footerStyle}>
          <p style={disclaimerStyle}>
            ✓ You need to accept these terms to continue using our services
          </p>
          <div style={buttonContainerStyle}>
            <button
              onClick={handleDecline}
              style={declineStyle}
              onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.background = '#fff'}
            >
              ✖ Decline & Exit
            </button>
            <button
              onClick={handleAccept}
              style={acceptStyle}
              disabled={loading}
              onMouseEnter={(e) => !loading && (e.target.style.background = '#0052a3')}
              onMouseLeave={(e) => !loading && (e.target.style.background = '#0066cc')}
            >
              {loading ? '⏳ Processing...' : '✓ Accept & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  backdropFilter: 'blur(4px)'
};

const modalStyle = {
  background: '#fff',
  borderRadius: '16px',
  width: '95%',
  maxWidth: '900px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  animation: 'slideUp 0.4s ease-out'
};

const headerStyle = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '32px',
  borderRadius: '16px 16px 0 0',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  color: '#fff'
};

const iconStyle = {
  fontSize: '48px',
  minWidth: '60px',
  textAlign: 'center'
};

const headerTitleStyle = {
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '2px',
  color: 'rgba(255, 255, 255, 0.8)',
  marginBottom: '8px',
  textTransform: 'uppercase'
};

const modalTitleStyle = {
  margin: '0',
  fontSize: '28px',
  fontWeight: '700',
  color: '#fff',
  lineHeight: '1.2'
};

const contentContainerStyle = {
  flex: 1,
  overflow: 'auto',
  padding: '32px',
  backgroundColor: '#f9f9f9',
  borderBottom: '1px solid #e0e0e0'
};

const contentStyle = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '1.8',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
};

const footerStyle = {
  padding: '24px 32px',
  backgroundColor: '#fff',
  borderRadius: '0 0 16px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const disclaimerStyle = {
  margin: '0',
  fontSize: '14px',
  color: '#666',
  fontStyle: 'italic'
};

const buttonContainerStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end'
};

const acceptStyle = {
  background: '#0066cc',
  color: '#fff',
  border: 'none',
  padding: '14px 28px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
  minWidth: '160px'
};

const declineStyle = {
  background: '#fff',
  color: '#666',
  border: '2px solid #e0e0e0',
  padding: '12px 24px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
  transition: 'all 0.3s ease',
  minWidth: '140px'
};

export default TermsModal;
