/**
 * @file tooltip.js
 * @description
 * 本文件负责实现一个由JavaScript驱动的全局工具提示（Tooltip）功能。
 * 它会自动为页面上任何带有 `data-tooltip` 属性的元素在鼠标悬停时显示一个自定义样式的提示框。
 *
 * @module components/common/tooltip
 */

/**
 * @description 初始化工具提示功能。
 * 这个函数应该在应用启动时调用一次。它会设置必要的事件监听器来控制提示框的显示、隐藏和定位。
 *
 * 实现原理：
 * - 使用一个单例模式的 `tooltipEl` 元素来显示所有提示信息，避免创建大量DOM节点。
 * - 通过事件委托（Event Delegation）在 `document.body` 上监听 `mouseover` 和 `mouseout` 事件，
 *   这样无需为每个带提示的元素单独绑定监听器，性能更高。
 * - 提示框的位置会根据目标元素动态计算，并带有边缘检测，防止提示框超出屏幕范围。
 * - 带有轻微的延迟显示，以避免在鼠标快速划过元素时造成不必要的闪烁。
 */
export function setupTooltips() {
    let tooltipEl = null; // 单例的提示框DOM元素
    let showTimer = null; // 用于延迟显示的定时器

    /**
     * @description 创建并初始化提示框的DOM元素。
     * 这是一个惰性创建（Lazy Creation）的函数，只有在第一次需要显示提示框时，
     * 才会创建`tooltipEl`元素并将其添加到`body`中。
     */
    function createTooltipElement() {
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.classList.add('js-tooltip'); // 添加CSS类以便样式化
            document.body.appendChild(tooltipEl);
        }
    }

    /**
     * @description 显示提示框。
     * @param {HTMLElement} target - 触发提示框的源元素（即带有`data-tooltip`属性的元素）。
     */
    function showTooltip(target) {
        const tooltipText = target.getAttribute('data-tooltip');
        if (!tooltipText) return; // 如果没有提示内容，则不显示

        createTooltipElement(); // 确保提示框元素已创建
        tooltipEl.textContent = tooltipText; // 设置提示内容
        positionTooltip(target); // 计算并设置提示框位置

        // 触发CSS动画，使提示框平滑显示
        tooltipEl.style.opacity = '1';
        tooltipEl.style.transform = 'scale(1) translateY(0)';
    }

    /**
     * @description 隐藏提示框。
     * 通过CSS动画使其平滑消失。
     */
    function hideTooltip() {
        if (tooltipEl) {
            tooltipEl.style.opacity = '0';
            tooltipEl.style.transform = 'scale(0.95) translateY(5px)';
        }
    }

    /**
     * @description 计算并设置提示框的精确位置。
     * @param {HTMLElement} target - 触发提示框的源元素。
     */
    function positionTooltip(target) {
        if (!tooltipEl || !target) return;

        const targetRect = target.getBoundingClientRect(); // 目标元素的位置和尺寸
        const tooltipRect = tooltipEl.getBoundingClientRect(); // 提示框的尺寸
        const offset = 10; // 提示框与目标元素之间的距离

        // 默认将提示框放在目标元素上方
        let top = targetRect.top - tooltipRect.height - offset;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // --- 边缘检测 ---
        // 如果上方空间不足，则移动到下方
        if (top < 0) {
            top = targetRect.bottom + offset;
        }
        // 如果左侧超出屏幕，则贴近左边缘
        if (left < 0) {
            left = 5;
        }
        // 如果右侧超出屏幕，则贴近右边缘
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 5;
        }

        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
    }
    
    // 使用事件委托监听所有元素的 `mouseover` 事件
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]'); // 寻找带有`data-tooltip`属性的祖先元素
        if (target) {
            clearTimeout(showTimer); // 清除之前的隐藏定时器
            // 设置一个短暂延迟后显示提示框，提升用户体验
            showTimer = setTimeout(() => {
                showTooltip(target);
            }, 200); // 200毫秒延迟
        }
    });

    // 使用事件委托监听 `mouseout` 事件
    document.body.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            clearTimeout(showTimer); // 清除可能存在的待显示定时器
            hideTooltip(); // 立即隐藏
        }
    });

    // 监听全局滚动事件，当页面滚动时隐藏提示框，防止其错位
    window.addEventListener('scroll', () => {
        clearTimeout(showTimer);
        hideTooltip();
    }, true); // 使用捕获阶段，以便更早地处理事件
}
