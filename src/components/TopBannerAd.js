import React from 'react';

const TopBannerAd = () => {
    const styles = {
        container: {
            width: '100%',
            height: '140px',
            background: 'linear-gradient(90deg, #FFD700, #FFA500)', // Gold/Orange Gradient
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            boxShadow: '0 4px 15px rgba(255, 165, 0, 0.3)',
            cursor: 'pointer',
            marginTop: '20px'
        },
        label: {
            position: 'absolute',
            top: '5px',
            left: '10px',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
        },
        content: {
            textAlign: 'center',
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        },
        title: {
            fontSize: '2rem',
            fontWeight: '900',
            margin: 0,
            fontFamily: "'Orbitron', sans-serif"
        },
        subtitle: {
            fontSize: '1.2rem',
            fontWeight: '500'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.label}>Sponsored</div>
            <div style={styles.content}>
                <h2 style={styles.title}>GOLD PREMIUM PASS</h2>
                <div style={styles.subtitle}>Get 50% OFF on your first 5 Orders</div>
            </div>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
            <div style={{ position: 'absolute', left: '-10px', bottom: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }}></div>
        </div>
    );
};

export default TopBannerAd;
