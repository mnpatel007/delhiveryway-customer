import React, { useState } from 'react';

const SimplePopupTest = () => {
    const [showPopup, setShowPopup] = useState(false);

    return (
        <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
            <h3>Simple Popup Test</h3>
            <button
                onClick={() => {
                    console.log('🔥 Simple test button clicked');
                    setShowPopup(true);
                }}
                style={{
                    background: '#ff4444',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px'
                }}
            >
                Show Simple Popup
            </button>

            {showPopup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 999999
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        textAlign: 'center'
                    }}>
                        <h2>🎉 Simple Popup Works!</h2>
                        <p>This proves React state and popup rendering works.</p>
                        <button
                            onClick={() => setShowPopup(false)}
                            style={{
                                background: '#4CAF50',
                                color: 'white',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '5px'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimplePopupTest;