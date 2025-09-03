/**
 * @file settings-modal.js
 * @description
 * 本文件负责管理主设置模态框的打开和关闭逻辑。
 * 它还包含了对设置面板内部滚动条和滚动遮罩效果的初始化。
 *
 * @module components/system/settings/settings-modal
 */
import { updateSettingsUI } from './settings-updater.js';

let settingsSimpleBar = null; // 用于缓存SimpleBar滚动条插件的实例

/**
 * @description 打开设置面板。
 */
function openSettings() {
    // 每次打开时，都先调用updater来确保面板中的所有UI控件都反映了最新的设置状态。
    updateSettingsUI();
    const settingsWindow = document.getElementById('settings-window');
    
    // 修正：临时禁用某些覆盖层上的过渡动画，以防止在面板打开时出现不必要的动画效果。
    const overlay1 = document.getElementById('background-settings-overlay');
    const overlay2 = document.getElementById('blur-slider-overlay');

    if (overlay1) overlay1.style.transition = 'none';
    if (overlay2) overlay2.style.transition = 'none';

    document.body.classList.add('settings-open');
    
    // 在面板出现后，再恢复这些过渡动画。
    setTimeout(() => {
        if (overlay1) overlay1.style.transition = '';
        if (overlay2) overlay2.style.transition = '';
    }, 300);


    // --- 懒加载滚动条和遮罩效果 ---
    // 仅在首次打开设置面板时初始化SimpleBar，以优化性能。
    if (!settingsSimpleBar) {
        const contentWrapper = settingsWindow.querySelector('[data-simplebar]');
        if (contentWrapper) {
            settingsSimpleBar = new SimpleBar(contentWrapper);
            const scrollElement = settingsSimpleBar.getScrollElement();
            const maskContainer = contentWrapper; // 遮罩是应用在带有data-simplebar属性的容器上
            const maxFadeSize = 24; // 对应CSS变量中的最大遮罩高度

            /**
             * @description 根据滚动位置更新顶部和底部的淡入淡出遮罩。
             */
            const updateSettingsMask = () => {
                const { scrollTop, scrollHeight, clientHeight } = scrollElement;
                const tolerance = 1; // 1像素的容差
                // 如果内容无需滚动，则移除遮罩
                if (scrollHeight <= clientHeight + tolerance) {
                    maskContainer.style.setProperty('--fade-top-size', '0px');
                    maskContainer.style.setProperty('--fade-bottom-size', '0px');
                    return;
                }
                const scrollBottom = scrollHeight - clientHeight - scrollTop;
                const topFade = Math.min(scrollTop, maxFadeSize);
                const bottomFade = Math.min(scrollBottom, maxFadeSize);
                // 通过CSS自定义属性来动态控制遮罩的高度
                maskContainer.style.setProperty('--fade-top-size', `${topFade}px`);
                maskContainer.style.setProperty('--fade-bottom-size', `${bottomFade}px`);
            };

            scrollElement.addEventListener('scroll', updateSettingsMask);
            // 初始化时调用一次以设置初始状态，稍作延迟以等待DOM渲染完成
            setTimeout(updateSettingsMask, 50);
        }
    }
}

/**
 * @description 关闭设置面板。
 */
export function closeSettings() {
    document.body.classList.remove('settings-open');
}

/**
 * @description 初始化设置模态框的打开和关闭按钮的事件监听器。
 */
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
