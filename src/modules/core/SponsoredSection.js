import React from 'react';
import { useNavigate } from 'react-router-dom';

const SponsoredSection = ({ shops, onShopClick }) => {
    // If no shops passed, show skeletons or return null
    // We'll assume the parent passes data or we show placeholders
    const displayShops = shops && shops.length > 0 ? shops.slice(0, 3) : [
        { _id: 's1', name: 'Burger King', rating: { average: 4.5 }, images: [] },
        { _id: 's2', name: 'Pizza Hut', rating: { average: 4.3 }, images: [] },
        { _id: 's3', name: 'Subway', rating: { average: 4.6 }, images: [] }
    ];

    const styles = {
        container: {
            marginBottom: '10px',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px'
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: 0,
            color: '#333'
        },
        badge: {
            background: '#ff4757',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
        },
        card: {
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: '0.3s',
            border: '1px solid #eee'
        },
        image: {
            width: '100%',
            height: '15vh',
            minHeight: '120px',
            maxHeight: '180px',
            objectFit: 'cover',
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
        },
        content: {
            padding: '15px'
        },
        name: {
            fontWeight: '600',
            fontSize: '1.1rem',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        meta: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            color: '#666'
        },
        sponsoredLabel: {
            color: '#ff9f43',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            marginBottom: '5px',
            display: 'block'
        },
        btn: {
            width: '100%',
            marginTop: '10px',
            padding: '8px',
            background: '#ff9f43',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Featured Restaurants</h2>
                <div style={styles.badge}>Sponsored Listings</div>
            </div>
            <div style={styles.grid}>
                {displayShops.map(shop => (
                    <div
                        key={shop._id}
                        style={styles.card}
                        onClick={() => onShopClick && onShopClick(shop._id)}
                        className="hover-scale"
                    >
                        <div style={styles.image}>
                            {shop.images?.[0] ? <img src={shop.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍔'}
                        </div>
                        <div style={styles.content}>
                            <span style={styles.sponsoredLabel}>Sponsored</span>
                            <div style={styles.name}>{shop.name}</div>
                            <div style={styles.meta}>
                                <span>⭐ {shop.rating?.average || 4.5}</span>
                                <span>Fast Delivery</span>
                            </div>
                            <button style={styles.btn}>Sponsored Restaurant</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SponsoredSection;
