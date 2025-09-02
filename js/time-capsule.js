// js/features/time-capsule.js

export function updateTimeCapsule() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const dayOfMonth = now.getDate();
    const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const hour = now.getHours();

    // Helper to update a single progress bar UI
    const updateProgressUI = (idPrefix, passed, left, percent) => {
        const passedEl = document.getElementById(`${idPrefix}-passed`);
        const leftEl = document.getElementById(`${idPrefix}-left`);
        const percentEl = document.getElementById(`${idPrefix}-percent`);
        const progressEl = document.getElementById(`${idPrefix}-progress`);

        if (passedEl) passedEl.textContent = passed;
        if (leftEl) leftEl.textContent = left;
        if (percentEl) percentEl.textContent = `${percent.toFixed(1)}%`;
        if (progressEl) progressEl.style.width = `${percent}%`;
    };

    // 1. Today's Progress
    const dayPassed = hour;
    const dayPercent = (dayPassed / 24) * 100;
    updateProgressUI('day', dayPassed, 24 - dayPassed, dayPercent);

    // 2. This Week's Progress (Monday as the first day)
    const weekPassed = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekPercent = ((weekPassed + (hour / 24)) / 7) * 100;
    updateProgressUI('week', weekPassed, 7 - weekPassed, weekPercent);

    // 3. This Month's Progress
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthPassed = dayOfMonth;
    const monthPercent = (monthPassed / daysInMonth) * 100;
    updateProgressUI('month', monthPassed, daysInMonth - monthPassed, monthPercent);

    // 4. This Year's Progress
    const startOfYear = new Date(year, 0, 1);
    const totalDaysInYear = (new Date(year, 11, 31) - startOfYear) / (1000 * 60 * 60 * 24) + 1;
    const yearPassed = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24));
    const yearPercent = (yearPassed / totalDaysInYear) * 100;
    updateProgressUI('year', yearPassed, totalDaysInYear - yearPassed, yearPercent);
}

export function initializeTimeCapsule() {
    updateTimeCapsule();
    setInterval(updateTimeCapsule, 60000); // Update every minute

    return {
        updateTimeCapsule
    };
}
