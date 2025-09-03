/**
 * @file background.js
 * @description
 * 本文件负责管理应用的所有背景相关功能。主要职责包括：
 * 1.  根据用户设置应用不同的背景来源（默认、自定义图片、自定义API、Bing每日图片等）。
 * 2.  处理背景图片的加载、预览和下载。
 * 3.  管理背景设置面板的UI交互。
 * 4.  提供一个交叉渐变（Cross-fade）的工具函数，以实现背景的平滑过渡。
 *
 * @module components/styling/background
 */

import { appSettings, saveSettings } from '../../../core/settings.js';
import { isNewYearPeriod } from '../../ui/holiday/calendar.js';

// --- 模块级变量 ---

/** @type {object|null} backgroundFader - 在 main.js 中创建并注入的交叉渐变器实例。*/
let backgroundFader;

/** @type {string} currentBgUrl - 当前背景图片的最终解析URL（可能是API的直接链接或Blob URL）。*/
let currentBgUrl = '';
/** @type {Blob|null} currentImageBlob - 当前背景图片的原始Blob数据，用于高质量下载。*/
let currentImageBlob = null;
/** @type {string} currentImageExtension - 当前Blob数据的图片文件扩展名（如 'jpg', 'png'）。*/
let currentImageExtension = 'jpg';
/** @type {number} latestBgRequestId - 用于处理异步请求竞争条件的ID。确保只有最新的请求结果会被应用。*/
let latestBgRequestId = 0;
/** @type {number} latestPreviewRequestId - 用于预览图加载的请求ID，逻辑同上。*/
let latestPreviewRequestId = 0;

/**
 * @description 默认背景图片的URL列表。
 * @const {string[]}
 */
export const DEFAULT_BG_IMAGES = [
    'https://s21.ax1x.com/2025/08/10/pVdEmM6.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEnsK.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEuqO.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEQde.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEMZD.jpg'
];

/**
 * @description 初始化背景模块，并注入一个交叉渐变器实例。
 * @param {object} fader - 在 `main.js` 中创建的交叉渐变器实例。
 */
export function initBackground(fader) {
    backgroundFader = fader;
}

// --- 下载图片辅助函数 ---

/**
 * @description 允许用户下载当前显示的背景图片。
 *
 * 下载策略：
 * 1.  **优先使用Blob数据**：如果 `currentImageBlob` 存在（通常来自API的图片），
 *     则直接将这个原始、高质量的Blob数据创建为对象URL并触发下载。这是最优方案。
 * 2.  **回退到Canvas方法**：如果Blob数据不存在（例如，对于默认的静态图片或Blob获取失败的情况），
 *     则尝试将预览图像绘制到Canvas上，然后从Canvas生成Blob进行下载。这是一个备用方案，
 *     但可能受限于CORS策略（如果图片跨域且未正确配置）。
 * 3.  **最终回退**：如果以上两种方法都失败，则在新标签页中打开图片URL，让用户手动保存。
 */
export function downloadImage() {
    const downloadBtn = document.getElementById('bg-preview-download-btn');
    if (!downloadBtn) return;

    const originalIcon = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // 显示加载动画

    const restoreIcon = () => {
        downloadBtn.innerHTML = originalIcon;
    };

    // 优先使用Blob数据下载
    if (currentImageBlob) {
        try {
            const objectUrl = URL.createObjectURL(currentImageBlob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = `background-${Date.now()}.${currentImageExtension}`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(objectUrl); // 释放内存
            setTimeout(restoreIcon, 100);
        } catch (error) {
            console.error('Blob下载失败:', error);
            if (currentBgUrl) window.open(currentBgUrl, '_blank'); // 最终回退
            restoreIcon();
        }
    } else {
        // 回退到Canvas方法
        console.warn("无可用Blob数据，回退到Canvas下载方法。");
        try {
            const img = document.getElementById('bg-preview-img');
            if (!img || !img.src || !img.complete || img.naturalWidth === 0) {
                throw new Error('预览图未就绪，无法使用Canvas下载。');
            }
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) throw new Error('Canvas toBlob返回了null。');
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = `background-${Date.now()}.png`; // Canvas通常输出PNG
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(objectUrl);
                restoreIcon();
            }, 'image/png');
        } catch (error) {
            console.error('Canvas下载失败:', error);
            if (currentBgUrl) window.open(currentBgUrl, '_blank'); // 最终回退
            restoreIcon();
        }
    }
}

/**
 * @description 在预览区域显示错误信息。
 */
const showPreviewError = () => {
    const errorContainer = document.getElementById('bg-preview-error');
    const loader = document.getElementById('preview-loader');
    const previewImg = document.getElementById('bg-preview-img');

    if (!errorContainer || !loader || !previewImg) return;

    // 停止加载动画
    loader.classList.remove('visible');
    previewImg.classList.remove('breathing-effect');

    // 平滑地显示错误信息
    errorContainer.classList.remove('hidden');
    setTimeout(() => {
        errorContainer.classList.add('visible');
    }, 10);
};

/**
 * @description 隐藏预览区域的错误信息。
 */
const hidePreviewError = () => {
    const errorContainer = document.getElementById('bg-preview-error');
    if (!errorContainer) return;

    errorContainer.classList.remove('visible');
    // 等待淡出动画结束后再添加 'hidden' 类
    setTimeout(() => {
        if (!errorContainer.classList.contains('visible')) {
            errorContainer.classList.add('hidden');
        }
    }, 300);
};

/**
 * @description 在预览区域显示指定的背景图片。
 * @param {string} displayUrl - 用于在 `<img>` 标签中显示的URL（可能是Blob URL）。
 * @param {string} originalUrl - 图片的原始URL，用于可能的下载回退。
 */
const showPreview = (displayUrl, originalUrl) => {
    const requestId = ++latestPreviewRequestId;
    const previewImg = document.getElementById('bg-preview-img');
    const loader = document.getElementById('preview-loader');
    const downloadBtn = document.getElementById('bg-preview-download-btn');
    const refreshBtn = document.getElementById('bg-preview-refresh-btn');

    if (!previewImg || !loader) return;

    // 清理加载状态
    previewImg.classList.remove('breathing-effect');
    loader.classList.remove('visible');

    // 确保下载和刷新按钮可见
    downloadBtn.classList.add('visible');
    refreshBtn.classList.add('visible');

    // 更新当前背景图的URL
    currentBgUrl = originalUrl;

    // 使用一个临时的Image对象来预加载图片，以确保在显示前图片已完全加载
    const preloader = new Image();
    preloader.src = displayUrl;

    preloader.onload = () => {
        // 检查请求ID，如果不是最新的请求，则忽略，防止旧图片覆盖新图片
        if (requestId !== latestPreviewRequestId) return;

        previewImg.classList.remove('hidden');
        previewImg.style.transition = 'opacity 0.2s ease-in-out';
        previewImg.style.opacity = 0;

        // 先将图片设置为透明，更新src后再淡入，避免闪烁
        setTimeout(() => {
            previewImg.src = preloader.src;
            previewImg.style.opacity = 1;
        }, 200);
    };

    preloader.onerror = () => {
        if (requestId !== latestPreviewRequestId) return;
        console.error(`预览图加载失败: ${displayUrl}`);
        showPreviewError();
    };
};

/**
 * @description 应用当前设置的背景。这是背景模块最核心的函数。
 * 它会根据 `appSettings` 中配置的来源（source）和说明符（specifier）来获取并应用背景图。
 * 函数内置了完整的错误处理和UI状态管理逻辑。
 */
export async function applyCurrentBackground() {
    // --- 保护逻辑 ---
    // 检查是否处于新年主题期间且用户未禁用新年背景，如果是，则不执行任何操作，以保证新年主题的优先显示。
    const isThemeAvailable = isNewYearPeriod() || (appSettings.developer && appSettings.developer.forceNewYearTheme);
    const isThemeEnabledByUser = appSettings.newYearTheme && appSettings.newYearTheme.backgroundEnabled;
    if (isThemeAvailable && isThemeEnabledByUser) {
        return;
    }

    // --- 异步竞争处理 ---
    const requestId = ++latestBgRequestId;

    hidePreviewError(); // 开始获取前，先隐藏可能存在的旧错误信息

    // --- 辅助函数 ---
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
        if (requestId !== latestBgRequestId) return; // 如果不是最新请求，则忽略错误
        console.error(`从源 [${source}] 获取背景失败:`, error);
        stopSpinner();
        showPreviewError();
    };

    // --- 主逻辑 ---
    try {
        const { source, specifier, customUrl, customType } = appSettings.background;
        const isDynamicSource = ['bing', 'anime', 'random'].includes(source);
        const shouldShowPreview = isDynamicSource || source === 'custom';

        // 控制预览区域的显示逻辑
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

            // 只有动态源（包括API类型的自定义源）才显示刷新按钮
            const showRefresh = isDynamicSource || (source === 'custom' && customType === 'api');
            if (refreshBtn) {
                refreshBtn.classList.toggle('visible', showRefresh);
            }
        } else {
            hideStaticPreviewElements();
        }

        let finalUrl;   // 最终用于下载或直接显示的原始URL
        let displayUrl; // 用于在页面上实际显示的URL (可能是Blob URL)

        // --- 分支逻辑：根据不同的source处理 ---
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
                currentImageBlob = null; // 静态图片没有Blob
            } else { // 处理API类型的自定义源
                const apiResponse = await fetch(`https://cors.eu.org/${customUrl.split('?')[0]}?v=${new Date().getTime()}`);
                if (!apiResponse.ok) throw new Error(`自定义API请求失败，状态码: ${apiResponse.status}`);

                const contentType = apiResponse.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) { // 如果API返回JSON
                    const data = await apiResponse.json();
                    let imageUrl;
                    const target = Array.isArray(data) ? data[Math.floor(Math.random() * data.length)] : data;
                    if (typeof target === 'object' && target !== null) {
                        imageUrl = target.url || target.image || target.img_url; // 尝试多个常用字段
                    }
                    if (!imageUrl) throw new Error('在JSON响应中找不到有效的图片URL。');

                    finalUrl = imageUrl;
                    const imageResponse = await fetch(`https://cors.eu.org/${finalUrl}`);
                    if (!imageResponse.ok) throw new Error(`无法从API提供的URL获取图片: ${finalUrl}`);

                    const imageBlob = await imageResponse.blob();
                    currentImageBlob = imageBlob;
                    const imageContentType = imageResponse.headers.get('content-type');
                    const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/bmp': 'bmp', 'image/webp': 'webp' };
                    currentImageExtension = mimeToExt[imageContentType] || 'jpg';
                    displayUrl = URL.createObjectURL(imageBlob);

                } else if (contentType && contentType.startsWith('image/')) { // 如果API直接返回图片
                    finalUrl = customUrl;
                    const imageBlob = await apiResponse.blob();
                    currentImageBlob = imageBlob;
                    const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/bmp': 'bmp', 'image/webp': 'webp' };
                    currentImageExtension = mimeToExt[contentType] || 'jpg';
                    displayUrl = URL.createObjectURL(imageBlob);
                } else {
                    throw new Error(`不支持的API响应内容类型: ${contentType}`);
                }
            }
        } else if (source === 'default') {
            finalUrl = (specifier && specifier !== 'random' && DEFAULT_BG_IMAGES.includes(specifier))
                ? specifier
                : DEFAULT_BG_IMAGES[Math.floor(Math.random() * DEFAULT_BG_IMAGES.length)];
            displayUrl = finalUrl;
            currentImageBlob = null;
        } else { // 处理 'bing', 'anime', 'random' 等动态API源
            if (source === 'bing') {
                const bingApiResponse = await fetch('https://cors.eu.org/https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN');
                if (!bingApiResponse.ok) throw new Error('Bing API请求失败');
                const bingData = await bingApiResponse.json();
                finalUrl = `https://www.bing.com${bingData.images[0].urlbase}_1920x1080.jpg`;
            } else {
                const apiUrl = source === 'anime'
                    ? 'https://api.sretna.cn/api/anime.php'
                    : 'https://imgapi.cn/api.php?zd=zsy&fl=fengjing&gs=images';
                finalUrl = `${apiUrl}?v=${new Date().getTime()}`;
            }

            const imageResponse = await fetch(`https://cors.eu.org/${finalUrl}`);
            if (!imageResponse.ok) throw new Error(`通过代理获取图片失败: ${finalUrl}`);

            const imageBlob = await imageResponse.blob();
            currentImageBlob = imageBlob;
            const contentType = imageResponse.headers.get('content-type');
            const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/bmp': 'bmp', 'image/webp': 'webp' };
            currentImageExtension = mimeToExt[contentType] || 'jpg';

            displayUrl = URL.createObjectURL(imageBlob);
        }

        // 再次检查请求ID，确保在所有异步操作后，这仍然是最新的请求
        if (requestId !== latestBgRequestId) {
            if (displayUrl && displayUrl.startsWith('blob:')) URL.revokeObjectURL(displayUrl); // 释放不再需要的Blob URL
            return;
        }

        // 使用渐变器更新背景
        await backgroundFader.update(displayUrl, true);

        // 如果需要，显示预览图
        if (shouldShowPreview) {
            showPreview(displayUrl, finalUrl);
        }

        stopSpinner();

    } catch (error) {
        handleError(error, source);
    }
}

/**
 * @description 根据 `appSettings` 的当前状态，更新背景设置面板的UI。
 */
export function updateBgSettingsUI() {
    const { source, specifier } = appSettings.background;

    // 更新单选按钮的选中状态
    const radio = document.querySelector(`input[name="background-source"][value="${source}"]`);
    if (radio) {
        radio.checked = true;
    }

    // 更新默认图片缩略图的选中状态
    const defaultOptionsContainer = document.getElementById('default-bg-options');
    const allThumbs = defaultOptionsContainer.querySelectorAll('.thumb-item');
    allThumbs.forEach(thumb => thumb.classList.remove('active'));

    const activeThumb = defaultOptionsContainer.querySelector(`.thumb-item[data-bg-url="${specifier}"]`);
    if (activeThumb) {
        activeThumb.classList.add('active');
    }

    // 根据当前背景源显示或隐藏缩略图区域
    if (source === 'default') {
        defaultOptionsContainer.classList.add('open');
    } else {
        defaultOptionsContainer.classList.remove('open');
    }

    // 更新自定义URL输入框的显示和内容
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

    // 对于所有动态源（包括自定义），都应显示预览容器
    const previewContainer = document.getElementById('background-preview-container');
    if (['bing', 'anime', 'random', 'custom'].includes(source)) {
        previewContainer.classList.add('visible');
    } else {
        previewContainer.classList.remove('visible');
    }
}

/**
 * @description 初始化背景设置面板的所有事件监听器。
 */
export function initializeBackgroundSettings() {
    // --- 背景源切换监听 ---
    const bgRadioButtons = document.querySelectorAll('input[name="background-source"]');
    const defaultOptionsContainer = document.getElementById('default-bg-options');
    const customBgInputWrapper = document.getElementById('custom-bg-input-wrapper');

    bgRadioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            const source = radio.value;
            appSettings.background.source = source;

            // 控制UI元素的显示/隐藏
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

            applyCurrentBackground();
            saveSettings();
        });
    });

    // --- 默认图片缩略图点击监听 ---
    const thumbItems = defaultOptionsContainer.querySelectorAll('.thumb-item');
    thumbItems.forEach(thumb => {
        thumb.addEventListener('click', () => {
            // 如果当前源不是'default'，点击缩略图会自动切换到'default'源
            if (appSettings.background.source !== 'default') {
                document.getElementById('bg-radio-default').checked = true;
                appSettings.background.source = 'default';
            }
            
            const specifier = thumb.dataset.bgUrl;
            appSettings.background.specifier = specifier;
            
            thumbItems.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            
            applyCurrentBackground();
            saveSettings();
        });
    });

    // --- 预览区域按钮监听 ---
    const refreshBtn = document.getElementById('bg-preview-refresh-btn');
    const downloadBtn = document.getElementById('bg-preview-download-btn');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const icon = refreshBtn.querySelector('i');
            // 防止在加载时重复点击
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

    // 错误信息点击重试
    const previewErrorContainer = document.getElementById('bg-preview-error');
    if (previewErrorContainer) {
        previewErrorContainer.addEventListener('click', () => {
            hidePreviewError();
            setTimeout(() => {
                applyCurrentBackground();
            }, 300);
        });
    }

    // --- 自定义背景输入框监听 ---
    const customBgInput = document.getElementById('custom-bg-input');
    const saveCustomBgBtn = document.getElementById('save-custom-bg-btn');
    const clearCustomBgBtn = document.getElementById('clear-custom-bg-btn');

    const saveCustomBg = () => {
        if (saveCustomBgBtn.disabled) return;

        const url = customBgInput.value.trim();
        const originalPlaceholder = "输入图片或API链接";
        
        // 简单的URL验证
        if (!url || !url.startsWith('http')) {
            customBgInput.classList.add('invalid');
            customBgInput.value = '';
            customBgInput.placeholder = '无效链接，请重新输入';
            
            setTimeout(() => {
                customBgInput.classList.remove('invalid');
                customBgInput.placeholder = originalPlaceholder;
            }, 2500);
            return;
        }

        appSettings.background.customUrl = url;
        appSettings.background.source = 'custom';
        
        // 基于URL扩展名简单判断类型（图片或API）
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
        appSettings.background.customType = isImage ? 'image' : 'api';

        saveSettings();
        applyCurrentBackground();

        // 保存按钮的确认动画
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
}

/**
 * @description 创建一个交叉渐变器实例。这是一个工厂函数。
 * @param {HTMLElement[]} layers - 一个包含两个DOM图层元素的数组，用于实现交叉渐变效果。
 * @returns {{update: function(string, boolean): Promise}} 返回一个包含 `update` 方法的对象。
 */
export function createCrossfader(layers) {
    let activeIndex = 0; // 当前可见的图层的索引

    /**
     * @description 更新背景并触发交叉渐变动画。
     * @param {string} newUrl - 新背景的URL。
     * @param {boolean} [isBackgroundImage=false] - 指示是将URL应用于`background-image`还是`src`属性。
     * @returns {Promise<void>} 当图片加载成功且过渡动画开始时，Promise会resolve。
     */
    const update = (newUrl, isBackgroundImage = false) => {
        return new Promise((resolve, reject) => {
            const nextIndex = (activeIndex + 1) % 2;
            const activeLayer = layers[activeIndex]; // 当前显示的图层
            const nextLayer = layers[nextIndex];   // 即将显示的图层

            if (!nextLayer || !activeLayer) {
                return reject('找不到用于交叉渐变的图层。');
            }

            // 使用Image对象预加载新图片
            const preloader = new Image();
            preloader.src = newUrl;

            preloader.onload = () => {
                // 图片加载成功后，将其应用到隐藏的图层上
                if (isBackgroundImage) {
                    nextLayer.style.backgroundImage = `url('${newUrl}')`;
                } else {
                    nextLayer.src = newUrl;
                }

                // 通过切换CSS的 'active' 类来触发淡入淡出动画
                activeLayer.classList.remove('active');
                nextLayer.classList.add('active');

                // 更新当前活动图层的索引，为下一次更新做准备
                activeIndex = nextIndex;
                resolve(); // 动画已开始，Promise完成
            };

            preloader.onerror = () => {
                console.error(`交叉渐变器加载图片失败: ${newUrl}`);
                reject('图片加载错误');
            };
        });
    };

    return { update };
}
