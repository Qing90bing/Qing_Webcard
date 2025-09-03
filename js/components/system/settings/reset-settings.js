/**
 * @file reset-settings.js
 * @description
 * 本文件负责处理“重置所有设置”功能的交互逻辑。
 * 它包含一个确认模态框，以防止用户意外操作。确认后，它会清除所有相关的localStorage项并重新加载页面。
 *
 * @module components/system/settings/reset-settings
 */
import { resetLuckGame } from '../../features/luck-game/luck-game.js';

/**
 * @description 初始化重置设置功能的事件监听器。
 */
export function initializeResetSettings() {
    // --- DOM元素获取 ---
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    const resetConfirmOverlay = document.getElementById('reset-confirm-overlay');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const resetConfirmState = document.getElementById('reset-confirm-state');
    const resetSuccessState = document.getElementById('reset-success-state');

    /**
     * @description 打开重置确认模态框。
     */
    const openResetModal = () => {
        // 确保每次打开时，模态框都处于初始的“确认”状态
        if(resetConfirmState) resetConfirmState.classList.remove('hidden');
        if(resetSuccessState) resetSuccessState.classList.add('hidden');
        if(confirmResetBtn) confirmResetBtn.disabled = false;
        if(cancelResetBtn) cancelResetBtn.disabled = false;

        if (resetConfirmOverlay) {
            resetConfirmOverlay.classList.remove('hidden');
            // 使用setTimeout确保 'hidden' 类移除后，浏览器有时间应用display属性，然后再触发CSS过渡动画
            setTimeout(() => {
                document.body.classList.add('reset-confirm-open');
            }, 10); 
        }
    };

    /**
     * @description 关闭重置确认模态框。
     */
    const closeResetModal = () => {
        document.body.classList.remove('reset-confirm-open');
    };
    
    // 监听CSS过渡结束事件，以便在模态框完全淡出后，再将其display设为none
    if (resetConfirmOverlay) {
        resetConfirmOverlay.addEventListener('transitionend', (event) => {
            // 确保是opacity属性的过渡结束，并且模态框确实是处于关闭状态
            if (event.propertyName === 'opacity' && !document.body.classList.contains('reset-confirm-open')) {
                resetConfirmOverlay.classList.add('hidden');
            }
        });
    }

    // --- 事件监听器绑定 ---
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', openResetModal);
    }
    if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', closeResetModal);
    }
    // 点击模态框的灰色背景区域也可以关闭它
    if (resetConfirmOverlay) {
        resetConfirmOverlay.addEventListener('click', (e) => {
            if (e.target === resetConfirmOverlay) {
                closeResetModal();
            }
        });
    }
    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', () => {
            // --- 重置流程 ---
            // 1. 立即禁用按钮，防止用户重复点击
            confirmResetBtn.disabled = true;
            if(cancelResetBtn) cancelResetBtn.disabled = true;

            // 2. 淡出确认信息
            if(resetConfirmState) resetConfirmState.style.opacity = '0';

            // 3. 在淡出动画后，切换到成功信息并淡入
            setTimeout(() => {
                if(resetConfirmState) resetConfirmState.classList.add('hidden');
                
                if(resetSuccessState) {
                    resetSuccessState.style.opacity = '0';
                    resetSuccessState.classList.remove('hidden');
                    
                    setTimeout(() => {
                        resetSuccessState.style.opacity = 1;
                    }, 20);
                }

                // 4. 执行实际的清除操作
                resetLuckGame(); // 重置“今日人品”游戏的状态
                localStorage.removeItem('qing-homepage-settings'); // 清除主设置
                localStorage.removeItem('developerModeUnlocked'); // 清除开发者模式解锁状态

                // 5. 在显示成功信息1.5秒后，重新加载页面以应用默认设置
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }, 250); // 此延迟应与CSS过渡时间匹配
        });
    }
}
