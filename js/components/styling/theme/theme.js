/**
 * @file theme.js
 * @description
 * 本文件负责管理应用的主题（浅色/深色/跟随系统）。
 * 它包含了应用主题、更新设置UI以及响应用户和系统事件的所有逻辑。
 *
 * @module components/styling/theme
 */

import { appSettings, saveSettings } from '../../../core/settings.js';

/**
 * @description 初始化主题相关的事件监听器。
 */
export function initializeTheme() {
    // 为设置面板中的每个主题按钮（浅色/深色/系统）添加点击事件监听器
    document.querySelectorAll('.setting-btn-group .setting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            appSettings.theme = theme;
            applyCurrentTheme();
            saveSettings();
            updateThemeSettingsUI(); // 更新滑块UI以匹配新状态
        });
    });

    // 监听操作系统颜色方案的变化（例如，用户在操作系统设置中从浅色模式切换到深色模式）
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        // 仅当用户设置为“跟随系统”时，才响应系统主题变化
        if (appSettings.theme === 'system') {
            applyCurrentTheme();
        }
    });
}

/**
 * @description 根据 `appSettings` 中的当前主题设置，为 `<body>` 元素应用相应的CSS类。
 */
export function applyCurrentTheme() {
    const body = document.body;
    // 在应用新主题前，先移除所有旧的 `theme-*` 类，防止冲突
    body.classList.forEach(className => {
        if (className.startsWith('theme-')) {
            body.classList.remove(className);
        }
    });

    let themeToApply;
    if (appSettings.theme === 'system') {
        // 如果是“跟随系统”，则检查系统当前偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        themeToApply = prefersDark ? 'theme-dark' : 'theme-light';
    } else {
        // 否则，直接使用指定的主题
        themeToApply = `theme-${appSettings.theme}`;
    }
    body.classList.add(themeToApply);
}

/**
 * @description 更新设置面板中主题选择器下方的高亮滑块的位置和大小，使其与当前激活的按钮对齐。
 * @param {boolean} [isInstant=false] - 如果为true，则移动滑块时不带CSS过渡动画。
 */
export function updateThemeSettingsUI(isInstant = false) {
    const slider = document.querySelector('.theme-slider');
    const parent = slider ? slider.parentElement : null;
    const currentTheme = appSettings.theme;
    const activeButton = document.querySelector(`.setting-btn[data-theme='${currentTheme}']`);

    if (!slider || !parent || !activeButton) {
        return; // 如果缺少任何必要元素，则退出
    }

    if (isInstant) {
        slider.style.transition = 'none'; // 临时禁用动画
    }

    // 更新所有按钮的 'active' 状态
    document.querySelectorAll('.setting-btn-group .setting-btn').forEach(btn => {
        btn.classList.toggle('active', btn === activeButton);
    });

    // 使用 getBoundingClientRect 来精确计算滑块的位置
    const parentRect = parent.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    const left = buttonRect.left - parentRect.left;
    const width = buttonRect.width;

    slider.style.width = `${width}px`;
    slider.style.transform = `translateX(${left}px)`;

    if (isInstant) {
        // 强制浏览器重绘以立即应用无动画的样式，然后重新启用动画
        void slider.offsetHeight;
        slider.style.transition = '';
    }
}

/**
 * @description 初始化主题滑块的位置。
 * 这是一个巧妙的技巧，用于在设置面板首次打开前预先计算并设置滑块的正确位置，
 * 以避免用户第一次打开设置时看到滑块从一个错误位置“跳”到正确位置的视觉闪烁。
 */
export function initializeThemeSlider() {
    const settingsWindow = document.getElementById('settings-window');
    if (!settingsWindow) return;

    // 1. 临时让设置面板在DOM中可测量，但对用户不可见
    const originalTransition = settingsWindow.style.transition;
    settingsWindow.style.transition = 'none'; // 禁用过渡
    settingsWindow.style.visibility = 'hidden'; // 设为不可见
    settingsWindow.style.display = 'flex'; // 确保其有布局

    // 2. 强制其进入打开状态，以便获取正确的尺寸
    document.body.classList.add('settings-open');

    // 3. 在这个不可见但已布局的状态下，立即计算并设置滑块的正确位置
    updateThemeSettingsUI(true);

    // 4. 立即恢复所有临时更改。
    // 这个过程在浏览器单次绘制之前同步完成，因此用户不会看到任何中间状态。
    document.body.classList.remove('settings-open');
    settingsWindow.style.display = ''; // 恢复默认display
    settingsWindow.style.visibility = ''; // 恢复默认可见性
    settingsWindow.style.transition = originalTransition; // 恢复过渡
}
