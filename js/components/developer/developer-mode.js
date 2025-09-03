/**
 * @file developer-mode.js
 * @description
 * 本文件负责实现和管理应用的“开发者模式”。
 * 这是一个隐藏功能，通过特定的“彩蛋”操作（连续点击Logo）来解锁。
 * 解锁后，会显示一个开发者图标，点击可进入开发者专属的设置页面。
 *
 * @module components/developer/developer-mode
 */

import { appSettings, saveSettings } from '../../core/settings.js';
import { applyNewYearMode } from '../styling/new-year/new-year-theme.js';
import { updateDeveloperSettingsUI } from '../system/settings/settings-updater.js';

/**
 * @description 初始化开发者模式的所有功能和事件监听器。
 * 这个函数在应用启动时被调用，并返回一个包含 `closeDeveloperSettings` 函数的对象，
 * 以便其他模块（如 `escape-handler`）可以调用它。
 * @returns {{closeDeveloperSettings: function}} 一个包含关闭开发者设置页面功能的对象。
 */
export function initializeDeveloperMode() {
    let logoClickCount = 0; // Logo点击计数器
    let logoClickTimer = null; // 用于重置点击计数的定时器

    // --- DOM 元素获取 ---
    const aboutCardLogo = document.getElementById('about-card-logo');
    const developerIconContainer = document.getElementById('developer-icon-container');
    const developerIcon = document.getElementById('developer-icon');
    const closeDeveloperSettingsBtn = document.getElementById('close-developer-settings-btn');
    const devOptionsToggle = document.getElementById('dev-options-toggle');
    
    /** @description 打开开发者设置页面 */
    const openDeveloperSettings = () => {
        updateDeveloperSettingsUI(); // 打开前，确保UI与当前设置状态同步
        document.body.classList.add('developer-settings-open');
    };

    /** @description 关闭开发者设置页面 */
    const closeDeveloperSettings = () => document.body.classList.remove('developer-settings-open');

    // --- “彩蛋”：解锁开发者模式 ---
    if (aboutCardLogo) {
        aboutCardLogo.addEventListener('click', () => {
            // 为了更好的点击反馈，重新触发点击动画
            aboutCardLogo.classList.remove('logo-click-bounce-anim');
            void aboutCardLogo.offsetWidth; // 强制浏览器重绘，以便动画能重新播放
            aboutCardLogo.classList.add('logo-click-bounce-anim');

            // 检查总开关，如果开发者功能被禁用，则不执行任何操作
            if (!appSettings.developer.masterSwitchEnabled) return;

            clearTimeout(logoClickTimer); // 清除上一个定时器
            logoClickCount++;

            // 如果在1.5秒内连续点击了5次
            if (logoClickCount >= 5) {
                // 如果开发者图标尚未显示，则显示它并保存解锁状态
                if (!developerIconContainer.classList.contains('visible')) {
                    developerIconContainer.classList.add('visible');
                    try {
                        localStorage.setItem('developerModeUnlocked', 'true');
                    } catch (e) {
                        console.error("无法保存到localStorage", e);
                    }
                }
                // 每次重新解锁时，都将UI开关重置为开启状态
                appSettings.developer.uiToggleState = true;
                saveSettings();

                logoClickCount = 0; // 重置计数器
                clearTimeout(logoClickTimer); // 停止定时器
            } else {
                // 设置一个1.5秒的定时器，如果期间没有再次点击，则重置计数器
                logoClickTimer = setTimeout(() => {
                    logoClickCount = 0;
                }, 1500);
            }
        });

        // 动画结束后移除动画类，以便下次点击时可以重新添加
        aboutCardLogo.addEventListener('animationend', () => {
            aboutCardLogo.classList.remove('logo-click-bounce-anim');
        });
    }

    // --- 事件监听器绑定 ---
    if (developerIcon) developerIcon.addEventListener('click', openDeveloperSettings);
    if (closeDeveloperSettingsBtn) closeDeveloperSettingsBtn.addEventListener('click', closeDeveloperSettings);

    // --- 开发者模式总开关逻辑 ---
    if (devOptionsToggle) {
        devOptionsToggle.addEventListener('change', () => {
            const isEnabled = devOptionsToggle.checked;
            appSettings.developer.uiToggleState = isEnabled;

            if (isEnabled) {
                // 如果开启，则显示开发者图标
                if (developerIconContainer) {
                    developerIconContainer.classList.add('visible');
                }
            } else {
                // 如果关闭，则重置所有开发者子选项
                appSettings.developer.forceNewYearTheme = false;
                
                // 同步更新UI上的子选项状态
                const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');
                if (forceNewYearToggle) {
                    forceNewYearToggle.checked = false;
                }
                
                // 应用因设置重置而产生的视觉变化
                applyNewYearMode(); 
                
                // 隐藏开发者图标
                if (developerIconContainer) {
                    developerIconContainer.classList.remove('visible');
                }

                // 重新锁定开发者模式，移除localStorage中的状态
                try {
                    localStorage.removeItem('developerModeUnlocked');
                } catch (e) {
                    console.error("无法从localStorage中移除", e);
                }

                // 关闭开发者设置窗口
                closeDeveloperSettings();
            }
            
            saveSettings(); // 保存更改
        });
    }

    // --- 启动时检查持久化的解锁状态 ---
    // 页面加载时，检查localStorage中是否已记录为解锁状态
    try {
        if (localStorage.getItem('developerModeUnlocked') === 'true') {
            if (developerIconContainer) {
                developerIconContainer.classList.add('visible');
            }
        }
    } catch (e) {
        console.error("无法从localStorage读取developerModeUnlocked状态", e);
    }

    // 返回需要被其他模块调用的函数
    return { closeDeveloperSettings };
}
