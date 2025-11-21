import React, { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const LOCAL_KEY_PREFIX = 'accepted_terms_';

const TermsModal = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [terms, setTerms] = useState(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

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

  if (!terms || !show) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>{terms.title || 'Terms & Conditions'}</h2>
        <div style={{ maxHeight: '50vh', overflow: 'auto', marginBottom: '16px' }} dangerouslySetInnerHTML={{ __html: terms.content }} />
        <div style={{ textAlign: 'right' }}>
          <button onClick={handleDecline} style={declineStyle}>Decline</button>
          <button onClick={handleAccept} style={acceptStyle} disabled={loading}>{loading ? 'Please wait...' : 'Accept'}</button>
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
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
};

const modalStyle = {
  background: '#fff',
  padding: '20px',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '800px',
  boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
};

const acceptStyle = {
  background: '#0066cc',
  color: '#fff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  marginLeft: '8px'
};

const declineStyle = {
  background: '#fff',
  color: '#333',
  border: '1px solid #ccc',
  padding: '10px 16px',
  borderRadius: '4px',
  cursor: 'pointer'
};

export default TermsModal;
