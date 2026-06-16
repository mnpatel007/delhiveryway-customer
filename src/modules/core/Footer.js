import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" className="ft-ic">
    {d}
  </svg>
);

const Footer = () => (
  <footer className="ft">
    <div className="ft-grid">
      <div>
        <div className="ft-logo">
          <span className="ft-dot">
            <Ico
              d={
                <>
                  <path d="M3 7l9-4 9 4-9 4-9-4z" />
                  <path d="M3 7v10l9 4 9-4V7" />
                </>
              }
            />
          </span>
          DelhiveryWay
        </div>
        <p className="ft-about">
          Your neighbourhood, delivered. Food, groceries and essentials from the shops you already
          love — faster than ever.
        </p>
        <div className="ft-socials">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
            <Ico
              d={
                <>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="1" />
                </>
              }
            />
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
            <Ico d={<path d="M4 4l16 16M20 4L4 20" />} />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
            <Ico
              d={<path d="M14 8h3V4h-3a4 4 0 00-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8a1 1 0 011-1z" />}
            />
          </a>
        </div>
      </div>
      <div>
        <h4>Company</h4>
        <Link to="/">About us</Link>
        <Link to="/">Careers</Link>
        <Link to="/community">Community</Link>
        <Link to="/">Partner with us</Link>
      </div>
      <div>
        <h4>Help</h4>
        <Link to="/orders">Order tracking</Link>
        <Link to="/profile">My account</Link>
        <Link to="/">Help centre</Link>
        <Link to="/">Terms & privacy</Link>
      </div>
      <div>
        <h4>Get the app</h4>
        <a className="ft-app" href="/">
          <Ico
            d={
              <>
                <path d="M12 2a4 4 0 00-4 4M5 9h14l-1 11H6L5 9z" />
              </>
            }
          />
          <span>
            <small>Download on the</small>
            <b>App Store</b>
          </span>
        </a>
        <a className="ft-app" href="/">
          <Ico d={<path d="M4 3l16 9-16 9V3z" />} />
          <span>
            <small>Get it on</small>
            <b>Google Play</b>
          </span>
        </a>
      </div>
    </div>
    <div className="ft-bar">
      <span>© {new Date().getFullYear()} DelhiveryWay. Made with care in Mumbai.</span>
      <div className="ft-pay">
        <span>VISA</span>
        <span>UPI</span>
        <span>RuPay</span>
        <span>Stripe</span>
      </div>
    </div>
  </footer>
);

export default Footer;
