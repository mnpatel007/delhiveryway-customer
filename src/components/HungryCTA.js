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
            background: 'white',
            border: '2px solid #333',
            padding: '10px 30px',
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '3px 3px 0px #000',
            transition: '0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px'
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
