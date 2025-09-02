import { appSettings, saveSettings } from './settings.js';
import { applyCurrentView } from './view-manager.js';

/**
 * Initializes the event listeners for the time format setting (12h/24h).
 * It also sets the initial state of the radio buttons based on loaded settings.
 * @param {object} clockModule - The clock module instance, which must have an `updateTime` method
 *                               to immediately reflect the format change.
 */
export function initializeTimeFormatSettings(clockModule) {
    const timeFormatRadios = document.querySelectorAll('input[name="time-format"]');

    timeFormatRadios.forEach(radio => {
        // Set the initial checked state of the radio buttons based on the loaded settings.
        if (radio.value === appSettings.timeFormat) {
            radio.checked = true;
        }

        radio.addEventListener('change', () => {
            // When a radio button is selected, update the settings.
            if (radio.checked) {
                appSettings.timeFormat = radio.value;
                saveSettings();

                // Immediately update the clock display to show the new format.
                if (clockModule && typeof clockModule.updateTime === 'function') {
                    clockModule.updateTime();
                }

                // If the weather view is active, re-render it because it displays
                // sunrise/sunset times which are affected by this setting.
                if (appSettings.view === 'weather') {
                    applyCurrentView();
                }
            }
        });
    });
}
