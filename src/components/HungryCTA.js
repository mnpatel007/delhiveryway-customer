import React from 'react';

const HungryCTA = ({ onClick }) => {
    const styles = {
        wrapper: {
            textAlign: 'center',
            margin: '60px 0',
            position: 'relative'
        },
        bubble: {
            background: 'white',
            border: '2px solid #333',
            display: 'inline-block',
            padding: '10px 30px',
            borderRadius: '20px',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '15px',
            position: 'relative',
            boxShadow: '4px 4px 0px #000',
            transform: 'rotate(-2deg)'
        },
        arrow: {
            fontSize: '2.5rem',
            lineHeight: '1',
            margin: '10px 0'
        },
        button: {
            background: 'white',
            border: '2px solid #333',
            padding: '20px 60px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '5px 5px 0px #000',
            transition: '0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px'
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.bubble}>Are you hungry?</div>
            <div style={styles.arrow}>⬇️</div>
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
