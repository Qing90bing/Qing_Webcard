// js/features/clock.js

let appSettings;
let immersiveTimeInterval = null;

// This is the core function that updates the main clock and date display.
function updateTime() {
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    if (!timeDisplay || !dateDisplay) return;

    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const colon = `<span class="time-colon">:</span>`;

    if (appSettings.timeFormat === '12h') {
        timeDisplay.classList.add('flex', 'items-baseline', 'justify-center');
        let h12 = hours % 12;
        h12 = h12 ? h12 : 12;
        const strH12 = String(h12).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        const timeString = `${strH12}${colon}${minutes}${colon}${seconds}`;
        timeDisplay.innerHTML = `<span>${timeString}</span><span class="text-3xl font-bold ml-2">${ampm}</span>`;
    } else {
        timeDisplay.classList.remove('flex', 'items-baseline', 'justify-center');
        const strH24 = String(hours).padStart(2, '0');
        timeDisplay.innerHTML = `${strH24}${colon}${minutes}${colon}${seconds}`;
    }

    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    dateDisplay.textContent = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日 ${weekdays[now.getDay()]}`;
}

// This function updates the specific immersive view, pulling data from other elements.
function updateImmersiveTime() {
    updateTime(); // Ensure the base clock is up-to-date

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

function setupImmersiveViewListeners() {
    const immersiveView = document.getElementById('immersive-time-view');
    const timeCard = document.getElementById('time-card');
    const exitImmersiveBtn = document.getElementById('exit-immersive-btn');

    if (!immersiveView || !timeCard || !exitImmersiveBtn) return;

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

    timeCard.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
            return;
        }
        document.body.classList.add('immersive-active');
        updateImmersiveTime();
        if (immersiveTimeInterval) clearInterval(immersiveTimeInterval);
        immersiveTimeInterval = setInterval(updateImmersiveTime, 1000);
        immersiveView.addEventListener('mousemove', handleImmersiveMouseMove);
        immersiveView.addEventListener('mouseleave', handleImmersiveMouseLeave);
    });

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

// Public function to initialize the clock feature
export function initializeClock(settings) {
    appSettings = settings;
    updateTime(); // Initial call to display time immediately
    setInterval(updateTime, 1000); // Set up the main interval
    setupImmersiveViewListeners();

    // Return a reference to updateTime so it can be called from elsewhere,
    // for example, when the time format setting is changed.
    return {
        updateTime
    };
}
