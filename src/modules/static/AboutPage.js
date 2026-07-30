import React from 'react';
import { Link } from 'react-router-dom';
import './InfoPage.css';

const AboutPage = () => (
  <div className="info-page">
    <div className="info-hero">
      <span className="info-eyebrow">About us</span>
      <h1>Your neighbourhood, delivered.</h1>
      <p>
        DelhiveryWay connects you with the food, grocery and everyday-essential shops around you —
        and brings your order right to your door.
      </p>
    </div>

    <div className="info-body">
      <p>
        We started DelhiveryWay with a simple belief: the best shops are often the ones already near
        you. Instead of pulling everything into one giant warehouse, we help the local shops you
        already trust reach you faster — with live order tracking and a personal shopper who picks
        your items with care.
      </p>

      <h2>What we stand for</h2>
      <div className="info-cards">
        <div className="info-card">
          <h3>Local first</h3>
          <p>We put neighbourhood shops and vendors at the centre of everything we do.</p>
        </div>
        <div className="info-card">
          <h3>Honest delivery</h3>
          <p>Clear pricing, real tracking, and no over-promises about your order.</p>
        </div>
        <div className="info-card">
          <h3>People who care</h3>
          <p>Real personal shoppers handle your order — not a faceless conveyor belt.</p>
        </div>
      </div>

      <h2>Say hello</h2>
      <p>Questions, ideas, or feedback? We would love to hear from you.</p>
      <Link className="info-cta" to="/community">
        Get in touch →
      </Link>
    </div>
  </div>
);

export default AboutPage;
