import React from 'react';
import './PromoBanner.css';

// No promo banner is running. Add an entry here to put one up again:
// { id, image, alt, href } — href null for a banner that is not clickable.
// With several entries this becomes a carousel; the layout already supports
// it, only a slide index and dots would need adding.
const PROMO_BANNERS = [];

const PromoBanner = () => {
  if (PROMO_BANNERS.length === 0) return null;

  return (
    <div className="dw-wrap">
      <div className="promo-banner-strip">
        {PROMO_BANNERS.map((banner) =>
          banner.href ? (
            <a key={banner.id} href={banner.href} className="promo-banner-slide">
              <img src={banner.image} alt={banner.alt} />
            </a>
          ) : (
            <div key={banner.id} className="promo-banner-slide">
              <img src={banner.image} alt={banner.alt} />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default PromoBanner;
