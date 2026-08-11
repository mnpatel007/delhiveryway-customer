import React from 'react';
import './PromoBanner.css';

// Add more entries here to turn this into a rotating carousel later —
// the layout already supports it, only a slide index/dots would need adding.
const PROMO_BANNERS = [
  {
    id: 'kanak-family-restaurant',
    image: '/promos/kanak-family-restaurant.jpeg',
    alt: 'Kanak, Family Restaurant — Authentic Indian & Indo-Chinese Cuisine, Pure Vegetarian',
    href: null, // set to `/shop/<shopId>` once we have the shop's id
  },
];

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
