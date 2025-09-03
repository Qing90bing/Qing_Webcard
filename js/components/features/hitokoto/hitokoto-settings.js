/**
 * @file hitokoto-settings.js
 * @description
 * 本文件负责处理“一言”功能在设置页面中的所有交互逻辑。
 * 它包括模式切换（默认/自定义）、分类选择以及保存设置等功能。
 *
 * @module components/features/hitokoto/hitokoto-settings
 */

import { appSettings, saveSettings } from '../../../core/settings.js';

/**
 * @description 初始化“一言”功能的设置面板交互。
 * @param {object} hitokotoModule - 从 `hitokoto.js` 初始化后返回的模块实例。这个实例包含了 `fetchHitokoto` 方法，
 *                                  允许本模块在设置变更后触发一言的刷新。
 */
export function initializeHitokotoSettings(hitokotoModule) {
    // --- DOM 元素获取 ---
    const hitokotoModeRadios = document.querySelectorAll('input[name="hitokoto-mode"]');
    const customOptionsContainer = document.getElementById('hitokoto-custom-options');
    const categoryCheckboxes = document.querySelectorAll('input[name="hitokoto-category"]');
    const selectAllCheckbox = document.getElementById('hitokoto-select-all');
    const saveBtn = document.getElementById('hitokoto-save-btn');

    // --- “一言”模式切换逻辑 (默认 vs 自定义) ---
    hitokotoModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const newMode = radio.value;
            appSettings.hitokoto.mode = newMode; // 更新设置对象中的模式

            if (newMode === 'default') {
                // 如果切换到默认模式
                customOptionsContainer.classList.remove('open'); // 收起自定义选项
                saveSettings(); // 保存设置
                hitokotoModule.fetchHitokoto(); // 立即获取一条新的一言
            } else {
                // 如果切换到自定义模式
                customOptionsContainer.classList.add('open'); // 展开自定义选项
                // 检查：如果当前一个分类都没选，则默认选中第一个，以提供更好的用户体验
                const checkedCount = document.querySelectorAll('input[name="hitokoto-category"]:checked').length;
                if (checkedCount === 0) {
                    const firstCategoryCheckbox = document.getElementById('hitokoto-cat-a');
                    if (firstCategoryCheckbox) {
                        firstCategoryCheckbox.checked = true;
                    }
                }
            }
        });
    });

    // --- “全选”复选框逻辑 ---
    selectAllCheckbox.addEventListener('change', () => {
        // 当“全选”框状态改变时，同步所有分类复选框的状态
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    // --- 单个分类复选框逻辑 ---
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('input[name="hitokoto-category"]:checked').length;
            
            // 健壮性检查：防止用户取消选中最后一个复选框，确保至少有一个分类被选中
            if (checkedCount === 0) {
                checkbox.checked = true; // 如果用户尝试取消最后一个，则强制其保持选中
            }

            // 联动更新“全选”复选框的状态：如果所有分类都被选中，则“全选”也应为选中状态
            selectAllCheckbox.checked = checkedCount === categoryCheckboxes.length;
        });
    });

    // --- 保存按钮逻辑 ---
    saveBtn.addEventListener('click', () => {
        // 从DOM中获取所有当前被选中的分类
        const selectedCategories = Array.from(document.querySelectorAll('input[name="hitokoto-category"]:checked')).map(cb => cb.value);
        
        // 验证：确保至少选择了一个分类（虽然UI上已阻止，但这里是双重保险）
        if (selectedCategories.length === 0) {
            const validationMsg = document.getElementById('hitokoto-validation-msg');
            validationMsg.classList.add('visible'); // 显示验证失败信息
            setTimeout(() => {
                validationMsg.classList.remove('visible');
            }, 3000); // 3秒后自动隐藏
            return;
        }

        // 更新设置对象并保存到localStorage
        appSettings.hitokoto.categories = selectedCategories;
        saveSettings();
        // 触发一次新的“一言”获取，让用户的更改立即生效
        hitokotoModule.fetchHitokoto();

        // --- 保存按钮的确认动画，提供即时反馈 ---
        const saveIcon = saveBtn.querySelector('i');
        const confirmIcon = document.getElementById('hitokoto-confirm-icon');
        
        saveBtn.disabled = true; // 暂时禁用按钮，防止重复点击
        saveIcon.style.opacity = '0'; // 隐藏保存图标
        
        setTimeout(() => {
            confirmIcon.style.opacity = '1'; // 显示确认（对勾）图标

            setTimeout(() => {
                confirmIcon.style.opacity = '0'; // 隐藏确认图标
                setTimeout(() => {
                    saveIcon.style.opacity = '1'; // 恢复显示保存图标
                    saveBtn.disabled = false; // 重新启用按钮
                }, 300); // 等待动画完成
            }, 3000); // 确认状态持续3秒
        }, 300); // 等待动画完成
    });
}
