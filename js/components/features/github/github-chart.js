/**
 * @file github-chart.js
 * @description
 * 本文件负责加载并显示用户的GitHub贡献图。
 * 它通过动态加载图片，并优雅地处理加载中、加载成功和加载失败三种状态，
 * 提供了流畅的用户体验。
 *
 * @module components/features/github/github-chart
 */

/**
 * @description 初始化GitHub贡献图的加载器。
 * 此函数应在页面加载后调用，以启动整个加载流程。
 */
export function setupGitHubChartLoader() {
    // --- DOM 元素获取 ---
    const spinner = document.getElementById('gh-chart-spinner');
    const errorContainer = document.getElementById('gh-chart-error');
    const errorMessage = document.getElementById('gh-chart-error-message');
    const imgLink = document.getElementById('gh-chart-link');
    const img = document.getElementById('gh-chart-img');
    const loadingContainer = document.getElementById('gh-chart-loading');
    const chartWrapper = document.getElementById('gh-chart-wrapper');

    /**
     * @description 启动或重新启动图片加载流程。
     * 这是一个核心函数，负责重置UI状态、显示加载动画并设置图片的`src`属性来触发加载。
     */
    const loadImage = () => {
        // --- 状态重置 ---
        // 为重新加载做准备，移除之前的状态类
        img.classList.remove('loaded');
        imgLink.classList.add('invisible');
        errorContainer.classList.remove('visible');

        // --- 显示加载中UI ---
        chartWrapper.classList.add('hidden'); // 隐藏图表容器
        loadingContainer.classList.remove('hidden'); // 显示加载动画容器
        spinner.classList.add('visible'); // 显示旋转动画

        // --- 设置图片源 ---
        const originalSrc = img.dataset.src; // 从data属性获取基础URL
        const baseUrl = originalSrc.split('?')[0];
        // 重构URL，安全地添加必要的参数（如主题）和用于防止缓存的时间戳
        img.src = `${baseUrl}?theme=dark&v=${new Date().getTime()}`;
    };

    /**
     * @description 图片成功加载时的回调函数。
     * 负责隐藏加载动画，并以平滑的动画效果显示图片。
     */
    img.onload = () => {
        // --- 隐藏加载中UI ---
        spinner.classList.remove('visible');
        loadingContainer.classList.add('hidden');
        
        // 显示图表容器，为内部元素的动画做准备
        chartWrapper.classList.remove('hidden');
        
        // 使用 requestAnimationFrame 来确保动画触发的可靠性。
        // 这会将动画的启动推迟到下一个浏览器绘制周期，避免因浏览器优化而跳过动画。
        requestAnimationFrame(() => {
            imgLink.classList.remove('invisible');
            imgLink.classList.add('visible'); // 触发图片容器的淡入
            img.classList.add('loaded'); // 触发图片本身的淡入
        });
    };

    /**
     * @description 图片加载失败时的回调函数。
     * 负责隐藏加载动画，并显示一个用户友好的错误信息。
     */
    img.onerror = () => {
        // --- 隐藏加载中UI ---
        spinner.classList.remove('visible');
        loadingContainer.classList.add('hidden');

        // 显示图表容器，以便在其中展示错误信息
        chartWrapper.classList.remove('hidden');

        // 显示错误信息容器
        errorContainer.classList.add('visible');
        errorMessage.textContent = '贡献图加载失败，请检查网络并重试。';
    };

    // 为错误信息容器添加点击事件，允许用户点击以重试加载
    errorContainer.addEventListener('click', () => {
        loadImage();
    });

    // --- 初始加载 ---
    // 页面设置好后，立即开始第一次加载
    loadImage();
}
