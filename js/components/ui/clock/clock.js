/**
 * @file clock.js
 * @description
 * 本文件负责管理页面上所有与时钟和日期相关的功能。
 * 包括主时钟的实时更新、日期显示、以及一个可以全屏显示的“沉浸式”时钟视图。
 *
 * @module components/ui/clock/clock
 */

let appSettings; // 引用全局设置
let immersiveTimeInterval = null; // 沉浸模式下的时间更新定时器

/**
 * @description 核心函数，用于更新主时钟和日期的显示。
 * 此函数每秒被调用一次，以确保时间实时刷新。
 */
function updateTime() {
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    if (!timeDisplay || !dateDisplay) return;

    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const colon = `<span class="time-colon">:</span>`;

    // 根据用户设置，切换12小时制和24小时制
    if (appSettings.timeFormat === '12h') {
        timeDisplay.classList.add('flex', 'items-baseline', 'justify-center');
        let h12 = hours % 12;
        h12 = h12 ? h12 : 12; // 0点时显示为12
        const strH12 = String(h12).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        const timeString = `${strH12}${colon}${minutes}${colon}${seconds}`;
        timeDisplay.innerHTML = `<span>${timeString}</span><span class="text-3xl font-bold ml-2">${ampm}</span>`;
    } else {
        timeDisplay.classList.remove('flex', 'items-baseline', 'justify-center');
        const strH24 = String(hours).padStart(2, '0');
        timeDisplay.innerHTML = `${strH24}${colon}${minutes}${colon}${seconds}`;
    }

    // 更新日期显示
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    dateDisplay.textContent = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日 ${weekdays[now.getDay()]}`;
}

/**
 * @description 更新沉浸式视图中的内容。
 * 它通过从主视图的元素中复制内容来实现，确保两者显示一致。
 */
function updateImmersiveTime() {
    updateTime(); // 首先确保基础时钟数据是最新的

    const timeDisplay = document.getElementById('time-display').innerHTML;
    const dateDisplay = document.getElementById('date-display').textContent;
    const greeting = document.getElementById('greeting').textContent;

    const immersiveTimeDisplay = document.getElementById('immersive-time-display');
    const immersiveDateDisplay = document.getElementById('immersive-date-display');
    const immersiveGreeting = document.getElementById('immersive-greeting');

    if(immersiveTimeDisplay) immersiveTimeDisplay.innerHTML = timeDisplay;
    if(immersiveDateDisplay) immersiveDateDisplay.textContent = dateDisplay;
    if(immersiveGreeting) immersiveGreeting.textContent = greeting;
}

/**
 * @description 设置进入和退出沉浸式视图的事件监听器。
 */
function setupImmersiveViewListeners() {
    const immersiveView = document.getElementById('immersive-time-view');
    const timeCard = document.getElementById('time-card');
    const exitImmersiveBtn = document.getElementById('exit-immersive-btn');

    if (!immersiveView || !timeCard || !exitImmersiveBtn) return;

    // 当鼠标移动到屏幕右上角时，显示退出按钮
    const handleImmersiveMouseMove = (event) => {
        const { clientX, clientY } = event;
        const { innerWidth, innerHeight } = window;
        if (clientX > innerWidth / 2 && clientY < innerHeight / 2) {
            exitImmersiveBtn.classList.add('visible');
        } else {
            exitImmersiveBtn.classList.remove('visible');
        }
    };

    const handleImmersiveMouseLeave = () => {
        exitImmersiveBtn.classList.remove('visible');
    };

    // 点击时间卡片进入沉浸模式
    timeCard.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
            return; // 如果点击的是链接，则不触发
        }
        document.body.classList.add('immersive-active');
        updateImmersiveTime();
        if (immersiveTimeInterval) clearInterval(immersiveTimeInterval);
        immersiveTimeInterval = setInterval(updateImmersiveTime, 1000);
        immersiveView.addEventListener('mousemove', handleImmersiveMouseMove);
        immersiveView.addEventListener('mouseleave', handleImmersiveMouseLeave);
    });

    // 点击退出按钮退出沉浸模式
    exitImmersiveBtn.addEventListener('click', () => {
        document.body.classList.remove('immersive-active');
        if (immersiveTimeInterval) {
            clearInterval(immersiveTimeInterval);
            immersiveTimeInterval = null;
        }
        exitImmersiveBtn.classList.remove('visible');
        immersiveView.removeEventListener('mousemove', handleImmersiveMouseMove);
        immersiveView.removeEventListener('mouseleave', handleImmersiveMouseLeave);
    });
}

/**
 * @description 初始化时钟功能。
 * @param {object} settings - 从 `core/settings.js` 传入的应用设置对象。
 * @returns {{updateTime: function}} 返回一个包含 `updateTime` 函数的对象，
 *                                   以便在需要时（如更改时间格式后）从外部调用。
 */
export function initializeClock(settings) {
    appSettings = settings;
    updateTime(); // 立即调用一次以显示初始时间
    setInterval(updateTime, 1000); // 设置定时器，每秒更新
    setupImmersiveViewListeners();

    // 返回API，允许外部调用
    return {
        updateTime
    };
}
