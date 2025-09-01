// --- [NEW] Settings Management ---
let appSettings = {
    background: {
        source: 'default',
        specifier: 'random',
        customUrl: null,
        customType: 'unknown' // 'image', 'api', or 'unknown'
    },
    appearance: {
        glassEffect: true,
        cardBorderRadius: 16,
        cardBlurAmount: 16
    },
    theme: 'system', // 'system', 'light', 'dark'
    timeFormat: '24h', // '12h' or '24h'
    immersiveBlinkingColon: false,
    view: 'github', // 'github' or 'weather'
    weather: {
        source: 'auto', // 'auto' or 'manual'
        city: null, // User-overridden city
        lastFetchedCity: null // City from last successful fetch
    },
    hitokoto: {
        mode: 'default', // 'default' or 'custom'
        categories: ['a'] // Array of selected category codes
    },
    developer: {
        masterSwitchEnabled: true, // Master switch for the entire feature
        uiToggleState: true,       // State of the toggle in the UI
        forceNewYearTheme: false // [NEW] Developer toggle for New Year theme
    },
    newYearTheme: {
        backgroundEnabled: true
    }
};

// --- [NEW] New Year Theme Logic ---
function isNewYearPeriod() {
    const today = new Date();
    const lunarDate = new Dianaday(today);

    // Case 1: It's the first lunar month, from day 1 to day 10.
    if (lunarDate.month === 1 && lunarDate.day >= 1 && lunarDate.day <= 10) {
        return true;
    }

    // Case 2: It's the last day of the 12th lunar month (New Year's Eve).
    if (lunarDate.month === 12) {
        const daysInLastMonth = monthDays(lunarDate.year, 12);
        if (lunarDate.day === daysInLastMonth) {
            return true;
        }
    }

    return false;
}

let newYearMusicIntroPlayed = false;
const NY_MUSIC_LOOP_START = 85.16; // 01:25:16
const NY_MUSIC_LOOP_END = 173.20;   // 02:53:20

function stopNewYearMusic() {
    const audio = document.getElementById('new-year-audio');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}


function applyNewYearMode() {
    const body = document.body;
    const musicBtn = document.getElementById('new-year-music-btn');

    const isThemeAvailable = isNewYearPeriod() || appSettings.developer.forceNewYearTheme;
    const isThemeEnabledByUser = appSettings.newYearTheme.backgroundEnabled;
    const shouldBeActive = isThemeAvailable && isThemeEnabledByUser;

    const isCurrentlyActive = body.classList.contains('new-year-active');

    const bgSettingsWrapper = document.getElementById('main-background-settings-wrapper');
    if (bgSettingsWrapper) {
        bgSettingsWrapper.classList.toggle('disabled', shouldBeActive);
    }

    if (shouldBeActive) {
        // --- Activate or Keep Active ---
        musicBtn.classList.add('visible'); // [MODIFIED] Use 'visible' class for transition
        musicBtn.classList.add('is-paused'); // Set initial state
        if (!isCurrentlyActive) {
            // It needs to be turned ON
            body.classList.add('new-year-active');
            backgroundFader.update('assets/images/new_year_bg.svg', true);
            // Music is not auto-played, user must click.
        }
        // If it's already active, do nothing to prevent re-renders.
    } else {
        // --- Deactivate or Keep Inactive ---
        musicBtn.classList.remove('visible'); // [MODIFIED] Use 'visible' class for transition
        stopNewYearMusic();
        if (isCurrentlyActive) {
            // It needs to be turned OFF
            body.classList.remove('new-year-active');
            applyCurrentBackground();
        }
        // If it's already inactive, do nothing.
    }
}

function saveSettings() {
    localStorage.setItem('qing-homepage-settings', JSON.stringify(appSettings));
}

function loadSettings() {
    const savedSettings = localStorage.getItem('qing-homepage-settings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            // Merge saved settings with defaults to ensure compatibility with future updates
            appSettings = {
                ...appSettings,
                ...parsedSettings,
                background: { ...appSettings.background, ...(parsedSettings.background || {}) },
                weather: { ...appSettings.weather, ...(parsedSettings.weather || {}) },
                developer: { ...appSettings.developer, ...(parsedSettings.developer || {}) },
                newYearTheme: { ...appSettings.newYearTheme, ...(parsedSettings.newYearTheme || {}) },
                appearance: { ...appSettings.appearance, ...(parsedSettings.appearance || {}) }
            };

            // Backward compatibility: If old setting `view: 'weather'` exists, but new `weather.source` doesn't, default it.
            if (appSettings.view === 'weather' && !appSettings.weather.source) {
                appSettings.weather.source = 'auto';
            }
        } catch (e) {
            console.error("Failed to parse settings from localStorage", e);
            // If parsing fails, use default settings
        }
    }
}

let currentBgUrl = ''; // Holds the resolved URL of the current background
let currentImageBlob = null; // Holds the raw image data for original-quality download
let currentImageExtension = 'jpg'; // Holds the file extension for the blob

// --- [NEW] Download Image Helper ---
function downloadImage() {
    const downloadBtn = document.getElementById('bg-preview-download-btn');
    if (!downloadBtn) return;

    const originalIcon = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const restoreIcon = () => {
        downloadBtn.innerHTML = originalIcon;
    };

    // Prioritize downloading the original blob if it exists
    if (currentImageBlob) {
        try {
            const objectUrl = URL.createObjectURL(currentImageBlob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = `background-${Date.now()}.${currentImageExtension}`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(objectUrl);
            setTimeout(restoreIcon, 100);
        } catch (error) {
            console.error('Blob download failed:', error);
            if (currentBgUrl) window.open(currentBgUrl, '_blank');
            restoreIcon();
        }
    } else {
        // Fallback to canvas method for static images or if blob capture failed
        console.warn("No image blob available, falling back to canvas download.");
        try {
            const img = document.getElementById('bg-preview-img');
            if (!img || !img.src || !img.complete || img.naturalWidth === 0) {
                throw new Error('Preview image is not available or ready for canvas download.');
            }
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) throw new Error('Canvas toBlob returned null.');
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = `background-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(objectUrl);
                restoreIcon();
            }, 'image/png');
        } catch (error) {
            console.error('Canvas download fallback failed:', error);
            if (currentBgUrl) window.open(currentBgUrl, '_blank');
            restoreIcon();
        }
    }
}

const showPreviewError = () => {
    const errorContainer = document.getElementById('bg-preview-error');
    const loader = document.getElementById('preview-loader');
    const previewImg = document.getElementById('bg-preview-img');

    if (!errorContainer || !loader || !previewImg) return;

    loader.classList.remove('visible');
    previewImg.classList.remove('breathing-effect');

    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('visible');
    }, 10);
};

const hidePreviewError = () => {
    const errorContainer = document.getElementById('bg-preview-error');
    if (!errorContainer) return;

    errorContainer.classList.remove('visible');
    setTimeout(() => {
        if (!errorContainer.classList.contains('visible')) {
            errorContainer.classList.add('hidden');
        }
    }, 300);
};

const showPreview = (displayUrl, originalUrl) => {
    const requestId = ++latestPreviewRequestId;
    const previewImg = document.getElementById('bg-preview-img');
    const loader = document.getElementById('preview-loader');
    const downloadBtn = document.getElementById('bg-preview-download-btn');
    const refreshBtn = document.getElementById('bg-preview-refresh-btn');

    if (!previewImg || !loader) return;

    previewImg.classList.remove('breathing-effect');
    loader.classList.remove('visible');

    downloadBtn.classList.add('visible');
    refreshBtn.classList.add('visible');

    currentBgUrl = originalUrl;

    const preloader = new Image();
    preloader.src = displayUrl;

    preloader.onload = () => {
        if (requestId !== latestPreviewRequestId) return;

        previewImg.classList.remove('hidden');
        previewImg.style.transition = 'opacity 0.2s ease-in-out';
        previewImg.style.opacity = 0;

        setTimeout(() => {
            previewImg.src = preloader.src;
            previewImg.style.opacity = 1;
        }, 200);
    };

    preloader.onerror = () => {
        if (requestId !== latestPreviewRequestId) return;
        console.error(`Preview image failed to load: ${displayUrl}`);
        showPreviewError();
    };
};

async function applyCurrentBackground() {
    // [FIX] Add a guard clause to prevent overriding the active New Year theme.
    // This check is now based on settings state, not DOM state, to avoid race conditions on page load.
    const isThemeAvailable = isNewYearPeriod() || (appSettings.developer && appSettings.developer.forceNewYearTheme);
    const isThemeEnabledByUser = appSettings.newYearTheme && appSettings.newYearTheme.backgroundEnabled;
    if (isThemeAvailable && isThemeEnabledByUser) {
        return; // Do nothing if the New Year background should be showing.
    }

    const requestId = ++latestBgRequestId;
    const { source, specifier } = appSettings.background;

    hidePreviewError();

    const stopSpinner = () => {
        const refreshBtn = document.getElementById('bg-preview-refresh-btn');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            if (icon) icon.classList.remove('fa-spin');
        }
    };

    const hideStaticPreviewElements = () => {
        const container = document.getElementById('background-preview-container');
        if (container) container.classList.remove('visible');
    };

    const handleError = (error, source) => {
        if (requestId !== latestBgRequestId) return;
        console.error(`Error fetching background from source: ${source}`, error);
        stopSpinner();
        showPreviewError();
    };

    try {
        const { source, specifier, customUrl, customType } = appSettings.background;
        const isDynamicSource = ['bing', 'anime', 'random'].includes(source);
        const shouldShowPreview = isDynamicSource || source === 'custom';

        if (shouldShowPreview) {
            const container = document.getElementById('background-preview-container');
            const previewImg = document.getElementById('bg-preview-img');
            const loader = document.getElementById('preview-loader');
            const refreshBtn = document.getElementById('bg-preview-refresh-btn');

            if (container) container.classList.add('visible');

            if (previewImg && loader) {
                previewImg.classList.add('breathing-effect');
                loader.classList.add('visible');
            }

            // Logic for refresh button visibility
            const showRefresh = isDynamicSource || (source === 'custom' && customType === 'api');
            if (refreshBtn) {
                // Use a class to control visibility for animation purposes
                refreshBtn.classList.toggle('visible', showRefresh);
            }
        } else {
            hideStaticPreviewElements();
        }

        let finalUrl;
        let displayUrl;

        if (source === 'custom') {
            if (!customUrl) {
                stopSpinner();
                const errContainer = document.getElementById('bg-preview-error');
                if (errContainer) {
                   const firstP = errContainer.querySelector('p:first-child');
                   const secondP = errContainer.querySelector('p:last-child');
                   if (firstP) firstP.textContent = '未提供链接';
                   if (secondP) secondP.textContent = '请在上方输入自定义链接并保存';
                }
                showPreviewError();
                return;
            }

            if (customType === 'image') {
                finalUrl = customUrl;
                displayUrl = finalUrl;
                currentImageBlob = null;
            } else { // API - Now with robust content-type checking
                const apiResponse = await fetch(`https://cors.eu.org/${customUrl.split('?')[0]}?v=${new Date().getTime()}`);
                if (!apiResponse.ok) throw new Error(`Custom API fetch failed with status: ${apiResponse.status}`);

                const contentType = apiResponse.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    const data = await apiResponse.json();
                    let imageUrl;
                    const target = Array.isArray(data) ? data[Math.floor(Math.random() * data.length)] : data;

                    if (typeof target === 'object' && target !== null) {
                        imageUrl = target.url || target.image || target.img_url;
                    }

                    if (!imageUrl) throw new Error('Could not find a valid image URL in JSON API response.');

                    finalUrl = imageUrl;
                    const imageResponse = await fetch(`https://cors.eu.org/${finalUrl}`);
                    if (!imageResponse.ok) throw new Error(`Failed to fetch image from API's URL: ${finalUrl}`);

                    const imageBlob = await imageResponse.blob();
                    currentImageBlob = imageBlob;
                    const imageContentType = imageResponse.headers.get('content-type');
                    const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/bmp': 'bmp', 'image/webp': 'webp' };
                    currentImageExtension = mimeToExt[imageContentType] || 'jpg';
                    displayUrl = URL.createObjectURL(imageBlob);

                } else if (contentType && contentType.startsWith('image/')) {
                    // This is a direct image API
                    finalUrl = customUrl;
                    const imageBlob = await apiResponse.blob();
                    currentImageBlob = imageBlob;
                    const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/bmp': 'bmp', 'image/webp': 'webp' };
                    currentImageExtension = mimeToExt[contentType] || 'jpg';
                    displayUrl = URL.createObjectURL(imageBlob);
                } else {
                    throw new Error(`Unsupported API response content-type: ${contentType}`);
                }
            }
        } else if (source === 'default') {
            finalUrl = (specifier && specifier !== 'random' && DEFAULT_BG_IMAGES.includes(specifier))
                ? specifier
                : DEFAULT_BG_IMAGES[Math.floor(Math.random() * DEFAULT_BG_IMAGES.length)];
            displayUrl = finalUrl;
            currentImageBlob = null;
        } else { // bing, anime, random
            if (source === 'bing') {
                const bingApiResponse = await fetch('https://cors.eu.org/https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN');
                if (!bingApiResponse.ok) throw new Error('Bing API request failed');
                const bingData = await bingApiResponse.json();
                finalUrl = `https://www.bing.com${bingData.images[0].urlbase}_1920x1080.jpg`;
            } else {
                const apiUrl = source === 'anime'
                    ? 'https://api.sretna.cn/api/anime.php'
                    : 'https://imgapi.cn/api.php?zd=zsy&fl=fengjing&gs=images';
                finalUrl = `${apiUrl}?v=${new Date().getTime()}`;
            }

            const imageResponse = await fetch(`https://cors.eu.org/${finalUrl}`);
            if (!imageResponse.ok) throw new Error(`Failed to fetch image from proxy: ${finalUrl}`);

            const imageBlob = await imageResponse.blob();
            currentImageBlob = imageBlob;
            const contentType = imageResponse.headers.get('content-type');
            const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/bmp': 'bmp', 'image/webp': 'webp' };
            currentImageExtension = mimeToExt[contentType] || 'jpg';

            displayUrl = URL.createObjectURL(imageBlob);
        }

        if (requestId !== latestBgRequestId) {
            if (displayUrl && displayUrl.startsWith('blob:')) URL.revokeObjectURL(displayUrl);
            return;
        }

        await backgroundFader.update(displayUrl, true);
        if (shouldShowPreview) {
            showPreview(displayUrl, finalUrl);
        }

        stopSpinner();

    } catch (error) {
        handleError(error, source);
    }
}

function updateBgSettingsUI() {
    const { source, specifier } = appSettings.background;

    // Update radio buttons
    const radio = document.querySelector(`input[name="background-source"][value="${source}"]`);
    if (radio) {
        radio.checked = true;
    }

    // Update thumbnail selection
    const defaultOptionsContainer = document.getElementById('default-bg-options');
    const allThumbs = defaultOptionsContainer.querySelectorAll('.thumb-item');
    allThumbs.forEach(thumb => thumb.classList.remove('active'));

    const activeThumb = defaultOptionsContainer.querySelector(`.thumb-item[data-bg-url="${specifier}"]`);
    if (activeThumb) {
        activeThumb.classList.add('active');
    }

    // Show/hide thumbnail section
    if (source === 'default') {
        defaultOptionsContainer.classList.add('open');
    } else {
        defaultOptionsContainer.classList.remove('open');
    }

    // --- [NEW] Update Custom URL Input ---
    const customBgInputWrapper = document.getElementById('custom-bg-input-wrapper');
    const customBgInput = document.getElementById('custom-bg-input');
    if (customBgInputWrapper && customBgInput) {
        if (source === 'custom') {
            customBgInputWrapper.style.maxHeight = '80px';
            customBgInputWrapper.classList.add('mt-2');
            customBgInput.value = appSettings.background.customUrl || '';
        } else {
            customBgInputWrapper.style.maxHeight = '0';
            customBgInputWrapper.classList.remove('mt-2');
        }
    }

    // Preview container should be visible for all dynamic sources, including custom
    const previewContainer = document.getElementById('background-preview-container');
    if (['bing', 'anime', 'random', 'custom'].includes(source)) {
        previewContainer.classList.add('visible');
    } else {
        previewContainer.classList.remove('visible');
    }
}

function updateThemeSettingsUI(isInstant = false) {
    const slider = document.querySelector('.theme-slider');
    const parent = slider ? slider.parentElement : null;
    const currentTheme = appSettings.theme;
    const activeButton = document.querySelector(`.setting-btn[data-theme='${currentTheme}']`);

    if (!slider || !parent || !activeButton) {
        return; // Exit if any required element is missing
    }

    if (isInstant) {
        slider.style.transition = 'none';
    }

    // Update active classes on all buttons
    document.querySelectorAll('.setting-btn-group .setting-btn').forEach(btn => {
        btn.classList.toggle('active', btn === activeButton);
    });

    // Use getBoundingClientRect for precise positioning
    const parentRect = parent.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    const left = buttonRect.left - parentRect.left;
    const width = buttonRect.width;

    slider.style.width = `${width}px`;
    slider.style.transform = `translateX(${left}px)`;

    if (isInstant) {
        // Force reflow to apply styles synchronously before re-enabling the transition
        void slider.offsetHeight;
        slider.style.transition = '';
    }
}

function initializeThemeSlider() {
    const settingsWindow = document.getElementById('settings-window');
    if (!settingsWindow) return;

    // 1. Temporarily make the modal measurable but invisible to the user
    const originalTransition = settingsWindow.style.transition;
    settingsWindow.style.transition = 'none';
    settingsWindow.style.visibility = 'hidden';
    settingsWindow.style.display = 'flex'; // Ensure it's not display:none

    // 2. Force it to its final "open" state to get correct dimensions
    document.body.classList.add('settings-open');

    // 3. Now, take the measurement and set the slider's state instantly
    updateThemeSettingsUI(true);

    // 4. Immediately revert all changes so the user sees nothing.
    // This happens synchronously before the browser can paint.
    document.body.classList.remove('settings-open');
    settingsWindow.style.display = ''; // Revert to default
    settingsWindow.style.visibility = ''; // Revert to default
    settingsWindow.style.transition = originalTransition;
}

// --- [NEW] Settings Panel UI Generation ---
function setupSettingsUI() {
    // --- 1. Background Settings ---
    const bgSettingsContainer = document.getElementById('background-settings-content');
    if (bgSettingsContainer) {
        const bgOptions = [
            { value: 'default', label: '默认图片', description: '随机选择一张内置图片作为背景' },
            { value: 'bing', label: '每日一Bing', description: '展示 Bing 搜索的每日壁纸' },
            { value: 'anime', label: '随机动漫', description: '从公共动漫图库随机加载一张高清壁纸' },
            { value: 'random', label: '随机图片', description: '从公共图库中随机加载一张风景图' },
            { value: 'custom', label: '自定义来源', description: '使用单个图片链接或公共图库API' } // 测试使用 https://www.loliapi.com/acg/
        ];

        const newYearToggleHTML = `
            <div id="new-year-bg-toggle-section" class="hidden">
                <div class="flex justify-between items-center p-2">
                    <div>
                        <span class="font-medium">启用新年节日背景</span>
                        <div class="setting-description">关闭后将恢复您选择的常规背景</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="new-year-bg-toggle">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="border-t border-[var(--separator-color)] my-4"></div>
            </div>
        `;

        let mainBgSettingsHTML = `<div id="main-background-settings-wrapper" class="relative">`;
        mainBgSettingsHTML += `<div id="main-background-settings-content">`;

        let radioOptionsHTML = '';
        bgOptions.forEach(option => {
            radioOptionsHTML += `
                <div>
                    <input type="radio" id="bg-radio-${option.value}" name="background-source" value="${option.value}" class="setting-radio-input">
                    <label for="bg-radio-${option.value}" class="setting-radio-label">
                        <span class="custom-radio-button"></span>
                        <div>
                            <span>${option.label}</span>
                            <div class="setting-description">${option.description}</div>
                        </div>
                    </label>
                </div>
            `;
        });

        const customBgInputHTML = `
            <div id="custom-bg-input-wrapper" class="pl-2 pr-2" style="max-height: 0; overflow: hidden; transition: all 0.3s ease-in-out;">
                <div class="relative flex items-center">
                    <input type="text" id="custom-bg-input" placeholder="输入图片或API链接" class="w-full rounded-md border px-3 py-1.5 text-sm" style="background-color: var(--progress-bar-bg); color: var(--text-color-primary); border-color: var(--separator-color); padding-right: 5.5rem;">
                    <div class="absolute right-1 flex items-center justify-end h-full w-14">
                        <div id="custom-bg-btn-group" class="flex items-center space-x-1">
                            <button id="clear-custom-bg-btn" data-tooltip="清空" class="tooltip-container p-1 rounded-full text-gray-400 hover:text-white transition-all relative w-8 h-8">
                                <i class="fas fa-times w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"></i>
                            </button>
                            <button id="save-custom-bg-btn" data-tooltip="保存" class="tooltip-container p-1 rounded-full text-gray-400 hover:text-white transition-all relative w-8 h-8">
                                <i class="fas fa-save w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 opacity-100 flex items-center justify-center"></i>
                                <i class="fas fa-check w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 opacity-0 flex items-center justify-center" style="color: var(--status-today);"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div id="custom-bg-input-error" class="text-xs mt-1 pl-1 hidden" style="color: #ef4444;"></div>
            </div>
        `;

        let defaultOptionsHTML = `
            <div id="default-bg-options">
                <div class="thumb-container">
                    <div class="thumb-item" data-bg-url="random">
                        <div class="thumb-overlay">随机</div>
                    </div>
        `;
        DEFAULT_BG_IMAGES.forEach((url, index) => {
            defaultOptionsHTML += `
                <div class="thumb-item" data-bg-url="${url}">
                    <img src="${url}" alt="Default Background ${index + 1}" loading="lazy">
                </div>
            `;
        });
        defaultOptionsHTML += `</div></div>`;

        const previewHTML = `
            <div id="background-preview-container">
                <div id="bg-preview-wrapper" class="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-white/5 transition-all duration-300 ease-in-out">
                    <img id="bg-preview-img" src="${DEFAULT_BG_IMAGES[0]}" alt="背景预览" class="w-full h-full object-cover hidden" crossorigin="anonymous">
                    <div id="preview-loader"></div>
                    <div id="bg-preview-error" class="absolute inset-0 hidden grid place-items-center cursor-pointer rounded-lg transition-all bg-black/30 backdrop-blur-sm text-center">
                        <div>
                            <p class="font-bold text-lg">图片加载失败</p>
                            <p class="mt-1 text-sm">请点击预览画面重试</p>
                        </div>
                    </div>
                    <a id="bg-preview-download-btn" href="#" download="background.jpg" data-tooltip="保存该图片" class="tooltip-container absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all scale-0 duration-300">
                        <i class="fas fa-download"></i>
                    </a>
                    <button id="bg-preview-refresh-btn" data-tooltip="换一张" class="tooltip-container absolute bottom-2 right-12 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all scale-0 duration-300">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
        `;

        mainBgSettingsHTML += radioOptionsHTML + customBgInputHTML + defaultOptionsHTML + previewHTML;
        mainBgSettingsHTML += `</div>`; // closes main-background-settings-content

        mainBgSettingsHTML += `
            <div id="background-settings-overlay" class="absolute inset-0 bg-[var(--card-bg-color)] bg-opacity-80 rounded-lg flex items-center justify-center text-sm font-bold cursor-not-allowed p-4 text-center">
                <i class="fas fa-lock mr-2"></i>
                <span>新年主题已激活，如要使用背景功能请关闭新年主题</span>
            </div>
        `;

        mainBgSettingsHTML += `</div>`; // closes main-background-settings-wrapper

        bgSettingsContainer.innerHTML = newYearToggleHTML + mainBgSettingsHTML;
    }

    // --- 2. Theme Mode Settings ---
    const themeSettingsContainer = document.getElementById('theme-settings-content').parentElement;
    if (themeSettingsContainer) {
        const container = themeSettingsContainer.querySelector('#theme-settings-content');
        container.innerHTML = `
        <div class="setting-description text-center mb-3">选择一个主题，或让它随系统自动更改</div>
            <div class="setting-btn-group w-full relative">
                <div class="theme-slider absolute h-full transition-all duration-300"></div>
                <button class="setting-btn relative z-10" data-theme="system"><i class="fas fa-desktop fa-fw mr-2"></i>跟随系统</button>
                <button class="setting-btn relative z-10" data-theme="light"><i class="fas fa-sun fa-fw mr-2"></i>日间模式</button>
                <button class="setting-btn relative z-10" data-theme="dark"><i class="fas fa-moon fa-fw mr-2"></i>夜间模式</button>
            </div>
        `;
    }

    // --- NEW: Time Format Settings ---
    const timeFormatContainer = document.getElementById('time-format-settings-content');
    if (timeFormatContainer) {
        timeFormatContainer.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between items-center p-2">
                    <div>
                        <span class="font-medium">沉浸模式冒号闪烁</span>
                        <div class="setting-description">仅在全屏时钟下生效</div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="immersive-blink-toggle">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div>
                    <input type="radio" id="time-format-24h" name="time-format" value="24h" class="setting-radio-input">
                    <label for="time-format-24h" class="setting-radio-label">
                        <span class="custom-radio-button"></span>
                        <div>
                            <span>24小时制（ 19:30 ）</span>
                            <div class="setting-description">以 00:00 至 23:59 的格式显示时间</div>
                        </div>
                    </label>
                </div>
                <div>
                    <input type="radio" id="time-format-12h" name="time-format" value="12h" class="setting-radio-input">
                    <label for="time-format-12h" class="setting-radio-label">
                        <span class="custom-radio-button"></span>
                        <div>
                            <span>12小时制（ 7:30 AM / 7:30 PM ）</span>
                            <div class="setting-description">使用 AM/PM 来区分上午和下午，符合部分用户习惯</div>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }

    // --- 3. View Toggle Settings ---
    const viewToggleContainer = document.getElementById('view-toggle-content');
    if (viewToggleContainer) {
        viewToggleContainer.innerHTML = `
            <div class="space-y-2">
                <div>
                    <input type="radio" id="view-radio-github" name="view-source" value="github" class="setting-radio-input">
                    <label for="view-radio-github" class="setting-radio-label">
                        <span class="custom-radio-button"></span>
                        <div>
                            <span>显示 GitHub 贡献图</span>
                            <div class="setting-description">主卡片区域展示您的 GitHub 提交活动图表</div>
                        </div>
                    </label>
                </div>
                <div>
                    <input type="radio" id="view-radio-weather-auto" name="view-source" value="weather-auto" class="setting-radio-input">
                    <label for="view-radio-weather-auto" class="setting-radio-label">
                        <span class="custom-radio-button"></span>
                        <div>
                            <span>天气信息（ IP 自动定位 ）</span>
                            <div class="setting-description">根据您的网络位置自动获取并显示当地的天气情况</div>
                        </div>
                    </label>
                </div>
                <div>
                    <input type="radio" id="view-radio-weather-manual" name="view-source" value="weather-manual" class="setting-radio-input">
                    <label for="view-radio-weather-manual" class="setting-radio-label">
                        <span class="custom-radio-button"></span>
                        <div>
                            <span>天气信息（ 手动输入 ）</span>
                            <div class="setting-description">手动输入城市名称来获取指定地点的天气预报</div>
                        </div>
                    </label>
                </div>
            </div>
            <div id="manual-city-input-wrapper" class="mt-2 pl-2 pr-2" style="max-height: 0; overflow: hidden; transition: all 0.3s ease-in-out;">
                <div class="relative flex items-center">
                    <input type="text" id="weather-city-input" placeholder="输入城市后回车 (例如: 北京)" class="w-full rounded-md border px-3 py-1.5 text-sm" style="background-color: var(--progress-bar-bg); color: var(--text-color-primary); border-color: var(--separator-color);">
                    <button id="save-city-btn" data-tooltip="保存" class="tooltip-container absolute right-1 p-1 rounded-full text-gray-400 hover:text-white">
                        <i class="fas fa-save w-5 h-5 flex items-center justify-center"></i>
                    </button>
                    <div id="confirm-city-icon" class="absolute right-1 p-1 hidden opacity-0" style="color: var(--status-today);">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                </div>
                <div id="city-input-error" class="text-xs mt-1 pl-1 hidden" style="color: #ef4444;"></div>
            </div>
        `;
    }

    // --- 4. Hitokoto Settings ---
    const hitokotoContainer = document.getElementById('hitokoto-settings-content');
    if (hitokotoContainer) {
        const categories = [
            { id: 'a', name: '动画' }, { id: 'b', name: '漫画' }, { id: 'c', name: '游戏' },
            { id: 'd', name: '文学' }, { id: 'e', name: '原创' }, { id: 'f', name: '网络' },
            { id: 'g', name: '其他' }, { id: 'h', name: '影视' }, { id: 'i', name: '诗词' },
            { id: 'j', name: '网易云' }, { id: 'k', name: '哲学' }, { id: 'l', name: '抖机灵' }
        ];

        let checkboxesHTML = categories.map(cat => `
            <div>
                <input type="checkbox" id="hitokoto-cat-${cat.id}" name="hitokoto-category" value="${cat.id}" class="setting-radio-input hitokoto-checkbox-input">
                <label for="hitokoto-cat-${cat.id}" class="hitokoto-checkbox-label">
                    <span class="custom-checkbox">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                    </span>
                    <span>${cat.name}</span>
                </label>
            </div>
        `).join('');

        hitokotoContainer.innerHTML = `
            <div class="space-y-2">
                <div>
                    <input type="radio" id="hitokoto-mode-default" name="hitokoto-mode" value="default" class="setting-radio-input">
                    <label for="hitokoto-mode-default" class="setting-radio-label">
                        <span class="custom-radio-button"></span>
                        <div>
                            <span>默认</span>
                            <div class="setting-description">随机从所有分类中获取句子</div>
                        </div>
                    </label>
                </div>
                <div>
                    <input type="radio" id="hitokoto-mode-custom" name="hitokoto-mode" value="custom" class="setting-radio-input">
                    <label for="hitokoto-mode-custom" class="setting-radio-label">
                        <span class="custom-radio-button"></span>
                        <div>
                            <span>自定义</span>
                            <div class="setting-description">手动选择想要获取的句子分类</div>
                        </div>
                    </label>
                </div>
            </div>
            <div id="hitokoto-custom-options">
                <div class="border-t border-[var(--separator-color)] pt-3">
                    <div class="hitokoto-checkbox-container">
                        ${checkboxesHTML}
                    </div>
                     <div class="mt-4 flex items-center">
                        <div class="flex-shrink-0">
                            <input type="checkbox" id="hitokoto-select-all" class="setting-radio-input hitokoto-checkbox-input">
                            <label for="hitokoto-select-all" class="hitokoto-checkbox-label font-medium">
                                <span class="custom-checkbox">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                </span>
                                <span>全选 / 全不选</span>
                            </label>
                        </div>
                        <div class="flex-grow text-center">
                            <div id="hitokoto-validation-msg" class="inline-flex items-center">
                                <svg class="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                <span>必须保留一个类型</span>
                            </div>
                        </div>
                        <div class="flex-shrink-0">
                            <button id="hitokoto-save-btn" data-tooltip="保存" class="tooltip-container p-2 rounded-full icon-btn transition-all active:scale-95 relative w-9 h-9">
                                <i class="fas fa-save fa-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"></i>
                                <div id="hitokoto-confirm-icon" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300" style="color: var(--status-today);">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function updateTimeFormatUI() {
    const selectedFormat = appSettings.timeFormat;
    const radio = document.querySelector(`input[name="time-format"][value="${selectedFormat}"]`);
    if (radio) {
        radio.checked = true;
    }
}

function updateViewToggleUI() {
    const cityInputWrapper = document.getElementById('manual-city-input-wrapper');
    const cityInput = document.getElementById('weather-city-input');

    let selectedViewValue;
    if (appSettings.view === 'github') {
        selectedViewValue = 'github';
    } else { // view is 'weather'
        selectedViewValue = `weather-${appSettings.weather.source}`;
    }

    const radio = document.querySelector(`input[name="view-source"][value="${selectedViewValue}"]`);
    if (radio) {
        radio.checked = true;
    }

    const isManual = appSettings.view === 'weather' && appSettings.weather.source === 'manual';
    cityInputWrapper.style.maxHeight = isManual ? '60px' : '0';
    cityInputWrapper.style.marginTop = isManual ? '0.75rem' : '0';

    if (isManual) {
        cityInput.placeholder = appSettings.weather.city || '输入城市后回车 (例如: 北京)';
        cityInput.value = appSettings.weather.city || '';
    }
}

function updateHitokotoSettingsUI() {
    const { mode, categories } = appSettings.hitokoto;

    // Update radio buttons
    const radio = document.querySelector(`input[name="hitokoto-mode"][value="${mode}"]`);
    if (radio) {
        radio.checked = true;
    }

    // Show/hide custom options panel
    const customOptionsContainer = document.getElementById('hitokoto-custom-options');
    if (mode === 'custom') {
        customOptionsContainer.classList.add('open');
    } else {
        customOptionsContainer.classList.remove('open');
    }

    // Update checkboxes
    const allCheckboxes = document.querySelectorAll('input[name="hitokoto-category"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = categories.includes(checkbox.value);
    });

    // Update "Select All" checkbox state
    const selectAllCheckbox = document.getElementById('hitokoto-select-all');
    if (selectAllCheckbox) {
        const allCategories = Array.from(allCheckboxes).map(cb => cb.value);
        selectAllCheckbox.checked = categories.length === allCategories.length;
    }
}

function updateImmersiveBlinkUI() {
    const toggle = document.getElementById('immersive-blink-toggle');
    if (toggle) {
        toggle.checked = appSettings.immersiveBlinkingColon;
    }
}

function updateDeveloperSettingsUI() {
    const devToggle = document.getElementById('dev-options-toggle');
    const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');

    if (devToggle) {
        devToggle.checked = appSettings.developer.uiToggleState;
    }
    if (forceNewYearToggle) {
        forceNewYearToggle.checked = appSettings.developer.forceNewYearTheme;
    }
}

function updateSliderProgress(slider) {
    const min = slider.min;
    const max = slider.max;
    const value = slider.value;
    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.backgroundSize = `${percentage}% 100%`;
}

function updateAppearanceSettingsUI() {
    const { glassEffect, cardBorderRadius, cardBlurAmount } = appSettings.appearance;

    const glassEffectToggle = document.getElementById('glass-effect-toggle');
    if (glassEffectToggle) {
        glassEffectToggle.checked = glassEffect;
    }

    const radiusSlider = document.getElementById('card-border-radius-slider');
    const radiusValue = document.getElementById('card-border-radius-value');
    if (radiusSlider && radiusValue) {
        radiusSlider.value = cardBorderRadius;
        radiusValue.textContent = `${cardBorderRadius}px`;
        updateSliderProgress(radiusSlider);
    }

    const blurSlider = document.getElementById('card-blur-amount-slider');
    const blurValue = document.getElementById('card-blur-amount-value');
    if (blurSlider && blurValue) {
        blurSlider.value = cardBlurAmount;
        blurValue.textContent = `${cardBlurAmount}px`;
        updateSliderProgress(blurSlider);
    }
}

function updateSettingsUI() {
    updateBgSettingsUI();
    // updateThemeSettingsUI(); // This is now handled by a dedicated initializer
    updateTimeFormatUI();
    updateViewToggleUI();
    updateHitokotoSettingsUI();
    updateImmersiveBlinkUI();
    updateDeveloperSettingsUI();
    updateAppearanceSettingsUI();

    // Logic for New Year background toggle
    const newYearBgToggleSection = document.getElementById('new-year-bg-toggle-section');
    const newYearBgToggle = document.getElementById('new-year-bg-toggle');
    const shouldThemeBeActive = isNewYearPeriod() || appSettings.developer.forceNewYearTheme;

    if (newYearBgToggleSection && newYearBgToggle) {
        if (shouldThemeBeActive) {
            newYearBgToggleSection.classList.remove('hidden');
            newYearBgToggle.checked = appSettings.newYearTheme.backgroundEnabled;
        } else {
            newYearBgToggleSection.classList.add('hidden');
        }
    }
}

// --- [NEW] View (GitHub/Weather) Management ---
function applyCurrentView() {
    const githubView = document.getElementById('github-view');
    const weatherView = document.getElementById('weather-view');

    if (appSettings.view === 'weather') {
        githubView.classList.add('hidden');
        weatherView.classList.remove('hidden');
        fetchAndDisplayWeather();
    } else {
        weatherView.classList.add('hidden');
        githubView.classList.remove('hidden');
        setupGitHubChartLoader();
    }
}

function applyCurrentTheme() {
    const body = document.body;
    // Clear all theme-* classes before adding the new one
    body.classList.forEach(className => {
        if (className.startsWith('theme-')) {
            body.classList.remove(className);
        }
    });

    let themeToApply;
    if (appSettings.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        themeToApply = prefersDark ? 'theme-dark' : 'theme-light';
    } else {
        themeToApply = `theme-${appSettings.theme}`;
    }
    body.classList.add(themeToApply);
}

function applyBlinkingEffect() {
    document.body.classList.toggle('immersive-blink-enabled', appSettings.immersiveBlinkingColon);
}

function applyGlassEffect() {
    document.body.classList.toggle('glass-effect-disabled', !appSettings.appearance.glassEffect);

    const blurSlider = document.getElementById('card-blur-amount-slider');
    const blurContainer = document.getElementById('blur-setting-container'); // Target the new container
    if (blurSlider && blurContainer) {
        const isGlassEnabled = appSettings.appearance.glassEffect;
        blurSlider.disabled = !isGlassEnabled;
        blurContainer.classList.toggle('disabled', !isGlassEnabled);
    }
}

function applyCardSettings() {
    const { cardBorderRadius, cardBlurAmount } = appSettings.appearance;
    document.documentElement.style.setProperty('--card-border-radius', `${cardBorderRadius}px`);
    document.documentElement.style.setProperty('--card-backdrop-blur', `${cardBlurAmount}px`);
}

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
import { initializeClock } from './clock.js';
import { initializeGreeting } from './greeting.js';
import { initializeHitokoto } from './hitokoto.js';
import { initializeTimeCapsule } from './time-capsule.js';
import { initializeHolidayDisplay } from './holiday-display.js';

let settingsSimpleBar = null; // Instance for the settings scrollbar
let isFetchingWeather = false; // Lock to prevent multiple weather requests
let cachedCommitsHTML = null;
let areCommitsCached = false;
let aboutCardHasAnimated = false;
let clockModule;
let hitokotoModule;
let timeCapsuleModule;

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
            clockModule.updateTime(); // Immediately update the main clock
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
            timeCapsuleModule.updateTimeCapsule();
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
        hitokotoModule.fetchHitokoto();

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
    clockModule = initializeClock(appSettings);
    initializeGreeting();
    hitokotoModule = initializeHitokoto(appSettings);
    timeCapsuleModule = initializeTimeCapsule();
    initializeHolidayDisplay();
    setupGitHubChartLoader();
    updateSiteRuntime();
    
    // 4. Defer non-critical layout calculations.
    setTimeout(() => {
        if (window.innerWidth >= 1024) {
            cachedRightColumnHeight = rightColumn.offsetHeight;
        }
    }, 100);

    // --- [NEW] Initialize Card Slider ---
    createCardSlider('#link-slider-container');
    
    setInterval(updateSiteRuntime, 1000);

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
