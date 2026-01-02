import { createContext, useState, useContext, useEffect } from 'react';

const LiteModeContext = createContext();

export const useLiteMode = () => useContext(LiteModeContext);

export const LiteModeProvider = ({ children }) => {
    const [isLiteMode, setIsLiteMode] = useState(false);
    const [batteryLevel, setBatteryLevel] = useState(100);

    useEffect(() => {
        // Auto-detect low power mode or low battery
        const checkPerformance = async () => {
            // Check logical cores (rough proxy for device age)
            const cores = navigator.hardwareConcurrency || 4;
            if (cores < 4) {
                setIsLiteMode(true);
            }

            // Check Battery API
            if (navigator.getBattery) {
                try {
                    const battery = await navigator.getBattery();
                    setBatteryLevel(battery.level * 100);

                    if (battery.level < 0.2 || battery.saveMode) {
                        setIsLiteMode(true);
                    }

                    battery.addEventListener('levelchange', () => {
                        setBatteryLevel(battery.level * 100);
                        if (battery.level < 0.2) setIsLiteMode(true);
                    });
                } catch (e) {
                    console.warn('Battery API not supported');
                }
            }
        };

        checkPerformance();
    }, []);

    const toggleLiteMode = () => setIsLiteMode(prev => !prev);

    return (
        <LiteModeContext.Provider value={{ isLiteMode, toggleLiteMode, batteryLevel }}>
            {children}
        </LiteModeContext.Provider>
    );
};
