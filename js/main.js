// --- 初始状态和常量 ---
const DEFAULT_BG_IMAGES = [
    'https://s21.ax1x.com/2025/08/10/pVdEmM6.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEnsK.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEuqO.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEQde.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEMZD.jpg'
];
// Calendar and holiday logic moved to js/calendar.js
let holidayListDisplayedYear = new Date().getFullYear();
let hasManuallyScrolled = false;
let holidayListSimpleBar; // Instance for the holiday list scrollbar
let settingsSimpleBar = null; // Instance for the settings scrollbar
let isFetchingWeather = false; // Lock to prevent multiple weather requests
let cachedCommitsHTML = null;
let areCommitsCached = false;
let aboutCardHasAnimated = false;

// --- [NEW] Reusable Cross-fade Logic ---
function createCrossfader(layers) {
    let activeIndex = 0;

    // Return an update function that handles the cross-fade
    const update = (newUrl, isBackgroundImage = false) => {
        return new Promise((resolve, reject) => {
            const nextIndex = (activeIndex + 1) % 2;
            const activeLayer = layers[activeIndex];
            const nextLayer = layers[nextIndex];

            if (!nextLayer || !activeLayer) {
                return reject('Cross-fade layers not found.');
            }

            const preloader = new Image();
            preloader.src = newUrl;

            preloader.onload = () => {
                // Apply the new image to the hidden layer
                if (isBackgroundImage) {
                    nextLayer.style.backgroundImage = `url('${newUrl}')`;
                } else {
                    nextLayer.src = newUrl;
                }

                // Trigger the cross-fade
                activeLayer.classList.remove('active');
                nextLayer.classList.add('active');
                
                // Update the active index for the next cycle
                activeIndex = nextIndex;
                resolve(); // Transition has started
            };

            preloader.onerror = () => {
                console.error(`Crossfader failed to load image: ${newUrl}`);
                reject('Image load error');
            };
        });
    };
    
    return { update };
}

let backgroundFader;
// previewFader is no longer needed

let latestBgRequestId = 0;
let latestPreviewRequestId = 0;

// --- DOM 元素获取 (部分移至DOMContentLoaded) ---
const countdownCard = document.getElementById('countdown-card');
const profileCard = document.getElementById('profile-card');
const rightColumn = document.getElementById('right-column');
const timeCapsuleCard = document.getElementById('time-capsule-card');
const holidayListCard = document.getElementById('holiday-list-card');
const aboutCard = document.getElementById('about-card');
let rightColumnInitialHeight = 0;
let cachedRightColumnHeight = 0; // Cache the height of the right column

// --- [NEW] Year Input Feature Elements ---
const yearDisplayControls = document.getElementById('year-display-controls');
const yearEditControls = document.getElementById('year-edit-controls');
const holidayListYearSpan = document.getElementById('holiday-list-year');
const yearInput = document.getElementById('year-input');
const confirmYearBtn = document.getElementById('confirm-year-btn');
const cancelYearBtn = document.getElementById('cancel-year-btn');
const yearInputError = document.getElementById('year-input-error');
const yearRangeWarning = document.getElementById('year-range-warning');

// --- 动态时钟功能 ---
function updateTime() {
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    const now = new Date();

    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const colon = `<span class="time-colon">:</span>`;

    if (appSettings.timeFormat === '12h') {
        timeDisplay.classList.add('flex', 'items-baseline', 'justify-center');
        let h12 = hours % 12;
        h12 = h12 ? h12 : 12; // the hour '0' should be '12'
        const strH12 = String(h12).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        const timeString = `${strH12}${colon}${minutes}${colon}${seconds}`;
        timeDisplay.innerHTML = `<span>${timeString}</span><span class="text-3xl font-bold ml-2">${ampm}</span>`;
    } else { // 24h format
        timeDisplay.classList.remove('flex', 'items-baseline', 'justify-center');
        const strH24 = String(hours).padStart(2, '0');
        timeDisplay.innerHTML = `${strH24}${colon}${minutes}${colon}${seconds}`;
    }

    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    dateDisplay.textContent = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日 ${weekdays[now.getDay()]}`;
}

// --- 问候语功能 ---
function updateGreeting() {
    const greetingEl = document.getElementById('greeting');
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1; // getMonth() 返回 0-11, +1 变为 1-12

    // 定义问候语库
    const greetings = {
        spring: { // 春季 (3-5月)
            morning: [
                "早上好，春意盎然，愿你的一天如诗如画。🌿",
                "清晨的露水，伴着花香，道一声早安。🌸",
                "春日黎明，万物复苏，今天也要活力满满！",
                "早安，愿春风为你吹来一天的好运。🍃",
                "听，窗外是不是有鸟儿在歌唱？早安！🐦",
                "新的一天，从一个清新的春日早晨开始。",
                "一年之计在于春，一日之计在于晨，加油！",
                "拉开窗帘，让第一缕春光拥抱你。☀️"
            ],
            afternoon: [
                "下午好，春日暖阳，适合小憩片刻。☀️",
                "午后时光，泡杯花茶，享受春日的悠闲吧。🍵",
                "愿你心情如春日午后的阳光，明媚不忧伤。",
                "春天到，别春困，起来活动一下筋骨吧！",
                "天气这么好，不去公园散散步吗？",
                "午后的阳光，暖得让人想打瞌睡。😴",
                "泡一壶龙井，静品春日的午后时光。",
                "春雷阵阵，说不定会有一场春雨，记得带伞。"
            ],
            evening: [
                "晚上好，春风拂面，一天的疲惫都消散了。🎑",
                "夜幕降临，静享春夜的温柔与宁静。",
                "春夜的星空格外明朗，祝你晚安好梦。✨",
                "在温柔的春夜里，和世界道一句晚安。",
                "春天的晚霞总是格外温柔，晚上好。",
                "忙碌了一天，是时候享受一顿美味的晚餐了。🍲",
                "晚风轻轻，吹来青草和泥土的芬芳。",
                "今晚月色真美，风也温柔，祝你愉快。"
            ],
            night: [
                "夜深了，春夜微凉，记得盖好被子。🌙",
                "晚安，愿你在梦里与最美的春天相遇。",
                "放下手机，闭上眼睛，聆听春虫的鸣叫。😴",
                "夜阑人静，祝你安眠，明日又是崭新的一天。",
                "春夜宁静，宜读一本闲书，安然入睡。",
                "把今天份的开心打包，睡个好觉吧。",
                "晚安，愿你的梦里繁花似锦。🌸",
                "夜了，全世界都睡了，你也要早点休息。"
            ]
        },
        summer: { // 夏季 (6-8月)
            morning: [
                "早上好，夏日清晨，阳光正好，微风不燥。☀️",
                "早安！今天也是元气满满的一天，别怕热！",
                "夏日的清晨，是西瓜味的，是冰汽水味的。🍉",
                "蝉鸣声声，唤醒了夏天的早晨，早安！",
                "早安！今天的太阳也很热情呢！",
                "赶在热浪来临前，享受清晨的片刻凉爽吧。",
                "又是被阳光叫醒的一天，你好呀！",
                "新的一天，像加了冰块的汽水，充满活力！"
            ],
            afternoon: [
                "下午好，夏日炎炎，记得多喝水防暑哦。💧",
                "午后困倦，来根冰棍提提神吧！🍦",
                "心静自然凉，愿你拥有一个清爽的下午。",
                "夏日午后，宜开空调，宜听音乐，宜想你。😉",
                "热到融化的下午，你还好吗？",
                "“哪儿凉快待着去”，是夏天最真诚的祝福。",
                "这个钟点，唯有空调和西瓜不可辜负。🍉"
            ],
            evening: [
                "晚上好，夏夜晚风，吹散白天的燥热。🎐",
                "提着一瓶汽水，坐在台阶上，感受夏天的晚风。",
                "属于夏天的夜晚，是烧烤、小龙虾和冰啤酒。🍻",
                "晚风轻踩着云朵，月亮在贩售快乐，晚安！",
                "晚风吹走了热气，带来了夏夜的惬意。",
                "又到了可以去夜市逛吃逛吃的季节！",
                "小时候的夏夜，是蒲扇、凉席和满天繁星。✨",
                "晚上好，去散散步吧，说不定能看到萤火虫。"
            ],
            night: [
                "夜深了，晚安，愿你的梦里有凉爽的夏风。🌌",
                "仲夏夜之梦，愿你拥抱整片星空。✨",
                "晚安，月亮警察已就位，请安心入睡。👮",
                "嘘，静下心来，听听窗外的虫鸣。",
                "晚安，空调调到26度刚刚好哦。😉",
                "别熬夜了，你的皮肤和头发都需要休息。",
                "祝你做个凉爽的梦，梦里没有蚊子。🦟"
            ]
        },
        autumn: { // 秋季 (9-11月)
            morning: [
                "早上好，秋高气爽，愿你今天也心情舒畅。🍁",
                "早安，空气中有了秋天的味道，深呼吸一下吧。",
                "秋日的晨光，温柔地洒在每一片落叶上，早安。",
                "天凉了，记得多穿件衣服，别感冒了哦。🧥",
                "秋日的天空，蓝得像一块画布，早安。",
                "早晨的空气微凉，记得添一件薄外套。",
                "秋天，是一个让一切都沉静下来的季节，早。",
                "又是被梦想叫醒的一天，加油，打工人！"
            ],
            afternoon: [
                "下午好，秋日的午后，阳光温暖得刚刚好。☕️",
                "捧一杯热茶，读一本好书，享受秋日的静谧。",
                "秋天是收获的季节，愿你的努力都有回报。",
                "午安，愿秋风带走你的烦恼和疲惫。🍂",
                "秋日的午后，每一帧都像电影画面。🎬",
                "阳光正好，温度也正好，一切都刚刚好。",
                "来块烤红薯或是糖炒栗子怎么样？🌰",
                "下午犯困的话，就看看窗外的蓝天白云吧。"
            ],
            evening: [
                "晚上好，秋风送爽，月色宜人。🌕",
                "丹桂飘香的夜晚，适合思念和团圆。",
                "秋天的夜晚，是思念的季节，也是养膘的季节。",
                "晚来秋，天凉如水，早点休息吧。",
                "晚上好，今天你看到美丽的落日了吗？",
                "秋天的夜晚，总让人感觉格外宁静和舒适。",
                "天气转凉，晚餐要吃得暖暖和和的。",
                "月亮挂在枝头，像一颗熟透的果子。晚安。"
            ],
            night: [
                "夜深了，秋意渐浓，晚安好梦。🌙",
                "愿你伴着窗外的桂花香，甜甜地进入梦乡。",
                "天阶夜色凉如水，卧看牵牛织女星。晚安。",
                "被子要盖厚一点了，夜里会降温的。😴",
                "夜深了，把心事放一边，好好睡觉最重要。",
                "秋夜微凉，盖着柔软的被子，最是舒服。😴",
                "晚安，愿你梦里有金色的麦田和果实。",
                "明天会更好，快睡吧。"
            ]
        },
        winter: { // 冬季 (12-2月)
            morning: [
                "早上好，虽然天气寒冷，但也要拥抱阳光哦。❄️",
                "早安，冬日醒来有阳光，就是最幸福的事。",
                "起床大作战开始了！祝你成功！💪",
                "冬日清晨，来一杯热饮，温暖一整天。☕️",
                "早安！今天你和你的床分离成功了吗？",
                "窗户上结了霜花，冬天真的来啦。❄️",
                "热气腾腾的早餐，是对冬天早晨最大的尊重。",
                "呼一口气都是白色的，这才是冬天的感觉。"
            ],
            afternoon: [
                "下午好，晒晒冬日的太阳，整个人都暖洋洋的。",
                "泡个热水脚，是对冬天下午最好的尊重。",
                "天气这么冷，不如…吃顿火锅？🍲",
                "愿这个冬天，有人与你立黄昏，问你粥可温。",
                "冬日的午后短暂又珍贵，多晒晒太阳吧。",
                "一杯热可可，一份好心情，送给下午的你。☕️",
                "外面天寒地冻，还是待在室内最舒服了。",
                "离天黑又近了一步，珍惜白天的时光。"
            ],
            evening: [
                "晚上好，窗外天寒地冻，屋内温暖如春。",
                "冬天最适合窝在沙发里，看一部温暖的电影。🎬",
                "雪落下的声音，是冬夜的交响曲。",
                "晚来天欲雪，能饮一杯无？",
                "晚上好，回家路上注意保暖呀。",
                "冬夜的灯火，看起来总是格外温暖。",
                "忙了一天，窝在沙发里就是最大的幸福。",
                "天冷了，今晚吃点热乎的吧！"
            ],
            night: [
                "夜深了，钻进温暖的被窝，和世界说晚安。🛌",
                "晚安，愿你一夜无梦，安睡到天亮。",
                "冬天，是适合早睡的季节，晚安。",
                "请查收你的冬日限定好梦。🌙",
                "晚安，让温暖的被窝治愈你的一切。",
                "听着窗外的风声，安稳地睡吧。",
                "别熬夜了，对得起这么冷的天吗？快去睡觉！",
                "晚安，愿你梦里阳光普照，春暖花开。"
            ]
        },
        default: [ // 默认/备用问候语
            "你好呀，今天过得怎么样？",
            "愿你眼里的星星，永远闪亮。",
            "无论天气如何，记得带上自己的阳光。",
            "希望你今天也能开心！",
            "嘿，陌生人，祝你今天开心。",
            "生活或许不易，但请别忘了微笑。😊",
            "每一天都是一份独一无二的礼物。",
            "偷偷告诉你，你很棒！",
            "愿你所到之处皆热土，所遇之人皆良善。"
        ]
    };

    // 判断季节
    let season = 'default';
    if (month >= 3 && month <= 5) {
        season = 'spring';
    } else if (month >= 6 && month <= 8) {
        season = 'summer';
    } else if (month >= 9 && month <= 11) {
        season = 'autumn';
    } else { // 12, 1, 2月
        season = 'winter';
    }

    // 判断时间段
    let timeOfDay = 'night';
    if (hour >= 5 && hour < 12) {
        timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 18) {
        timeOfDay = 'afternoon';
    } else if (hour >= 18 && hour < 22) {
        timeOfDay = 'evening';
    }

    // 获取对应的问候语列表
    const availableGreetings = greetings[season][timeOfDay] || greetings.default;
    
    // 随机选择一条问候语并显示
    const randomGreeting = availableGreetings[Math.floor(Math.random() * availableGreetings.length)];
    greetingEl.textContent = randomGreeting;
}

// --- 主倒计时卡片更新 ---
function updateCountdown() {
    const countdownDisplay = document.getElementById('countdown-display');
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

// --- 节日列表视图更新 ---
function displayHolidayList(year, isAnimated = false) {
    const container = document.getElementById('holiday-list-container');
    const yearDisplay = document.getElementById('holiday-list-year');

    const updateContent = () => {
        yearDisplay.textContent = year;
    
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
        container.innerHTML = html;
        // [NEW] Update button visibility after content is rendered
        setTimeout(updateTodayButtonVisibility, 50);
    };

    if (isAnimated) {
        container.style.opacity = 0;
        yearDisplay.style.opacity = 0;
        setTimeout(() => {
            updateContent();
            container.style.opacity = 1;
            yearDisplay.style.opacity = 1;
        }, 100);
    } else {
        updateContent();
    }
}

// [NEW] Custom smooth scroll implementation for speed control
function customSmoothScrollTo(targetElement, options) {
    const { duration = 300, block = 'center' } = options;
    // SimpleBar creates a specific wrapper for the scrollable content.
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
    
    // Ensure targetY is within scrollable bounds
    targetY = Math.max(0, Math.min(targetY, scrollContainer.scrollHeight - scrollContainer.clientHeight));

    const startY = scrollContainer.scrollTop;
    const distance = targetY - startY;
    let startTime = null;

    // easeInOutCubic easing function for a slightly smoother start/end
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

// [NEW] Core function to scroll to the target festival
const scrollToTargetFestival = (isAnimated = true) => {
    // Use a timeout to ensure the DOM has updated, e.g., after a year change
    setTimeout(() => {
        const container = document.getElementById('holiday-list-container');
        if (!container) return;

        let targetElement = container.querySelector('.highlight-holiday');

        // If no highlighted holiday in the current view (e.g., all passed for the year)
        if (!targetElement) {
            // As per user request, find the last festival of the displayed year
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
    }, 160); // Must be slightly longer than the list update animation (150ms)
};

// [NEW] Logic for the "Today" button's visibility
let todayButtonObserver;
function updateTodayButtonVisibility() {
    const backToTodayBtn = document.getElementById('back-to-today-btn');
    const currentYear = new Date().getFullYear();

    if (todayButtonObserver) {
        todayButtonObserver.disconnect();
    }

    if (holidayListDisplayedYear !== currentYear) {
        backToTodayBtn.classList.add('visible'); // Always show for other years
        return;
    }

    // Logic for the current year
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
            // Show button if target is NOT visible
            if (entry.isIntersecting) {
                backToTodayBtn.classList.remove('visible');
            } else {
                backToTodayBtn.classList.add('visible');
            }
        }, {
            root: scrollWrapper,
            threshold: 0.5 // 50% of the element is visible
        });
        todayButtonObserver.observe(targetElement);
    } else {
        // No target element found, hide the button
        backToTodayBtn.classList.remove('visible');
    }
}

// --- Hitokoto 一言 功能 ---
let isUpdatingQuote = false;
async function fetchHitokoto() {
    if (isUpdatingQuote) return;
    isUpdatingQuote = true;
    const hitokotoText = document.getElementById('hitokoto-text');
    const hitokotoFrom = document.getElementById('hitokoto-from');
    hitokotoText.classList.add('opacity-0');
    hitokotoFrom.classList.add('opacity-0');
    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        let apiUrl = 'https://v1.hitokoto.cn/?encode=json';
        if (appSettings.hitokoto.mode === 'custom' && appSettings.hitokoto.categories.length > 0) {
            const categoryParams = appSettings.hitokoto.categories.map(cat => `c=${cat}`).join('&');
            apiUrl += `&${categoryParams}`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();
        hitokotoText.textContent = data.hitokoto;
        hitokotoFrom.textContent = `— 「${data.from || '未知来源'}」`;
    } catch (error) {
        console.error("获取一言失败:", error);
        hitokotoText.textContent = '获取一言失败，请稍后再试。';
        hitokotoFrom.textContent = '';
    } finally {
        hitokotoText.classList.remove('opacity-0');
        hitokotoFrom.classList.remove('opacity-0');
        setTimeout(() => { isUpdatingQuote = false; }, 600);
    }
}

// --- 时光胶囊功能 ---
function updateTimeCapsule() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const dayOfMonth = now.getDate();
    const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const hour = now.getHours();

    // 1. 今日进度
    const dayPassed = hour;
    const dayLeft = 24 - dayPassed;
    const dayPercent = (dayPassed / 24) * 100;
    document.getElementById('day-passed').textContent = dayPassed;
    document.getElementById('day-left').textContent = dayLeft;
    document.getElementById('day-percent').textContent = `${dayPercent.toFixed(1)}%`;
    document.getElementById('day-progress').style.width = `${dayPercent}%`;

    // 2. 本周进度 (周一为第一天)
    const weekPassed = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekLeft = 7 - weekPassed;
    const weekPercent = ((weekPassed + (hour / 24)) / 7) * 100;
    document.getElementById('week-passed').textContent = weekPassed;
    document.getElementById('week-left').textContent = weekLeft;
    document.getElementById('week-percent').textContent = `${weekPercent.toFixed(1)}%`;
    document.getElementById('week-progress').style.width = `${weekPercent}%`;

    // 3. 本月进度
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthPassed = dayOfMonth;
    const monthLeft = daysInMonth - monthPassed;
    const monthPercent = (monthPassed / daysInMonth) * 100;
    document.getElementById('month-passed').textContent = monthPassed;
    document.getElementById('month-left').textContent = monthLeft;
    document.getElementById('month-percent').textContent = `${monthPercent.toFixed(1)}%`;
    document.getElementById('month-progress').style.width = `${monthPercent}%`;

    // 4. 今年进度
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const totalDaysInYear = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24) + 1;
    const yearPassed = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24));
    const yearLeft = totalDaysInYear - yearPassed;
    const yearPercent = (yearPassed / totalDaysInYear) * 100;
    document.getElementById('year-passed').textContent = yearPassed;
    document.getElementById('year-left').textContent = yearLeft;
    document.getElementById('year-percent').textContent = `${yearPercent.toFixed(1)}%`;
    document.getElementById('year-progress').style.width = `${yearPercent}%`;
}

// --- 网站运行时间 ---
function updateSiteRuntime() {
     const startTime = new Date('2025-07-30T18:30:00');
    const now = new Date();
    const diff = now - startTime;

    const displayElement = document.getElementById('site-runtime-display');
    if (!displayElement) return;

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

// --- GitHub Chart Loader Logic ---
function setupGitHubChartLoader() {
    const spinner = document.getElementById('gh-chart-spinner');
    const errorContainer = document.getElementById('gh-chart-error');
    const errorMessage = document.getElementById('gh-chart-error-message');
    const imgLink = document.getElementById('gh-chart-link');
    const img = document.getElementById('gh-chart-img');
    const loadingContainer = document.getElementById('gh-chart-loading');
    const chartWrapper = document.getElementById('gh-chart-wrapper');

    const loadImage = () => {
        // Reset image state for re-loads
        img.classList.remove('loaded');
        imgLink.classList.add('invisible');
        errorContainer.classList.remove('visible');

        // Show loading UI
        chartWrapper.classList.add('hidden');
        loadingContainer.classList.remove('hidden');
        spinner.classList.add('visible');

        const originalSrc = img.dataset.src;
        const baseUrl = originalSrc.split('?')[0];
        // Reconstruct URL to safely add cache-busting parameter
        img.src = `${baseUrl}?theme=dark&v=${new Date().getTime()}`;
    };

    img.onload = () => {
        // Hide loading UI
        spinner.classList.remove('visible');
        loadingContainer.classList.add('hidden');
        
        // Show the chart wrapper so its contents can be animated
        chartWrapper.classList.remove('hidden');
        
        // Defer the animation trigger to the next paint cycle for reliability
        requestAnimationFrame(() => {
            imgLink.classList.remove('invisible');
            imgLink.classList.add('visible');
            img.classList.add('loaded');
        });
    };

    img.onerror = () => {
        // Hide loading UI
        spinner.classList.remove('visible');
        loadingContainer.classList.add('hidden');

        // Show the chart wrapper to display the error message
        chartWrapper.classList.remove('hidden');

        errorContainer.classList.add('visible');
        errorMessage.textContent = '贡献图加载失败，请检查网络并重试。';
    };

    errorContainer.addEventListener('click', () => {
        loadImage();
    });

    // Initial load
    loadImage();
}





// --- [NEW] Card Slider Logic ---
function createCardSlider(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const wrapper = container.querySelector('.slider-wrapper');
    const track = container.querySelector('.slider-track');
    const slides = Array.from(container.querySelectorAll('.card-slide'));
    const dotsContainer = container.querySelector('.slider-dots');

    if (!wrapper || !track || !slides.length || !dotsContainer) {
        console.error('Slider missing required elements.');
        return;
    }

    let hasDragged = false;

    let state = {
        slidesToShow: 3,
        slidesToScroll: 3,
        totalSlides: slides.length,
        currentPage: 0,
        totalPages: 1,
        isDragging: false,
        startX: 0,
        currentTranslate: 0,
        startTranslate: 0,
        lastX: 0,
        velocity: 0,
        animationFrame: null,
    };

    const FRICTION = 0.92;
    const THRESHOLD = 50; // Min distance in px to trigger a slide

    function updateSliderConfig() {
        const screenWidth = window.innerWidth;
        if (screenWidth < 768) { // On mobile and small tablets, show 2 cards
            state.slidesToShow = 2;
            state.slidesToScroll = 2;
        } else { // On larger screens, show 3 cards
            state.slidesToShow = 3;
            state.slidesToScroll = 3;
        }
        state.totalPages = Math.ceil(state.totalSlides / state.slidesToScroll);
    }

    function applySlideWidths() {
        const gap = 16; // 1rem, from `gap-4`
        const style = window.getComputedStyle(wrapper);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        const contentWidth = wrapper.clientWidth - paddingLeft - paddingRight;
        const slideWidth = (contentWidth - (gap * (state.slidesToShow - 1))) / state.slidesToShow;
        slides.forEach(slide => {
            slide.style.width = `${slideWidth}px`;
        });
    }

    function createDots() {
        dotsContainer.innerHTML = '';
        if (state.totalPages <= 1) {
            container.style.display = 'none'; // Hide the whole thing
            return;
        }
        container.style.display = '';

        for (let i = 0; i < state.totalPages; i++) {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            dot.setAttribute('data-page', i);
            dot.addEventListener('click', () => goToPage(i));
            dotsContainer.appendChild(dot);
        }
    }

    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === state.currentPage);
        });
    }
    
    function goToPage(page, animated = true) {
        state.currentPage = Math.max(0, Math.min(page, state.totalPages - 1));
        
        const gap = 16;
        const style = window.getComputedStyle(wrapper);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        const contentWidth = wrapper.clientWidth - paddingLeft - paddingRight;
        
        // Since slidesToScroll is always equal to slidesToShow, the total distance
        // to scroll for one page is the width of the content area plus one gap.
        const scrollAmount = contentWidth + gap;
        const newTranslate = -state.currentPage * scrollAmount;

        if (animated) {
            track.style.transition = `transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)`;
            track.style.transform = `translateX(${newTranslate}px)`;
        } else {
            track.style.transition = 'none';
            track.style.transform = `translateX(${newTranslate}px)`;
        }

        state.currentTranslate = newTranslate;
        updateDots();
    }

    function onDragStart(event) {
        hasDragged = false;
        event.preventDefault();
        state.isDragging = true;
        state.startX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
        state.startTranslate = state.currentTranslate;
        state.lastX = state.startX;
        state.velocity = 0;
        
        track.style.transition = 'none';
        wrapper.classList.add('grabbing');
        
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = requestAnimationFrame(updateVelocity);
    }

    function onDragMove(event) {
        if (!state.isDragging) return;
        const currentX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
        const dx = currentX - state.startX;
        if (Math.abs(dx) > 10) {
            hasDragged = true;
        }
        state.currentTranslate = state.startTranslate + dx;
        track.style.transform = `translateX(${state.currentTranslate}px)`;
    }
    
    function updateVelocity() {
        const now = performance.now();
        const currentX = state.lastX;
        const dx = currentX - state.lastX;
        const dt = now - (state.lastTime || now);
        state.lastTime = now;
        
        if (dt > 0) {
            state.velocity = (dx / dt) * 10; // Scale up for more oomph
        }
        state.lastX = currentX;
        state.animationFrame = requestAnimationFrame(updateVelocity);
    }

    function onDragEnd() {
        if (!state.isDragging) return;
        state.isDragging = false;
        wrapper.classList.remove('grabbing');
        cancelAnimationFrame(state.animationFrame);

        const dragDistance = state.currentTranslate - state.startTranslate;
        const targetPage = state.currentPage;

        if (Math.abs(dragDistance) > THRESHOLD) {
            // Move to next/prev page
            const direction = dragDistance < 0 ? 1 : -1;
            goToPage(state.currentPage + direction);
        } else {
            // Snap back to current page
            goToPage(state.currentPage);
        }
    }

    function init() {
        updateSliderConfig();
        applySlideWidths();
        createDots();
        goToPage(0, false); // Initialize position

        slides.forEach(slide => {
            slide.addEventListener('click', (e) => {
                if (hasDragged) {
                    e.preventDefault();
                }
            });
        });

        wrapper.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        wrapper.addEventListener('mouseleave', onDragEnd);

        wrapper.addEventListener('touchstart', onDragStart, { passive: true });
        wrapper.addEventListener('touchmove', onDragMove, { passive: true });
        wrapper.addEventListener('touchend', onDragEnd);
        wrapper.addEventListener('touchcancel', onDragEnd);

        let lastWheelTime = 0;
        const wheelThrottle = 500; // 500ms delay between wheel scrolls

        wrapper.addEventListener('wheel', (event) => {
            // Ignore wheel events that are more horizontal than vertical
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                return;
            }

            event.preventDefault();
            const now = Date.now();
            if (now - lastWheelTime < wheelThrottle) {
                return;
            }
            lastWheelTime = now;

            const direction = event.deltaY > 0 ? 1 : -1;
            const newPage = state.currentPage + direction;

            if (newPage >= 0 && newPage < state.totalPages) {
                goToPage(newPage);
            }
        }, { passive: false });
    }

    const resizeObserver = new ResizeObserver(() => {
        const oldTotalPages = state.totalPages;
        updateSliderConfig();
        applySlideWidths();
        if (state.totalPages !== oldTotalPages) {
            createDots();
        }
        goToPage(state.currentPage, false);
    });
    resizeObserver.observe(container);

    init();
}

// --- [NEW] About Card Commit Fetching ---
function formatTimeAgo(dateString) {
    const now = new Date();
    const commitDate = new Date(dateString);
    const diffSeconds = Math.round((now - commitDate) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);

    if (diffHours < 1) {
        return "提交于 刚刚";
    }
    if (diffHours < 24) {
        return `提交于 ${diffHours} 小时前`;
    }
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const commitDay = new Date(commitDate.getFullYear(), commitDate.getMonth(), commitDate.getDate());
    const dayDiff = (today - commitDay) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
        return "提交于 昨天";
    }
    if (dayDiff < 7) {
        return `提交于 ${dayDiff} 天前`;
    }
    
    return `提交于 ${commitDate.getFullYear()}-${String(commitDate.getMonth() + 1).padStart(2, '0')}-${String(commitDate.getDate()).padStart(2, '0')}`;
}

async function fetchAndRenderCommits(forceRefresh = false) {
    const container = document.getElementById('recent-commits-container');
    if (!container) return;

    if (areCommitsCached && !forceRefresh) {
        return; // Should be handled by toggleAboutCard, but acts as a safeguard.
    }

    const simplebarInstance = SimpleBar.instances.get(container);
    const contentEl = simplebarInstance ? simplebarInstance.getContentElement() : container;
    const refreshBtn = document.getElementById('refresh-commits-btn');
    const refreshIcon = refreshBtn ? refreshBtn.querySelector('i') : null;

    const executeFetch = async () => {
        try {
            const response = await fetch(`https://cors.eu.org/https://api.github.com/repos/Qing90bing/Qing_Webcard/commits?per_page=30&v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
            const allCommits = await response.json();

            if (allCommits.length === 0) {
                renderContent(`<div class="commit-loader-wrapper"><p style="color: var(--text-color-secondary);">未能找到任何提交记录。</p></div>`, false);
                return;
            }

            const commitsToDisplay = allCommits.slice(0, 15);

            const groupedByDate = new Map();
            commitsToDisplay.forEach(commitData => {
                const date = new Date(commitData.commit.author.date);
                const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
                
                if (!groupedByDate.has(dateStr)) {
                    groupedByDate.set(dateStr, []);
                }
                groupedByDate.get(dateStr).push(commitData);
            });

            let commitsHTML = '';
            for (const [date, dateCommits] of groupedByDate.entries()) {
                commitsHTML += `
                    <div class="timeline-item">
                        <div class="timeline-node"></div>
                        <div class="timeline-content">
                            <h4 class="text-base font-semibold" style="color: var(--text-color-primary);">
                                <i class="far fa-calendar-alt mr-2"></i>${date}
                            </h4>
                            <div class="mt-2 space-y-2">
                `;
                
                dateCommits.forEach(commitData => {
                    const message = commitData.commit.message.split('\n')[0];
                    const url = commitData.html_url;
                    const authorName = commitData.commit.author.name;
                    const avatarUrl = commitData.author?.avatar_url;
                    const timeAgo = formatTimeAgo(commitData.commit.author.date);
                    
                    let authorHTML = `
                        <span class="flex items-center">
                            <i class="fas fa-user-edit fa-fw mr-2"></i>
                    `;

                    if (avatarUrl) {
                        authorHTML += `<img src="${avatarUrl}" class="tooltip-container w-4 h-4 rounded-full mr-2 commit-avatar" alt="${authorName}'s avatar" data-tooltip="${authorName}" onload="this.classList.add('loaded')">`;
                    }
                    
                    authorHTML += `<span>${authorName}</span>`;

                    authorHTML += `</span>`;

                    commitsHTML += `
                        <a href="${url}" target="_blank" class="block p-2 rounded-lg themed-hover-bg transition-colors duration-200">
                            <p class="tooltip-container font-semibold commit-message-text" style="color: var(--text-color-primary);" data-tooltip="${message}">${message}</p>
                            <div class="text-xs mt-1 flex justify-between items-center" style="color: var(--text-color-tertiary);">
                                ${authorHTML}
                                <span>${timeAgo}</span>
                            </div>
                        </a>
                    `;
                });

                commitsHTML += `
                            </div>
                        </div>
                    </div>
                `;
            }

            if (allCommits.length === 30) {
                commitsHTML += `
                    <div class="timeline-item">
                        <div class="timeline-node"></div>
                        <div class="timeline-content">
                            <a href="https://github.com/Qing90bing/Qing_Webcard/commits" target="_blank" class="inline-flex items-center text-sm font-semibold p-2 rounded-lg themed-hover-bg transition-colors duration-200" style="color: var(--accent-color);">
                                前往 Github 查看更多
                                <i class="fas fa-external-link-alt ml-2 fa-xs"></i>
                            </a>
                        </div>
                    </div>
                `;
            }
            
            renderContent(`<div class="timeline-wrapper">${commitsHTML}</div>`, true);

        } catch (error) {
            console.error("Failed to fetch commits:", error);
            renderContent(`<div class="commit-loader-wrapper"><p style="color: var(--status-past);">加载提交记录失败，请稍后重试。</p></div>`, false);
        }
    };

    const renderContent = (html, isSuccess) => {
        if (isSuccess) {
            cachedCommitsHTML = html;
            areCommitsCached = true;
        }
        container.style.opacity = '0';
        setTimeout(() => {
            contentEl.innerHTML = html;
            container.style.opacity = '1';
            simplebarInstance?.recalculate();
            // --- Restore button state ---
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.classList.remove('is-refreshing');
            }
            refreshIcon?.classList.remove('fa-spin');
            // Update mask after content is rendered
            setTimeout(updateCommitMask, 50);
        }, 300);
    };

    const showLoaderAndFetch = () => {
        contentEl.innerHTML = `
            <div class="commit-loader-wrapper">
                <div class="commit-spinner"></div>
                <p style="color: var(--text-color-secondary);">正在加载提交记录...</p>
            </div>
        `;
        container.style.opacity = '1';
        executeFetch();
    };

    // --- Manage Button and Loading State ---
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.classList.add('is-refreshing');
    }
    refreshIcon?.classList.add('fa-spin');

    if (forceRefresh) {
        container.style.opacity = '0';
        setTimeout(showLoaderAndFetch, 300);
    } else {
        showLoaderAndFetch();
    }
}

function updateCommitMask() {
    const container = document.getElementById('recent-commits-container');
    if (!container) return;

    const simplebarInstance = SimpleBar.instances.get(container);
    if (!simplebarInstance) return;

    const scrollElement = simplebarInstance.getScrollElement();
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const maxFadeSize = 24; // Desired fade height in px

    // If content is not scrollable, set fades to 0 and exit.
    if (scrollHeight <= clientHeight) {
        container.style.setProperty('--fade-top-size', '0px');
        container.style.setProperty('--fade-bottom-size', '0px');
        return;
    }

    const scrollBottom = scrollHeight - clientHeight - scrollTop;
    
    const topFade = Math.min(scrollTop, maxFadeSize);
    const bottomFade = Math.min(scrollBottom, maxFadeSize);

    container.style.setProperty('--fade-top-size', `${topFade}px`);
    container.style.setProperty('--fade-bottom-size', `${bottomFade}px`);
}

// --- 交互事件监听 ---
function setupEventListeners() {
    // --- Theme Settings Listeners ---
    document.querySelectorAll('.setting-btn-group .setting-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            appSettings.theme = theme;
            applyCurrentTheme();
            saveSettings();
            updateThemeSettingsUI(); // Update active state
        });
    });

    // --- Background Settings Listeners ---
    const bgRadioButtons = document.querySelectorAll('input[name="background-source"]');
    const defaultOptionsContainer = document.getElementById('default-bg-options');

    const customBgInputWrapper = document.getElementById('custom-bg-input-wrapper');

    bgRadioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            const source = radio.value;
            appSettings.background.source = source;

            if (source === 'default') {
                defaultOptionsContainer.classList.add('open');
            } else {
                defaultOptionsContainer.classList.remove('open');
            }

            if (source === 'custom') {
                customBgInputWrapper.style.maxHeight = '80px';
                customBgInputWrapper.classList.add('mt-2');
            } else {
                customBgInputWrapper.style.maxHeight = '0';
                customBgInputWrapper.classList.remove('mt-2');
            }

            // When a source is selected, apply the background.
            // The applyCurrentBackground function will handle logic for new/empty custom URLs.
            applyCurrentBackground();
            
            saveSettings();
        });
    });

    const thumbItems = defaultOptionsContainer.querySelectorAll('.thumb-item');
    thumbItems.forEach(thumb => {
        thumb.addEventListener('click', () => {
            // This listener only matters when the 'default' source is active
            if (appSettings.background.source !== 'default') {
                // To be safe, check the 'default' radio
                document.getElementById('bg-radio-default').checked = true;
                appSettings.background.source = 'default';
            }
            
            const specifier = thumb.dataset.bgUrl;
            appSettings.background.specifier = specifier;
            
            // Update UI immediately for responsiveness
            thumbItems.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            
            applyCurrentBackground();
            saveSettings();
        });
    });

    // --- [NEW] Preview Buttons Listeners ---
    const refreshBtn = document.getElementById('bg-preview-refresh-btn');
    const downloadBtn = document.getElementById('bg-preview-download-btn');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const icon = refreshBtn.querySelector('i');
            if (icon && !icon.classList.contains('fa-spin')) {
                icon.classList.add('fa-spin');
                applyCurrentBackground();
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            downloadImage();
        });
    }

    const previewErrorContainer = document.getElementById('bg-preview-error');
    if (previewErrorContainer) {
        previewErrorContainer.addEventListener('click', () => {
            hidePreviewError();
            setTimeout(() => {
                // We call this again to retry loading a background.
                applyCurrentBackground();
            }, 300); // Wait for the fade-out transition to complete before retrying.
        });
    }


    // --- Time Format Listeners ---
    document.querySelectorAll('input[name="time-format"]').forEach(radio => {
        radio.addEventListener('change', () => {
            appSettings.timeFormat = radio.value;
            saveSettings();
            updateTime(); // Immediately update the main clock
            // If weather view is active, re-render it to update sunrise/sunset
            if (appSettings.view === 'weather') {
                applyCurrentView();
            }
        });
    });

    // --- [NEW] Immersive Blink Toggle Listener ---
    const immersiveBlinkToggle = document.getElementById('immersive-blink-toggle');
    if (immersiveBlinkToggle) {
        immersiveBlinkToggle.addEventListener('change', () => {
            appSettings.immersiveBlinkingColon = immersiveBlinkToggle.checked;
            saveSettings();
            applyBlinkingEffect();
        });
    }

    // --- [NEW] Appearance Settings Listener ---
    const glassEffectToggle = document.getElementById('glass-effect-toggle');
    if (glassEffectToggle) {
        glassEffectToggle.addEventListener('change', () => {
            appSettings.appearance.glassEffect = glassEffectToggle.checked;
            saveSettings();
            applyGlassEffect();
        });
    }

    const radiusSlider = document.getElementById('card-border-radius-slider');
    const radiusValue = document.getElementById('card-border-radius-value');
    if (radiusSlider && radiusValue) {
        radiusSlider.addEventListener('input', (e) => {
            const newValue = e.target.value;
            radiusValue.textContent = `${newValue}px`;
            appSettings.appearance.cardBorderRadius = parseInt(newValue, 10);
            applyCardSettings();
            updateSliderProgress(e.target);
        });
        radiusSlider.addEventListener('change', () => {
            saveSettings(); // Save only when the user releases the mouse
        });
    }

    const blurSlider = document.getElementById('card-blur-amount-slider');
    const blurValue = document.getElementById('card-blur-amount-value');
    if (blurSlider && blurValue) {
        blurSlider.addEventListener('input', (e) => {
            const newValue = e.target.value;
            blurValue.textContent = `${newValue}px`;
            appSettings.appearance.cardBlurAmount = parseInt(newValue, 10);
            applyCardSettings();
            updateSliderProgress(e.target);
        });
        blurSlider.addEventListener('change', () => {
            saveSettings(); // Save only when the user releases the mouse
        });
    }

    // --- View Toggle Listeners ---
    const cityInput = document.getElementById('weather-city-input');
    const saveCityBtn = document.getElementById('save-city-btn');
    const confirmCityIcon = document.getElementById('confirm-city-icon');
    const cityInputError = document.getElementById('city-input-error');

    const saveCity = () => {
        const newCity = cityInput.value.trim();

        // Validation for length
        if (newCity.length > 20) {
            cityInput.classList.add('invalid');
            cityInputError.textContent = '内容过长 (最多20个字符)';
            cityInputError.classList.add('visible');
            cityInputError.classList.remove('hidden');
            return;
        }

        // Clear previous errors
        cityInput.classList.remove('invalid');
        cityInputError.classList.remove('visible');
        // Use a timeout to hide it after the transition
        setTimeout(() => { cityInputError.classList.add('hidden'); }, 200);

        // Save logic
        appSettings.weather.city = newCity;
        applyCurrentView();
        saveSettings();
        cityInput.blur();

        // Feedback animation
        saveCityBtn.style.opacity = '0';
        confirmCityIcon.classList.remove('hidden');
        setTimeout(() => { 
            confirmCityIcon.style.opacity = '1';
            confirmCityIcon.style.transform = 'scale(1)';
        }, 10);

        setTimeout(() => {
            confirmCityIcon.style.opacity = '0';
            confirmCityIcon.style.transform = 'scale(0.9)';
            setTimeout(() => {
                confirmCityIcon.classList.add('hidden');
                saveCityBtn.style.opacity = '1';
            }, 200);
        }, 2000); 
    };

    document.querySelectorAll('input[name="view-source"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const value = radio.value;
            if (value === 'github') {
                appSettings.view = 'github';
            } else {
                appSettings.view = 'weather';
                if (value === 'weather-auto') {
                    appSettings.weather.source = 'auto';
                    appSettings.weather.city = null; 
                } else { // weather-manual
                    appSettings.weather.source = 'manual';
                }
            }
            
            applyCurrentView();
            updateViewToggleUI();
            saveSettings();
        });
    });

    cityInput.addEventListener('focus', () => {
        cityInput.classList.remove('invalid');
        cityInputError.classList.remove('visible');
        setTimeout(() => { cityInputError.classList.add('hidden'); }, 200);
    });

    cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCity();
        }
    });

    saveCityBtn.addEventListener('click', saveCity);


    // --- Settings Modal Logic ---
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const settingsOverlay = document.getElementById('settings-overlay');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    function openSettings() {
        updateSettingsUI(); // Refresh UI to match saved settings
        const settingsWindow = document.getElementById('settings-window');
        
        // [FIX] Temporarily disable transitions on overlays to prevent animation on panel open
        const overlay1 = document.getElementById('background-settings-overlay');
        const overlay2 = document.getElementById('blur-slider-overlay');

        if (overlay1) overlay1.style.transition = 'none';
        if (overlay2) overlay2.style.transition = 'none';

        document.body.classList.add('settings-open');
        
        // Restore transitions after the panel has appeared.
        setTimeout(() => {
            if (overlay1) overlay1.style.transition = '';
            if (overlay2) overlay2.style.transition = '';
        }, 300);


        // Initialize SimpleBar on the content area if it hasn't been already
        if (!settingsSimpleBar) {
            const contentWrapper = settingsWindow.querySelector('[data-simplebar]');
            if (contentWrapper) {
                settingsSimpleBar = new SimpleBar(contentWrapper);
                const scrollElement = settingsSimpleBar.getScrollElement();
                const maskContainer = contentWrapper; // The element with the mask is the one with data-simplebar
                const maxFadeSize = 24; // Corresponds to the CSS variable

                const updateSettingsMask = () => {
                    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
                    const tolerance = 1;
                    // If content is not scrollable, remove fades
                    if (scrollHeight <= clientHeight + tolerance) {
                        maskContainer.style.setProperty('--fade-top-size', '0px');
                        maskContainer.style.setProperty('--fade-bottom-size', '0px');
                        return;
                    }
                    const scrollBottom = scrollHeight - clientHeight - scrollTop;
                    const topFade = Math.min(scrollTop, maxFadeSize);
                    const bottomFade = Math.min(scrollBottom, maxFadeSize);
                    maskContainer.style.setProperty('--fade-top-size', `${topFade}px`);
                    maskContainer.style.setProperty('--fade-bottom-size', `${bottomFade}px`);
                };

                scrollElement.addEventListener('scroll', updateSettingsMask);
                // Call once to set initial state, delayed to allow rendering
                setTimeout(updateSettingsMask, 50);
            }
        }
    }

    function closeSettings() {
        document.body.classList.remove('settings-open');
        // The line that removed the 'visible' class from the preview container
        // has been removed to prevent the re-animation issue.
    }

    openSettingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    // settingsOverlay.addEventListener('click', (e) => {
    //     if (e.target === settingsOverlay) closeSettings();
    // });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Priority 0: Close immersive view
            if (document.body.classList.contains('immersive-active')) {
                document.getElementById('exit-immersive-btn').click();
                return;
            }
            
            // Priority 1: Close developer settings modal if it's open
            if (document.body.classList.contains('developer-settings-open')) {
                closeDeveloperSettings();
                return;
            }

            // Priority 2: Close settings modal if it's open
            if (document.body.classList.contains('settings-open')) {
                closeSettings();
                return;
            }

            // [USER FEEDBACK] Priority 3: Close "About" card if it's open
            if (!aboutCard.classList.contains('hidden')) {
                toggleAboutCard();
                return;
            }

            // Priority 4: Close holiday list card if it's open
            if (!holidayListCard.classList.contains('hidden')) {
                holidayListCard.classList.add('hidden');
                rightColumn.classList.remove('hidden');
                animateRightColumnIn();
                return;
            }

            // Priority 5: Close time capsule card if it's open
            if (!timeCapsuleCard.classList.contains('hidden')) {
                timeCapsuleCard.classList.add('hidden');
                rightColumn.classList.remove('hidden');
                animateRightColumnIn();
                return;
            }
        }
    });

    // --- [NEW] Developer Mode Logic ---
    let logoClickCount = 0;
    let logoClickTimer = null;

    const aboutCardLogo = document.getElementById('about-card-logo');
    const developerIconContainer = document.getElementById('developer-icon-container');
    const developerIcon = document.getElementById('developer-icon');
    const developerSettingsOverlay = document.getElementById('developer-settings-overlay');
    const closeDeveloperSettingsBtn = document.getElementById('close-developer-settings-btn');

    const openDeveloperSettings = () => {
        updateDeveloperSettingsUI(); // Update the UI from the latest settings state
        document.body.classList.add('developer-settings-open');
    };
    const closeDeveloperSettings = () => document.body.classList.remove('developer-settings-open');

    if (aboutCardLogo) {
        aboutCardLogo.addEventListener('click', () => {
            // Re-trigger animation for a satisfying click feel
            aboutCardLogo.classList.remove('logo-click-bounce-anim');
            void aboutCardLogo.offsetWidth; // Force reflow to restart animation
            aboutCardLogo.classList.add('logo-click-bounce-anim');

            // [FIX] Check the master switch to see if the feature is enabled at all
            if (!appSettings.developer.masterSwitchEnabled) return;

            clearTimeout(logoClickTimer);
            logoClickCount++;

            if (logoClickCount >= 5) {
                if (!developerIconContainer.classList.contains('visible')) {
                    developerIconContainer.classList.add('visible');
                    // [NEW] Save unlock state
                    try {
                        localStorage.setItem('developerModeUnlocked', 'true');
                    } catch (e) {
                        console.error("Failed to save to localStorage", e);
                    }
                }
                // [FIX] When re-unlocking, always reset the toggle's state to ON.
                appSettings.developer.uiToggleState = true;
                saveSettings();

                logoClickCount = 0;
                clearTimeout(logoClickTimer); // Stop timer once icon is shown
            } else {
                logoClickTimer = setTimeout(() => {
                    logoClickCount = 0;
                }, 1500); // 1.5-second window for consecutive clicks
            }
        });
    }

    if (developerIcon) developerIcon.addEventListener('click', openDeveloperSettings);
    if (closeDeveloperSettingsBtn) closeDeveloperSettingsBtn.addEventListener('click', closeDeveloperSettings);

    // [FIX] Remove the click animation class after it finishes to prevent re-playing on show/hide
    if (aboutCardLogo) {
        aboutCardLogo.addEventListener('animationend', () => {
            aboutCardLogo.classList.remove('logo-click-bounce-anim');
        });
    }
    // --- End Settings Modal Logic ---

    const animateRightColumnIn = () => {
        const elementsToAnimate = rightColumn.querySelectorAll(':scope > div');
        elementsToAnimate.forEach(el => {
            el.classList.remove('bounce-in');
            void el.offsetWidth;
            el.classList.add('bounce-in');
        });
    };

    // 切换到时光胶囊
    profileCard.addEventListener('click', (e) => { // 1. 接收 event 对象，命名为 e
        // 2. 增加判断：如果点击的目标是 <a> 标签或其内部元素，则直接返回
        if (e.target.closest('a')) {
            return;
        }

        // If the time capsule is already visible, hide it and show the main column.
        if (!timeCapsuleCard.classList.contains('hidden')) {
            timeCapsuleCard.classList.add('hidden');
            rightColumn.classList.remove('hidden');
            animateRightColumnIn();
        } else { // Otherwise, show it.
            rightColumn.classList.add('hidden');
            holidayListCard.classList.add('hidden'); // Hide other cards
            aboutCard.classList.add('hidden'); // Hide other cards
            timeCapsuleCard.classList.remove('hidden');
            timeCapsuleCard.classList.add('bounce-in');
            updateTimeCapsule();
        }
    });

    // 关闭时光胶囊
    document.getElementById('close-time-capsule').addEventListener('click', (e) => {
        e.stopPropagation();
        timeCapsuleCard.classList.add('hidden');
        rightColumn.classList.remove('hidden');
        animateRightColumnIn();
    });

    // --- [NEW] About Card Listeners ---
    const aboutCardTrigger = document.getElementById('about-card-trigger');
    const closeAboutCardBtn = document.getElementById('close-about-card');
    const refreshCommitsBtn = document.getElementById('refresh-commits-btn');

    const toggleAboutCard = () => {
        if (!aboutCard.classList.contains('hidden')) {
            aboutCard.classList.add('hidden');
            rightColumn.classList.remove('hidden');
            animateRightColumnIn();
        } else {
            rightColumn.classList.add('hidden');
            timeCapsuleCard.classList.add('hidden');
            holidayListCard.classList.add('hidden');
            aboutCard.classList.remove('hidden');
            
            if (!aboutCardHasAnimated) {
                aboutCard.classList.add('bounce-in');
                aboutCardHasAnimated = true;
            }

            const commitsContainer = document.getElementById('recent-commits-container');
            if (commitsContainer && !SimpleBar.instances.get(commitsContainer)) {
                const simplebarInstance = new SimpleBar(commitsContainer);
                simplebarInstance.getScrollElement().addEventListener('scroll', updateCommitMask);
            }
            
            if (areCommitsCached) {
                const simplebarInstance = SimpleBar.instances.get(commitsContainer);
                const contentEl = simplebarInstance ? simplebarInstance.getContentElement() : commitsContainer;
                contentEl.innerHTML = cachedCommitsHTML;
                simplebarInstance?.recalculate();
            } else {
                fetchAndRenderCommits();
            }
        }
    };

    if (aboutCardTrigger) {
        aboutCardTrigger.addEventListener('click', toggleAboutCard);
    }

    if (refreshCommitsBtn) {
        refreshCommitsBtn.addEventListener('click', () => {
            fetchAndRenderCommits(true); // Force refresh
        });
    }

    if (closeAboutCardBtn) {
        closeAboutCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAboutCard();
        });
    }

    // 切换到节日列表
    countdownCard.addEventListener('click', () => {
        if (!holidayListCard.classList.contains('hidden')) {
            holidayListCard.classList.add('hidden');
            rightColumn.classList.remove('hidden');
            animateRightColumnIn();
        } else {
            hasManuallyScrolled = false; // Reset scroll flag
            rightColumn.classList.add('hidden');
            timeCapsuleCard.classList.add('hidden'); // Hide other cards
            aboutCard.classList.add('hidden'); // Hide other cards
            holidayListCard.classList.remove('hidden');
            holidayListCard.classList.add('bounce-in');
            holidayListDisplayedYear = new Date().getFullYear();
            displayHolidayList(holidayListDisplayedYear, true);
            updateWarningMessage(holidayListDisplayedYear);
            
            // Only initialize SimpleBar and listeners once to prevent bugs
            if (!holidayListSimpleBar) {
                holidayListSimpleBar = new SimpleBar(document.getElementById('holiday-list-container-wrapper'));
                const scrollElement = holidayListSimpleBar.getScrollElement();
                const maskContainer = document.getElementById('holiday-list-container-wrapper');
                const maxFadeSize = 40;

                const updateMask = () => {
                    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
                    const tolerance = 1;
                    if (scrollHeight <= clientHeight + tolerance) {
                        maskContainer.style.setProperty('--fade-top-size', '0px');
                        maskContainer.style.setProperty('--fade-bottom-size', '0px');
                        return;
                    }
                    const scrollBottom = scrollHeight - clientHeight - scrollTop;
                    const topFade = Math.min(scrollTop, maxFadeSize);
                    const bottomFade = Math.min(scrollBottom, maxFadeSize);
                    maskContainer.style.setProperty('--fade-top-size', `${topFade}px`);
                    maskContainer.style.setProperty('--fade-bottom-size', `${bottomFade}px`);
                };

                scrollElement.addEventListener('scroll', updateMask);
                
                // Also handle the original manual scroll flag listener
                scrollElement.addEventListener('scroll', () => {
                    hasManuallyScrolled = true;
                }, { once: true });

                // Call once after a short delay to ensure layout is calculated correctly
                setTimeout(updateMask, 50);
            }

            // Initial scroll is now animated
            setTimeout(() => {
                scrollToTargetFestival(true);
            }, 50);
        }
    });

    // 关闭节日列表
    document.getElementById('close-holiday-list').addEventListener('click', (e) => {
        e.stopPropagation();
        holidayListCard.classList.add('hidden');
        rightColumn.classList.remove('hidden');
        animateRightColumnIn();
    });

    // "回到今天"按钮逻辑
    document.getElementById('back-to-today-btn').addEventListener('click', () => {
        const currentYear = new Date().getFullYear();
        if (holidayListDisplayedYear !== currentYear) {
            handleYearChange(currentYear);
        }
        scrollToTargetFestival(true);
    });

    // [NEW] Warning message logic
    const updateWarningMessage = (year) => {
        const yearWarning = document.getElementById('year-range-warning');
        if (year < 1900 || year > 2049) {
            yearWarning.innerHTML = `<svg class="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><span>${year}年的农历节日可能不准确</span>`;
            if (yearWarning.classList.contains('hidden')) {
                yearWarning.classList.remove('hidden', 'animate-fade-out');
                yearWarning.classList.add('animate-fade-in');
                setTimeout(() => yearWarning.classList.remove('animate-fade-in'), 100);
            }
        } else {
            if (!yearWarning.classList.contains('hidden')) {
                yearWarning.classList.add('animate-fade-out');
                setTimeout(() => {
                    yearWarning.classList.add('hidden');
                    yearWarning.classList.remove('animate-fade-out');
                }, 100);
            }
        }
    };

    // 节日列表年份切换
    const handleYearChange = (newYear) => {
        const yearBeforeChange = holidayListDisplayedYear;
        const currentSystemYear = new Date().getFullYear();
        
        holidayListDisplayedYear = newYear;
        displayHolidayList(holidayListDisplayedYear, true);
        updateWarningMessage(newYear); // Centralized call to handle warning

        // Check for smart scroll condition
        if (hasManuallyScrolled && holidayListDisplayedYear === currentSystemYear && yearBeforeChange !== currentSystemYear) {
            scrollToTargetFestival(true);
            hasManuallyScrolled = false; // Reset flag after use
        }
    };

    document.getElementById('prev-year').addEventListener('click', () => {
        handleYearChange(holidayListDisplayedYear - 1);
    });
    document.getElementById('next-year').addEventListener('click', () => {
        handleYearChange(holidayListDisplayedYear + 1);
    });

    // --- [NEW] Year Input Logic ---
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

            setTimeout(() => {
                yearEditControls.classList.remove('animate-fade-in');
            }, 100);
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
            setTimeout(() => {
                yearDisplayControls.classList.remove('animate-fade-in');
            }, 100);
        }, 100);
    };

    const submitNewYear = () => {
        const newYear = parseInt(yearInput.value, 10);
        // Relaxed validation as per user request.
        if (!isNaN(newYear) && newYear > 0 && newYear < 9999) {
            handleYearChange(newYear);
            exitEditMode();
        } else {
            yearInputError.textContent = '请输入有效的4位年份';
            yearInputError.classList.remove('hidden');
            yearInput.classList.add('invalid');
            setTimeout(() => {
                yearInput.classList.remove('invalid');
            }, 500);
            setTimeout(() => {
                 yearInputError.classList.add('hidden');
            }, 2500);
        }
    };

    holidayListYearSpan.addEventListener('click', enterEditMode);
    confirmYearBtn.addEventListener('click', submitNewYear);
    cancelYearBtn.addEventListener('click', exitEditMode);
    yearInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { submitNewYear(); }
        else if (e.key === 'Escape') { exitEditMode(); }
    });

    // 点击一言卡片刷新
    document.getElementById('hitokoto-card').addEventListener('click', fetchHitokoto);
    
    // 天气刷新按钮
    document.getElementById('weather-refresh-btn').addEventListener('click', () => {
        setWeatherSpinner(true);
        fetchAndDisplayWeather();
    });

    // --- [NEW] Custom Background Input Listeners ---
    const customBgInput = document.getElementById('custom-bg-input');
    const saveCustomBgBtn = document.getElementById('save-custom-bg-btn');
    const clearCustomBgBtn = document.getElementById('clear-custom-bg-btn');
    const customBgError = document.getElementById('custom-bg-input-error');
    const btnGroup = document.getElementById('custom-bg-btn-group');
    const confirmIcon = document.getElementById('confirm-custom-bg-icon');

    const saveCustomBg = () => {
        if (saveCustomBgBtn.disabled) return; // Prevent spam-clicking

        const url = customBgInput.value.trim();
        const originalPlaceholder = "输入图片或API链接";
        
        if (!url || !url.startsWith('http')) {
            customBgInput.classList.add('invalid');
            customBgInput.value = ''; // Clear input to show placeholder
            customBgInput.placeholder = '无效链接，请重新输入';
            
            // Restore after a delay
            setTimeout(() => {
                customBgInput.classList.remove('invalid');
                customBgInput.placeholder = originalPlaceholder;
            }, 2500);
            return;
        }

        appSettings.background.customUrl = url;
        appSettings.background.source = 'custom';
        
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
        appSettings.background.customType = isImage ? 'image' : 'api';

        saveSettings();
        applyCurrentBackground();

        // --- New Save Button Animation ---
        saveCustomBgBtn.disabled = true;
        const saveIcon = saveCustomBgBtn.querySelector('.fa-save');
        const checkIcon = saveCustomBgBtn.querySelector('.fa-check');

        if (saveIcon && checkIcon) {
            saveIcon.style.opacity = '0';
            checkIcon.style.opacity = '1';

            setTimeout(() => {
                saveIcon.style.opacity = '1';
                checkIcon.style.opacity = '0';
                saveCustomBgBtn.disabled = false;
            }, 2000);
        }
    };
    
    customBgInput.addEventListener('focus', () => {
        if (customBgInput.classList.contains('invalid')) {
            customBgInput.classList.remove('invalid');
            customBgInput.placeholder = "输入图片或API链接";
        }
    });

    saveCustomBgBtn.addEventListener('click', saveCustomBg);
    customBgInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCustomBg();
        }
    });

    clearCustomBgBtn.addEventListener('click', () => {
        customBgInput.value = '';
        appSettings.background.customUrl = null;
        appSettings.background.customType = 'unknown';
        saveSettings();
        customBgInput.focus();
    });

    // --- [NEW] Hitokoto Settings Listeners ---
    const hitokotoModeRadios = document.querySelectorAll('input[name="hitokoto-mode"]');
    const customOptionsContainer = document.getElementById('hitokoto-custom-options');
    const categoryCheckboxes = document.querySelectorAll('input[name="hitokoto-category"]');
    const selectAllCheckbox = document.getElementById('hitokoto-select-all');
    const saveBtn = document.getElementById('hitokoto-save-btn');

    hitokotoModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const newMode = radio.value;
            appSettings.hitokoto.mode = newMode;
            if (newMode === 'default') {
                customOptionsContainer.classList.remove('open');
                saveSettings();
                fetchHitokoto(); // Immediately fetch on switching to default
            } else {
                customOptionsContainer.classList.add('open');
                // If entering custom mode and no categories are checked (e.g. first time), check the first one.
                const checkedCount = document.querySelectorAll('input[name="hitokoto-category"]:checked').length;
                if (checkedCount === 0) {
                    const firstCategoryCheckbox = document.getElementById('hitokoto-cat-a');
                    if (firstCategoryCheckbox) {
                        firstCategoryCheckbox.checked = true;
                    }
                }
            }
        });
    });

    selectAllCheckbox.addEventListener('change', () => {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCount = document.querySelectorAll('input[name="hitokoto-category"]:checked').length;
            
            // Prevent unchecking the last box
            if (checkedCount === 0) {
                checkbox.checked = true;
            }

            // Update "Select All" checkbox state
            selectAllCheckbox.checked = checkedCount === categoryCheckboxes.length;
        });
    });

    saveBtn.addEventListener('click', () => {
        const selectedCategories = Array.from(document.querySelectorAll('input[name="hitokoto-category"]:checked')).map(cb => cb.value);
        
        if (selectedCategories.length === 0) {
            const validationMsg = document.getElementById('hitokoto-validation-msg');
            // Add the class to trigger the animation
            validationMsg.classList.add('visible');
            // Remove the class after the animation is done to allow it to be re-triggered
            setTimeout(() => {
                validationMsg.classList.remove('visible');
            }, 3000);
            return;
        }

        appSettings.hitokoto.categories = selectedCategories;
        saveSettings();
        fetchHitokoto();

        // --- [FIX] Refined Save button animation & spam prevention ---
        const saveIcon = saveBtn.querySelector('i');
        const confirmIcon = document.getElementById('hitokoto-confirm-icon');
        
        saveBtn.disabled = true; // Disable button
        saveIcon.style.opacity = '0';
        
        setTimeout(() => {
            confirmIcon.style.opacity = '1';

            setTimeout(() => {
                confirmIcon.style.opacity = '0';
                setTimeout(() => {
                    saveIcon.style.opacity = '1';
                    saveBtn.disabled = false; // Re-enable button
                }, 300);
            }, 3000);
        }, 300);
    });

    // --- [NEW] Immersive Time Listeners ---
    const immersiveView = document.getElementById('immersive-time-view');
    const timeCard = document.getElementById('time-card');
    const exitImmersiveBtn = document.getElementById('exit-immersive-btn');

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
        // Do not trigger if a sub-element that is a link was clicked
        if (event.target.closest('a')) {
            return;
        }
        document.body.classList.add('immersive-active');
        updateImmersiveTime(); // Initial population
        if (immersiveTimeInterval) clearInterval(immersiveTimeInterval);
        immersiveTimeInterval = setInterval(updateImmersiveTime, 1000);

        // Add mouse listeners for the exit button
        immersiveView.addEventListener('mousemove', handleImmersiveMouseMove);
        immersiveView.addEventListener('mouseleave', handleImmersiveMouseLeave);
    });

    exitImmersiveBtn.addEventListener('click', () => {
        document.body.classList.remove('immersive-active');
        if (immersiveTimeInterval) {
            clearInterval(immersiveTimeInterval);
            immersiveTimeInterval = null;
        }
        
        // Clean up button visibility and remove listeners
        exitImmersiveBtn.classList.remove('visible');
        immersiveView.removeEventListener('mousemove', handleImmersiveMouseMove);
        immersiveView.removeEventListener('mouseleave', handleImmersiveMouseLeave);
    });

    // --- [NEW] Hidden Reset Feature ---
    const luckTitleIcon = document.querySelector('#time-capsule-card h2 svg');
    if (luckTitleIcon) {
        luckTitleIcon.addEventListener('click', () => {
            resetClickCount++;
            clearTimeout(resetClickTimer);
            resetClickTimer = setTimeout(() => {
                resetClickCount = 0;
            }, 3000);

            if (resetClickCount === 5) {
                resetClickCount = 0;
                clearTimeout(resetClickTimer);
                localStorage.removeItem('dailyLuckData');
                
                const luckResult = document.getElementById('luck-result');
                if (luckResult) {
                    // Reset all JS state immediately
                    luckGameState = 'initial';
                    dailyLuckData = null;
                    hasPlayedGameToday = false;
                    luckClickCount = 0;
                    clearTimeout(luckResetTimer);
                    clearTimeout(countdownAnimationHandle);

                    // Start the collapse animation
                    luckResult.classList.remove('visible');

                    // After the animation finishes, clean up the DOM properties
                    setTimeout(() => {
                        // Only clean up if another game hasn't started in the meantime
                        if(luckGameState === 'initial') {
                            luckResult.classList.remove('flex', 'flex-col', 'justify-center', 'flex-1', 'min-w-0', 'relative');
                            luckResult.innerHTML = '';
                        }
                    }, 500);
                }
            }
        });
    }

    // --- [REVISED] Developer Options Toggle Listener ---
    const devOptionsToggle = document.getElementById('dev-options-toggle');
    if (devOptionsToggle) {
        devOptionsToggle.addEventListener('change', () => {
            const isEnabled = devOptionsToggle.checked;
            appSettings.developer.uiToggleState = isEnabled;
            const developerIconContainer = document.getElementById('developer-icon-container');

            if (isEnabled) {
                // When turned ON, just ensure the icon is marked as visible for the next time the 'About' panel is opened.
                // This fixes the bug where the icon would disappear.
                if (developerIconContainer) {
                    developerIconContainer.classList.add('visible');
                }
            } else {
                // When turned OFF, perform all reset actions as requested.
                // 1. Reset sub-settings in the settings object.
                appSettings.developer.forceNewYearTheme = false;
                
                // 2. Update the UI of all sub-settings to reflect the change.
                const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');
                if (forceNewYearToggle) {
                    forceNewYearToggle.checked = false;
                }
                
                // 3. Apply changes triggered by settings reset (e.g., turn off NY theme).
                applyNewYearMode(); 
                
                // 4. Hide the developer icon in the 'About' panel.
                if (developerIconContainer) {
                    developerIconContainer.classList.remove('visible');
                }

                // 5. Remove the unlock flag from localStorage to re-lock the feature.
                try {
                    localStorage.removeItem('developerModeUnlocked');
                } catch (e) {
                    console.error("Failed to remove from localStorage", e);
                }

                // 6. Close the developer settings window immediately.
                closeDeveloperSettings();
            }
            
            saveSettings(); // Save all settings changes.
        });
    }

    // --- [NEW] New Year Theme Event Listeners ---
    const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');
    if (forceNewYearToggle) {
        forceNewYearToggle.addEventListener('change', () => {
            appSettings.developer.forceNewYearTheme = forceNewYearToggle.checked;
            saveSettings();
            applyNewYearMode();
        });
    }

    const musicBtn = document.getElementById('new-year-music-btn');
    if (musicBtn) {
        const audio = document.getElementById('new-year-audio');

        musicBtn.addEventListener('click', () => {
            if (!audio) return;
            if (audio.paused) {
                audio.play().catch(e => console.error("Music play failed on click:", e));
            } else {
                audio.pause();
            }
        });

        if (audio) {
            audio.addEventListener('play', () => {
                musicBtn.classList.add('is-playing');
                musicBtn.classList.remove('is-paused');
            });
            audio.addEventListener('pause', () => {
                musicBtn.classList.remove('is-playing');
                musicBtn.classList.add('is-paused');
            });
        }
    }

    const newYearAudio = document.getElementById('new-year-audio');
    if (newYearAudio) {
        newYearAudio.addEventListener('timeupdate', () => {
            if (newYearAudio.paused) return;

            if (!newYearMusicIntroPlayed) {
                if (newYearAudio.currentTime >= NY_MUSIC_LOOP_END) {
                    newYearMusicIntroPlayed = true;
                    newYearAudio.currentTime = NY_MUSIC_LOOP_START;
                }
            } else {
                if (newYearAudio.currentTime >= NY_MUSIC_LOOP_END) {
                    newYearAudio.currentTime = NY_MUSIC_LOOP_START;
                }
            }
        });
    }

    const newYearBgToggle = document.getElementById('new-year-bg-toggle');
    if (newYearBgToggle) {
        newYearBgToggle.addEventListener('change', () => {
            appSettings.newYearTheme.backgroundEnabled = newYearBgToggle.checked;
            saveSettings();
            applyNewYearMode(); // Re-evaluate the whole theme state
        });
    }

    // --- [NEW] Reset Settings Logic ---
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    const resetConfirmOverlay = document.getElementById('reset-confirm-overlay');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const resetConfirmState = document.getElementById('reset-confirm-state');
    const resetSuccessState = document.getElementById('reset-success-state');

    const openResetModal = () => {
        // Ensure the modal is in the correct initial state when opening
        resetConfirmState.classList.remove('hidden');
        resetSuccessState.classList.add('hidden');
        if(confirmResetBtn) confirmResetBtn.disabled = false;
        if(cancelResetBtn) cancelResetBtn.disabled = false;

        if (resetConfirmOverlay) {
            resetConfirmOverlay.classList.remove('hidden');
            setTimeout(() => {
                document.body.classList.add('reset-confirm-open');
            }, 10); 
        }
    };

    const closeResetModal = () => {
        document.body.classList.remove('reset-confirm-open');
    };
    
    if (resetConfirmOverlay) {
        resetConfirmOverlay.addEventListener('transitionend', (event) => {
            if (event.propertyName === 'opacity' && !document.body.classList.contains('reset-confirm-open')) {
                resetConfirmOverlay.classList.add('hidden');
            }
        });
    }

    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', openResetModal);
    }
    if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', closeResetModal);
    }
    if (resetConfirmOverlay) {
        resetConfirmOverlay.addEventListener('click', (e) => {
            if (e.target === resetConfirmOverlay) {
                closeResetModal();
            }
        });
    }
    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', () => {
            // Disable buttons immediately to prevent multiple clicks
            confirmResetBtn.disabled = true;
            if(cancelResetBtn) cancelResetBtn.disabled = true;

            // 1. Fade out the confirmation content
            if(resetConfirmState) resetConfirmState.style.opacity = '0';

            // 2. After fade-out, switch content and fade in success message
            setTimeout(() => {
                if(resetConfirmState) resetConfirmState.classList.add('hidden');
                
                if(resetSuccessState) {
                    resetSuccessState.style.opacity = '0'; // Start transparent
                    resetSuccessState.classList.remove('hidden');
                    
                    // A tiny delay to allow the browser to apply display:block before transitioning opacity
                    setTimeout(() => {
                        resetSuccessState.style.opacity = 1;
                    }, 20);
                }

                // 3. Perform the actual reset
                localStorage.removeItem('qing-homepage-settings');
                localStorage.removeItem('developerModeUnlocked');

                // 4. Reload the page after showing the success message
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }, 250); // This duration should match the CSS transition
        });
    }
}

// --- [NEW] JS-Powered Tooltip Logic ---
function setupTooltips() {
    let tooltipEl = null;
    let showTimer = null;

    function createTooltipElement() {
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.classList.add('js-tooltip');
            document.body.appendChild(tooltipEl);
        }
    }

    function showTooltip(target) {
        const tooltipText = target.getAttribute('data-tooltip');
        if (!tooltipText) return;

        createTooltipElement();
        tooltipEl.textContent = tooltipText;
        positionTooltip(target);

        tooltipEl.style.opacity = '1';
        tooltipEl.style.transform = 'scale(1) translateY(0)';
    }

    function hideTooltip() {
        if (tooltipEl) {
            tooltipEl.style.opacity = '0';
            tooltipEl.style.transform = 'scale(0.95) translateY(5px)';
        }
    }

    function positionTooltip(target) {
        if (!tooltipEl || !target) return;

        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const offset = 10; 

        let top = targetRect.top - tooltipRect.height - offset;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        if (top < 0) {
            top = targetRect.bottom + offset;
        }
        if (left < 0) {
            left = 5;
        }
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 5;
        }

        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
    }
    
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            clearTimeout(showTimer);
            showTimer = setTimeout(() => {
                showTooltip(target);
            }, 200);
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            clearTimeout(showTimer);
            hideTooltip();
        }
    });

    window.addEventListener('scroll', () => {
        clearTimeout(showTimer);
        hideTooltip();
    }, true);
}


// --- 页面加载时执行的函数 ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // Initialize Faders
    const bgLayers = document.querySelectorAll('#bg-wrapper .bg-layer');
    backgroundFader = createCrossfader(Array.from(bgLayers));

    // --- [FIX] Correct Initialization Order ---
    setupTooltips(); // Initialize the new tooltip system
    // 1. Build the settings panel UI first, so other functions can find its elements.
    setupSettingsUI();
    setupEventListeners();
    setupLuckFeature(); // Activate the new luck feature
    particleEffects.init(); // Initialize particle system

    // [NEW] Check for persisted developer mode unlock
    try {
        if (localStorage.getItem('developerModeUnlocked') === 'true') {
            const developerIconContainer = document.getElementById('developer-icon-container');
            if (developerIconContainer) {
                developerIconContainer.classList.add('visible');
            }
        }
    } catch (e) {
        console.error("Failed to read developerModeUnlocked from localStorage", e);
    }

    // 2. Pre-calculate the theme slider's correct position before it's ever shown.
    initializeThemeSlider();
    
    // 3. Now apply all other settings.
    applyCurrentTheme();
    applyBlinkingEffect();
    applyGlassEffect();
    applyCardSettings();
    applyCurrentBackground();
    applyCurrentView();
    updateSettingsUI();
    applyNewYearMode(); // [NEW] Apply New Year theme on load

    // 3. Initial data fetches and updates.
    updateTime();
    updateGreeting();
    updateCountdown();
    fetchHitokoto();
    setupGitHubChartLoader();
    updateSiteRuntime();
    updateTimeCapsule();
    
    // 4. Defer non-critical layout calculations.
    setTimeout(() => {
        if (window.innerWidth >= 1024) {
            cachedRightColumnHeight = rightColumn.offsetHeight;
        }
    }, 100);

    // --- [NEW] Initialize Card Slider ---
    createCardSlider('#link-slider-container');
    
    setInterval(updateTime, 1000);
    setInterval(updateSiteRuntime, 1000);
    setInterval(updateGreeting, 1800000); 
    setInterval(updateCountdown, 3600000); 
    setInterval(updateTimeCapsule, 60000);

    // [NEW] Auto-refresh weather data every 30 minutes
    setInterval(() => {
        if (appSettings.view === 'weather') {
            fetchAndDisplayWeather();
        }
    }, 30 * 60 * 1000);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (appSettings.theme === 'system') {
            applyCurrentTheme();
        }
    });
});
