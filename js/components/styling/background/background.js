import { appSettings, saveSettings } from '../../../core/settings.js';
import { isNewYearPeriod } from '../../ui/holiday/calendar.js';

// This will be initialized from main.js
let backgroundFader;

// Module-level variables
let currentBgUrl = ''; // Holds the resolved URL of the current background
let currentImageBlob = null; // Holds the raw image data for original-quality download
let currentImageExtension = 'jpg'; // Holds the file extension for the blob
let latestBgRequestId = 0;
let latestPreviewRequestId = 0;

export const DEFAULT_BG_IMAGES = [
    'https://s21.ax1x.com/2025/08/10/pVdEmM6.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEnsK.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEuqO.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEQde.jpg',
    'https://s21.ax1x.com/2025/08/10/pVdEMZD.jpg'
];

/**
 * Initializes the background module with a fader instance.
 * @param {object} fader - The cross-fader instance created in main.js.
 */
export function initBackground(fader) {
    backgroundFader = fader;
}

// --- Download Image Helper ---
export function downloadImage() {
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

export async function applyCurrentBackground() {
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

export function updateBgSettingsUI() {
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

export function initializeBackgroundSettings() {
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

            applyCurrentBackground();
            saveSettings();
        });
    });

    const thumbItems = defaultOptionsContainer.querySelectorAll('.thumb-item');
    thumbItems.forEach(thumb => {
        thumb.addEventListener('click', () => {
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

    // --- Preview Buttons Listeners ---
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
                applyCurrentBackground();
            }, 300);
        });
    }

    // --- Custom Background Input Listeners ---
    const customBgInput = document.getElementById('custom-bg-input');
    const saveCustomBgBtn = document.getElementById('save-custom-bg-btn');
    const clearCustomBgBtn = document.getElementById('clear-custom-bg-btn');

    const saveCustomBg = () => {
        if (saveCustomBgBtn.disabled) return;

        const url = customBgInput.value.trim();
        const originalPlaceholder = "输入图片或API链接";
        
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
        
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
        appSettings.background.customType = isImage ? 'image' : 'api';

        saveSettings();
        applyCurrentBackground();

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

export function createCrossfader(layers) {
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
