/**
 * @file site-runtime.js
 * @description
 * 本文件负责实现一个“小破站运行时间”的动态计数器。
 * 它会持续计算从一个预设的起始时间到现在的时长，并实时更新显示。
 *
 * @module components/ui/site-runtime
 */

/**
 * @description 初始化网站运行时间的显示和更新定时器。
 */
export function initializeSiteRuntime() {
    const displayElement = document.getElementById('site-runtime-display');
    if (!displayElement) {
        // 如果页面上没有对应的显示元素，则直接退出，不设置定时器。
        return;
    }

    /**
     * @description 核心更新函数，计算并格式化运行时长。
     */
    function update() {
        // 网站的“生日”
        const startTime = new Date('2025-07-30T18:30:00');
        const now = new Date();
        const diff = now - startTime; // 毫秒差

        // 如果当前时间早于起始时间，则显示特殊文本
        if (diff < 0) {
            displayElement.textContent = '小破站尚未启航...';
            return;
        }

        // 将毫秒差转换为天、小时、分钟和秒
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // 更新DOM内容
        displayElement.innerHTML = `小破站已经在风雨中度过了 <span class="font-semibold runtime-number" style="color: var(--text-color-primary);">${days}</span> 天 <span class="font-semibold runtime-number" style="color: var(--text-color-primary);">${hours}</span> 小时 <span class="font-semibold runtime-number" style="color: var(--text-color-primary);">${minutes}</span> 分 <span class="font-semibold runtime-number" style="color: var(--text-color-primary);">${seconds}</span> 秒`;
    }

    // 立即执行一次，避免页面加载后出现空白
    update();
    // 设置定时器，每秒更新一次
    setInterval(update, 1000);
}
