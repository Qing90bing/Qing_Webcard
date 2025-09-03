/**
 * @file luck-game-ui.js
 * @description
 * 本文件负责为“今日人品”游戏提供一个隐藏的UI交互功能。
 * 它实现了一个“彩蛋”，允许开发者或测试者通过连续点击特定图标来重置游戏状态。
 *
 * @module components/features/luck-game/luck-game-ui
 */
import { resetLuckGame } from './luck-game.js';

/**
 * @description 初始化“今日人品”游戏的UI交互，主要是设置一个隐藏的重置触发器。
 * 这个功能主要用于开发和测试阶段，方便在不清除localStorage的情况下重复测试每日首次游戏体验。
 */
export function initializeLuckGameUI() {
    // 目标元素是“时间胶囊”卡片标题中的SVG图标
    const luckTitleIcon = document.querySelector('#time-capsule-card h2 svg');
    if (!luckTitleIcon) {
        // 如果页面结构变化导致找不到元素，则静默失败，不执行任何操作。
        return;
    }

    let resetClickCount = 0; // 重置操作的点击计数器
    let resetClickTimer;     // 用于在超时后清零点击计数的定时器

    luckTitleIcon.addEventListener('click', () => {
        resetClickCount++;
        clearTimeout(resetClickTimer); // 每次点击都重置超时定时器

        // 如果在3秒内连续点击了5次
        if (resetClickCount >= 5) {
            resetClickCount = 0; // 重置计数器，准备下一次触发

            // 直接调用从 `luck-game.js` 导入的重置函数
            resetLuckGame();
            console.log('“今日人品”游戏已被重置。'); // 在控制台输出信息，方便调试

        } else {
            // 设置一个3秒的窗口期，如果用户在此期间没有完成5次点击，则计数器归零。
            resetClickTimer = setTimeout(() => {
                resetClickCount = 0;
            }, 3000);
        }
    });
}
