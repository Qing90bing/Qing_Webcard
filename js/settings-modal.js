import { updateSettingsUI } from './settings-updater.js';

let settingsSimpleBar = null; // Instance for the settings scrollbar

function openSettings() {
    updateSettingsUI(); // Refresh UI to match saved settings
    const settingsWindow = document.getElementById('settings-window');
    
    // [FIX] Temporarily disable transitions on overlays to prevent animation on panel open
    const overlay1 = document.getElementById('background-settings-overlay');
    const overlay2 = document.getElementById('blur-slider-overlay');

    if (overlay1) overlay1.style.transition = 'none';
    if (overlay2) overlay2.style.transition = 'none';

    document.body.classList.add('settings-open');
    
    // Restore transitions after the panel has appeared.
    setTimeout(() => {
        if (overlay1) overlay1.style.transition = '';
        if (overlay2) overlay2.style.transition = '';
    }, 300);


    // Initialize SimpleBar on the content area if it hasn't been already
    if (!settingsSimpleBar) {
        const contentWrapper = settingsWindow.querySelector('[data-simplebar]');
        if (contentWrapper) {
            settingsSimpleBar = new SimpleBar(contentWrapper);
            const scrollElement = settingsSimpleBar.getScrollElement();
            const maskContainer = contentWrapper; // The element with the mask is the one with data-simplebar
            const maxFadeSize = 24; // Corresponds to the CSS variable

            const updateSettingsMask = () => {
                const { scrollTop, scrollHeight, clientHeight } = scrollElement;
                const tolerance = 1;
                // If content is not scrollable, remove fades
                if (scrollHeight <= clientHeight + tolerance) {
                    maskContainer.style.setProperty('--fade-top-size', '0px');
                    maskContainer.style.setProperty('--fade-bottom-size', '0px');
                    return;
                }
                const scrollBottom = scrollHeight - clientHeight - scrollTop;
                const topFade = Math.min(scrollTop, maxFadeSize);
                const bottomFade = Math.min(scrollBottom, maxFadeSize);
                maskContainer.style.setProperty('--fade-top-size', `${topFade}px`);
                maskContainer.style.setProperty('--fade-bottom-size', `${bottomFade}px`);
            };

            scrollElement.addEventListener('scroll', updateSettingsMask);
            // Call once to set initial state, delayed to allow rendering
            setTimeout(updateSettingsMask, 50);
        }
    }
}

export function closeSettings() {
    document.body.classList.remove('settings-open');
    // The line that removed the 'visible' class from the preview container
    // has been removed to prevent the re-animation issue.
}

export function initializeSettingsModal() {
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', openSettings);
    }
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', closeSettings);
    }
}
