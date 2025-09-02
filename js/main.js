import { initializeClock } from './clock.js';
import { initializeGreeting } from './greeting.js';
import { initializeHitokoto } from './hitokoto.js';
import { initializeTimeCapsule } from './time-capsule.js';
import { initializeHolidayDisplay } from './holiday-display.js';
import { appSettings, loadSettings, saveSettings } from './settings.js';
import { initializeNewYearTheme, applyNewYearMode } from './new-year-theme.js';
import { createCrossfader, isNewYearPeriod } from './utils.js';
import {
    initBackground,
    applyCurrentBackground,
    updateBgSettingsUI,
    downloadImage,
    DEFAULT_BG_IMAGES
} from './background.js';
import { fetchAndRenderCommits, updateCommitMask } from './commit-history.js';
import { createCardSlider } from './card-slider.js';
import { setupSettingsUI } from './settings-ui.js';

function updateThemeSettingsUI(isInstant = false) {
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

function initializeThemeSlider() {
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

function updateTimeFormatUI() {
    const selectedFormat = appSettings.timeFormat;
    const radio = document.querySelector(`input[name="time-format"][value="${selectedFormat}"]`);
    if (radio) {
        radio.checked = true;
    }
}

function updateViewToggleUI() {
    const cityInputWrapper = document.getElementById('manual-city-input-wrapper');
    const cityInput = document.getElementById('weather-city-input');

    let selectedViewValue;
    if (appSettings.view === 'github') {
        selectedViewValue = 'github';
    } else { // view is 'weather'
        selectedViewValue = `weather-${appSettings.weather.source}`;
    }

    const radio = document.querySelector(`input[name="view-source"][value="${selectedViewValue}"]`);
    if (radio) {
        radio.checked = true;
    }

    const isManual = appSettings.view === 'weather' && appSettings.weather.source === 'manual';
    cityInputWrapper.style.maxHeight = isManual ? '60px' : '0';
    cityInputWrapper.style.marginTop = isManual ? '0.75rem' : '0';

    if (isManual) {
        cityInput.placeholder = appSettings.weather.city || '输入城市后回车 (例如: 北京)';
        cityInput.value = appSettings.weather.city || '';
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

function updateDeveloperSettingsUI() {
    const devToggle = document.getElementById('dev-options-toggle');
    const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');

    if (devToggle) {
        devToggle.checked = appSettings.developer.uiToggleState;
    }
    if (forceNewYearToggle) {
        forceNewYearToggle.checked = appSettings.developer.forceNewYearTheme;
    }
}

function updateSliderProgress(slider) {
    const min = slider.min;
    const max = slider.max;
    const value = slider.value;
    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.backgroundSize = `${percentage}% 100%`;
}

function updateAppearanceSettingsUI() {
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

function updateSettingsUI() {
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

// --- [NEW] View (GitHub/Weather) Management ---
function applyCurrentView() {
    const githubView = document.getElementById('github-view');
    const weatherView = document.getElementById('weather-view');

    if (appSettings.view === 'weather') {
        githubView.classList.add('hidden');
        weatherView.classList.remove('hidden');
        fetchAndDisplayWeather();
    } else {
        weatherView.classList.add('hidden');
        githubView.classList.remove('hidden');
        setupGitHubChartLoader();
    }
}

function applyCurrentTheme() {
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

function applyBlinkingEffect() {
    document.body.classList.toggle('immersive-blink-enabled', appSettings.immersiveBlinkingColon);
}

function applyGlassEffect() {
    document.body.classList.toggle('glass-effect-disabled', !appSettings.appearance.glassEffect);

    const blurSlider = document.getElementById('card-blur-amount-slider');
    const blurContainer = document.getElementById('blur-setting-container'); // Target the new container
    if (blurSlider && blurContainer) {
        const isGlassEnabled = appSettings.appearance.glassEffect;
        blurSlider.disabled = !isGlassEnabled;
        blurContainer.classList.toggle('disabled', !isGlassEnabled);
    }
}

function applyCardSettings() {
    const { cardBorderRadius, cardBlurAmount } = appSettings.appearance;
    document.documentElement.style.setProperty('--card-border-radius', `${cardBorderRadius}px`);
    document.documentElement.style.setProperty('--card-backdrop-blur', `${cardBlurAmount}px`);
}

// --- 初始状态和常量 ---
// Calendar and holiday logic moved to js/calendar.js
let holidayListDisplayedYear = new Date().getFullYear();
let settingsSimpleBar = null; // Instance for the settings scrollbar
let isFetchingWeather = false; // Lock to prevent multiple weather requests
let aboutCardHasAnimated = false;
let clockModule;
let hitokotoModule;
let timeCapsuleModule;
let backgroundFader;

// previewFader is no longer needed

// --- DOM 元素获取 (部分移至DOMContentLoaded) ---
const countdownCard = document.getElementById('countdown-card');
const profileCard = document.getElementById('profile-card');
const rightColumn = document.getElementById('right-column');
const timeCapsuleCard = document.getElementById('time-capsule-card');
const holidayListCard = document.getElementById('holiday-list-card');
const aboutCard = document.getElementById('about-card');
let rightColumnInitialHeight = 0;
let cachedRightColumnHeight = 0; // Cache the height of the right column

// --- [NEW] Year Input Feature Elements ---
const yearDisplayControls = document.getElementById('year-display-controls');
const yearEditControls = document.getElementById('year-edit-controls');
const holidayListYearSpan = document.getElementById('holiday-list-year');
const yearInput = document.getElementById('year-input');
const confirmYearBtn = document.getElementById('confirm-year-btn');
const cancelYearBtn = document.getElementById('cancel-year-btn');
const yearInputError = document.getElementById('year-input-error');
const yearRangeWarning = document.getElementById('year-range-warning');







// --- GitHub Chart Loader Logic ---
function setupGitHubChartLoader() {
    const spinner = document.getElementById('gh-chart-spinner');
    const errorContainer = document.getElementById('gh-chart-error');
    const errorMessage = document.getElementById('gh-chart-error-message');
    const imgLink = document.getElementById('gh-chart-link');
    const img = document.getElementById('gh-chart-img');
    const loadingContainer = document.getElementById('gh-chart-loading');
    const chartWrapper = document.getElementById('gh-chart-wrapper');

    const loadImage = () => {
        // Reset image state for re-loads
        img.classList.remove('loaded');
        imgLink.classList.add('invisible');
        errorContainer.classList.remove('visible');

        // Show loading UI
        chartWrapper.classList.add('hidden');
        loadingContainer.classList.remove('hidden');
        spinner.classList.add('visible');

        const originalSrc = img.dataset.src;
        const baseUrl = originalSrc.split('?')[0];
        // Reconstruct URL to safely add cache-busting parameter
        img.src = `${baseUrl}?theme=dark&v=${new Date().getTime()}`;
    };

    img.onload = () => {
        // Hide loading UI
        spinner.classList.remove('visible');
        loadingContainer.classList.add('hidden');
        
        // Show the chart wrapper so its contents can be animated
        chartWrapper.classList.remove('hidden');
        
        // Defer the animation trigger to the next paint cycle for reliability
        requestAnimationFrame(() => {
            imgLink.classList.remove('invisible');
            imgLink.classList.add('visible');
            img.classList.add('loaded');
        });
    };

    img.onerror = () => {
        // Hide loading UI
        spinner.classList.remove('visible');
        loadingContainer.classList.add('hidden');

        // Show the chart wrapper to display the error message
        chartWrapper.classList.remove('hidden');

        errorContainer.classList.add('visible');
        errorMessage.textContent = '贡献图加载失败，请检查网络并重试。';
    };

    errorContainer.addEventListener('click', () => {
        loadImage();
    });

    // Initial load
    loadImage();
}







// --- 交互事件监听 ---
function setupEventListeners() {
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

    // --- Background Settings Listeners ---
    const bgRadioButtons = document.querySelectorAll('input[name="background-source"]');
    const defaultOptionsContainer = document.getElementById('default-bg-options');

    const customBgInputWrapper = document.getElementById('custom-bg-input-wrapper');

    bgRadioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            const source = radio.value;
            appSettings.background.source = source;

            if (source === 'default') {
                defaultOptionsContainer.classList.add('open');
            } else {
                defaultOptionsContainer.classList.remove('open');
            }

            if (source === 'custom') {
                customBgInputWrapper.style.maxHeight = '80px';
                customBgInputWrapper.classList.add('mt-2');
            } else {
                customBgInputWrapper.style.maxHeight = '0';
                customBgInputWrapper.classList.remove('mt-2');
            }

            // When a source is selected, apply the background.
            // The applyCurrentBackground function will handle logic for new/empty custom URLs.
            applyCurrentBackground();
            
            saveSettings();
        });
    });

    const thumbItems = defaultOptionsContainer.querySelectorAll('.thumb-item');
    thumbItems.forEach(thumb => {
        thumb.addEventListener('click', () => {
            // This listener only matters when the 'default' source is active
            if (appSettings.background.source !== 'default') {
                // To be safe, check the 'default' radio
                document.getElementById('bg-radio-default').checked = true;
                appSettings.background.source = 'default';
            }
            
            const specifier = thumb.dataset.bgUrl;
            appSettings.background.specifier = specifier;
            
            // Update UI immediately for responsiveness
            thumbItems.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            
            applyCurrentBackground();
            saveSettings();
        });
    });

    // --- [NEW] Preview Buttons Listeners ---
    const refreshBtn = document.getElementById('bg-preview-refresh-btn');
    const downloadBtn = document.getElementById('bg-preview-download-btn');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const icon = refreshBtn.querySelector('i');
            if (icon && !icon.classList.contains('fa-spin')) {
                icon.classList.add('fa-spin');
                applyCurrentBackground();
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            downloadImage();
        });
    }

    const previewErrorContainer = document.getElementById('bg-preview-error');
    if (previewErrorContainer) {
        previewErrorContainer.addEventListener('click', () => {
            hidePreviewError();
            setTimeout(() => {
                // We call this again to retry loading a background.
                applyCurrentBackground();
            }, 300); // Wait for the fade-out transition to complete before retrying.
        });
    }


    // --- Time Format Listeners ---
    document.querySelectorAll('input[name="time-format"]').forEach(radio => {
        radio.addEventListener('change', () => {
            appSettings.timeFormat = radio.value;
            saveSettings();
            clockModule.updateTime(); // Immediately update the main clock
            // If weather view is active, re-render it to update sunrise/sunset
            if (appSettings.view === 'weather') {
                applyCurrentView();
            }
        });
    });

    // --- [NEW] Immersive Blink Toggle Listener ---
    const immersiveBlinkToggle = document.getElementById('immersive-blink-toggle');
    if (immersiveBlinkToggle) {
        immersiveBlinkToggle.addEventListener('change', () => {
            appSettings.immersiveBlinkingColon = immersiveBlinkToggle.checked;
            saveSettings();
            applyBlinkingEffect();
        });
    }

    // --- [NEW] Appearance Settings Listener ---
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

    // --- View Toggle Listeners ---
    const cityInput = document.getElementById('weather-city-input');
    const saveCityBtn = document.getElementById('save-city-btn');
    const confirmCityIcon = document.getElementById('confirm-city-icon');
    const cityInputError = document.getElementById('city-input-error');

    const saveCity = () => {
        const newCity = cityInput.value.trim();

        // Validation for length
        if (newCity.length > 20) {
            cityInput.classList.add('invalid');
            cityInputError.textContent = '内容过长 (最多20个字符)';
            cityInputError.classList.add('visible');
            cityInputError.classList.remove('hidden');
            return;
        }

        // Clear previous errors
        cityInput.classList.remove('invalid');
        cityInputError.classList.remove('visible');
        // Use a timeout to hide it after the transition
        setTimeout(() => { cityInputError.classList.add('hidden'); }, 200);

        // Save logic
        appSettings.weather.city = newCity;
        applyCurrentView();
        saveSettings();
        cityInput.blur();

        // Feedback animation
        saveCityBtn.style.opacity = '0';
        confirmCityIcon.classList.remove('hidden');
        setTimeout(() => { 
            confirmCityIcon.style.opacity = '1';
            confirmCityIcon.style.transform = 'scale(1)';
        }, 10);

        setTimeout(() => {
            confirmCityIcon.style.opacity = '0';
            confirmCityIcon.style.transform = 'scale(0.9)';
            setTimeout(() => {
                confirmCityIcon.classList.add('hidden');
                saveCityBtn.style.opacity = '1';
            }, 200);
        }, 2000); 
    };

    document.querySelectorAll('input[name="view-source"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const value = radio.value;
            if (value === 'github') {
                appSettings.view = 'github';
            } else {
                appSettings.view = 'weather';
                if (value === 'weather-auto') {
                    appSettings.weather.source = 'auto';
                    appSettings.weather.city = null; 
                } else { // weather-manual
                    appSettings.weather.source = 'manual';
                }
            }
            
            applyCurrentView();
            updateViewToggleUI();
            saveSettings();
        });
    });

    cityInput.addEventListener('focus', () => {
        cityInput.classList.remove('invalid');
        cityInputError.classList.remove('visible');
        setTimeout(() => { cityInputError.classList.add('hidden'); }, 200);
    });

    cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCity();
        }
    });

    saveCityBtn.addEventListener('click', saveCity);


    // --- Settings Modal Logic ---
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const settingsOverlay = document.getElementById('settings-overlay');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

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

    function closeSettings() {
        document.body.classList.remove('settings-open');
        // The line that removed the 'visible' class from the preview container
        // has been removed to prevent the re-animation issue.
    }

    openSettingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    // settingsOverlay.addEventListener('click', (e) => {
    //     if (e.target === settingsOverlay) closeSettings();
    // });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Priority 0: Close immersive view
            if (document.body.classList.contains('immersive-active')) {
                document.getElementById('exit-immersive-btn').click();
                return;
            }
            
            // Priority 1: Close developer settings modal if it's open
            if (document.body.classList.contains('developer-settings-open')) {
                closeDeveloperSettings();
                return;
            }

            // Priority 2: Close settings modal if it's open
            if (document.body.classList.contains('settings-open')) {
                closeSettings();
                return;
            }

            // [USER FEEDBACK] Priority 3: Close "About" card if it's open
            if (!aboutCard.classList.contains('hidden')) {
                toggleAboutCard();
                return;
            }

            // Priority 4: Close holiday list card if it's open
            if (!holidayListCard.classList.contains('hidden')) {
                holidayListCard.classList.add('hidden');
                rightColumn.classList.remove('hidden');
                animateRightColumnIn();
                return;
            }

            // Priority 5: Close time capsule card if it's open
            if (!timeCapsuleCard.classList.contains('hidden')) {
                timeCapsuleCard.classList.add('hidden');
                rightColumn.classList.remove('hidden');
                animateRightColumnIn();
                return;
            }
        }
    });

    // --- [NEW] Developer Mode Logic ---
    let logoClickCount = 0;
    let logoClickTimer = null;

    const aboutCardLogo = document.getElementById('about-card-logo');
    const developerIconContainer = document.getElementById('developer-icon-container');
    const developerIcon = document.getElementById('developer-icon');
    const developerSettingsOverlay = document.getElementById('developer-settings-overlay');
    const closeDeveloperSettingsBtn = document.getElementById('close-developer-settings-btn');

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

            // [FIX] Check the master switch to see if the feature is enabled at all
            if (!appSettings.developer.masterSwitchEnabled) return;

            clearTimeout(logoClickTimer);
            logoClickCount++;

            if (logoClickCount >= 5) {
                if (!developerIconContainer.classList.contains('visible')) {
                    developerIconContainer.classList.add('visible');
                    // [NEW] Save unlock state
                    try {
                        localStorage.setItem('developerModeUnlocked', 'true');
                    } catch (e) {
                        console.error("Failed to save to localStorage", e);
                    }
                }
                // [FIX] When re-unlocking, always reset the toggle's state to ON.
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
    }

    if (developerIcon) developerIcon.addEventListener('click', openDeveloperSettings);
    if (closeDeveloperSettingsBtn) closeDeveloperSettingsBtn.addEventListener('click', closeDeveloperSettings);

    // [FIX] Remove the click animation class after it finishes to prevent re-playing on show/hide
    if (aboutCardLogo) {
        aboutCardLogo.addEventListener('animationend', () => {
            aboutCardLogo.classList.remove('logo-click-bounce-anim');
        });
    }
    // --- End Settings Modal Logic ---

    const animateRightColumnIn = () => {
        const elementsToAnimate = rightColumn.querySelectorAll(':scope > div');
        elementsToAnimate.forEach(el => {
            el.classList.remove('bounce-in');
            void el.offsetWidth;
            el.classList.add('bounce-in');
        });
    };

    // 切换到时光胶囊
    profileCard.addEventListener('click', (e) => { // 1. 接收 event 对象，命名为 e
        // 2. 增加判断：如果点击的目标是 <a> 标签或其内部元素，则直接返回
        if (e.target.closest('a')) {
            return;
        }

        // If the time capsule is already visible, hide it and show the main column.
        if (!timeCapsuleCard.classList.contains('hidden')) {
            timeCapsuleCard.classList.add('hidden');
            rightColumn.classList.remove('hidden');
            animateRightColumnIn();
        } else { // Otherwise, show it.
            rightColumn.classList.add('hidden');
            holidayListCard.classList.add('hidden'); // Hide other cards
            aboutCard.classList.add('hidden'); // Hide other cards
            timeCapsuleCard.classList.remove('hidden');
            timeCapsuleCard.classList.add('bounce-in');
            timeCapsuleModule.updateTimeCapsule();
        }
    });

    // 关闭时光胶囊
    document.getElementById('close-time-capsule').addEventListener('click', (e) => {
        e.stopPropagation();
        timeCapsuleCard.classList.add('hidden');
        rightColumn.classList.remove('hidden');
        animateRightColumnIn();
    });

    // --- [NEW] About Card Listeners ---
    const aboutCardTrigger = document.getElementById('about-card-trigger');
    const closeAboutCardBtn = document.getElementById('close-about-card');
    const refreshCommitsBtn = document.getElementById('refresh-commits-btn');

    const toggleAboutCard = () => {
        if (!aboutCard.classList.contains('hidden')) {
            aboutCard.classList.add('hidden');
            rightColumn.classList.remove('hidden');
            animateRightColumnIn();
        } else {
            rightColumn.classList.add('hidden');
            timeCapsuleCard.classList.add('hidden');
            holidayListCard.classList.add('hidden');
            aboutCard.classList.remove('hidden');
            
            if (!aboutCardHasAnimated) {
                aboutCard.classList.add('bounce-in');
                aboutCardHasAnimated = true;
            }

            const commitsContainer = document.getElementById('recent-commits-container');
            if (commitsContainer && !SimpleBar.instances.get(commitsContainer)) {
                const simplebarInstance = new SimpleBar(commitsContainer);
                simplebarInstance.getScrollElement().addEventListener('scroll', updateCommitMask);
            }
            
            // Simplified logic: always fetch on open
            fetchAndRenderCommits();
        }
    };

    if (aboutCardTrigger) {
        aboutCardTrigger.addEventListener('click', toggleAboutCard);
    }

    if (refreshCommitsBtn) {
        refreshCommitsBtn.addEventListener('click', () => {
            fetchAndRenderCommits(); // forceRefresh parameter is removed
        });
    }

    if (closeAboutCardBtn) {
        closeAboutCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAboutCard();
        });
    }

    // 天气刷新按钮
    document.getElementById('weather-refresh-btn').addEventListener('click', () => {
        setWeatherSpinner(true);
        fetchAndDisplayWeather();
    });

    // --- [NEW] Custom Background Input Listeners ---
    const customBgInput = document.getElementById('custom-bg-input');
    const saveCustomBgBtn = document.getElementById('save-custom-bg-btn');
    const clearCustomBgBtn = document.getElementById('clear-custom-bg-btn');
    const customBgError = document.getElementById('custom-bg-input-error');
    const btnGroup = document.getElementById('custom-bg-btn-group');
    const confirmIcon = document.getElementById('confirm-custom-bg-icon');

    const saveCustomBg = () => {
        if (saveCustomBgBtn.disabled) return; // Prevent spam-clicking

        const url = customBgInput.value.trim();
        const originalPlaceholder = "输入图片或API链接";
        
        if (!url || !url.startsWith('http')) {
            customBgInput.classList.add('invalid');
            customBgInput.value = ''; // Clear input to show placeholder
            customBgInput.placeholder = '无效链接，请重新输入';
            
            // Restore after a delay
            setTimeout(() => {
                customBgInput.classList.remove('invalid');
                customBgInput.placeholder = originalPlaceholder;
            }, 2500);
            return;
        }

        appSettings.background.customUrl = url;
        appSettings.background.source = 'custom';
        
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
        appSettings.background.customType = isImage ? 'image' : 'api';

        saveSettings();
        applyCurrentBackground();

        // --- New Save Button Animation ---
        saveCustomBgBtn.disabled = true;
        const saveIcon = saveCustomBgBtn.querySelector('.fa-save');
        const checkIcon = saveCustomBgBtn.querySelector('.fa-check');

        if (saveIcon && checkIcon) {
            saveIcon.style.opacity = '0';
            checkIcon.style.opacity = '1';

            setTimeout(() => {
                saveIcon.style.opacity = '1';
                checkIcon.style.opacity = '0';
                saveCustomBgBtn.disabled = false;
            }, 2000);
        }
    };
    
    customBgInput.addEventListener('focus', () => {
        if (customBgInput.classList.contains('invalid')) {
            customBgInput.classList.remove('invalid');
            customBgInput.placeholder = "输入图片或API链接";
        }
    });

    saveCustomBgBtn.addEventListener('click', saveCustomBg);
    customBgInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCustomBg();
        }
    });

    clearCustomBgBtn.addEventListener('click', () => {
        customBgInput.value = '';
        appSettings.background.customUrl = null;
        appSettings.background.customType = 'unknown';
        saveSettings();
        customBgInput.focus();
    });

    // --- [NEW] Hitokoto Settings Listeners ---
    const hitokotoModeRadios = document.querySelectorAll('input[name="hitokoto-mode"]');
    const customOptionsContainer = document.getElementById('hitokoto-custom-options');
    const categoryCheckboxes = document.querySelectorAll('input[name="hitokoto-category"]');
    const selectAllCheckbox = document.getElementById('hitokoto-select-all');
    const saveBtn = document.getElementById('hitokoto-save-btn');

    hitokotoModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const newMode = radio.value;
            appSettings.hitokoto.mode = newMode;
            if (newMode === 'default') {
                customOptionsContainer.classList.remove('open');
                saveSettings();
                fetchHitokoto(); // Immediately fetch on switching to default
            } else {
                customOptionsContainer.classList.add('open');
                // If entering custom mode and no categories are checked (e.g. first time), check the first one.
                const checkedCount = document.querySelectorAll('input[name="hitokoto-category"]:checked').length;
                if (checkedCount === 0) {
                    const firstCategoryCheckbox = document.getElementById('hitokoto-cat-a');
                    if (firstCategoryCheckbox) {
                        firstCategoryCheckbox.checked = true;
                    }
                }
            }
        });
    });

    selectAllCheckbox.addEventListener('change', () => {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('input[name="hitokoto-category"]:checked').length;
            
            // Prevent unchecking the last box
            if (checkedCount === 0) {
                checkbox.checked = true;
            }

            // Update "Select All" checkbox state
            selectAllCheckbox.checked = checkedCount === categoryCheckboxes.length;
        });
    });

    saveBtn.addEventListener('click', () => {
        const selectedCategories = Array.from(document.querySelectorAll('input[name="hitokoto-category"]:checked')).map(cb => cb.value);
        
        if (selectedCategories.length === 0) {
            const validationMsg = document.getElementById('hitokoto-validation-msg');
            // Add the class to trigger the animation
            validationMsg.classList.add('visible');
            // Remove the class after the animation is done to allow it to be re-triggered
            setTimeout(() => {
                validationMsg.classList.remove('visible');
            }, 3000);
            return;
        }

        appSettings.hitokoto.categories = selectedCategories;
        saveSettings();
        hitokotoModule.fetchHitokoto();

        // --- [FIX] Refined Save button animation & spam prevention ---
        const saveIcon = saveBtn.querySelector('i');
        const confirmIcon = document.getElementById('hitokoto-confirm-icon');
        
        saveBtn.disabled = true; // Disable button
        saveIcon.style.opacity = '0';
        
        setTimeout(() => {
            confirmIcon.style.opacity = '1';

            setTimeout(() => {
                confirmIcon.style.opacity = '0';
                setTimeout(() => {
                    saveIcon.style.opacity = '1';
                    saveBtn.disabled = false; // Re-enable button
                }, 300);
            }, 3000);
        }, 300);
    });


    // --- [NEW] Hidden Reset Feature ---
    const luckTitleIcon = document.querySelector('#time-capsule-card h2 svg');
    if (luckTitleIcon) {
        luckTitleIcon.addEventListener('click', () => {
            resetClickCount++;
            clearTimeout(resetClickTimer);
            resetClickTimer = setTimeout(() => {
                resetClickCount = 0;
            }, 3000);

            if (resetClickCount === 5) {
                resetClickCount = 0;
                clearTimeout(resetClickTimer);
                localStorage.removeItem('dailyLuckData');
                
                const luckResult = document.getElementById('luck-result');
                if (luckResult) {
                    // Reset all JS state immediately
                    luckGameState = 'initial';
                    dailyLuckData = null;
                    hasPlayedGameToday = false;
                    luckClickCount = 0;
                    clearTimeout(luckResetTimer);
                    clearTimeout(countdownAnimationHandle);

                    // Start the collapse animation
                    luckResult.classList.remove('visible');

                    // After the animation finishes, clean up the DOM properties
                    setTimeout(() => {
                        // Only clean up if another game hasn't started in the meantime
                        if(luckGameState === 'initial') {
                            luckResult.classList.remove('flex', 'flex-col', 'justify-center', 'flex-1', 'min-w-0', 'relative');
                            luckResult.innerHTML = '';
                        }
                    }, 500);
                }
            }
        });
    }

    // --- [REVISED] Developer Options Toggle Listener ---
    const devOptionsToggle = document.getElementById('dev-options-toggle');
    if (devOptionsToggle) {
        devOptionsToggle.addEventListener('change', () => {
            const isEnabled = devOptionsToggle.checked;
            appSettings.developer.uiToggleState = isEnabled;
            const developerIconContainer = document.getElementById('developer-icon-container');

            if (isEnabled) {
                // When turned ON, just ensure the icon is marked as visible for the next time the 'About' panel is opened.
                // This fixes the bug where the icon would disappear.
                if (developerIconContainer) {
                    developerIconContainer.classList.add('visible');
                }
            } else {
                // When turned OFF, perform all reset actions as requested.
                // 1. Reset sub-settings in the settings object.
                appSettings.developer.forceNewYearTheme = false;
                
                // 2. Update the UI of all sub-settings to reflect the change.
                const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');
                if (forceNewYearToggle) {
                    forceNewYearToggle.checked = false;
                }
                
                // 3. Apply changes triggered by settings reset (e.g., turn off NY theme).
                applyNewYearMode(); 
                
                // 4. Hide the developer icon in the 'About' panel.
                if (developerIconContainer) {
                    developerIconContainer.classList.remove('visible');
                }

                // 5. Remove the unlock flag from localStorage to re-lock the feature.
                try {
                    localStorage.removeItem('developerModeUnlocked');
                } catch (e) {
                    console.error("Failed to remove from localStorage", e);
                }

                // 6. Close the developer settings window immediately.
                closeDeveloperSettings();
            }
            
            saveSettings(); // Save all settings changes.
        });
    }

    // --- [NEW] New Year Theme Event Listeners (Moved to new-year-theme.js) ---
    const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');
    if (forceNewYearToggle) {
        forceNewYearToggle.addEventListener('change', () => {
            appSettings.developer.forceNewYearTheme = forceNewYearToggle.checked;
            saveSettings();
            applyNewYearMode();
        });
    }

    const newYearBgToggle = document.getElementById('new-year-bg-toggle');
    if (newYearBgToggle) {
        newYearBgToggle.addEventListener('change', () => {
            appSettings.newYearTheme.backgroundEnabled = newYearBgToggle.checked;
            saveSettings();
            applyNewYearMode(); // Re-evaluate the whole theme state
        });
    }

    // --- [NEW] Reset Settings Logic ---
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    const resetConfirmOverlay = document.getElementById('reset-confirm-overlay');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const resetConfirmState = document.getElementById('reset-confirm-state');
    const resetSuccessState = document.getElementById('reset-success-state');

    const openResetModal = () => {
        // Ensure the modal is in the correct initial state when opening
        resetConfirmState.classList.remove('hidden');
        resetSuccessState.classList.add('hidden');
        if(confirmResetBtn) confirmResetBtn.disabled = false;
        if(cancelResetBtn) cancelResetBtn.disabled = false;

        if (resetConfirmOverlay) {
            resetConfirmOverlay.classList.remove('hidden');
            setTimeout(() => {
                document.body.classList.add('reset-confirm-open');
            }, 10); 
        }
    };

    const closeResetModal = () => {
        document.body.classList.remove('reset-confirm-open');
    };
    
    if (resetConfirmOverlay) {
        resetConfirmOverlay.addEventListener('transitionend', (event) => {
            if (event.propertyName === 'opacity' && !document.body.classList.contains('reset-confirm-open')) {
                resetConfirmOverlay.classList.add('hidden');
            }
        });
    }

    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', openResetModal);
    }
    if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', closeResetModal);
    }
    if (resetConfirmOverlay) {
        resetConfirmOverlay.addEventListener('click', (e) => {
            if (e.target === resetConfirmOverlay) {
                closeResetModal();
            }
        });
    }
    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', () => {
            // Disable buttons immediately to prevent multiple clicks
            confirmResetBtn.disabled = true;
            if(cancelResetBtn) cancelResetBtn.disabled = true;

            // 1. Fade out the confirmation content
            if(resetConfirmState) resetConfirmState.style.opacity = '0';

            // 2. After fade-out, switch content and fade in success message
            setTimeout(() => {
                if(resetConfirmState) resetConfirmState.classList.add('hidden');
                
                if(resetSuccessState) {
                    resetSuccessState.style.opacity = '0'; // Start transparent
                    resetSuccessState.classList.remove('hidden');
                    
                    // A tiny delay to allow the browser to apply display:block before transitioning opacity
                    setTimeout(() => {
                        resetSuccessState.style.opacity = 1;
                    }, 20);
                }

                // 3. Perform the actual reset
                localStorage.removeItem('qing-homepage-settings');
                localStorage.removeItem('developerModeUnlocked');

                // 4. Reload the page after showing the success message
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }, 250); // This duration should match the CSS transition
        });
    }
}

// --- [NEW] JS-Powered Tooltip Logic ---
function setupTooltips() {
    let tooltipEl = null;
    let showTimer = null;

    function createTooltipElement() {
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.classList.add('js-tooltip');
            document.body.appendChild(tooltipEl);
        }
    }

    function showTooltip(target) {
        const tooltipText = target.getAttribute('data-tooltip');
        if (!tooltipText) return;

        createTooltipElement();
        tooltipEl.textContent = tooltipText;
        positionTooltip(target);

        tooltipEl.style.opacity = '1';
        tooltipEl.style.transform = 'scale(1) translateY(0)';
    }

    function hideTooltip() {
        if (tooltipEl) {
            tooltipEl.style.opacity = '0';
            tooltipEl.style.transform = 'scale(0.95) translateY(5px)';
        }
    }

    function positionTooltip(target) {
        if (!tooltipEl || !target) return;

        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const offset = 10; 

        let top = targetRect.top - tooltipRect.height - offset;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        if (top < 0) {
            top = targetRect.bottom + offset;
        }
        if (left < 0) {
            left = 5;
        }
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 5;
        }

        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
    }
    
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            clearTimeout(showTimer);
            showTimer = setTimeout(() => {
                showTooltip(target);
            }, 200);
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            clearTimeout(showTimer);
            hideTooltip();
        }
    });

    window.addEventListener('scroll', () => {
        clearTimeout(showTimer);
        hideTooltip();
    }, true);
}


// --- 页面加载时执行的函数 ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // Initialize Faders
    const bgLayers = document.querySelectorAll('#bg-wrapper .bg-layer');
    backgroundFader = createCrossfader(Array.from(bgLayers));
    initBackground(backgroundFader);

    // --- [FIX] Correct Initialization Order ---
    setupTooltips(); // Initialize the new tooltip system
    // 1. Build the settings panel UI first, so other functions can find its elements.
    setupSettingsUI();
    setupEventListeners();
    setupLuckFeature(); // Activate the new luck feature
    particleEffects.init(); // Initialize particle system

    // [NEW] Check for persisted developer mode unlock
    try {
        if (localStorage.getItem('developerModeUnlocked') === 'true') {
            const developerIconContainer = document.getElementById('developer-icon-container');
            if (developerIconContainer) {
                developerIconContainer.classList.add('visible');
            }
        }
    } catch (e) {
        console.error("Failed to read developerModeUnlocked from localStorage", e);
    }

    // 2. Pre-calculate the theme slider's correct position before it's ever shown.
    initializeThemeSlider();
    
    // 3. Now apply all other settings.
    applyCurrentTheme();
    applyBlinkingEffect();
    applyGlassEffect();
    applyCardSettings();
    applyCurrentBackground();
    applyCurrentView();
    updateSettingsUI();

    // 3. Initial data fetches and updates.
    initializeNewYearTheme(backgroundFader); // Initialize New Year theme logic
    clockModule = initializeClock(appSettings);
    initializeGreeting();
    hitokotoModule = initializeHitokoto(appSettings);
    timeCapsuleModule = initializeTimeCapsule();
    initializeHolidayDisplay();
    setupGitHubChartLoader();
    
    // 4. Defer non-critical layout calculations.
    setTimeout(() => {
        if (window.innerWidth >= 1024) {
            cachedRightColumnHeight = rightColumn.offsetHeight;
        }
    }, 100);

    // --- [NEW] Initialize Card Slider ---
    createCardSlider('#link-slider-container');
    
    // [NEW] Auto-refresh weather data every 30 minutes
    setInterval(() => {
        if (appSettings.view === 'weather') {
            fetchAndDisplayWeather();
        }
    }, 30 * 60 * 1000);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (appSettings.theme === 'system') {
            applyCurrentTheme();
        }
    });
});
