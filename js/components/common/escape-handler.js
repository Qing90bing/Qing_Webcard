/**
 * @file escape-handler.js
 * @description
 * 本文件负责提供一个全局的 "Escape" (Esc) 按键事件处理器。
 * 当用户按下 Esc 键时，它会按照预设的优先级顺序来关闭当前打开的模态框或视图。
 * 这种集中式处理避免了在多个不同组件中重复编写相同的关闭逻辑。
 *
 * @module components/common/escape-handler
 */

import { closeSettings } from '../system/settings/settings-modal.js';
import { closeOpenCard } from '../system/card/card-manager.js';

/**
 * @description 初始化全局的键盘监听器，专门用于处理 "Escape" 键。
 * 它会按照以下优先级顺序，依次检查并关闭最上层的UI元素：
 * 1. 沉浸式视图
 * 2. 开发者设置模态框
 * 3. 常规设置模态框
 * 4. 任何已打开的卡片
 *
 * 这种优先级设计确保了用户按下 Esc 键时，总能关闭最符合直觉的那个窗口。
 *
 * @param {object} dependencies - 一个包含从其他模块注入的依赖的对象。
 * @param {function} dependencies.getCloseDeveloperSettings - 一个用于获取 `closeDeveloperSettings` 函数的函数。
 *        这种"getter"函数的设计是为了解决循环依赖问题：`main.js` 需要初始化此模块，而此模块又需要
 *        一个由 `developer-mode.js` (在 `main.js` 中初始化) 提供的函数。通过传递一个getter，
 *        我们延迟了对 `closeDeveloperSettings` 函数的实际访问，直到它真正被需要（即Esc键被按下时）。
 */
export function initializeEscapeKeyHandler({ getCloseDeveloperSettings }) {
    document.addEventListener('keydown', (e) => {
        // 如果按下的不是 "Escape" 键，则直接返回，不做任何处理。
        if (e.key !== 'Escape') {
            return;
        }

        // 优先级 0: 关闭沉浸式视图
        // 如果当前处于沉浸式视图模式，则模拟点击退出按钮。
        if (document.body.classList.contains('immersive-active')) {
            document.getElementById('exit-immersive-btn').click();
            return; // 完成操作后返回，不再继续检查其他层级
        }

        // 优先级 1: 关闭开发者设置模态框
        // 如果开发者设置是打开的，则调用从外部注入的关闭函数。
        if (document.body.classList.contains('developer-settings-open')) {
            const closeDeveloperSettings = getCloseDeveloperSettings();
            if (closeDeveloperSettings) {
                closeDeveloperSettings();
            }
            return; // 完成操作后返回
        }

        // 优先级 2: 关闭常规设置模态框
        // 如果设置模态框是打开的，则调用其关闭函数。
        if (document.body.classList.contains('settings-open')) {
            closeSettings();
            return; // 完成操作后返回
        }

        // 优先级 3: 关闭任何已打开的卡片
        // `closeOpenCard` 函数会检查是否有卡片是打开的，并尝试关闭它。
        // 如果成功关闭了一个卡片，它会返回 `true`。
        if (closeOpenCard()) {
            return; // 完成操作后返回
        }
    });
}
