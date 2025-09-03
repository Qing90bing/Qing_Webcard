// --- GitHub Chart Loader Logic ---
export function setupGitHubChartLoader() {
    const spinner = document.getElementById('gh-chart-spinner');
    const errorContainer = document.getElementById('gh-chart-error');
    const errorMessage = document.getElementById('gh-chart-error-message');
    const imgLink = document.getElementById('gh-chart-link');
    const img = document.getElementById('gh-chart-img');
    const loadingContainer = document.getElementById('gh-chart-loading');
    const chartWrapper = document.getElementById('gh-chart-wrapper');

    const loadImage = () => {
        // Reset image state for re-loads
        img.classList.remove('loaded');
        imgLink.classList.add('invisible');
        errorContainer.classList.remove('visible');

        // Show loading UI
        chartWrapper.classList.add('hidden');
        loadingContainer.classList.remove('hidden');
        spinner.classList.add('visible');

        const originalSrc = img.dataset.src;
        const baseUrl = originalSrc.split('?')[0];
        // Reconstruct URL to safely add cache-busting parameter
        img.src = `${baseUrl}?theme=dark&v=${new Date().getTime()}`;
    };

    img.onload = () => {
        // Hide loading UI
        spinner.classList.remove('visible');
        loadingContainer.classList.add('hidden');
        
        // Show the chart wrapper so its contents can be animated
        chartWrapper.classList.remove('hidden');
        
        // Defer the animation trigger to the next paint cycle for reliability
        requestAnimationFrame(() => {
            imgLink.classList.remove('invisible');
            imgLink.classList.add('visible');
            img.classList.add('loaded');
        });
    };

    img.onerror = () => {
        // Hide loading UI
        spinner.classList.remove('visible');
        loadingContainer.classList.add('hidden');

        // Show the chart wrapper to display the error message
        chartWrapper.classList.remove('hidden');

        errorContainer.classList.add('visible');
        errorMessage.textContent = '贡献图加载失败，请检查网络并重试。';
    };

    errorContainer.addEventListener('click', () => {
        loadImage();
    });

    // Initial load
    loadImage();
}
