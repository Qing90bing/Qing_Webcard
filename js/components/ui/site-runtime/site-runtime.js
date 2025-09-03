export function initializeSiteRuntime() {
    const displayElement = document.getElementById('site-runtime-display');
    if (!displayElement) {
        // If the element doesn't exist, don't set up the interval.
        return;
    }

    function update() {
        const startTime = new Date('2025-07-30T18:30:00');
        const now = new Date();
        const diff = now - startTime;

        if (diff < 0) {
            displayElement.textContent = '小破站尚未启航...';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        displayElement.innerHTML = `小破站已经在风雨中度过了 <span class="font-semibold runtime-number" style="color: var(--text-color-primary);">${days}</span> 天 <span class="font-semibold runtime-number" style="color: var(--text-color-primary);">${hours}</span> 小时 <span class="font-semibold runtime-number" style="color: var(--text-color-primary);">${minutes}</span> 分 <span class="font-semibold runtime-number" style="color: var(--text-color-primary);">${seconds}</span> 秒`;
    }

    // Initial call to display time immediately
    update();
    // Update every second
    setInterval(update, 1000);
}
