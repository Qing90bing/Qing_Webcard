/**
 * @file commit-history.js
 * @description
 * 本文件负责从GitHub API获取指定仓库的最新提交记录，
 * 并将其格式化为美观、易读的时间线视图。
 * 它还包含了一个滚动遮罩效果，以提升用户体验。
 *
 * @module components/features/github/commit-history
 */

/**
 * @description 将ISO 8601格式的日期字符串转换为用户友好的相对时间文本。
 * 例如："提交于 刚刚", "提交于 5 小时前", "提交于 昨天", "提交于 3 天前"。
 * 超过7天则直接显示具体日期。
 * @param {string} dateString - 符合ISO 8601格式的日期字符串。
 * @returns {string} 格式化后的相对时间字符串。
 */
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

    // 为了准确计算天数差异，我们将时间部分归零
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const commitDay = new Date(commitDate.getFullYear(), commitDate.getMonth(), commitDate.getDate());
    const dayDiff = (today - commitDay) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
        return "提交于 昨天";
    }
    if (dayDiff < 7) {
        return `提交于 ${dayDiff} 天前`;
    }

    // 超过一周，直接显示年月日
    return `提交于 ${commitDate.getFullYear()}-${String(commitDate.getMonth() + 1).padStart(2, '0')}-${String(commitDate.getDate()).padStart(2, '0')}`;
}

/**
 * @description 异步获取并渲染GitHub的提交记录。
 * 这是该模块的核心功能，负责整个流程的协调。
 */
export async function fetchAndRenderCommits() {
    const container = document.getElementById('recent-commits-container');
    if (!container) return;

    // 适配SimpleBar滚动条插件，获取其内容元素
    const simplebarInstance = SimpleBar.instances.get(container);
    const contentEl = simplebarInstance ? simplebarInstance.getContentElement() : container;
    const refreshBtn = document.getElementById('refresh-commits-btn');
    const refreshIcon = refreshBtn ? refreshBtn.querySelector('i') : null;

    /**
     * @description 执行实际的fetch请求和DOM渲染。
     */
    const executeFetch = async () => {
        try {
            // 使用CORS代理来避免浏览器跨域限制。
            // 添加时间戳 `v=${new Date().getTime()}` 来防止浏览器缓存API请求。
            const response = await fetch(`https://cors.eu.org/https://api.github.com/repos/Qing90bing/Qing_Webcard/commits?per_page=30&v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`GitHub API 错误: ${response.status}`);
            const allCommits = await response.json();

            if (allCommits.length === 0) {
                renderContent(`<div class="commit-loader-wrapper"><p style="color: var(--text-color-secondary);">未能找到任何提交记录。</p></div>`);
                return;
            }

            // 只显示最近的15条提交记录
            const commitsToDisplay = allCommits.slice(0, 15);

            // --- 按日期对提交进行分组 ---
            const groupedByDate = new Map();
            commitsToDisplay.forEach(commitData => {
                const date = new Date(commitData.commit.author.date);
                const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

                if (!groupedByDate.has(dateStr)) {
                    groupedByDate.set(dateStr, []);
                }
                groupedByDate.get(dateStr).push(commitData);
            });

            // --- 构建HTML字符串 ---
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
                    const message = commitData.commit.message.split('\n')[0]; // 只取提交信息的第一行
                    const url = commitData.html_url;
                    const authorName = commitData.commit.author.name;
                    const avatarUrl = commitData.author?.avatar_url;
                    const timeAgo = formatTimeAgo(commitData.commit.author.date);

                    let authorHTML = `
                        <span class="flex items-center">
                            <i class="fas fa-user-edit fa-fw mr-2"></i>
                    `;

                    if (avatarUrl) {
                        authorHTML += `<img src="${avatarUrl}" class="tooltip-container w-4 h-4 rounded-full mr-2 commit-avatar" alt="${authorName}的头像" data-tooltip="${authorName}" onload="this.classList.add('loaded')">`;
                    }

                    authorHTML += `<span>${authorName}</span></span>`;

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

                commitsHTML += `</div></div></div>`;
            }

            // 如果返回了30条记录，说明GitHub上可能有更多记录，显示一个“查看更多”的链接
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

            renderContent(`<div class="timeline-wrapper">${commitsHTML}</div>`);

        } catch (error) {
            console.error("获取提交记录失败:", error);
            renderContent(`<div class="commit-loader-wrapper"><p style="color: var(--status-past);">加载提交记录失败，请稍后重试。</p></div>`);
        }
    };

    /**
     * @description 将生成的HTML内容渲染到页面上，并带有淡入淡出效果。
     * @param {string} html - 要渲染的HTML字符串。
     */
    const renderContent = (html) => {
        container.style.opacity = '0';
        setTimeout(() => {
            contentEl.innerHTML = html;
            container.style.opacity = '1';
            simplebarInstance?.recalculate(); // 如果使用了SimpleBar，需要重新计算滚动条
            // 恢复刷新按钮的状态
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.classList.remove('is-refreshing');
            }
            refreshIcon?.classList.remove('fa-spin');
            // 内容渲染后，更新滚动遮罩
            setTimeout(updateCommitMask, 50);
        }, 300); // 300ms的延迟用于CSS过渡效果
    };

    /**
     * @description 显示加载动画，然后开始获取数据。
     */
    const showLoaderAndFetch = () => {
        container.style.opacity = '0';
        setTimeout(() => {
            contentEl.innerHTML = `
                <div class="commit-loader-wrapper">
                    <div class="commit-spinner"></div>
                    <p style="color: var(--text-color-secondary);">正在加载提交记录...</p>
                </div>
            `;
            container.style.opacity = '1';
            executeFetch();
        }, 300);
    };

    // --- 初始加载逻辑 ---
    // 禁用刷新按钮并显示加载动画
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.classList.add('is-refreshing');
    }
    refreshIcon?.classList.add('fa-spin');

    showLoaderAndFetch();
}

/**
 * @description 更新滚动区域顶部的淡入淡出遮罩效果。
 * 当内容可以滚动时，在顶部和底部显示一个渐变叠加层，
 * 以此来提示用户此处有更多内容可以滚动查看。
 */
export function updateCommitMask() {
    const container = document.getElementById('recent-commits-container');
    if (!container) return;

    const simplebarInstance = SimpleBar.instances.get(container);
    if (!simplebarInstance) return;

    const scrollElement = simplebarInstance.getScrollElement();
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const maxFadeSize = 24; // 遮罩的最大高度 (px)

    // 如果内容无需滚动，则移除遮罩效果
    if (scrollHeight <= clientHeight) {
        container.style.setProperty('--fade-top-size', '0px');
        container.style.setProperty('--fade-bottom-size', '0px');
        return;
    }

    const scrollBottom = scrollHeight - clientHeight - scrollTop;

    // 根据滚动距离计算顶部和底部遮罩的实际高度
    const topFade = Math.min(scrollTop, maxFadeSize);
    const bottomFade = Math.min(scrollBottom, maxFadeSize);

    // 通过CSS自定义属性来应用遮罩大小
    container.style.setProperty('--fade-top-size', `${topFade}px`);
    container.style.setProperty('--fade-bottom-size', `${bottomFade}px`);
}
