import { initializeClock } from './clock.js';
import { initializeGreeting } from './greeting.js';
import { initializeHitokoto } from './hitokoto.js';
import { initializeTimeCapsule } from './time-capsule.js';
import { initializeHolidayDisplay } from './holiday-display.js';
import { appSettings, loadSettings } from './settings.js';
import { initializeNewYearTheme } from './new-year-theme.js';
import { initializeTheme, applyCurrentTheme, initializeThemeSlider } from './theme.js';
import { createCrossfader } from './utils.js';
import { initBackground, applyCurrentBackground, initializeBackgroundSettings } from './background.js';
import { createCardSlider } from './card-slider.js';
import { setupSettingsUI } from './settings-ui.js';
import { setupTooltips } from './tooltip.js';
import { initializeResetSettings } from './reset-settings.js';
import { initializeAppearanceSettings, applyGlassEffect, applyCardSettings } from './appearance.js';
import { initializeViewManager, applyCurrentView } from './view-manager.js';
import { updateSettingsUI } from './settings-updater.js';
import { initializeDeveloperMode } from './developer-mode.js';
import { initializeHitokotoSettings } from './hitokoto-settings.js';
import { initializeSettingsModal } from './settings-modal.js';

// --- Import all newly created feature modules ---
import { initializeImmersiveMode } from './immersive-mode.js';
import { initializeEscapeKeyHandler } from './escape-handler.js';
import { initializeCardManager } from './card-manager.js';
import { initializeWeatherUI } from './weather-ui.js';
import { initializeTimeFormatSettings } from './time-format-settings.js';
import { initializeLuckGameUI } from './luck-game-ui.js';
import { fetchAndDisplayWeather } from './weather.js';
import { setupLuckFeature, particleEffects } from './luck-game.js';
import { initializeSiteRuntime } from './site-runtime.js';

// Module-level variables to hold instances or functions needed for dependency injection.
let clockModule;
let closeDeveloperSettings;

// --- Main Application Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load settings first, as many modules depend on it.
    loadSettings();
    
    // 2. Initialize core UI and utility modules that don't have many dependencies.
    const bgLayers = document.querySelectorAll('#bg-wrapper .bg-layer');
    const backgroundFader = createCrossfader(Array.from(bgLayers));
    initBackground(backgroundFader);
    setupTooltips();
    setupSettingsUI();
    createCardSlider('#link-slider-container');

    // 3. Initialize modules that provide functions/instances needed by other modules.
    const devModeFuncs = initializeDeveloperMode();
    closeDeveloperSettings = devModeFuncs.closeDeveloperSettings;
    clockModule = initializeClock(appSettings);
    const hitokotoModule = initializeHitokoto(appSettings);

    // 4. Initialize all other feature and UI modules.
    initializeGreeting();
    initializeTimeCapsule();
    initializeHolidayDisplay();
    initializeSiteRuntime();
    initializeNewYearTheme(backgroundFader);
    initializeTheme();
    initializeAppearanceSettings();
    initializeViewManager();
    initializeBackgroundSettings();
    initializeSettingsModal();
    initializeResetSettings();
    initializeHitokotoSettings(hitokotoModule);

    // 5. Initialize all the newly refactored modules.
    initializeImmersiveMode();
    initializeCardManager();
    initializeWeatherUI();
    initializeTimeFormatSettings(clockModule);
    initializeLuckGameUI();
    initializeEscapeKeyHandler({
        getCloseDeveloperSettings: () => closeDeveloperSettings
    });

    // 6. Initialize luck game and particle effects
    setupLuckFeature();
    particleEffects.init();

    // 7. Pre-calculate UI elements now that settings are loaded.
    initializeThemeSlider();
    
    // 8. Apply all visual settings based on the loaded configuration.
    applyCurrentTheme();
    applyGlassEffect();
    applyCardSettings();
    applyCurrentBackground();
    applyCurrentView();
    
    // 9. Update the settings UI to reflect the loaded settings.
    updateSettingsUI();
    
    // 10. Setup timers.
    setInterval(() => {
        if (appSettings.view === 'weather') {
            fetchAndDisplayWeather();
        }
    }, 30 * 60 * 1000);
});
