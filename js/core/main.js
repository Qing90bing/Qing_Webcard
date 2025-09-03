import { initializeClock } from '../components/ui/clock/clock.js';
import { initializeGreeting } from '../components/ui/greeting/greeting.js';
import { initializeHitokoto } from '../components/features/hitokoto/hitokoto.js';
import { initializeTimeCapsule } from '../components/features/time-capsule/time-capsule.js';
import { initializeHolidayDisplay } from '../components/ui/holiday/holiday-display.js';
import { appSettings, loadSettings } from './settings.js';
import { initializeNewYearTheme } from '../components/styling/new-year/new-year-theme.js';
import { initializeTheme, applyCurrentTheme, initializeThemeSlider } from '../components/styling/theme/theme.js';
import { createCrossfader, initBackground, applyCurrentBackground, initializeBackgroundSettings } from '../components/styling/background/background.js';
import { createCardSlider } from '../components/system/card/card-slider.js';
import { setupSettingsUI } from '../components/system/settings/settings-ui.js';
import { setupTooltips } from '../components/common/tooltip.js';
import { initializeResetSettings } from '../components/system/settings/reset-settings.js';
import { initializeAppearanceSettings, applyGlassEffect, applyCardSettings } from '../components/styling/appearance/appearance.js';
import { initializeViewManager, applyCurrentView } from '../components/system/view-manager/view-manager.js';
import { updateSettingsUI } from '../components/system/settings/settings-updater.js';
import { initializeDeveloperMode } from '../components/developer/developer-mode.js';
import { initializeHitokotoSettings } from '../components/features/hitokoto/hitokoto-settings.js';
import { initializeSettingsModal } from '../components/system/settings/settings-modal.js';

// --- Import all newly created feature modules ---
import { initializeImmersiveMode } from '../components/system/immersive/immersive-mode.js';
import { initializeEscapeKeyHandler } from '../components/common/escape-handler.js';
import { initializeCardManager } from '../components/system/card/card-manager.js';
import { initializeWeatherUI } from '../components/features/weather/weather-ui.js';
import { initializeTimeFormatSettings } from '../components/ui/clock/time-format-settings.js';
import { initializeLuckGameUI } from '../components/features/luck-game/luck-game-ui.js';
import { fetchAndDisplayWeather } from '../components/features/weather/weather.js';
import { setupLuckFeature, particleEffects } from '../components/features/luck-game/luck-game.js';
import { initializeSiteRuntime } from '../components/ui/site-runtime/site-runtime.js';

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
