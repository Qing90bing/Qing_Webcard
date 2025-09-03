import { appSettings, saveSettings } from '../../../core/settings.js';

// --- Helper Functions ---

function updateSliderProgress(slider) {
    const min = slider.min;
    const max = slider.max;
    const value = slider.value;
    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.backgroundSize = `${percentage}% 100%`;
}

// --- UI Update Functions ---

export function updateAppearanceSettingsUI() {
    const { glassEffect, cardBorderRadius, cardBlurAmount } = appSettings.appearance;

    const glassEffectToggle = document.getElementById('glass-effect-toggle');
    if (glassEffectToggle) {
        glassEffectToggle.checked = glassEffect;
    }

    const radiusSlider = document.getElementById('card-border-radius-slider');
    const radiusValue = document.getElementById('card-border-radius-value');
    if (radiusSlider && radiusValue) {
        radiusSlider.value = cardBorderRadius;
        radiusValue.textContent = `${cardBorderRadius}px`;
        updateSliderProgress(radiusSlider);
    }

    const blurSlider = document.getElementById('card-blur-amount-slider');
    const blurValue = document.getElementById('card-blur-amount-value');
    if (blurSlider && blurValue) {
        blurSlider.value = cardBlurAmount;
        blurValue.textContent = `${cardBlurAmount}px`;
        updateSliderProgress(blurSlider);
    }
}

// --- Style Application Functions ---

export function applyGlassEffect() {
    document.body.classList.toggle('glass-effect-disabled', !appSettings.appearance.glassEffect);

    const blurSlider = document.getElementById('card-blur-amount-slider');
    const blurContainer = document.getElementById('blur-setting-container');
    if (blurSlider && blurContainer) {
        const isGlassEnabled = appSettings.appearance.glassEffect;
        blurSlider.disabled = !isGlassEnabled;
        blurContainer.classList.toggle('disabled', !isGlassEnabled);
    }
}

export function applyCardSettings() {
    const { cardBorderRadius, cardBlurAmount } = appSettings.appearance;
    document.documentElement.style.setProperty('--card-border-radius', `${cardBorderRadius}px`);
    document.documentElement.style.setProperty('--card-backdrop-blur', `${cardBlurAmount}px`);
}

// --- Event Listener Setup ---

export function initializeAppearanceSettings() {
    const glassEffectToggle = document.getElementById('glass-effect-toggle');
    if (glassEffectToggle) {
        glassEffectToggle.addEventListener('change', () => {
            appSettings.appearance.glassEffect = glassEffectToggle.checked;
            saveSettings();
            applyGlassEffect();
        });
    }

    const radiusSlider = document.getElementById('card-border-radius-slider');
    const radiusValue = document.getElementById('card-border-radius-value');
    if (radiusSlider && radiusValue) {
        radiusSlider.addEventListener('input', (e) => {
            const newValue = e.target.value;
            radiusValue.textContent = `${newValue}px`;
            appSettings.appearance.cardBorderRadius = parseInt(newValue, 10);
            applyCardSettings();
            updateSliderProgress(e.target);
        });
        radiusSlider.addEventListener('change', () => {
            saveSettings(); // Save only when the user releases the mouse
        });
    }

    const blurSlider = document.getElementById('card-blur-amount-slider');
    const blurValue = document.getElementById('card-blur-amount-value');
    if (blurSlider && blurValue) {
        blurSlider.addEventListener('input', (e) => {
            const newValue = e.target.value;
            blurValue.textContent = `${newValue}px`;
            appSettings.appearance.cardBlurAmount = parseInt(newValue, 10);
            applyCardSettings();
            updateSliderProgress(e.target);
        });
        blurSlider.addEventListener('change', () => {
            saveSettings(); // Save only when the user releases the mouse
        });
    }
}
