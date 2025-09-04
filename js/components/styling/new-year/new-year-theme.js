/**
 * @file new-year-theme.js
 * @description
 * 本文件负责管理一个特殊的新年主题。该主题在特定日期范围内或通过开发者选项强制开启时激活。
 * 它会应用一个特殊的背景、播放背景音乐，并提供相关的UI控件。
 *
 * @module components/styling/new-year/new-year-theme
 */
import { appSettings, saveSettings } from '../../../core/settings.js';
import { isNewYearPeriod } from '../../ui/holiday/calendar.js';
import { applyCurrentBackground } from '../background/background.js';

let newYearMusicIntroPlayed = false; // 标记音乐前奏是否已播放完毕
const NY_MUSIC_LOOP_START = 85.16; // 音乐循环播放的起始时间点 (秒)
const NY_MUSIC_LOOP_END = 173.20;   // 音乐循环播放的结束时间点 (秒)

let backgroundFaderInstance; // 背景渐变器实例的引用

/**
 * @description 停止并重置新年主题的背景音乐。
 */
function stopNewYearMusic() {
    const audio = document.getElementById('new-year-audio');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

/**
 * @description 应用或移除新年主题模式。
 * 这是本模块的核心状态机，根据日期和用户设置决定是否激活主题。
 */
export function applyNewYearMode() {
    const rootEl = document.documentElement;
    const musicBtn = document.getElementById('new-year-music-btn');

    // 条件1：当前是否在新年期间，或者开发者是否强制开启
    const isThemeAvailable = isNewYearPeriod() || appSettings.developer.forceNewYearTheme;
    // 条件2：用户是否在设置中启用了新年主题
    const isThemeEnabledByUser = appSettings.newYearTheme.backgroundEnabled;
    // 最终决定：只有两个条件都满足时，主题才应该被激活
    const shouldBeActive = isThemeAvailable && isThemeEnabledByUser;

    const isCurrentlyActive = rootEl.classList.contains('new-year-active');

    // 当新年主题激活时，禁用常规的背景设置选项
    const bgSettingsWrapper = document.getElementById('main-background-settings-wrapper');
    if (bgSettingsWrapper) {
        bgSettingsWrapper.classList.toggle('disabled', shouldBeActive);
    }

    if (shouldBeActive) {
        // --- 激活或保持激活状态 ---
        musicBtn.classList.add('visible'); // 显示音乐播放按钮
        musicBtn.classList.add('is-paused'); // 默认是暂停状态
        if (!isCurrentlyActive) {
            // 如果当前未激活，则执行激活操作
            rootEl.classList.add('new-year-active');
            if (backgroundFaderInstance) {
                // 使用背景渐变器应用新年专属背景
                backgroundFaderInstance.update('assets/images/new_year_bg.svg', true);
            }
            // 注意：音乐不会自动播放，需要用户手动点击
        }
    } else {
        // --- 停用或保持停用状态 ---
        musicBtn.classList.remove('visible'); // 隐藏音乐播放按钮
        stopNewYearMusic(); // 停止音乐
        if (isCurrentlyActive) {
            // 如果当前是激活的，则执行停用操作
            rootEl.classList.remove('new-year-active');
            // 恢复用户之前设置的常规背景
            applyCurrentBackground();
        }
    }
}

/**
 * @description 初始化新年主题的所有功能和事件监听器。
 * @param {object} backgroundFader - 从main.js注入的背景渐变器实例。
 */
export function initializeNewYearTheme(backgroundFader) {
    backgroundFaderInstance = backgroundFader;

    // --- 音乐播放器控制 ---
    const musicBtn = document.getElementById('new-year-music-btn');
    if (musicBtn) {
        const audio = document.getElementById('new-year-audio');

        musicBtn.addEventListener('click', () => {
            if (!audio) return;
            if (audio.paused) {
                audio.play().catch(e => console.error("音乐播放失败:", e));
            } else {
                audio.pause();
            }
        });

        // 根据音频的播放和暂停状态，更新按钮的UI
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

    // --- 音乐无缝循环逻辑 ---
    const newYearAudio = document.getElementById('new-year-audio');
    if (newYearAudio) {
        newYearAudio.addEventListener('timeupdate', () => {
            if (newYearAudio.paused) return;

            // 首次播放时，允许播放完整的前奏
            if (!newYearMusicIntroPlayed) {
                if (newYearAudio.currentTime >= NY_MUSIC_LOOP_END) {
                    newYearMusicIntroPlayed = true;
                    newYearAudio.currentTime = NY_MUSIC_LOOP_START; // 跳回到循环起点
                }
            } else {
                // 后续循环只在循环段内播放
                if (newYearAudio.currentTime >= NY_MUSIC_LOOP_END) {
                    newYearAudio.currentTime = NY_MUSIC_LOOP_START;
                }
            }
        });
    }
    
    // --- 设置面板中的开关监听 ---
    const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');
    if (forceNewYearToggle) {
        forceNewYearToggle.checked = appSettings.developer.forceNewYearTheme;
        forceNewYearToggle.addEventListener('change', () => {
            appSettings.developer.forceNewYearTheme = forceNewYearToggle.checked;
            saveSettings();
            applyNewYearMode(); // 应用更改
        });
    }

    const newYearBgToggle = document.getElementById('new-year-bg-toggle');
    if (newYearBgToggle) {
        newYearBgToggle.checked = appSettings.newYearTheme.backgroundEnabled;
        newYearBgToggle.addEventListener('change', () => {
            appSettings.newYearTheme.backgroundEnabled = newYearBgToggle.checked;
            saveSettings();
            applyNewYearMode(); // 应用更改
        });
    }

    // 页面加载时，立即应用一次当前的主题状态
    applyNewYearMode();
}
