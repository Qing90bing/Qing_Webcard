/**
 * @file Manages UI interactions for the weather component, specifically the refresh button.
 */

/**
 * Initializes the event listener for the weather refresh button.
 * This module assumes that the `setWeatherSpinner` and `fetchAndDisplayWeather` functions
 * are available in the global scope, as they are loaded from the non-module `weather.js` script.
 */
export function initializeWeatherUI() {
    const refreshBtn = document.getElementById('weather-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // Check for the existence of global functions before calling them, for safety.
            if (typeof setWeatherSpinner === 'function') {
                setWeatherSpinner(true);
            }
            if (typeof fetchAndDisplayWeather === 'function') {
                fetchAndDisplayWeather();
            } else {
                console.error('The global function fetchAndDisplayWeather() is not available.');
            }
        });
    }
}
