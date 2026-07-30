import React from 'react';
import { Link } from 'react-router-dom';
import './InfoPage.css';

const CareersPage = () => (
  <div className="info-page">
    <div className="info-hero">
      <span className="info-eyebrow">Careers</span>
      <h1>Build local commerce with us.</h1>
      <p>
        We are a small, fast-moving team making everyday delivery better for neighbourhoods across
        India. If that excites you, we would love to talk.
      </p>
    </div>

    <div className="info-body">
      <h2>Where we could use help</h2>
      <div className="info-cards">
        <div className="info-card">
          <h3>Engineering</h3>
          <p>Full-stack (MERN), building the customer, shopper and admin experiences.</p>
        </div>
        <div className="info-card">
          <h3>Operations</h3>
          <p>Onboarding shops, coordinating personal shoppers, and keeping deliveries smooth.</p>
        </div>
        <div className="info-card">
          <h3>Growth &amp; support</h3>
          <p>Helping customers and local shops get the most out of DelhiveryWay.</p>
        </div>
      </div>

      <h2>Don't see your role?</h2>
      <p>
        We are growing, so we are always happy to hear from talented people. Tell us how you would
        like to contribute and share a bit about yourself.
      </p>
      <Link className="info-cta" to="/community">
        Reach out →
      </Link>
    </div>
  </div>
);

export default CareersPage;
