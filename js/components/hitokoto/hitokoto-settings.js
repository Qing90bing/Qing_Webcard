import { appSettings, saveSettings } from '../../settings.js';

/**
 * 初始化“一言”功能的设置交互。
 * @param {object} hitokotoModule - 从 hitokoto.js 初始化后返回的模块实例。
 */
export function initializeHitokotoSettings(hitokotoModule) {
    const hitokotoModeRadios = document.querySelectorAll('input[name="hitokoto-mode"]');
    const customOptionsContainer = document.getElementById('hitokoto-custom-options');
    const categoryCheckboxes = document.querySelectorAll('input[name="hitokoto-category"]');
    const selectAllCheckbox = document.getElementById('hitokoto-select-all');
    const saveBtn = document.getElementById('hitokoto-save-btn');

    hitokotoModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const newMode = radio.value;
            appSettings.hitokoto.mode = newMode;
            if (newMode === 'default') {
                customOptionsContainer.classList.remove('open');
                saveSettings();
                // 切换到默认模式时，立即获取新的一言
                hitokotoModule.fetchHitokoto();
            } else {
                customOptionsContainer.classList.add('open');
                // 首次进入自定义模式且未选择任何分类时，默认选中第一个
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

    selectAllCheckbox.addEventListener('change', () => {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('input[name="hitokoto-category"]:checked').length;
            
            // 防止取消选中最后一个复选框
            if (checkedCount === 0) {
                checkbox.checked = true;
            }

            // 更新“全选”复选框的状态
            selectAllCheckbox.checked = checkedCount === categoryCheckboxes.length;
        });
    });

    saveBtn.addEventListener('click', () => {
        const selectedCategories = Array.from(document.querySelectorAll('input[name="hitokoto-category"]:checked')).map(cb => cb.value);
        
        if (selectedCategories.length === 0) {
            const validationMsg = document.getElementById('hitokoto-validation-msg');
            validationMsg.classList.add('visible');
            setTimeout(() => {
                validationMsg.classList.remove('visible');
            }, 3000);
            return;
        }

        appSettings.hitokoto.categories = selectedCategories;
        saveSettings();
        hitokotoModule.fetchHitokoto();

        // 保存按钮的确认动画
        const saveIcon = saveBtn.querySelector('i');
        const confirmIcon = document.getElementById('hitokoto-confirm-icon');
        
        saveBtn.disabled = true;
        saveIcon.style.opacity = '0';
        
        setTimeout(() => {
            confirmIcon.style.opacity = '1';

            setTimeout(() => {
                confirmIcon.style.opacity = '0';
                setTimeout(() => {
                    saveIcon.style.opacity = '1';
                    saveBtn.disabled = false;
                }, 300);
            }, 3000);
        }, 300);
    });
}
