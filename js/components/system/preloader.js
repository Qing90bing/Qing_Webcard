/**
 * @file preloader.js
 * @description
 * 负责管理页面加载时的预加载（splash）屏幕。
 *
 * @module components/system/preloader
 */

/**
 * 初始化预加载器。
 * 设置一个超时计时器，并返回一个函数，该函数在主应用加载完成后被调用。
 *
 * @returns {Object} 包含一个 `loadComplete` 函数的对象。
 */
export function initializePreloader() {
    const preloader = document.getElementById('preloader');
    const mainWrapper = document.getElementById('main-wrapper');
    const startTime = Date.now();
    const minDisplayTime = 2000; // 最短显示时间（毫秒）
    let loadFinished = false;

    if (!preloader || !mainWrapper) {
        console.error('Preloader or main wrapper not found.');
        return { loadComplete: () => {} };
    }

    mainWrapper.classList.add('preloader-active');

    const hidePreloader = () => {
        if (loadFinished) {
            return;
        }
        loadFinished = true;
        preloader.classList.add('preloader-hidden');
        mainWrapper.classList.remove('preloader-active');
        setTimeout(() => {
            preloader.remove();
        }, 500);
    };

    const timeoutId = setTimeout(hidePreloader, 12000);

    const loadComplete = () => {
        clearTimeout(timeoutId);
        const elapsedTime = Date.now() - startTime;
        const remainingTime = minDisplayTime - elapsedTime;

        if (remainingTime > 0) {
            setTimeout(hidePreloader, remainingTime);
        } else {
            hidePreloader();
        }
    };

    return { loadComplete };
}
