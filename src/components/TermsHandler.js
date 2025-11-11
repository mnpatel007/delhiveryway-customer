import React from 'react';
import { useTerms } from '../context/TermsContext';
import TermsModal from './TermsModal';

const TermsHandler = () => {
    const {
        currentTerms,
        showTermsModal,
        acceptTerms,
        declineTerms
    } = useTerms();

    return (
        <TermsModal
            terms={currentTerms}
            isVisible={showTermsModal}
            onAccept={acceptTerms}
            onDecline={declineTerms}
        />
    );
};

export default TermsHandler;