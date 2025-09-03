/**
 * @file time-capsule.js
 * @description
 * 本文件负责实现“时间胶囊”功能。
 * 它通过计算当前日期在今日、本周、本月、本年中的进度，
 * 并将这些信息以进度条的形式直观地展示出来，提醒用户时间的流逝。
 *
 * @module components/features/time-capsule
 */

/**
 * @description 更新所有时间胶囊进度条的显示。
 * 这是模块的核心函数，包含了所有时间进度的计算逻辑。
 */
export function updateTimeCapsule() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const dayOfMonth = now.getDate();
    const dayOfWeek = now.getDay(); // 0 = 星期日, 1 = 星期一, ..., 6 = 星期六
    const hour = now.getHours();

    /**
     * @description 一个辅助函数，用于统一更新单个进度条的UI元素。
     * @param {string} idPrefix - 进度条相关DOM元素的ID前缀 (如 'day', 'week')。
     * @param {number} passed - 已过去的时间单位数量。
     * @param {number} left - 剩余的时间单位数量。
     * @param {number} percent - 已过去的百分比。
     */
    const updateProgressUI = (idPrefix, passed, left, percent) => {
        const passedEl = document.getElementById(`${idPrefix}-passed`);
        const leftEl = document.getElementById(`${idPrefix}-left`);
        const percentEl = document.getElementById(`${idPrefix}-percent`);
        const progressEl = document.getElementById(`${idPrefix}-progress`);

        if (passedEl) passedEl.textContent = passed;
        if (leftEl) leftEl.textContent = left;
        if (percentEl) percentEl.textContent = `${percent.toFixed(1)}%`; // 保留一位小数
        if (progressEl) progressEl.style.width = `${percent}%`;
    };

    // --- 1. 今日进度 ---
    const dayPassed = hour;
    const dayPercent = (dayPassed / 24) * 100;
    updateProgressUI('day', dayPassed, 24 - dayPassed, dayPercent);

    // --- 2. 本周进度 (以周一为一周的开始) ---
    // 将星期日(0)映射为6，其他日子(1-6)映射为0-5
    const weekPassed = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    // 更精确的计算，将小时数也折算进去
    const weekPercent = ((weekPassed + (hour / 24)) / 7) * 100;
    updateProgressUI('week', weekPassed, 7 - weekPassed, weekPercent);

    // --- 3. 本月进度 ---
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 获取当月总天数
    const monthPassed = dayOfMonth;
    const monthPercent = (monthPassed / daysInMonth) * 100;
    updateProgressUI('month', monthPassed, daysInMonth - monthPassed, monthPercent);

    // --- 4. 今年进度 ---
    const startOfYear = new Date(year, 0, 1); // 当年的第一天
    // 计算当年是闰年还是平年，得出总天数
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDaysInYear = isLeapYear ? 366 : 365;
    // 计算从年初到今天过去了多少天
    const yearPassed = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24));
    const yearPercent = (yearPassed / totalDaysInYear) * 100;
    updateProgressUI('year', yearPassed, totalDaysInYear - yearPassed, yearPercent);
}

/**
 * @description 初始化时间胶囊功能。
 * 它会立即执行一次更新，然后设置一个定时器，每分钟更新一次。
 * @returns {{updateTimeCapsule: function}} 返回一个包含 `updateTimeCapsule` 函数的对象，
 *                                           以便在需要时从外部手动触发更新。
 */
export function initializeTimeCapsule() {
    updateTimeCapsule(); // 立即执行一次，避免页面加载后出现空数据
    setInterval(updateTimeCapsule, 60000); // 设置定时器，每分钟更新一次

    // 返回API，允许外部调用
    return {
        updateTimeCapsule
    };
}
