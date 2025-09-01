// js/features/holiday-display.js

// Assuming 'Dianaday' and 'SimpleBar' are available globally from scripts in index.html
const { getAllHolidaysForYear } = window;

// --- Module State ---
let holidayListDisplayedYear;
let hasManuallyScrolled;
let holidayListSimpleBar;
let todayButtonObserver;

// --- DOM Elements ---
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

// --- Main Countdown Card Update ---
function updateCountdown() {
    const countdownDisplay = document.getElementById('countdown-display');
    if (!countdownDisplay) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const currentYearEvents = getAllHolidaysForYear(now.getFullYear());
    const nextYearEvents = getAllHolidaysForYear(now.getFullYear() + 1);

    const upcomingEvents = [...currentYearEvents, ...nextYearEvents].filter(event => event.date >= today);

    if (upcomingEvents.length > 0) {
        const nextHoliday = upcomingEvents[0];
        const diffTime = nextHoliday.date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

// --- Holiday List Card ---

function customSmoothScrollTo(targetElement, options) {
    const { duration = 300, block = 'center' } = options;
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

    targetY = Math.max(0, Math.min(targetY, scrollContainer.scrollHeight - scrollContainer.clientHeight));

    const startY = scrollContainer.scrollTop;
    const distance = targetY - startY;
    let startTime = null;

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t * t + b;
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    }

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

function scrollToTargetFestival(isAnimated = true) {
    setTimeout(() => {
        const container = document.getElementById('holiday-list-container');
        if (!container) return;

        let targetElement = container.querySelector('.highlight-holiday');

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

function updateTodayButtonVisibility() {
    const currentYear = new Date().getFullYear();

    if (todayButtonObserver) {
        todayButtonObserver.disconnect();
    }

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
        todayButtonObserver = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting) {
                backToTodayBtn.classList.remove('visible');
            } else {
                backToTodayBtn.classList.add('visible');
            }
        }, {
            root: scrollWrapper,
            threshold: 0.5
        });
        todayButtonObserver.observe(targetElement);
    } else {
        backToTodayBtn.classList.remove('visible');
    }
}

function displayHolidayList(year, isAnimated = false) {
    const updateContent = () => {
        holidayListYearSpan.textContent = year;

        const allHolidays = getAllHolidaysForYear(year);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const firstUpcoming = [...getAllHolidaysForYear(now.getFullYear()), ...getAllHolidaysForYear(now.getFullYear() + 1)]
            .filter(e => e.date >= today)[0];

        const holidaysByMonth = allHolidays.reduce((acc, holiday) => {
            const month = holiday.date.getMonth();
            if (!acc[month]) acc[month] = [];
            acc[month].push(holiday);
            return acc;
        }, {});

        let html = '';
        for (let month = 0; month < 12; month++) {
            if (holidaysByMonth[month]) {
                html += `<div class="mb-3"><h3 class="text-lg font-semibold border-b pb-1 mb-2" style="color: var(--text-color-secondary); border-color: var(--separator-color);">${month + 1}月</h3>`;
                holidaysByMonth[month].forEach(holiday => {
                    const diffTime = holiday.date - today;
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    let statusText = '';

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
        setTimeout(updateTodayButtonVisibility, 50);
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

function handleYearChange(newYear) {
    const yearBeforeChange = holidayListDisplayedYear;
    const currentSystemYear = new Date().getFullYear();

    holidayListDisplayedYear = newYear;
    displayHolidayList(holidayListDisplayedYear, true);
    updateWarningMessage(newYear);

    if (hasManuallyScrolled && holidayListDisplayedYear === currentSystemYear && yearBeforeChange !== currentSystemYear) {
        scrollToTargetFestival(true);
        hasManuallyScrolled = false;
    }
}

function setupHolidayListListeners() {
    const animateRightColumnIn = () => {
        const elementsToAnimate = rightColumn.querySelectorAll(':scope > div');
        elementsToAnimate.forEach(el => {
            el.classList.remove('bounce-in');
            void el.offsetWidth;
            el.classList.add('bounce-in');
        });
    };

    countdownCard.addEventListener('click', () => {
        if (!holidayListCard.classList.contains('hidden')) {
            holidayListCard.classList.add('hidden');
            rightColumn.classList.remove('hidden');
            animateRightColumnIn();
        } else {
            hasManuallyScrolled = false;
            rightColumn.classList.add('hidden');
            timeCapsuleCard.classList.add('hidden');
            aboutCard.classList.add('hidden');
            holidayListCard.classList.remove('hidden');
            holidayListCard.classList.add('bounce-in');
            holidayListDisplayedYear = new Date().getFullYear();
            displayHolidayList(holidayListDisplayedYear, true);
            updateWarningMessage(holidayListDisplayedYear);

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
                scrollElement.addEventListener('scroll', () => { hasManuallyScrolled = true; }, { once: true });
                setTimeout(updateMask, 50);
            }

            setTimeout(() => {
                scrollToTargetFestival(true);
            }, 50);
        }
    });

    closeHolidayListBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        holidayListCard.classList.add('hidden');
        rightColumn.classList.remove('hidden');
        animateRightColumnIn();
    });

    backToTodayBtn.addEventListener('click', () => {
        const currentYear = new Date().getFullYear();
        if (holidayListDisplayedYear !== currentYear) {
            handleYearChange(currentYear);
        }
        scrollToTargetFestival(true);
    });

    prevYearBtn.addEventListener('click', () => handleYearChange(holidayListDisplayedYear - 1));
    nextYearBtn.addEventListener('click', () => handleYearChange(holidayListDisplayedYear + 1));

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

export function initializeHolidayDisplay() {
    // Initialize state
    holidayListDisplayedYear = new Date().getFullYear();
    hasManuallyScrolled = false;
    holidayListSimpleBar = null;
    todayButtonObserver = null;

    // Cache DOM elements
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

    // Set up everything
    setupHolidayListListeners();
    updateCountdown();
    setInterval(updateCountdown, 3600000);
}
