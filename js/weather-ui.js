/**
 * @file Manages UI interactions for the weather component, specifically the refresh button.
 */

import { fetchAndDisplayWeather, setWeatherSpinner } from './weather.js';

/**
 * Initializes the event listener for the weather refresh button.
 */
export function initializeWeatherUI() {
    const refreshBtn = document.getElementById('weather-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // Call the imported functions directly.
            setWeatherSpinner(true);
            fetchAndDisplayWeather();
        });
    }
}
