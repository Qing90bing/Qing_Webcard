/**
 * @file time-format-settings.js
 * @description
 * 本文件负责处理设置面板中“时间格式”选项（12小时制/24小时制）的交互逻辑。
 *
 * @module components/ui/clock/time-format-settings
 */
import { appSettings, saveSettings } from '../../../core/settings.js';
import { applyCurrentView } from '../../system/view-manager/view-manager.js';

/**
 * @description 初始化时间格式设置的事件监听器。
 * @param {object} clockModule - 从 `clock.js` 传入的时钟模块实例。
 *        这个实例必须包含一个 `updateTime` 方法，以便在格式更改后能立即刷新时钟显示。
 */
export function initializeTimeFormatSettings(clockModule) {
    const timeFormatRadios = document.querySelectorAll('input[name="time-format"]');

    timeFormatRadios.forEach(radio => {
        // 1. 根据已加载的设置，初始化单选按钮的选中状态。
        if (radio.value === appSettings.timeFormat) {
            radio.checked = true;
        }

        // 2. 为每个单选按钮添加 'change' 事件监听器。
        radio.addEventListener('change', () => {
            if (radio.checked) {
                // 当用户做出选择时，更新全局设置对象。
                appSettings.timeFormat = radio.value;
                saveSettings(); // 保存设置到localStorage。

                // 立即调用时钟模块的更新函数，使时间格式的更改即时生效。
                if (clockModule && typeof clockModule.updateTime === 'function') {
                    clockModule.updateTime();
                }

                // 如果当前主视图是天气，则重新应用视图。
                // 这是因为天气视图中显示的日出/日落时间也受此设置影响。
                if (appSettings.view === 'weather') {
                    applyCurrentView();
                }
            }
        });
    });
}
