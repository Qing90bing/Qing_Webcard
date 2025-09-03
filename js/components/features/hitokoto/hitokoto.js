/**
 * @file hitokoto.js
 * @description
 * 本文件负责实现“一言”功能。
 * 它从 `hitokoto.cn` 的API获取并显示一句有深度或有趣味的话。
 * 用户可以点击卡片来刷新“一言”，并且支持根据用户在设置中选择的分类进行筛选。
 *
 * @module components/features/hitokoto/hitokoto
 */

let appSettings; // 用于存储从外部注入的应用设置
let isUpdatingQuote = false; // 一个简单的防抖（debounce）标志，防止用户过快连续点击刷新

/**
 * @description 异步获取并显示一条新的一言。
 * 函数内置了防抖逻辑和加载动画（淡入淡出）。
 */
async function fetchHitokoto() {
    // 如果当前正在更新，则直接返回，防止重复请求
    if (isUpdatingQuote) return;
    isUpdatingQuote = true;

    const hitokotoText = document.getElementById('hitokoto-text');
    const hitokotoFrom = document.getElementById('hitokoto-from');
    if (!hitokotoText || !hitokotoFrom) {
        isUpdatingQuote = false; // 如果DOM元素不存在，则重置标志并退出
        return;
    }

    // 步骤1: 触发淡出动画
    hitokotoText.classList.add('opacity-0');
    hitokotoFrom.classList.add('opacity-0');

    try {
        // 等待淡出动画完成，给用户一个视觉反馈
        await new Promise(resolve => setTimeout(resolve, 500));

        // 步骤2: 构建API请求URL
        let apiUrl = 'https://v1.hitokoto.cn/?encode=json';
        // 如果用户在设置中选择了自定义分类，则将分类参数附加到URL上
        if (appSettings.hitokoto.mode === 'custom' && appSettings.hitokoto.categories.length > 0) {
            const categoryParams = appSettings.hitokoto.categories.map(cat => `c=${cat}`).join('&');
            apiUrl += `&${categoryParams}`;
        }

        // 步骤3: 发起网络请求
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('网络响应不佳。');
        const data = await response.json();

        // 步骤4: 更新DOM内容
        hitokotoText.textContent = data.hitokoto;
        hitokotoFrom.textContent = `— 「${data.from || '未知来源'}」`;
    } catch (error) {
        // 错误处理：在UI上显示错误信息
        console.error("获取一言失败:", error);
        hitokotoText.textContent = '获取一言失败，请稍后再试。';
        hitokotoFrom.textContent = '';
    } finally {
        // 步骤5: 触发淡入动画
        hitokotoText.classList.remove('opacity-0');
        hitokotoFrom.classList.remove('opacity-0');
        // 在动画结束后的一小段时间后，重置防抖标志，允许再次刷新
        setTimeout(() => { isUpdatingQuote = false; }, 600);
    }
}

/**
 * @description 初始化一言功能。
 * @param {object} settings - 从 `core/settings.js` 传入的应用设置对象。
 * @returns {{fetchHitokoto: function}} 返回一个包含 `fetchHitokoto` 函数的对象，以便其他模块可以按需调用。
 */
export function initializeHitokoto(settings) {
    appSettings = settings; // 保存设置的引用

    const hitokotoCard = document.getElementById('hitokoto-card');
    if (hitokotoCard) {
        // 为一言卡片添加点击事件监听器，点击时刷新
        hitokotoCard.addEventListener('click', fetchHitokoto);
    }

    // 页面加载后立即获取第一条一言
    fetchHitokoto();

    // 返回API，允许外部调用
    return {
        fetchHitokoto
    };
}
