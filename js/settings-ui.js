import { DEFAULT_BG_IMAGES } from './background.js';

export function setupSettingsUI() {
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
