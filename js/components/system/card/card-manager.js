/**
 * @file card-manager.js
 * @description
 * 本文件是右侧栏卡片的视图管理器。它负责控制哪个卡片（主栏、关于、时间胶囊等）当前可见，
 * 并处理它们之间的切换逻辑、动画效果以及内容的懒加载。
 *
 * @module components/system/card/card-manager
 */

import { updateTimeCapsule } from '../../features/time-capsule/time-capsule.js';
import { fetchAndRenderCommits, updateCommitMask } from '../../features/github/commit-history.js';

// --- 模块级状态和元素缓存 ---
let aboutCardHasAnimated = false; // 标记“关于”卡片是否已播放过入场动画
let commitsFetched = false;     // 标记GitHub提交记录是否已获取过
let rightColumn, timeCapsuleCard, holidayListCard, aboutCard, profileCard, aboutCardTrigger, closeAboutCardBtn, refreshCommitsBtn, closeTimeCapsuleBtn;

/**
 * @description 为右侧主栏的卡片应用入场动画。
 */
export function animateRightColumnIn() {
    if (!rightColumn) return;
    const elementsToAnimate = rightColumn.querySelectorAll(':scope > div');
    elementsToAnimate.forEach(el => {
        el.classList.remove('bounce-in');
        void el.offsetWidth; // 强制浏览器重绘，以确保动画能够重新播放
        el.classList.add('bounce-in');
    });
}

/**
 * @description 显示右侧主栏，并隐藏所有覆盖型卡片。
 */
function showRightColumn() {
    if (!rightColumn) return;
    timeCapsuleCard.classList.add('hidden');
    holidayListCard.classList.add('hidden');
    aboutCard.classList.add('hidden');
    rightColumn.classList.remove('hidden');
    animateRightColumnIn();
}

/**
 * @description 隐藏所有视图，包括右侧主栏和所有覆盖型卡片。通常在显示特定卡片前调用。
 */
function hideAllViews() {
    if (!rightColumn) return;
    rightColumn.classList.add('hidden');
    timeCapsuleCard.classList.add('hidden');
    holidayListCard.classList.add('hidden');
    aboutCard.classList.add('hidden');
}

/**
 * @description 切换“关于”卡片的可见性。
 */
export function toggleAboutCard() {
    if (!aboutCard) return;
    const isHidden = aboutCard.classList.contains('hidden');

    if (isHidden) {
        // --- 显示 "关于" 卡片 ---
        hideAllViews();
        aboutCard.classList.remove('hidden');

        // 首次显示时播放入场动画
        if (!aboutCardHasAnimated) {
            aboutCard.classList.add('bounce-in');
            aboutCardHasAnimated = true;
        }

        // --- 懒加载内容 ---
        // 首次显示时初始化滚动条插件
        const commitsContainer = document.getElementById('recent-commits-container');
        if (commitsContainer && !SimpleBar.instances.get(commitsContainer)) {
            const simplebarInstance = new SimpleBar(commitsContainer);
            simplebarInstance.getScrollElement().addEventListener('scroll', updateCommitMask);
        }

        // 首次显示时获取GitHub提交记录
        if (!commitsFetched) {
            fetchAndRenderCommits();
            commitsFetched = true;
        }
    } else {
        // --- 隐藏 "关于" 卡片，返回主栏 ---
        showRightColumn();
    }
}

/**
 * @description 切换“时间胶囊”卡片的可见性。
 */
function toggleTimeCapsuleCard() {
    if (!timeCapsuleCard) return;
    const isHidden = timeCapsuleCard.classList.contains('hidden');

    if (isHidden) {
        hideAllViews();
        timeCapsuleCard.classList.remove('hidden');
        timeCapsuleCard.classList.add('bounce-in');
        updateTimeCapsule(); // 每次显示时都更新时间进度
    } else {
        showRightColumn();
    }
}

/**
 * @description 检查是否有任何覆盖型卡片是打开的，如果有则关闭它。
 * 这个函数主要被全局事件（如按下Esc键）调用。
 * @returns {boolean} - 如果成功关闭了一个卡片则返回true，否则返回false。
 */
export function closeOpenCard() {
    if (aboutCard && !aboutCard.classList.contains('hidden')) {
        showRightColumn();
        return true;
    }
    if (holidayListCard && !holidayListCard.classList.contains('hidden')) {
        showRightColumn();
        return true;
    }
    if (timeCapsuleCard && !timeCapsuleCard.classList.contains('hidden')) {
        showRightColumn();
        return true;
    }
    return false;
}

/**
 * @description 初始化所有与卡片管理相关的事件监听器。
 */
export function initializeCardManager() {
    // 缓存DOM元素以提高性能和便利性
    rightColumn = document.getElementById('right-column');
    timeCapsuleCard = document.getElementById('time-capsule-card');
    holidayListCard = document.getElementById('holiday-list-card');
    aboutCard = document.getElementById('about-card');
    profileCard = document.getElementById('profile-card');
    aboutCardTrigger = document.getElementById('about-card-trigger');
    closeAboutCardBtn = document.getElementById('close-about-card');
    refreshCommitsBtn = document.getElementById('refresh-commits-btn');
    closeTimeCapsuleBtn = document.getElementById('close-time-capsule');

    // --- 事件监听器设置 ---

    if (profileCard) {
        profileCard.addEventListener('click', (e) => {
            // 如果点击的是卡片内的链接，则不触发卡片切换
            if (e.target.closest('a')) {
                return;
            }
            toggleTimeCapsuleCard();
        });
    }

    if (closeTimeCapsuleBtn) {
        closeTimeCapsuleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡到父元素(profileCard)
            showRightColumn();
        });
    }

    if (aboutCardTrigger) {
        aboutCardTrigger.addEventListener('click', toggleAboutCard);
    }

    if (closeAboutCardBtn) {
        closeAboutCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAboutCard(); // 再次调用toggle会隐藏卡片
        });
    }

    if (refreshCommitsBtn) {
        refreshCommitsBtn.addEventListener('click', () => {
            fetchAndRenderCommits(); // 手动刷新提交记录
        });
    }
}
