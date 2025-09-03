/**
 * @file weather-ui.js
 * @description
 * 本文件负责管理天气组件的用户界面（UI）交互。
 * 目前，它的主要职责是为“刷新”按钮绑定事件监听器。
 * 这种将UI交互逻辑与核心数据获取逻辑分离的做法，使得代码结构更清晰。
 *
 * @module components/features/weather/weather-ui
 */

import { fetchAndDisplayWeather, setWeatherSpinner } from './weather.js';

/**
 * @description 初始化天气功能的UI事件监听器。
 */
export function initializeWeatherUI() {
    const refreshBtn = document.getElementById('weather-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // 当用户点击刷新按钮时，直接调用从 weather.js 导入的函数

            // 1. 让刷新图标开始旋转，提供即时反馈
            setWeatherSpinner(true);

            // 2. 触发完整的天气获取和显示流程
            fetchAndDisplayWeather();
        });
    }
}
