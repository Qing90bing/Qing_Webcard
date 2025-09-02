import { appSettings, saveSettings } from './settings.js';
import { applyNewYearMode } from './new-year-theme.js';
import { updateDeveloperSettingsUI } from './settings-updater.js';

// This function will be called from main.js to set up all developer mode features.
export function initializeDeveloperMode() {
    let logoClickCount = 0;
    let logoClickTimer = null;

    const aboutCardLogo = document.getElementById('about-card-logo');
    const developerIconContainer = document.getElementById('developer-icon-container');
    const developerIcon = document.getElementById('developer-icon');
    const closeDeveloperSettingsBtn = document.getElementById('close-developer-settings-btn');
    const devOptionsToggle = document.getElementById('dev-options-toggle');
    
    const openDeveloperSettings = () => {
        updateDeveloperSettingsUI(); // Update the UI from the latest settings state
        document.body.classList.add('developer-settings-open');
    };

    const closeDeveloperSettings = () => document.body.classList.remove('developer-settings-open');

    if (aboutCardLogo) {
        aboutCardLogo.addEventListener('click', () => {
            // Re-trigger animation for a satisfying click feel
            aboutCardLogo.classList.remove('logo-click-bounce-anim');
            void aboutCardLogo.offsetWidth; // Force reflow to restart animation
            aboutCardLogo.classList.add('logo-click-bounce-anim');

            // Check the master switch to see if the feature is enabled at all
            if (!appSettings.developer.masterSwitchEnabled) return;

            clearTimeout(logoClickTimer);
            logoClickCount++;

            if (logoClickCount >= 5) {
                if (!developerIconContainer.classList.contains('visible')) {
                    developerIconContainer.classList.add('visible');
                    // Save unlock state
                    try {
                        localStorage.setItem('developerModeUnlocked', 'true');
                    } catch (e) {
                        console.error("Failed to save to localStorage", e);
                    }
                }
                // When re-unlocking, always reset the toggle's state to ON.
                appSettings.developer.uiToggleState = true;
                saveSettings();

                logoClickCount = 0;
                clearTimeout(logoClickTimer); // Stop timer once icon is shown
            } else {
                logoClickTimer = setTimeout(() => {
                    logoClickCount = 0;
                }, 1500); // 1.5-second window for consecutive clicks
            }
        });

        // Remove the click animation class after it finishes
        aboutCardLogo.addEventListener('animationend', () => {
            aboutCardLogo.classList.remove('logo-click-bounce-anim');
        });
    }

    if (developerIcon) developerIcon.addEventListener('click', openDeveloperSettings);
    if (closeDeveloperSettingsBtn) closeDeveloperSettingsBtn.addEventListener('click', closeDeveloperSettings);

    if (devOptionsToggle) {
        devOptionsToggle.addEventListener('change', () => {
            const isEnabled = devOptionsToggle.checked;
            appSettings.developer.uiToggleState = isEnabled;

            if (isEnabled) {
                if (developerIconContainer) {
                    developerIconContainer.classList.add('visible');
                }
            } else {
                // Reset sub-settings
                appSettings.developer.forceNewYearTheme = false;
                
                // Update UI of sub-settings
                const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');
                if (forceNewYearToggle) {
                    forceNewYearToggle.checked = false;
                }
                
                // Apply changes triggered by settings reset
                applyNewYearMode(); 
                
                // Hide the developer icon
                if (developerIconContainer) {
                    developerIconContainer.classList.remove('visible');
                }

                // Re-lock the feature
                try {
                    localStorage.removeItem('developerModeUnlocked');
                } catch (e) {
                    console.error("Failed to remove from localStorage", e);
                }

                // Close the developer settings window
                closeDeveloperSettings();
            }
            
            saveSettings();
        });
    }

    // Check for persisted developer mode unlock on startup
    try {
        if (localStorage.getItem('developerModeUnlocked') === 'true') {
            if (developerIconContainer) {
                developerIconContainer.classList.add('visible');
            }
        }
    } catch (e) {
        console.error("Failed to read developerModeUnlocked from localStorage", e);
    }

    // Return any functions that need to be accessed from other modules
    return { closeDeveloperSettings };
}
