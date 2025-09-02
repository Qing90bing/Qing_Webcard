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

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const commitDay = new Date(commitDate.getFullYear(), commitDate.getMonth(), commitDate.getDate());
    const dayDiff = (today - commitDay) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
        return "提交于 昨天";
    }
    if (dayDiff < 7) {
        return `提交于 ${dayDiff} 天前`;
    }

    return `提交于 ${commitDate.getFullYear()}-${String(commitDate.getMonth() + 1).padStart(2, '0')}-${String(commitDate.getDate()).padStart(2, '0')}`;
}

export async function fetchAndRenderCommits() {
    const container = document.getElementById('recent-commits-container');
    if (!container) return;

    const simplebarInstance = SimpleBar.instances.get(container);
    const contentEl = simplebarInstance ? simplebarInstance.getContentElement() : container;
    const refreshBtn = document.getElementById('refresh-commits-btn');
    const refreshIcon = refreshBtn ? refreshBtn.querySelector('i') : null;

    const executeFetch = async () => {
        try {
            const response = await fetch(`https://cors.eu.org/https://api.github.com/repos/Qing90bing/Qing_Webcard/commits?per_page=30&v=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
            const allCommits = await response.json();

            if (allCommits.length === 0) {
                renderContent(`<div class="commit-loader-wrapper"><p style="color: var(--text-color-secondary);">未能找到任何提交记录。</p></div>`);
                return;
            }

            const commitsToDisplay = allCommits.slice(0, 15);

            const groupedByDate = new Map();
            commitsToDisplay.forEach(commitData => {
                const date = new Date(commitData.commit.author.date);
                const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

                if (!groupedByDate.has(dateStr)) {
                    groupedByDate.set(dateStr, []);
                }
                groupedByDate.get(dateStr).push(commitData);
            });

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
                    const message = commitData.commit.message.split('\n')[0];
                    const url = commitData.html_url;
                    const authorName = commitData.commit.author.name;
                    const avatarUrl = commitData.author?.avatar_url;
                    const timeAgo = formatTimeAgo(commitData.commit.author.date);

                    let authorHTML = `
                        <span class="flex items-center">
                            <i class="fas fa-user-edit fa-fw mr-2"></i>
                    `;

                    if (avatarUrl) {
                        authorHTML += `<img src="${avatarUrl}" class="tooltip-container w-4 h-4 rounded-full mr-2 commit-avatar" alt="${authorName}'s avatar" data-tooltip="${authorName}" onload="this.classList.add('loaded')">`;
                    }

                    authorHTML += `<span>${authorName}</span>`;

                    authorHTML += `</span>`;

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

                commitsHTML += `
                            </div>
                        </div>
                    </div>
                `;
            }

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
            console.error("Failed to fetch commits:", error);
            renderContent(`<div class="commit-loader-wrapper"><p style="color: var(--status-past);">加载提交记录失败，请稍后重试。</p></div>`);
        }
    };

    const renderContent = (html) => {
        container.style.opacity = '0';
        setTimeout(() => {
            contentEl.innerHTML = html;
            container.style.opacity = '1';
            simplebarInstance?.recalculate();
            // --- Restore button state ---
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.classList.remove('is-refreshing');
            }
            refreshIcon?.classList.remove('fa-spin');
            // Update mask after content is rendered
            setTimeout(updateCommitMask, 50);
        }, 300);
    };

    const showLoaderAndFetch = () => {
        contentEl.innerHTML = `
            <div class="commit-loader-wrapper">
                <div class="commit-spinner"></div>
                <p style="color: var(--text-color-secondary);">正在加载提交记录...</p>
            </div>
        `;
        container.style.opacity = '1';
        executeFetch();
    };

    // --- Manage Button and Loading State ---
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.classList.add('is-refreshing');
    }
    refreshIcon?.classList.add('fa-spin');

    showLoaderAndFetch();
}

export function updateCommitMask() {
    const container = document.getElementById('recent-commits-container');
    if (!container) return;

    const simplebarInstance = SimpleBar.instances.get(container);
    if (!simplebarInstance) return;

    const scrollElement = simplebarInstance.getScrollElement();
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const maxFadeSize = 24; // Desired fade height in px

    // If content is not scrollable, set fades to 0 and exit.
    if (scrollHeight <= clientHeight) {
        container.style.setProperty('--fade-top-size', '0px');
        container.style.setProperty('--fade-bottom-size', '0px');
        return;
    }

    const scrollBottom = scrollHeight - clientHeight - scrollTop;

    const topFade = Math.min(scrollTop, maxFadeSize);
    const bottomFade = Math.min(scrollBottom, maxFadeSize);

    container.style.setProperty('--fade-top-size', `${topFade}px`);
    container.style.setProperty('--fade-bottom-size', `${bottomFade}px`);
}
