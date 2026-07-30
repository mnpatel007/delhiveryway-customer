import React from 'react';
import { Link } from 'react-router-dom';
import './InfoPage.css';

const PartnerPage = () => (
  <div className="info-page">
    <div className="info-hero">
      <span className="info-eyebrow">Partner with us</span>
      <h1>Bring your shop to more customers.</h1>
      <p>
        List your shop on DelhiveryWay and reach nearby customers who are already looking for what
        you sell — food, groceries and daily essentials.
      </p>
    </div>

    <div className="info-body">
      <h2>Why partner with DelhiveryWay</h2>
      <div className="info-cards">
        <div className="info-card">
          <h3>More orders</h3>
          <p>Get discovered by customers in your neighbourhood, without building your own app.</p>
        </div>
        <div className="info-card">
          <h3>You stay in control</h3>
          <p>Manage your products, pricing and availability from a simple shop dashboard.</p>
        </div>
        <div className="info-card">
          <h3>We handle delivery</h3>
          <p>Personal shoppers and delivery are taken care of — you focus on your shop.</p>
        </div>
      </div>

      <h2>Ready to get started?</h2>
      <p>
        Tell us about your shop and we will help you get set up. It only takes a quick message to
        begin.
      </p>
      <Link className="info-cta" to="/community">
        Become a partner →
      </Link>
    </div>
  </div>
);

export default PartnerPage;
