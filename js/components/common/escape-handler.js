import { closeSettings } from '../settings/settings-modal.js';
import { closeOpenCard } from '../card/card-manager.js';

/**
 * Initializes the global 'keydown' event listener for the Escape key.
 * It closes modals and cards in a specific order of priority.
 * @param {object} dependencies - An object containing dependencies from other modules.
 * @param {function} dependencies.getCloseDeveloperSettings - A function that returns the `closeDeveloperSettings` function.
 */
export function initializeEscapeKeyHandler({ getCloseDeveloperSettings }) {
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') {
            return;
        }

        // Priority 0: Close immersive view
        if (document.body.classList.contains('immersive-active')) {
            document.getElementById('exit-immersive-btn').click();
            return;
        }

        // Priority 1: Close developer settings modal if it's open
        if (document.body.classList.contains('developer-settings-open')) {
            const closeDeveloperSettings = getCloseDeveloperSettings();
            if (closeDeveloperSettings) {
                closeDeveloperSettings();
            }
            return;
        }

        // Priority 2: Close settings modal if it's open
        if (document.body.classList.contains('settings-open')) {
            closeSettings();
            return;
        }

        // Priority 3: Close any open card (handled by the card manager)
        if (closeOpenCard()) {
            return;
        }
    });
}
