import React from 'react';

const SidebarAd = () => {
    const styles = {
        container: {
            width: '100%',
            height: '100%', // Flexible height to fill sidebar
            maxHeight: '100%',
            background: 'linear-gradient(180deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)',
            borderRadius: '12px',
            position: 'sticky',
            top: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        },
        label: {
            marginTop: 'auto',
            marginBottom: '10px',
            fontSize: '10px',
            opacity: 0.8
        },
        imagePlaceholder: {
            width: '80%',
            height: '50%',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem'
        },
        btn: {
            background: 'white',
            color: '#C850C0',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '50px',
            fontWeight: 'bold',
            marginTop: '20px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.imagePlaceholder}>📱</div>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif" }}>DOWNLOAD APP</h2>
            <p>Experience smoother tracking and exclusive mobile-only deals.</p>
            <button style={styles.btn}>Get it on Store</button>
            <div style={styles.label}>Advertisement</div>
        </div>
    );
};

export default SidebarAd;
