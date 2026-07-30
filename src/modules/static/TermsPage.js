import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './InfoPage.css';

const TermsPage = () => {
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/terms/current');
        if (!active) return;
        // Backend shape: { success, data: { terms: {...} | null } }
        setTerms(res?.data?.data?.terms || null);
      } catch (e) {
        if (active) setError('We could not load the terms right now. Please try again later.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="info-page">
      <div className="info-hero">
        <span className="info-eyebrow">Legal</span>
        <h1>Terms &amp; privacy</h1>
        <p>The terms and privacy policy that apply when you use DelhiveryWay.</p>
      </div>

      <div className="info-body">
        {loading && <p>Loading…</p>}

        {!loading && error && <div className="info-note">{error}</div>}

        {!loading && !error && !terms && (
          <div className="info-note">
            Our terms and privacy policy haven&apos;t been published yet. Please check back soon.
          </div>
        )}

        {!loading && !error && terms && (
          <>
            {terms.title && <h2 style={{ marginTop: 0 }}>{terms.title}</h2>}
            <p className="info-meta">
              {terms.version ? `Version ${terms.version}` : ''}
              {terms.version && terms.createdAt ? ' · ' : ''}
              {terms.createdAt ? `Updated ${new Date(terms.createdAt).toLocaleDateString()}` : ''}
            </p>
            <div className="info-terms-content">{terms.content}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default TermsPage;
