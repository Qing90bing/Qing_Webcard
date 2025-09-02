import { appSettings } from './settings.js';
import { isNewYearPeriod } from './utils.js';
import { updateBgSettingsUI } from './background.js';
import { updateAppearanceSettingsUI } from './appearance.js';
import { updateViewToggleUI } from './view-manager.js';

function updateTimeFormatUI() {
    const selectedFormat = appSettings.timeFormat;
    const radio = document.querySelector(`input[name="time-format"][value="${selectedFormat}"]`);
    if (radio) {
        radio.checked = true;
    }
}


function updateHitokotoSettingsUI() {
    const { mode, categories } = appSettings.hitokoto;

    // Update radio buttons
    const radio = document.querySelector(`input[name="hitokoto-mode"][value="${mode}"]`);
    if (radio) {
        radio.checked = true;
    }

    // Show/hide custom options panel
    const customOptionsContainer = document.getElementById('hitokoto-custom-options');
    if (mode === 'custom') {
        customOptionsContainer.classList.add('open');
    } else {
        customOptionsContainer.classList.remove('open');
    }

    // Update checkboxes
    const allCheckboxes = document.querySelectorAll('input[name="hitokoto-category"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = categories.includes(checkbox.value);
    });

    // Update "Select All" checkbox state
    const selectAllCheckbox = document.getElementById('hitokoto-select-all');
    if (selectAllCheckbox) {
        const allCategories = Array.from(allCheckboxes).map(cb => cb.value);
        selectAllCheckbox.checked = categories.length === allCategories.length;
    }
}

function updateImmersiveBlinkUI() {
    const toggle = document.getElementById('immersive-blink-toggle');
    if (toggle) {
        toggle.checked = appSettings.immersiveBlinkingColon;
    }
}

export function updateDeveloperSettingsUI() {
    const devToggle = document.getElementById('dev-options-toggle');
    const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');

    if (devToggle) {
        devToggle.checked = appSettings.developer.uiToggleState;
    }
    if (forceNewYearToggle) {
        forceNewYearToggle.checked = appSettings.developer.forceNewYearTheme;
    }
}

export function updateSettingsUI() {
    updateBgSettingsUI();
    // updateThemeSettingsUI(); // This is now handled by a dedicated initializer
    updateTimeFormatUI();
    updateViewToggleUI();
    updateHitokotoSettingsUI();
    updateImmersiveBlinkUI();
    updateDeveloperSettingsUI();
    updateAppearanceSettingsUI();

    // Logic for New Year background toggle
    const newYearBgToggleSection = document.getElementById('new-year-bg-toggle-section');
    const newYearBgToggle = document.getElementById('new-year-bg-toggle');
    const shouldThemeBeActive = isNewYearPeriod() || appSettings.developer.forceNewYearTheme;

    if (newYearBgToggleSection && newYearBgToggle) {
        if (shouldThemeBeActive) {
            newYearBgToggleSection.classList.remove('hidden');
            newYearBgToggle.checked = appSettings.newYearTheme.backgroundEnabled;
        } else {
            newYearBgToggleSection.classList.add('hidden');
        }
    }
}
