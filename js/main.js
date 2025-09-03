import { initializeClock } from './components/clock/clock.js';
import { initializeGreeting } from './components/greeting/greeting.js';
import { initializeHitokoto } from './components/hitokoto/hitokoto.js';
import { initializeTimeCapsule } from './components/time-capsule/time-capsule.js';
import { initializeHolidayDisplay } from './components/holiday/holiday-display.js';
import { appSettings, loadSettings } from './settings.js';
import { initializeNewYearTheme } from './components/new-year/new-year-theme.js';
import { initializeTheme, applyCurrentTheme, initializeThemeSlider } from './components/theme/theme.js';
import { createCrossfader } from './utils.js';
import { initBackground, applyCurrentBackground, initializeBackgroundSettings } from './components/background/background.js';
import { createCardSlider } from './components/card/card-slider.js';
import { setupSettingsUI } from './components/settings/settings-ui.js';
import { setupTooltips } from './components/common/tooltip.js';
import { initializeResetSettings } from './components/settings/reset-settings.js';
import { initializeAppearanceSettings, applyGlassEffect, applyCardSettings } from './components/appearance/appearance.js';
import { initializeViewManager, applyCurrentView } from './components/view-manager/view-manager.js';
import { updateSettingsUI } from './components/settings/settings-updater.js';
import { initializeDeveloperMode } from './components/developer/developer-mode.js';
import { initializeHitokotoSettings } from './components/hitokoto/hitokoto-settings.js';
import { initializeSettingsModal } from './components/settings/settings-modal.js';

// --- Import all newly created feature modules ---
import { initializeImmersiveMode } from './components/immersive/immersive-mode.js';
import { initializeEscapeKeyHandler } from './components/common/escape-handler.js';
import { initializeCardManager } from './components/card/card-manager.js';
import { initializeWeatherUI } from './components/weather/weather-ui.js';
import { initializeTimeFormatSettings } from './components/clock/time-format-settings.js';
import { initializeLuckGameUI } from './components/luck-game/luck-game-ui.js';
import { fetchAndDisplayWeather } from './components/weather/weather.js';
import { setupLuckFeature, particleEffects } from './components/luck-game/luck-game.js';
import { initializeSiteRuntime } from './components/site-runtime/site-runtime.js';

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
