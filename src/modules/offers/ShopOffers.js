import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './ShopOffers.css';

const formatRupees = (n) => `₹${Math.round(Number(n) || 0)}`;

/**
 * The free-gift offers a shop is running, measured against what is in the
 * cart right now.
 *
 * The shop decides the rules and the backend decides what is actually given
 * away when the order is placed; this only shows the customer where they
 * stand and, for a "pick one" offer, collects their choice.
 *
 * @param shopId     the shop being ordered from
 * @param subtotal   the current cart subtotal
 * @param selections [{ offerId, productId }] chosen so far
 * @param onSelect   (offerId, productId) => void; omit to render read-only
 */
const ShopOffers = ({ shopId, subtotal = 0, selections = [], onSelect }) => {
  const [offers, setOffers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!shopId) {
      setOffers([]);
      setLoaded(true);
      return undefined;
    }

    api
      .get(`/shops/${shopId}/offers`)
      .then((res) => {
        if (!cancelled) setOffers(res.data?.data?.offers || []);
      })
      .catch(() => {
        // Offers are a bonus, never a reason to block the checkout.
        if (!cancelled) setOffers([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  if (!loaded || offers.length === 0) return null;

  const chosenFor = (offerId) =>
    selections.find((s) => String(s.offerId) === String(offerId))?.productId;

  return (
    <div className="shop-offers">
      <div className="shop-offers-head">
        <span className="shop-offers-title">Free with your order</span>
      </div>

      {offers.map((offer) => {
        const unlocked = subtotal >= offer.minSubtotal;
        const remaining = Math.max(0, offer.minSubtotal - subtotal);
        const progress = Math.min(100, Math.round((subtotal / offer.minSubtotal) * 100));
        const picked = chosenFor(offer._id);
        const needsPick = unlocked && offer.mode === 'choice' && !picked;
        const inStockRewards = offer.rewards.filter((r) => r.inStock);

        // Nothing on this offer is available right now, so it cannot be given.
        if (inStockRewards.length === 0) return null;

        return (
          <div
            key={offer._id}
            className={`shop-offer ${unlocked ? 'unlocked' : ''} ${needsPick ? 'needs-pick' : ''}`}
          >
            <div className="shop-offer-top">
              <span className="shop-offer-name">{offer.title}</span>
              {unlocked ? (
                <span className="shop-offer-badge on">Unlocked</span>
              ) : (
                <span className="shop-offer-badge">Add {formatRupees(remaining)} more</span>
              )}
            </div>

            {!unlocked && (
              <div className="shop-offer-bar" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>
            )}

            {offer.mode === 'auto' ? (
              <p className="shop-offer-line">
                {unlocked ? 'Added free: ' : 'You will get: '}
                <strong>
                  {offer.rewardQuantity > 1 ? `${offer.rewardQuantity} × ` : ''}
                  {inStockRewards[0].name}
                </strong>
              </p>
            ) : (
              <>
                <p className="shop-offer-line">
                  {unlocked
                    ? 'Pick your free item:'
                    : `Then pick one free: ${inStockRewards.map((r) => r.name).join(', ')}`}
                </p>

                {unlocked && (
                  <div className="shop-offer-choices">
                    {inStockRewards.map((reward) => {
                      const on = String(picked) === String(reward._id);
                      return (
                        <button
                          type="button"
                          key={reward._id}
                          className={`shop-offer-choice ${on ? 'on' : ''}`}
                          onClick={() => onSelect && onSelect(offer._id, reward._id)}
                          disabled={!onSelect}
                        >
                          {reward.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {needsPick && onSelect && (
              <p className="shop-offer-hint">Choose one, or it will not be added.</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ShopOffers;
