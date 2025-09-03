import { appSettings, saveSettings } from '../../../core/settings.js';
import { isNewYearPeriod } from '../../ui/holiday/calendar.js';
import { applyCurrentBackground } from '../background/background.js';

let newYearMusicIntroPlayed = false;
const NY_MUSIC_LOOP_START = 85.16; // 01:25:16
const NY_MUSIC_LOOP_END = 173.20;   // 02:53:20

let backgroundFaderInstance;

function stopNewYearMusic() {
    const audio = document.getElementById('new-year-audio');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

export function applyNewYearMode() {
    const body = document.body;
    const musicBtn = document.getElementById('new-year-music-btn');

    const isThemeAvailable = isNewYearPeriod() || appSettings.developer.forceNewYearTheme;
    const isThemeEnabledByUser = appSettings.newYearTheme.backgroundEnabled;
    const shouldBeActive = isThemeAvailable && isThemeEnabledByUser;

    const isCurrentlyActive = body.classList.contains('new-year-active');

    const bgSettingsWrapper = document.getElementById('main-background-settings-wrapper');
    if (bgSettingsWrapper) {
        bgSettingsWrapper.classList.toggle('disabled', shouldBeActive);
    }

    if (shouldBeActive) {
        // --- Activate or Keep Active ---
        musicBtn.classList.add('visible');
        musicBtn.classList.add('is-paused');
        if (!isCurrentlyActive) {
            // It needs to be turned ON
            body.classList.add('new-year-active');
            if (backgroundFaderInstance) {
                backgroundFaderInstance.update('assets/images/new_year_bg.svg', true);
            }
            // Music is not auto-played, user must click.
        }
    } else {
        // --- Deactivate or Keep Inactive ---
        musicBtn.classList.remove('visible');
        stopNewYearMusic();
        if (isCurrentlyActive) {
            // It needs to be turned OFF
            body.classList.remove('new-year-active');
            applyCurrentBackground();
        }
    }
}

export function initializeNewYearTheme(backgroundFader) {
    backgroundFaderInstance = backgroundFader;

    const musicBtn = document.getElementById('new-year-music-btn');
    if (musicBtn) {
        const audio = document.getElementById('new-year-audio');

        musicBtn.addEventListener('click', () => {
            if (!audio) return;
            if (audio.paused) {
                audio.play().catch(e => console.error("Music play failed on click:", e));
            } else {
                audio.pause();
            }
        });

        if (audio) {
            audio.addEventListener('play', () => {
                musicBtn.classList.add('is-playing');
                musicBtn.classList.remove('is-paused');
            });
            audio.addEventListener('pause', () => {
                musicBtn.classList.remove('is-playing');
                musicBtn.classList.add('is-paused');
            });
        }
    }

    const newYearAudio = document.getElementById('new-year-audio');
    if (newYearAudio) {
        newYearAudio.addEventListener('timeupdate', () => {
            if (newYearAudio.paused) return;

            if (!newYearMusicIntroPlayed) {
                if (newYearAudio.currentTime >= NY_MUSIC_LOOP_END) {
                    newYearMusicIntroPlayed = true;
                    newYearAudio.currentTime = NY_MUSIC_LOOP_START;
                }
            } else {
                if (newYearAudio.currentTime >= NY_MUSIC_LOOP_END) {
                    newYearAudio.currentTime = NY_MUSIC_LOOP_START;
                }
            }
        });
    }
    
    // --- New Year Theme Setting Listeners ---
    const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');
    if (forceNewYearToggle) {
        forceNewYearToggle.checked = appSettings.developer.forceNewYearTheme;
        forceNewYearToggle.addEventListener('change', () => {
            appSettings.developer.forceNewYearTheme = forceNewYearToggle.checked;
            saveSettings();
            applyNewYearMode();
        });
    }

    const newYearBgToggle = document.getElementById('new-year-bg-toggle');
    if (newYearBgToggle) {
        newYearBgToggle.checked = appSettings.newYearTheme.backgroundEnabled;
        newYearBgToggle.addEventListener('change', () => {
            appSettings.newYearTheme.backgroundEnabled = newYearBgToggle.checked;
            saveSettings();
            applyNewYearMode();
        });
    }

    // Initial application of the theme mode on load
    applyNewYearMode();
}
