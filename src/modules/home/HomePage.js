import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { useSocket } from '../../context/SocketContext';
import PermanentNotices from './PermanentNotices';
import ActiveOrdersWidget from './ActiveOrdersWidget';
import Logo from '../core/Logo';
import {
  calculateDeliveryFeesBulk,
  getDeliveryFeeDisplay,
  getCustomerLocation,
  getCurrentLocation,
} from '../../utils/deliveryCalculator';
import axios from 'axios';
import './HomePage.css';

const UN = 'https://images.unsplash.com/';
const CATEGORIES = [
  { key: 'restaurant', label: 'Food', img: 'photo-1504674900247-0877df9cc836' },
  { key: 'grocery', label: 'Grocery', img: 'photo-1542838132-92c53300491e' },
];
const FILTERS = ['Sort', 'Top rated', 'Fastest', 'Offers', 'Open now'];

const Svg = ({ d, s = {} }) => (
  <svg
    viewBox="0 0 24 24"
    style={{
      width: 18,
      height: 18,
      stroke: 'currentColor',
      fill: 'none',
      strokeWidth: 1.9,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...s,
    }}
  >
    {d}
  </svg>
);
const starIcon = <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z" />;
const pinIcon = (
  <>
    <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </>
);
const bikeIcon = (
  <>
    <circle cx="6" cy="17" r="3" />
    <circle cx="18" cy="17" r="3" />
    <path d="M6 17l4-9h5l3 9M10 8h6" />
  </>
);
const tagIcon = (
  <>
    <path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0l-7.8-7.8V3h9.8l8 8a2 2 0 010 2.4z" />
    <circle cx="7.5" cy="7.5" r="1.2" />
  </>
);
const boxIcon = (
  <>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
  </>
);

const HomePage = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('Sort');
  const [deliveryFees, setDeliveryFees] = useState({});
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [gettingLocation, setGettingLocation] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const searchInputRef = useRef(null);
  const { indexLoaded, searchLocal } = useSearch();
  const { socket } = useSocket();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [globalClosure, setGlobalClosure] = useState({ isClosed: false });

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const API_URL =
        process.env.REACT_APP_API_URL || 'https://delhiveryway-backend-1.onrender.com/api';

      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '20');

      const url = `${API_URL}/shops?${params.toString()}`;

      const response = await axios.get(url, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });

      let shopsData = [];
      if (response.data.success) {
        shopsData = response.data.data?.shops || response.data.shops || [];
      } else if (Array.isArray(response.data)) {
        shopsData = response.data;
      } else if (response.data.shops) {
        shopsData = response.data.shops;
      }

      const closureInfo = response.data?.data?.globalClosure ||
        response.data?.globalClosure || { isClosed: false };
      setGlobalClosure(closureInfo);

      if (shopsData.length > 0) {
        const sortedShops = shopsData.sort((a, b) => {
          const aOrders = a.orderCount || a.totalOrders || 0;
          const bOrders = b.orderCount || b.totalOrders || 0;
          if (aOrders !== bOrders) return bOrders - aOrders;

          const aOpen = a.isOpenNow || isShopOpen(a);
          const bOpen = b.isOpenNow || isShopOpen(b);
          if (aOpen !== bOpen) return bOpen - aOpen;

          const aItems = a.productCount || 0;
          const bItems = b.productCount || 0;
          return bItems - aItems;
        });

        setShops(sortedShops);
        setError('');
        requestLocationAndCalculateFees(sortedShops);
      } else {
        setShops([]);
        setError('');
      }
    } catch (err) {
      console.error('Failed to fetch shops:', err);
      setShops([]);
      setError('We could not load shops right now. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  const requestLocationAndCalculateFees = useCallback(async (shopsData) => {
    if (!shopsData || shopsData.length === 0) return;
    setGettingLocation(true);
    try {
      let loc = await getCurrentLocation();
      if (loc) {
        setLocationPermission('granted');
        setCustomerLocation(loc);
      } else {
        loc = getCustomerLocation();
        if (loc) {
          setCustomerLocation(loc);
        } else {
          setLocationPermission('denied');
          return;
        }
      }

      const shopIds = shopsData
        .map((shop) => shop._id)
        .filter((id) => id && !id.startsWith('sample'));
      if (shopIds.length === 0) return;

      const feeResults = await calculateDeliveryFeesBulk(shopIds, loc);
      const feesMap = {};
      feeResults.forEach((result) => {
        if (result.shopId && !result.error) {
          feesMap[result.shopId] = {
            deliveryFee: result.deliveryFee,
            originalDeliveryFee: result.originalDeliveryFee,
            discountApplied: result.discountApplied,
          };
        }
      });
      setDeliveryFees(feesMap);
    } catch (error) {
      console.error('Error calculating delivery fees:', error);
    } finally {
      setGettingLocation(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Keep the global closure banner in sync in real time (admin can open/close while the page is open)
  useEffect(() => {
    if (!socket) return;
    const handleClosureUpdate = (data) => {
      setGlobalClosure(data || { isClosed: false });
    };
    socket.on('globalShopClosureUpdated', handleClosureUpdate);
    return () => socket.off('globalShopClosureUpdated', handleClosureUpdate);
  }, [socket]);

  useEffect(() => {
    if (location && (location.pathname === '/' || location.pathname === '')) {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }
  }, [location.key, location.pathname]);

  useEffect(() => {
    const autoRequestLocation = async () => {
      const existingLocation = getCustomerLocation();
      if (existingLocation) {
        setCustomerLocation(existingLocation);
        setLocationPermission('granted');
        return;
      }
      const locationDenied = localStorage.getItem('locationDenied');
      if (!locationDenied) {
        try {
          const loc = await getCurrentLocation();
          if (loc) {
            setCustomerLocation(loc);
            setLocationPermission('granted');
            if (shops.length > 0) requestLocationAndCalculateFees(shops);
          }
        } catch (error) {
          localStorage.setItem('locationDenied', 'true');
          setLocationPermission('denied');
        }
      } else {
        setLocationPermission('denied');
      }
    };
    const t = setTimeout(autoRequestLocation, 1000);
    return () => clearTimeout(t);
  }, [shops, requestLocationAndCalculateFees]);

  const isShopOpen = (shop) => {
    if (!shop?.operatingHours) return true;
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const day = dayNames[istTime.getDay()];
    const currentTime = istTime.toTimeString().slice(0, 5);
    const todayHours = shop.operatingHours[day];
    if (!todayHours || todayHours.closed) return false;
    if (!todayHours.open || !todayHours.close) return true;
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  const handleShopClick = (shopId) => {
    if (shopId.startsWith('sample')) return;
    navigate(`/shop/${shopId}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(query.trim());
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      if (indexLoaded) {
        const local = searchLocal(query, 500);
        if (cancelled) return;
        setSuggestions(local);
        setShowSuggestions(local.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, indexLoaded, searchLocal]);

  const handleSuggestionClick = (item) => {
    if (item.shopId && item.shopId._id) {
      navigate(`/shop/${item.shopId._id}?highlight=${encodeURIComponent(item._id)}`);
    } else if (item.shopId) {
      navigate(`/shop/${item.shopId}?highlight=${encodeURIComponent(item._id)}`);
    } else {
      setSearchTerm(item.name || '');
      navigate(`/search?q=${encodeURIComponent(item.name || '')}`);
    }
    setQuery('');
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setQuery('');
    setSelectedCategory('all');
  };

  const pickCategory = (key) => {
    setSelectedCategory((prev) => (prev === key ? 'all' : key));
    const el = document.getElementById('dw-shops');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const feeInfo = (shop) => {
    const fr = deliveryFees[shop._id];
    if (fr && typeof fr === 'object' && fr.deliveryFee !== undefined) {
      const discountApplied = fr.discountApplied || fr.originalDeliveryFee > fr.deliveryFee;
      return {
        free: fr.deliveryFee === 0,
        text: fr.deliveryFee === 0 ? 'Free delivery' : `₹${fr.deliveryFee} delivery`,
        originalFee: fr.originalDeliveryFee,
        discountApplied,
      };
    }
    if (typeof fr === 'number') {
      return { free: fr === 0, text: fr === 0 ? 'Free delivery' : `₹${fr} delivery` };
    }
    const d = getDeliveryFeeDisplay(shop);
    return { free: /free/i.test(d), text: d };
  };

  const filteredShops = [...shops]
    .filter((shop) => {
      const open = shop.isOpenNow ?? isShopOpen(shop);
      const fee = feeInfo(shop);

      if (activeFilter === 'Open now' && !open) {
        return false;
      }
      if (activeFilter === 'Top rated' && (!shop.rating?.average || shop.rating.average < 4.0)) {
        return false;
      }
      if (activeFilter === 'Offers' && !fee.discountApplied && !fee.free) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (activeFilter === 'Top rated') {
        const aRating = a.rating?.average || 0;
        const bRating = b.rating?.average || 0;
        return bRating - aRating;
      }
      if (activeFilter === 'Fastest') {
        const aTime = a.preparationTime || 30;
        const bTime = b.preparationTime || 30;
        return aTime - bTime;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="dw-home">
        <div className="dw-state">
          <Logo size="large" showText={true} className="loading" />
          <h3>Finding great shops near you…</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="dw-home">
      <PermanentNotices />
      {globalClosure?.isClosed && (
        <div className="dw-wrap">
          <div className="dw-closure">
            <span className="dw-closure-ic">!</span>
            <div>
              <strong>All shops are currently closed.</strong>{' '}
              {globalClosure.mode === 'manual' && 'Please check back later.'}
              {globalClosure.mode === 'until_time' && globalClosure.reopenAt && (
                <>Reopening at {new Date(globalClosure.reopenAt).toLocaleString()}.</>
              )}
              {globalClosure.mode === 'next_day' && globalClosure.reopenAt && (
                <>Reopening on {new Date(globalClosure.reopenAt).toLocaleDateString()}.</>
              )}
              {globalClosure.reason ? (
                <div className="dw-closure-reason">{globalClosure.reason}</div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="dw-hero">
        <div className="dw-wrap dw-hero-grid">
          <div>
            <div className="dw-eyebrow">Groceries · Food</div>
            <h1>
              Everything you crave,
              <br />
              <span className="dw-grad">delivered in minutes.</span>
            </h1>
            <p className="dw-sub">
              {user?.name ? `Hi ${user.name.split(' ')[0]} — ` : ''}fresh food and daily essentials
              from shops around the corner.
            </p>

            <form className="dw-herosearch" onSubmit={handleSearch}>
              <div className="dw-field">
                <Svg
                  d={
                    <>
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4-4" />
                    </>
                  }
                />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What are you hungry for?"
                  aria-label="Search products"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="dw-suggest" role="listbox">
                    {(() => {
                      const grouped = {};
                      suggestions.forEach((s) => {
                        const sid = s.shopId?._id || s.shopId || 'unknown';
                        const sname = s.shopId?.name || 'Shop';
                        if (!grouped[sid]) grouped[sid] = { sname, products: [] };
                        grouped[sid].products.push(s);
                      });
                      return Object.entries(grouped).map(([sid, { sname, products }]) => (
                        <div key={sid} className="dw-suggest-group">
                          <div className="dw-suggest-head">{sname}</div>
                          {products.slice(0, 3).map((s) => (
                            <div
                              key={s._id}
                              role="option"
                              tabIndex={0}
                              className="dw-suggest-item"
                              onClick={() => handleSuggestionClick(s)}
                            >
                              {s.images?.[0] && <img src={s.images[0]} alt={s.name} />}
                              <div>
                                <div className="dw-suggest-name">{s.name}</div>
                                <div className="dw-suggest-price">₹{s.price}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
              <button type="submit" className="dw-cta">
                Find food
              </button>
            </form>

            <div className="dw-trust">
              <div>
                <span className="dw-trust-ic">
                  <Svg d={<path d="M5 13l4 4L19 7" />} />
                </span>
                Live order tracking
              </div>
              <div>
                <span className="dw-trust-ic">
                  <Svg
                    d={
                      <>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </>
                    }
                  />
                </span>
                Fast delivery
              </div>
              <div>
                <span className="dw-trust-ic">
                  <Svg d={starIcon} />
                </span>
                Trusted local shops
              </div>
            </div>
          </div>
          <div className="dw-collage">
            <div className="dw-ph dw-ph-a">
              <img
                alt=""
                src={`${UN}photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=520&q=70`}
              />
            </div>
            <div className="dw-ph dw-ph-b">
              <img
                alt=""
                src={`${UN}photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=70`}
              />
            </div>
            <div className="dw-ph dw-ph-c">
              <img
                alt=""
                src={`${UN}photo-1542838132-92c53300491e?auto=format&fit=crop&w=320&q=70`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="dw-wrap">
        <ActiveOrdersWidget />
      </div>

      {/* CATEGORIES */}
      <section className="dw-wrap">
        <div className="dw-head">
          <h2>What's on your mind?</h2>
        </div>
        <div className="dw-cats">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`dw-cat ${selectedCategory === c.key ? 'on' : ''}`}
              onClick={() => pickCategory(c.key)}
            >
              <img alt={c.label} src={`${UN}${c.img}?auto=format&fit=crop&w=300&q=65`} />
              <span className="dw-cat-ov">
                <span>{c.label}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* PROMOS */}
      <section className="dw-wrap">
        <div className="dw-promos">
          <div className="dw-promo dw-p1">
            <div>
              <h3>50% OFF</h3>
              <p>Coming soon on your first 3 orders</p>
            </div>
          </div>
          <div className="dw-promo dw-p2">
            <div>
              <h3>Special Offers</h3>
              <p>Free item above ₹500 &amp; festive discounts</p>
            </div>
          </div>
          <div className="dw-promo dw-p3">
            <div>
              <h3>Fresh &amp; fast</h3>
              <p>delivered within 30 min of order pickup</p>
            </div>
          </div>
        </div>
      </section>

      {/* SHOPS */}
      <section className="dw-wrap" id="dw-shops">
        <div className="dw-head">
          <h2>
            {searchTerm
              ? `Results for "${searchTerm}"`
              : selectedCategory !== 'all'
                ? `${selectedCategory[0].toUpperCase()}${selectedCategory.slice(1)} shops`
                : 'Top picks near you'}
            <span className="dw-count">{filteredShops.length} shops</span>
          </h2>
          {(searchTerm || selectedCategory !== 'all') && (
            <button className="dw-clear" onClick={clearSearch}>
              Clear
            </button>
          )}
        </div>

        <div className="dw-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`dw-chip ${activeFilter === f ? 'on' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {error ? (
          <div className="dw-empty">
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="dw-cta" onClick={fetchShops}>
              Try again
            </button>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="dw-empty">
            <h3>No shops found</h3>
            <p>
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or category.'
                : 'No shops are currently available.'}
            </p>
            <button className="dw-cta" onClick={clearSearch}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="dw-grid">
            {filteredShops.map((shop) => {
              const open = shop.isOpenNow ?? isShopOpen(shop);
              const rating = shop.rating?.average;
              const fee = feeInfo(shop);
              const topRated = (rating || 0) >= 4.5;
              return (
                <div
                  key={shop._id}
                  className="dw-card"
                  onClick={() => handleShopClick(shop._id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleShopClick(shop._id);
                  }}
                >
                  <div className="dw-media">
                    <div className="dw-img-wrap">
                      {shop.images && shop.images.length > 0 ? (
                        <img
                          src={shop.images[0]}
                          alt={shop.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="dw-media-ph">
                          <Svg
                            d={boxIcon}
                            s={{ width: 40, height: 40, stroke: '#fff', opacity: 0.9 }}
                          />
                        </div>
                      )}
                    </div>
                    {topRated && (
                      <div className="dw-ribbon">
                        <Svg d={starIcon} s={{ width: 13, height: 13, fill: '#fff' }} />
                        Top rated
                      </div>
                    )}
                    <button
                      className="dw-fav"
                      aria-label="Save"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.currentTarget.classList.toggle('on');
                      }}
                    >
                      <Svg d={<path d="M20 12l-8 8-8-8a5 5 0 117-7 5 5 0 117 7z" />} />
                    </button>
                    <div className={`dw-feepill ${fee.free ? 'free' : ''}`}>
                      <Svg d={bikeIcon} s={{ width: 16, height: 16 }} />
                      {fee.discountApplied && fee.originalFee && (
                        <span className="dw-fee-original">₹{fee.originalFee}</span>
                      )}
                      <span>{fee.text}</span>
                    </div>
                  </div>
                  <div className="dw-body">
                    <div className="dw-row">
                      <h3>{shop.name}</h3>
                      {rating ? (
                        <span className="dw-rate">
                          <Svg
                            d={starIcon}
                            s={{ width: 13, height: 13, fill: '#fff', stroke: '#fff' }}
                          />
                          {rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <div className="dw-cuisine">
                      {shop.description
                        ? shop.description.length > 64
                          ? `${shop.description.slice(0, 64)}…`
                          : shop.description
                        : shop.category}
                    </div>
                    <div className="dw-meta">
                      {shop.productCount !== undefined && (
                        <span className="dw-m">
                          <Svg d={boxIcon} s={{ width: 16, height: 16 }} />
                          {shop.productCount} items
                        </span>
                      )}
                      {shop.address?.city && (
                        <span className="dw-m">
                          <Svg d={pinIcon} s={{ width: 16, height: 16 }} />
                          {shop.address.city}
                        </span>
                      )}
                      <span className={`dw-status ${open ? 'open' : 'closed'}`}>
                        ● {open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    {fee.free && (
                      <div className="dw-off">
                        <Svg d={tagIcon} s={{ width: 15, height: 15 }} />
                        Free delivery on this shop
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
