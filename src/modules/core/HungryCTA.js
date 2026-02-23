import React from 'react';

const HungryCTA = ({ onClick }) => {
    const styles = {
        wrapper: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            margin: '10px 0', // Compact margin
            position: 'relative'
        },
        bubble: {
            background: 'white',
            border: '2px solid #333',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            position: 'relative',
            boxShadow: '3px 3px 0px #000',
            transform: 'rotate(-2deg)',
            margin: 0
        },
        arrow: {
            fontSize: '1.5rem',
            lineHeight: '1',
            margin: 0
        },
        button: {
            background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 40px',
            fontSize: '1.2rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 10px 20px rgba(255, 140, 0, 0.4), inset 0 -4px 0 rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transform: 'scale(1)'
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.bubble}>Are you hungry?</div>
            <div style={styles.arrow}>➡️</div>
            <button
                style={styles.button}
                onClick={onClick}
            >
                Order Items
            </button>
        </div>
    );
};

export default HungryCTA;
