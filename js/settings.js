export let appSettings = {
    background: {
        source: 'default',
        specifier: 'random',
        customUrl: null,
        customType: 'unknown' // 'image', 'api', or 'unknown'
    },
    appearance: {
        glassEffect: true,
        cardBorderRadius: 16,
        cardBlurAmount: 24
    },
    theme: 'system', // 'system', 'light', 'dark'
    timeFormat: '24h', // '12h' or '24h'
    immersiveBlinkingColon: false,
    view: 'github', // 'github' or 'weather'
    weather: {
        source: 'auto', // 'auto' or 'manual'
        city: null, // User-overridden city
        lastFetchedCity: null // City from last successful fetch
    },
    hitokoto: {
        mode: 'default', // 'default' or 'custom'
        categories: ['a'] // Array of selected category codes
    },
    developer: {
        masterSwitchEnabled: true, // Master switch for the entire feature
        uiToggleState: true,       // State of the toggle in the UI
        forceNewYearTheme: false // [NEW] Developer toggle for New Year theme
    },
    newYearTheme: {
        backgroundEnabled: true
    }
};

export function saveSettings() {
    localStorage.setItem('qing-homepage-settings', JSON.stringify(appSettings));
}

export function loadSettings() {
    const savedSettings = localStorage.getItem('qing-homepage-settings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            // Merge saved settings with defaults to ensure compatibility with future updates
            appSettings = {
                ...appSettings,
                ...parsedSettings,
                background: { ...appSettings.background, ...(parsedSettings.background || {}) },
                weather: { ...appSettings.weather, ...(parsedSettings.weather || {}) },
                developer: { ...appSettings.developer, ...(parsedSettings.developer || {}) },
                newYearTheme: { ...appSettings.newYearTheme, ...(parsedSettings.newYearTheme || {}) },
                appearance: { ...appSettings.appearance, ...(parsedSettings.appearance || {}) }
            };

            // Backward compatibility: If old setting `view: 'weather'` exists, but new `weather.source` doesn't, default it.
            if (appSettings.view === 'weather' && !appSettings.weather.source) {
                appSettings.weather.source = 'auto';
            }
        } catch (e) {
            console.error("Failed to parse settings from localStorage", e);
            // If parsing fails, use default settings
        }
    }
}
