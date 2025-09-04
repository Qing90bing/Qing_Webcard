/**
 * @file theme-flash-fix.js
 * @description
 * 这是一个用于防止主题闪烁（FOUC - Flash of Unstyled Content）的脚本。
 * 它必须在 <head> 的最顶部被同步加载，以确保在浏览器渲染任何内容之前执行。
 *
 * 工作原理：
 * 1. 立即执行一个函数，避免污染全局作用域。
 * 2. 尝试从 localStorage 读取已保存的设置。
 * 3. 根据设置（'dark', 'light', 或 'system'）来决定是否需要应用 'theme-dark' 类。
 * 4. 如果设置为 'system'，则会检查用户的操作系统/浏览器偏好。
 * 5. 将 'theme-dark' 类直接应用到 <html> 元素上，而不是 <body>，因为 <html> 元素更早可用。
 */
(function() {
    try {
        const settingsString = localStorage.getItem('qing-homepage-settings');
        if (settingsString) {
            const settings = JSON.parse(settingsString);
            const theme = settings.theme;

            if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('theme-dark');
            }
        } else {
            // 如果没有设置，也根据系统偏好来决定
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('theme-dark');
            }
        }
    } catch (e) {
        // 如果 localStorage 操作失败，则静默处理，避免阻塞页面渲染。
        console.error('Failed to apply initial theme:', e);
    }
})();
