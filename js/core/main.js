/**
 * @file main.js
 * @description
 * 本文件是整个网页应用的入口点（Entry Point）。
 * 它负责在DOM内容加载完毕后，按顺序导入并初始化应用的所有模块（组件、功能、设置等）。
 * 整个应用的启动流程和模块编排都在这里定义。
 *
 * @module core/main
 */

// 导入UI组件模块
import { initializeClock } from '../components/ui/clock/clock.js';
import { initializeGreeting } from '../components/ui/greeting/greeting.js';
import { initializeHolidayDisplay } from '../components/ui/holiday/holiday-display.js';
import { initializeSiteRuntime } from '../components/ui/site-runtime/site-runtime.js';
import { initializeTimeFormatSettings } from '../components/ui/clock/time-format-settings.js';

// 导入功能模块
import { initializeHitokoto } from '../components/features/hitokoto/hitokoto.js';
import { initializeTimeCapsule } from '../components/features/time-capsule/time-capsule.js';
import { initializeWeatherUI } from '../components/features/weather/weather-ui.js';
import { fetchAndDisplayWeather } from '../components/features/weather/weather.js';
import { initializeLuckGameUI } from '../components/features/luck-game/luck-game-ui.js';
import { setupLuckFeature, particleEffects } from '../components/features/luck-game/luck-game.js';
import { initializeHitokotoSettings } from '../components/features/hitokoto/hitokoto-settings.js';

// 导入核心与系统模块
import { appSettings, loadSettings } from './settings.js';
import { initializeTheme, applyCurrentTheme, initializeThemeSlider } from '../components/styling/theme/theme.js';
import { createCrossfader, initBackground, applyCurrentBackground, initializeBackgroundSettings } from '../components/styling/background/background.js';
import { createCardSlider } from '../components/system/card/card-slider.js';
import { setupSettingsUI } from '../components/system/settings/settings-ui.js';
import { initializeResetSettings } from '../components/system/settings/reset-settings.js';
import { initializeAppearanceSettings, applyGlassEffect, applyCardSettings } from '../components/styling/appearance/appearance.js';
import { initializeViewManager, applyCurrentView } from '../components/system/view-manager/view-manager.js';
import { updateSettingsUI } from '../components/system/settings/settings-updater.js';
import { initializeDeveloperMode } from '../components/developer/developer-mode.js';
import { initializeSettingsModal } from '../components/system/settings/settings-modal.js';
import { initializeImmersiveMode } from '../components/system/immersive/immersive-mode.js';
import { initializeCardManager } from '../components/system/card/card-manager.js';
import { initializeNewYearTheme } from '../components/styling/new-year/new-year-theme.js';

// 导入通用工具模块
import { setupTooltips } from '../components/common/tooltip.js';
import { initializeEscapeKeyHandler } from '../components/common/escape-handler.js';


// --- 模块级变量 ---
// 用于存储模块实例或需要跨模块传递的函数，实现一种简单的依赖注入。
let clockModule; // 存储时钟模块的实例，以便其他模块可以调用其方法
let closeDeveloperSettings; // 存储关闭开发者设置页面的函数

// --- 应用主初始化流程 ---
// 监听DOM内容加载完成事件，确保所有HTML元素都已准备就绪。
document.addEventListener('DOMContentLoaded', () => {
    // 步骤 1: 优先加载设置
    // 这是整个应用启动的第一步，因为后续绝大多数模块的初始化都依赖于用户的配置。
    loadSettings();
    
    // 步骤 2: 初始化核心UI和无依赖的工具模块
    // 这些模块通常不依赖于其他模块的状态，可以先一步设置。
    const bgLayers = document.querySelectorAll('#bg-wrapper .bg-layer');
    const backgroundFader = createCrossfader(Array.from(bgLayers)); // 创建背景交叉渐变效果器
    initBackground(backgroundFader); // 初始化背景
    setupTooltips(); // 初始化全局工具提示
    setupSettingsUI(); // 设置设置界面的基本结构
    createCardSlider('#link-slider-container'); // 创建卡片滑块

    // 步骤 3: 初始化提供接口供其他模块使用的模块
    // 这些模块在初始化后会返回一些函数或实例，供后续模块使用。
    const devModeFuncs = initializeDeveloperMode();
    closeDeveloperSettings = devModeFuncs.closeDeveloperSettings; // 获取关闭开发者设置的函数
    clockModule = initializeClock(appSettings); // 初始化时钟，并保存其实例
    const hitokotoModule = initializeHitokoto(appSettings); // 初始化一言，并保存其实例

    // 步骤 4: 初始化其他所有功能和UI模块
    // 这些模块依赖于前面的步骤，现在可以安全地进行初始化。
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

    // 步骤 5: 初始化重构后的新模块
    initializeImmersiveMode();
    initializeCardManager();
    initializeWeatherUI();
    initializeTimeFormatSettings(clockModule); // 时间格式化设置依赖于时钟模块
    initializeLuckGameUI();
    initializeEscapeKeyHandler({ // ESC键处理器依赖于关闭开发者设置的函数
        getCloseDeveloperSettings: () => closeDeveloperSettings
    });

    // 步骤 6: 初始化幸运游戏和粒子效果
    setupLuckFeature();
    particleEffects.init();

    // 步骤 7: 预计算UI元素
    // 在所有设置加载完毕后，对需要动态计算的UI元素进行初始化。
    initializeThemeSlider();
    
    // 步骤 8: 应用所有基于配置的视觉设置
    // 根据加载的设置，更新页面的外观。
    applyCurrentTheme();
    applyGlassEffect();
    applyCardSettings();
    applyCurrentBackground();
    applyCurrentView();
    
    // 步骤 9: 更新设置界面
    // 确保设置界面中的所有选项都准确反映当前加载的配置。
    updateSettingsUI();
    
    // 步骤 10: 设置定时器
    // 为需要定时更新的功能设置定时器，例如天气信息。
    setInterval(() => {
        if (appSettings.view === 'weather') {
            fetchAndDisplayWeather(); // 每30分钟获取一次天气信息
        }
    }, 30 * 60 * 1000);
});
