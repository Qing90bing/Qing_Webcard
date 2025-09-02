import { appSettings, saveSettings } from './settings.js';

/**
 * Applies the blinking effect to the clock's colon based on user settings.
 */
function applyBlinkingEffect() {
    document.body.classList.toggle('immersive-blink-enabled', appSettings.immersiveBlinkingColon);
}

/**
 * Initializes the immersive mode features, including the event listener for the blinking colon toggle.
 * It also applies the initial state on page load.
 */
export function initializeImmersiveMode() {
    const immersiveBlinkToggle = document.getElementById('immersive-blink-toggle');
    if (immersiveBlinkToggle) {
        // Set the initial state of the toggle based on loaded settings.
        immersiveBlinkToggle.checked = appSettings.immersiveBlinkingColon;

        // Add a listener to handle changes to the toggle.
        immersiveBlinkToggle.addEventListener('change', () => {
            appSettings.immersiveBlinkingColon = immersiveBlinkToggle.checked;
            saveSettings();
            applyBlinkingEffect();
        });
    }

    // Apply the effect on initial page load to ensure the correct state is displayed.
    applyBlinkingEffect();
}
