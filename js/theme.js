// js/theme.js
// Contains all logic related to theme management, including applying themes,
// updating UI elements in the settings panel, and handling user interactions.

import { appSettings, saveSettings } from './settings.js';

export function initializeTheme() {
    // --- Theme Settings Listeners ---
    document.querySelectorAll('.setting-btn-group .setting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            appSettings.theme = theme;
            applyCurrentTheme();
            saveSettings();
            updateThemeSettingsUI(); // Update active state
        });
    });

    // Also, add the listener for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (appSettings.theme === 'system') {
            applyCurrentTheme();
        }
    });
}

export function applyCurrentTheme() {
    const body = document.body;
    // Clear all theme-* classes before adding the new one
    body.classList.forEach(className => {
        if (className.startsWith('theme-')) {
            body.classList.remove(className);
        }
    });

    let themeToApply;
    if (appSettings.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        themeToApply = prefersDark ? 'theme-dark' : 'theme-light';
    } else {
        themeToApply = `theme-${appSettings.theme}`;
    }
    body.classList.add(themeToApply);
}

export function updateThemeSettingsUI(isInstant = false) {
    const slider = document.querySelector('.theme-slider');
    const parent = slider ? slider.parentElement : null;
    const currentTheme = appSettings.theme;
    const activeButton = document.querySelector(`.setting-btn[data-theme='${currentTheme}']`);

    if (!slider || !parent || !activeButton) {
        return; // Exit if any required element is missing
    }

    if (isInstant) {
        slider.style.transition = 'none';
    }

    // Update active classes on all buttons
    document.querySelectorAll('.setting-btn-group .setting-btn').forEach(btn => {
        btn.classList.toggle('active', btn === activeButton);
    });

    // Use getBoundingClientRect for precise positioning
    const parentRect = parent.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    const left = buttonRect.left - parentRect.left;
    const width = buttonRect.width;

    slider.style.width = `${width}px`;
    slider.style.transform = `translateX(${left}px)`;

    if (isInstant) {
        // Force reflow to apply styles synchronously before re-enabling the transition
        void slider.offsetHeight;
        slider.style.transition = '';
    }
}

export function initializeThemeSlider() {
    const settingsWindow = document.getElementById('settings-window');
    if (!settingsWindow) return;

    // 1. Temporarily make the modal measurable but invisible to the user
    const originalTransition = settingsWindow.style.transition;
    settingsWindow.style.transition = 'none';
    settingsWindow.style.visibility = 'hidden';
    settingsWindow.style.display = 'flex'; // Ensure it's not display:none

    // 2. Force it to its final "open" state to get correct dimensions
    document.body.classList.add('settings-open');

    // 3. Now, take the measurement and set the slider's state instantly
    updateThemeSettingsUI(true);

    // 4. Immediately revert all changes so the user sees nothing.
    // This happens synchronously before the browser can paint.
    document.body.classList.remove('settings-open');
    settingsWindow.style.display = ''; // Revert to default
    settingsWindow.style.visibility = ''; // Revert to default
    settingsWindow.style.transition = originalTransition;
}
