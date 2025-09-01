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

// --- [NEW] Immersive Time View Logic ---
let immersiveTimeInterval = null;

function updateImmersiveTime() {
    // We need to call the original updateTime to get the most up-to-date values,
    // then copy them over. This avoids code duplication.
    updateTime();
    
    const timeDisplay = document.getElementById('time-display').innerHTML;
    const dateDisplay = document.getElementById('date-display').textContent;
    const greeting = document.getElementById('greeting').textContent;
    
    // For 12h format, the time is in a span, so innerHTML is needed.
    document.getElementById('immersive-time-display').innerHTML = timeDisplay;
    document.getElementById('immersive-date-display').textContent = dateDisplay;
    document.getElementById('immersive-greeting').textContent = greeting;
}
