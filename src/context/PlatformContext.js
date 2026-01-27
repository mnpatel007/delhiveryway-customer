import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const PlatformContext = createContext();

export const usePlatform = () => useContext(PlatformContext);

export const PlatformProvider = ({ children }) => {
    const [isNative, setIsNative] = useState(false);
    const [platform, setPlatform] = useState('web');

    useEffect(() => {
        const checkPlatform = () => {
            const nativeState = Capacitor.isNativePlatform();
            setIsNative(nativeState);

            const currentPlatform = Capacitor.getPlatform(); // 'web', 'ios', 'android'
            setPlatform(currentPlatform);

            // Inject Class into Body for CSS styling
            // e.g., body.platform-android or body.platform-web
            document.body.classList.add(`platform-${currentPlatform}`);
            if (nativeState) {
                document.body.classList.add('platform-native');
            } else {
                document.body.classList.add('platform-web');
            }
        };

        checkPlatform();
    }, []);

    return (
        <PlatformContext.Provider value={{ isNative, platform }}>
            {children}
        </PlatformContext.Provider>
    );
};
