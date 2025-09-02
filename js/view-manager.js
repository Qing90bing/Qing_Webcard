import { appSettings, saveSettings } from './settings.js';
import { setupGitHubChartLoader } from './github-chart.js';

// Note: fetchAndDisplayWeather is treated as a global function for now.

function applyCurrentView() {
    const githubView = document.getElementById('github-view');
    const weatherView = document.getElementById('weather-view');

    if (appSettings.view === 'weather') {
        githubView.classList.add('hidden');
        weatherView.classList.remove('hidden');
        fetchAndDisplayWeather();
    } else {
        weatherView.classList.add('hidden');
        githubView.classList.remove('hidden');
        setupGitHubChartLoader();
    }
}

function updateViewToggleUI() {
    const cityInputWrapper = document.getElementById('manual-city-input-wrapper');
    const cityInput = document.getElementById('weather-city-input');

    let selectedViewValue;
    if (appSettings.view === 'github') {
        selectedViewValue = 'github';
    } else { // view is 'weather'
        selectedViewValue = `weather-${appSettings.weather.source}`;
    }

    const radio = document.querySelector(`input[name="view-source"][value="${selectedViewValue}"]`);
    if (radio) {
        radio.checked = true;
    }

    const isManual = appSettings.view === 'weather' && appSettings.weather.source === 'manual';
    cityInputWrapper.style.maxHeight = isManual ? '60px' : '0';
    cityInputWrapper.style.marginTop = isManual ? '0.75rem' : '0';

    if (isManual) {
        cityInput.placeholder = appSettings.weather.city || '输入城市后回车 (例如: 北京)';
        cityInput.value = appSettings.weather.city || '';
    }
}

export function initializeViewManager() {
    const cityInput = document.getElementById('weather-city-input');
    const saveCityBtn = document.getElementById('save-city-btn');
    const confirmCityIcon = document.getElementById('confirm-city-icon');
    const cityInputError = document.getElementById('city-input-error');

    const saveCity = () => {
        const newCity = cityInput.value.trim();

        // Validation for length
        if (newCity.length > 20) {
            cityInput.classList.add('invalid');
            cityInputError.textContent = '内容过长 (最多20个字符)';
            cityInputError.classList.add('visible');
            cityInputError.classList.remove('hidden');
            return;
        }

        // Clear previous errors
        cityInput.classList.remove('invalid');
        cityInputError.classList.remove('visible');
        // Use a timeout to hide it after the transition
        setTimeout(() => { cityInputError.classList.add('hidden'); }, 200);

        // Save logic
        appSettings.weather.city = newCity;
        applyCurrentView();
        saveSettings();
        cityInput.blur();

        // Feedback animation
        saveCityBtn.style.opacity = '0';
        confirmCityIcon.classList.remove('hidden');
        setTimeout(() => { 
            confirmCityIcon.style.opacity = '1';
            confirmCityIcon.style.transform = 'scale(1)';
        }, 10);

        setTimeout(() => {
            confirmCityIcon.style.opacity = '0';
            confirmCityIcon.style.transform = 'scale(0.9)';
            setTimeout(() => {
                confirmCityIcon.classList.add('hidden');
                saveCityBtn.style.opacity = '1';
            }, 200);
        }, 2000); 
    };

    document.querySelectorAll('input[name="view-source"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const value = radio.value;
            if (value === 'github') {
                appSettings.view = 'github';
            } else {
                appSettings.view = 'weather';
                if (value === 'weather-auto') {
                    appSettings.weather.source = 'auto';
                    appSettings.weather.city = null; 
                } else { // weather-manual
                    appSettings.weather.source = 'manual';
                }
            }
            
            applyCurrentView();
            updateViewToggleUI();
            saveSettings();
        });
    });

    cityInput.addEventListener('focus', () => {
        cityInput.classList.remove('invalid');
        cityInputError.classList.remove('visible');
        setTimeout(() => { cityInputError.classList.add('hidden'); }, 200);
    });

    cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCity();
        }
    });

    saveCityBtn.addEventListener('click', saveCity);

    // Also, we need to export the functions that are called from outside this module.
    // In this case, `updateSettingsUI` calls `updateViewToggleUI`.
    // And `DOMContentLoaded` calls `applyCurrentView`.
    // So we need to make them available.
    // Let's re-export them for clarity, or just make them available on the window object if needed.
    // For now, let's just export them.
}

// We need to export these so they can be called from main.js if needed.
// Specifically, `updateSettingsUI` calls `updateViewToggleUI`.
export { applyCurrentView, updateViewToggleUI };
