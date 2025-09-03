/**
 * @file holiday-display.js
 * @description
 * 本文件负责“节假日”相关的所有UI显示和交互逻辑。它主要包含两个部分：
 * 1.  主界面的“下一个节日倒计时”卡片。
 * 2.  一个可交互的、全年节假日和节气的详细列表视图。
 *
 * @module components/ui/holiday/holiday-display
 */
import { getAllHolidaysForYear } from './calendar.js';

// --- 模块级状态变量 ---
/** @type {number} holidayListDisplayedYear - 假日列表视图当前显示的年份。*/
let holidayListDisplayedYear;
/** @type {boolean} hasManuallyScrolled - 标记用户是否已在假日列表中手动滚动过。*/
let hasManuallyScrolled;
/** @type {object|null} holidayListSimpleBar - 假日列表滚动条插件的实例。*/
let holidayListSimpleBar;
/** @type {IntersectionObserver|null} todayButtonObserver - 用于观察当前节日是否在视口内的观察器。*/
let todayButtonObserver;

// --- DOM元素缓存 ---
// 在模块作用域内缓存DOM元素的引用，可以提高性能，避免在函数中重复查询。
let countdownCard;
let holidayListCard;
let rightColumn;
let timeCapsuleCard;
let aboutCard;
let holidayListContainer;
let holidayListYearSpan;
let yearDisplayControls;
let yearEditControls;
let yearInput;
let confirmYearBtn;
let cancelYearBtn;
let yearInputError;
let yearRangeWarning;
let prevYearBtn;
let nextYearBtn;
let backToTodayBtn;
let closeHolidayListBtn;

// --- 主倒计时卡片更新逻辑 ---

/**
 * @description 更新主界面上“下一个节日”倒计时卡片的内容。
 */
function updateCountdown() {
    const countdownDisplay = document.getElementById('countdown-display');
    if (!countdownDisplay) return;

    const now = new Date();
    // 将时间部分归零，只比较日期
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 获取今年和明年的所有节日，以处理跨年时的情况
    const currentYearEvents = getAllHolidaysForYear(now.getFullYear());
    const nextYearEvents = getAllHolidaysForYear(now.getFullYear() + 1);

    // 从所有事件中筛选出今天及以后的事件
    const upcomingEvents = [...currentYearEvents, ...nextYearEvents].filter(event => event.date >= today);

    if (upcomingEvents.length > 0) {
        const nextHoliday = upcomingEvents[0]; // 第一个就是最近的节日
        const diffTime = nextHoliday.date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 向上取整计算天数差异

        // 根据剩余天数显示不同的文案
        if (diffDays === 0) {
            countdownDisplay.innerHTML = `<span style="color: var(--text-color-primary);">距离</span><br><span class="text-2xl font-bold" style="color: var(--text-color-primary);">${nextHoliday.name}</span><br><strong class="text-4xl font-bold" style="color: var(--accent-color);">今天</strong>`;
        } else if (diffDays === 1) {
            countdownDisplay.innerHTML = `<span style="color: var(--text-color-primary);">距离</span><br><span class="text-2xl font-bold" style="color: var(--text-color-primary);">${nextHoliday.name}</span><br><strong class="text-4xl font-bold" style="color: var(--accent-color);">明天</strong>`;
        } else {
            countdownDisplay.innerHTML = `<span style="color: var(--text-color-primary);">距离</span><br><strong class="text-2xl" style="color: var(--text-color-primary);">${nextHoliday.name}</strong><br><span class="font-bold text-5xl align-baseline">${diffDays}</span><span class="text-lg align-baseline ml-1">天</span>`;
        }
    } else {
        countdownDisplay.textContent = '所有节日都已计算完毕！';
    }
}

// --- 假日列表卡片逻辑 ---

/**
 * @description 一个自定义的平滑滚动函数，提供了比原生`scrollIntoView`更精细的控制。
 * @param {HTMLElement} targetElement - 要滚动到的目标元素。
 * @param {object} options - 配置选项。
 * @param {number} [options.duration=300] - 滚动动画的持续时间（毫秒）。
 * @param {string} [options.block='center'] - 滚动结束后目标元素在视口中的位置 ('center', 'start', 'end')。
 */
function customSmoothScrollTo(targetElement, options) {
    const { duration = 300, block = 'center' } = options;
    // 注意：滚动容器是SimpleBar插件生成的包装元素
    const scrollContainer = document.getElementById('holiday-list-container-wrapper').querySelector('.simplebar-content-wrapper');

    if (!scrollContainer || !targetElement) return;

    let targetY;
    if (block === 'center') {
        targetY = targetElement.offsetTop + (targetElement.offsetHeight / 2) - (scrollContainer.offsetHeight / 2);
    } else if (block === 'start') {
        targetY = targetElement.offsetTop;
    } else { // 'end'
        targetY = targetElement.offsetTop + targetElement.offsetHeight - scrollContainer.offsetHeight;
    }

    // 确保目标Y坐标在有效范围内
    targetY = Math.max(0, Math.min(targetY, scrollContainer.scrollHeight - scrollContainer.clientHeight));

    const startY = scrollContainer.scrollTop;
    const distance = targetY - startY;
    let startTime = null;

    // 三次缓动函数 (Cubic easing)
    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t * t + b;
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    }

    // 使用 requestAnimationFrame 实现动画循环
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startY, distance, duration);
        scrollContainer.scrollTop = run;
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }

    requestAnimationFrame(animation);
}

/**
 * @description 滚动到假日列表中的目标节日（通常是下一个即将到来的节日）。
 * @param {boolean} [isAnimated=true] - 是否使用平滑滚动动画。
 */
function scrollToTargetFestival(isAnimated = true) {
    // 使用setTimeout确保DOM更新完成后再执行滚动
    setTimeout(() => {
        const container = document.getElementById('holiday-list-container');
        if (!container) return;

        // 优先寻找被高亮的节日
        let targetElement = container.querySelector('.highlight-holiday');

        // 如果没有高亮的（例如，所有节日都已过去），则定位到列表的最后一个节日
        if (!targetElement) {
            const allHolidays = container.querySelectorAll('.flex.justify-between.items-center');
            if (allHolidays.length > 0) {
                targetElement = allHolidays[allHolidays.length - 1];
            }
        }

        if (targetElement) {
            if (isAnimated) {
                customSmoothScrollTo(targetElement, { duration: 300, block: 'center' });
            } else {
                targetElement.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        }
    }, 160);
}

/**
 * @description 更新“返回今日”按钮的可见性。
 * 使用 IntersectionObserver 高效地判断目标节日是否在视口内。
 */
function updateTodayButtonVisibility() {
    const currentYear = new Date().getFullYear();

    if (todayButtonObserver) {
        todayButtonObserver.disconnect(); // 清理旧的观察器
    }

    // 如果当前显示的不是今年，则“返回今日”按钮始终可见
    if (holidayListDisplayedYear !== currentYear) {
        backToTodayBtn.classList.add('visible');
        return;
    }

    const container = document.getElementById('holiday-list-container');
    let targetElement = container.querySelector('.highlight-holiday');

    if (!targetElement) {
        const allHolidays = container.querySelectorAll('.flex.justify-between.items-center');
        if (allHolidays.length > 0) {
            targetElement = allHolidays[allHolidays.length - 1];
        }
    }

    if (targetElement) {
        const scrollWrapper = document.getElementById('holiday-list-container-wrapper');
        // 创建一个新的观察器
        todayButtonObserver = new IntersectionObserver((entries) => {
            const [entry] = entries;
            // 如果目标元素可见，则隐藏按钮；否则显示按钮。
            if (entry.isIntersecting) {
                backToTodayBtn.classList.remove('visible');
            } else {
                backToTodayBtn.classList.add('visible');
            }
        }, {
            root: scrollWrapper, // 视口为滚动容器
            threshold: 0.5       // 目标元素超过50%可见时触发
        });
        todayButtonObserver.observe(targetElement);
    } else {
        backToTodayBtn.classList.remove('visible');
    }
}

/**
 * @description 显示指定年份的假日列表。
 * @param {number} year - 要显示的年份。
 * @param {boolean} [isAnimated=false] - 是否使用淡入动画。
 */
function displayHolidayList(year, isAnimated = false) {
    // 核心内容更新逻辑被封装在一个函数中，以便可以根据isAnimated参数决定是直接调用还是延迟调用。
    const updateContent = () => {
        holidayListYearSpan.textContent = year;

        const allHolidays = getAllHolidaysForYear(year);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // 找到下一个即将到来的节日，用于高亮显示
        const firstUpcoming = [...getAllHolidaysForYear(now.getFullYear()), ...getAllHolidaysForYear(now.getFullYear() + 1)]
            .filter(e => e.date >= today)[0];

        // 按月份对所有节日进行分组
        const holidaysByMonth = allHolidays.reduce((acc, holiday) => {
            const month = holiday.date.getMonth();
            if (!acc[month]) acc[month] = [];
            acc[month].push(holiday);
            return acc;
        }, {});

        // 构建HTML字符串
        let html = '';
        for (let month = 0; month < 12; month++) {
            if (holidaysByMonth[month]) {
                html += `<div class="mb-3"><h3 class="text-lg font-semibold border-b pb-1 mb-2" style="color: var(--text-color-secondary); border-color: var(--separator-color);">${month + 1}月</h3>`;
                holidaysByMonth[month].forEach(holiday => {
                    const diffTime = holiday.date - today;
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    let statusText = '';

                    // 根据与今天的日期差异，显示不同的状态文本
                    if (holiday.date.getFullYear() < now.getFullYear() || (holiday.date.getFullYear() === now.getFullYear() && diffDays < -1)) {
                        statusText = `<span style="color: var(--status-past);">已过</span>`;
                    } else if (diffDays === -1) {
                        statusText = `<span style="color: var(--status-yesterday);">昨天</span>`;
                    } else if (diffDays === 0) {
                        statusText = `<span style="color: var(--status-today); font-weight: bold;">今天</span>`;
                    } else if (diffDays === 1) {
                        statusText = `<span style="color: var(--status-tomorrow); font-weight: bold;">明天</span>`;
                    } else {
                        statusText = `
                            <div class="flex items-baseline" style="color: var(--accent-color);">
                                <span class="text-2xl font-bold">${diffDays}</span>
                                <span class="text-sm ml-1">天</span>
                            </div>
                        `;
                    }

                    // 检查是否是下一个即将到来的节日，如果是则添加高亮类
                    const isHighlighted = firstUpcoming && firstUpcoming.name === holiday.name && firstUpcoming.date.getTime() === holiday.date.getTime();
                    const highlightClass = isHighlighted ? 'highlight-holiday' : '';

                    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                    const dayOfWeek = weekdays[holiday.date.getDay()];
                    const formattedDate = `${holiday.date.getMonth() + 1}月${holiday.date.getDate()}日`;

                    html += `
                        <div class="flex justify-between items-center p-2 rounded-lg ${highlightClass}">
                            <div>
                                <div style="color: var(--text-color-primary);">${holiday.name}</div>
                                <div class="text-sm" style="color: var(--text-color-secondary);">${formattedDate} | ${dayOfWeek}</div>
                            </div>
                            ${statusText}
                        </div>
                    `;
                });
                html += `</div>`;
            }
        }
        holidayListContainer.innerHTML = html;
        setTimeout(updateTodayButtonVisibility, 50); // 内容更新后，重新评估“返回今日”按钮的可见性
    };

    if (isAnimated) {
        holidayListContainer.style.opacity = 0;
        holidayListYearSpan.style.opacity = 0;
        setTimeout(() => {
            updateContent();
            holidayListContainer.style.opacity = 1;
            holidayListYearSpan.style.opacity = 1;
        }, 100);
    } else {
        updateContent();
    }
}

/**
 * @description 当查询的年份超出农历数据范围（1900-2049）时，显示或隐藏警告信息。
 * @param {number} year - 当前显示的年份。
 */
function updateWarningMessage(year) {
    if (year < 1900 || year > 2049) {
        yearRangeWarning.innerHTML = `<svg class="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><span>${year}年的农历节日可能不准确</span>`;
        if (yearRangeWarning.classList.contains('hidden')) {
            yearRangeWarning.classList.remove('hidden', 'animate-fade-out');
            yearRangeWarning.classList.add('animate-fade-in');
            setTimeout(() => yearRangeWarning.classList.remove('animate-fade-in'), 100);
        }
    } else {
        if (!yearRangeWarning.classList.contains('hidden')) {
            yearRangeWarning.classList.add('animate-fade-out');
            setTimeout(() => {
                yearRangeWarning.classList.add('hidden');
                yearRangeWarning.classList.remove('animate-fade-out');
            }, 100);
        }
    }
}

/**
 * @description 处理年份变更的逻辑。
 * @param {number} newYear - 新的目标年份。
 */
function handleYearChange(newYear) {
    const yearBeforeChange = holidayListDisplayedYear;
    const currentSystemYear = new Date().getFullYear();

    holidayListDisplayedYear = newYear;
    displayHolidayList(holidayListDisplayedYear, true);
    updateWarningMessage(newYear);

    // 如果用户之前手动滚动过，并且现在返回了当前年份，则自动滚动到下一个节日
    if (hasManuallyScrolled && holidayListDisplayedYear === currentSystemYear && yearBeforeChange !== currentSystemYear) {
        scrollToTargetFestival(true);
        hasManuallyScrolled = false;
    }
}

/**
 * @description 设置假日列表卡片的所有事件监听器。
 */
function setupHolidayListListeners() {
    // 这是一个内联的辅助函数，因为只在这里使用一次。
    const animateRightColumnIn = () => {
        const elementsToAnimate = rightColumn.querySelectorAll(':scope > div');
        elementsToAnimate.forEach(el => {
            el.classList.remove('bounce-in');
            void el.offsetWidth;
            el.classList.add('bounce-in');
        });
    };

    // --- 主卡片点击事件：打开/关闭假日列表 ---
    countdownCard.addEventListener('click', () => {
        if (!holidayListCard.classList.contains('hidden')) {
            // 如果列表已打开，则关闭它并显示主栏
            holidayListCard.classList.add('hidden');
            rightColumn.classList.remove('hidden');
            animateRightColumnIn();
        } else {
            // 如果列表是关闭的，则打开它
            hasManuallyScrolled = false;
            rightColumn.classList.add('hidden');
            timeCapsuleCard.classList.add('hidden');
            aboutCard.classList.add('hidden');
            holidayListCard.classList.remove('hidden');
            holidayListCard.classList.add('bounce-in');
            holidayListDisplayedYear = new Date().getFullYear();
            displayHolidayList(holidayListDisplayedYear, true);
            updateWarningMessage(holidayListDisplayedYear);

            // 懒加载滚动条插件和遮罩效果
            if (!holidayListSimpleBar) {
                const wrapper = document.getElementById('holiday-list-container-wrapper');
                holidayListSimpleBar = new SimpleBar(wrapper);
                const scrollElement = holidayListSimpleBar.getScrollElement();
                const maxFadeSize = 40;

                const updateMask = () => {
                    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
                    const tolerance = 1;
                    if (scrollHeight <= clientHeight + tolerance) {
                        wrapper.style.setProperty('--fade-top-size', '0px');
                        wrapper.style.setProperty('--fade-bottom-size', '0px');
                        return;
                    }
                    const scrollBottom = scrollHeight - clientHeight - scrollTop;
                    const topFade = Math.min(scrollTop, maxFadeSize);
                    const bottomFade = Math.min(scrollBottom, maxFadeSize);
                    wrapper.style.setProperty('--fade-top-size', `${topFade}px`);
                    wrapper.style.setProperty('--fade-bottom-size', `${bottomFade}px`);
                };

                scrollElement.addEventListener('scroll', updateMask);
                // 监听一次滚动事件，以标记用户已手动交互
                scrollElement.addEventListener('scroll', () => { hasManuallyScrolled = true; }, { once: true });
                setTimeout(updateMask, 50);
            }

            // 自动滚动到目标节日
            setTimeout(() => {
                scrollToTargetFestival(true);
            }, 50);
        }
    });

    // --- 关闭按钮 ---
    closeHolidayListBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡到父元素(countdownCard)
        holidayListCard.classList.add('hidden');
        rightColumn.classList.remove('hidden');
        animateRightColumnIn();
    });

    // --- “返回今日”按钮 ---
    backToTodayBtn.addEventListener('click', () => {
        const currentYear = new Date().getFullYear();
        if (holidayListDisplayedYear !== currentYear) {
            handleYearChange(currentYear);
        }
        scrollToTargetFestival(true);
    });

    // --- 年份切换按钮 ---
    prevYearBtn.addEventListener('click', () => handleYearChange(holidayListDisplayedYear - 1));
    nextYearBtn.addEventListener('click', () => handleYearChange(holidayListDisplayedYear + 1));

    // --- 年份就地编辑功能 ---
    const enterEditMode = () => {
        yearDisplayControls.classList.add('animate-fade-out');
        setTimeout(() => {
            yearDisplayControls.classList.add('hidden');
            yearDisplayControls.classList.remove('animate-fade-out');
            yearEditControls.classList.remove('hidden');
            yearEditControls.classList.add('animate-fade-in');
            yearInput.value = holidayListDisplayedYear;
            yearInput.focus();
            yearInput.select();
            setTimeout(() => yearEditControls.classList.remove('animate-fade-in'), 100);
        }, 100);
    };

    const exitEditMode = () => {
        yearInput.classList.remove('invalid');
        yearInputError.classList.add('hidden');
        yearEditControls.classList.add('animate-fade-out');
        setTimeout(() => {
            yearEditControls.classList.add('hidden');
            yearEditControls.classList.remove('animate-fade-out');
            yearDisplayControls.classList.remove('hidden');
            yearDisplayControls.classList.add('animate-fade-in');
            setTimeout(() => yearDisplayControls.classList.remove('animate-fade-in'), 100);
        }, 100);
    };

    const submitNewYear = () => {
        const newYear = parseInt(yearInput.value, 10);
        if (!isNaN(newYear) && newYear > 0 && newYear < 9999) {
            handleYearChange(newYear);
            exitEditMode();
        } else {
            yearInputError.textContent = '请输入有效的4位年份';
            yearInputError.classList.remove('hidden');
            yearInput.classList.add('invalid');
            setTimeout(() => yearInput.classList.remove('invalid'), 500);
            setTimeout(() => yearInputError.classList.add('hidden'), 2500);
        }
    };

    holidayListYearSpan.addEventListener('click', enterEditMode);
    confirmYearBtn.addEventListener('click', submitNewYear);
    cancelYearBtn.addEventListener('click', exitEditMode);
    yearInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { submitNewYear(); }
        else if (e.key === 'Escape') { exitEditMode(); }
    });
}

/**
 * @description 初始化节假日显示功能。
 * 这是该模块的入口点，负责初始化所有状态、缓存DOM元素并设置必要的定时器。
 */
export function initializeHolidayDisplay() {
    // 1. 初始化模块级状态变量
    holidayListDisplayedYear = new Date().getFullYear();
    hasManuallyScrolled = false;
    holidayListSimpleBar = null;
    todayButtonObserver = null;

    // 2. 缓存所有需要用到的DOM元素
    countdownCard = document.getElementById('countdown-card');
    holidayListCard = document.getElementById('holiday-list-card');
    rightColumn = document.getElementById('right-column');
    timeCapsuleCard = document.getElementById('time-capsule-card');
    aboutCard = document.getElementById('about-card');
    holidayListContainer = document.getElementById('holiday-list-container');
    holidayListYearSpan = document.getElementById('holiday-list-year');
    yearDisplayControls = document.getElementById('year-display-controls');
    yearEditControls = document.getElementById('year-edit-controls');
    yearInput = document.getElementById('year-input');
    confirmYearBtn = document.getElementById('confirm-year-btn');
    cancelYearBtn = document.getElementById('cancel-year-btn');
    yearInputError = document.getElementById('year-input-error');
    yearRangeWarning = document.getElementById('year-range-warning');
    prevYearBtn = document.getElementById('prev-year');
    nextYearBtn = document.getElementById('next-year');
    backToTodayBtn = document.getElementById('back-to-today-btn');
    closeHolidayListBtn = document.getElementById('close-holiday-list');

    // 3. 设置所有事件监听器
    setupHolidayListListeners();

    // 4. 首次加载时更新倒计时，并设置定时器以定期刷新
    updateCountdown();
    setInterval(updateCountdown, 3600000); // 每小时 (3600000ms) 更新一次
}
