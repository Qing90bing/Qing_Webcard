/**
 * @file settings.js
 * @description
 * 本文件负责管理应用的全部设置。
 * 它定义了默认的设置结构 `appSettings`，并提供了从 localStorage 保存和加载设置的功能。
 * 这个模块是整个应用配置中心，所有需要持久化的用户偏好都应在此定义。
 *
 * @module core/settings
 */

/**
 * @description
 * `appSettings` 是一个导出的、可变的（let）对象，包含了应用的所有默认设置。
 * 应用的其他部分通过导入此对象来访问当前的设置值。
 * 它的所有属性都有一个默认值，确保在没有保存任何设置的情况下，应用也能正常运行。
 */
export let appSettings = {
    // 背景设置
    background: {
        source: 'default',      // 背景来源: 'default' (默认), 'custom' (自定义)
        specifier: 'random',    // 具体的背景指定: 'random' (随机), 或特定的标识符
        customUrl: null,        // 自定义背景的URL
        customType: 'unknown'   // 自定义背景类型: 'image' (图片), 'api' (接口), 'unknown' (未知)
    },
    // 外观设置
    appearance: {
        glassEffect: true,      // 是否启用毛玻璃效果
        cardBorderRadius: 16,   // 卡片圆角半径 (单位: px)
        cardBlurAmount: 24      // 卡片背景模糊程度 (单位: px)
    },
    // 主题设置
    theme: 'system',            // 主题: 'system' (跟随系统), 'light' (浅色), 'dark' (深色)
    // 时间格式设置
    timeFormat: '24h',          // 时间格式: '12h' (12小时制), '24h' (24小时制)
    // 沉浸模式下冒号是否闪烁
    immersiveBlinkingColon: false,
    // 当前主视图
    view: 'github',             // 主视图: 'github' (GitHub提交图), 'weather' (天气)
    // 天气设置
    weather: {
        source: 'auto',         // 天气信息来源: 'auto' (自动定位), 'manual' (手动输入)
        city: null,             // 用户手动指定的城市
        lastFetchedCity: null   // 上次成功获取天气信息时所在的城市
    },
    // 一言（Hitokoto）设置
    hitokoto: {
        mode: 'default',        // 模式: 'default' (默认), 'custom' (自定义)
        categories: ['a']       // 选中的一言分类代码数组
    },
    // 开发者模式设置
    developer: {
        masterSwitchEnabled: true, // 总开关，控制整个开发者功能是否启用
        uiToggleState: true,       // UI上的切换开关状态
        forceNewYearTheme: false   // 强制启用新年主题（用于调试）
    },
    // 新年主题设置
    newYearTheme: {
        backgroundEnabled: true // 是否启用新年主题的特殊背景
    }
};

/**
 * @description 将当前的 `appSettings` 对象序列化为JSON字符串，并保存到浏览器的 localStorage 中。
 * 建议在每次修改设置后调用此函数，以确保设置被持久化。
 */
export function saveSettings() {
    localStorage.setItem('qing-homepage-settings', JSON.stringify(appSettings));
}

/**
 * @description 从 localStorage 加载之前保存的设置，并与默认设置合并。
 * 这个函数应该在应用启动时首先被调用。
 *
 * 合并逻辑：
 * - 它会以默认设置 `appSettings` 为基础。
 * - 然后用从 localStorage 加载的已保存设置覆盖默认值。
 * - 这种深度合并（特别是对于嵌套对象如 `background`, `weather` 等）确保了即使未来版本添加了新的设置项，
 *   老的配置信息也不会导致应用出错，新设置项会保留其默认值。
 */
export function loadSettings() {
    const savedSettings = localStorage.getItem('qing-homepage-settings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);

            // 将加载的设置与默认设置进行深度合并，以确保新添加的设置项不会丢失。
            // 这是一个健壮性设计，保证了应用的向前兼容性。
            appSettings = {
                ...appSettings,
                ...parsedSettings,
                background: { ...appSettings.background, ...(parsedSettings.background || {}) },
                weather: { ...appSettings.weather, ...(parsedSettings.weather || {}) },
                developer: { ...appSettings.developer, ...(parsedSettings.developer || {}) },
                newYearTheme: { ...appSettings.newYearTheme, ...(parsedSettings.newYearTheme || {}) },
                appearance: { ...appSettings.appearance, ...(parsedSettings.appearance || {}) }
            };

            // 向后兼容性处理: 这是一个适配旧版本设置的例子。
            // 如果用户的老设置中 `view` 是 'weather'，但还没有新的 `weather.source` 属性，
            // 则为其设置一个默认值 'auto'。
            if (appSettings.view === 'weather' && !appSettings.weather.source) {
                appSettings.weather.source = 'auto';
            }
        } catch (e) {
            console.error("从localStorage解析设置失败", e);
            // 如果解析失败（例如，数据损坏），将继续使用默认设置，而不会导致应用崩溃。
        }
    }
}
