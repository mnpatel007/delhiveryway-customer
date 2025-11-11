import React, { useState, useEffect } from 'react';
import './TermsModal.css';

const TermsModal = ({ terms, onAccept, onDecline, isVisible }) => {
    const [isAccepting, setIsAccepting] = useState(false);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setHasScrolledToBottom(isAtBottom);
    };

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            await onAccept();
        } finally {
            setIsAccepting(false);
        }
    };

    if (!isVisible || !terms) return null;

    return (
        <div className="terms-modal-overlay">
            <div className="terms-modal">
                <div className="terms-modal-header">
                    <h2>{terms.title}</h2>
                    <span className="terms-version">Version {terms.version}</span>
                </div>

                <div
                    className="terms-modal-content"
                    onScroll={handleScroll}
                >
                    <div
                        className="terms-content"
                        dangerouslySetInnerHTML={{ __html: terms.content.replace(/\n/g, '<br>') }}
                    />
                </div>

                <div className="terms-modal-footer">
                    <div className="scroll-indicator">
                        {!hasScrolledToBottom && (
                            <p className="scroll-hint">
                                📜 Please scroll down to read the complete terms and conditions
                            </p>
                        )}
                    </div>

                    <div className="terms-modal-actions">
                        <button
                            className="terms-decline-btn"
                            onClick={onDecline}
                            disabled={isAccepting}
                        >
                            Decline
                        </button>
                        <button
                            className={`terms-accept-btn ${!hasScrolledToBottom ? 'disabled' : ''}`}
                            onClick={handleAccept}
                            disabled={!hasScrolledToBottom || isAccepting}
                        >
                            {isAccepting ? 'Accepting...' : 'Accept & Continue'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;