// js/features/hitokoto.js

let appSettings;
let isUpdatingQuote = false;

async function fetchHitokoto() {
    if (isUpdatingQuote) return;
    isUpdatingQuote = true;

    const hitokotoText = document.getElementById('hitokoto-text');
    const hitokotoFrom = document.getElementById('hitokoto-from');
    if (!hitokotoText || !hitokotoFrom) {
        isUpdatingQuote = false;
        return;
    }

    hitokotoText.classList.add('opacity-0');
    hitokotoFrom.classList.add('opacity-0');

    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        let apiUrl = 'https://v1.hitokoto.cn/?encode=json';
        if (appSettings.hitokoto.mode === 'custom' && appSettings.hitokoto.categories.length > 0) {
            const categoryParams = appSettings.hitokoto.categories.map(cat => `c=${cat}`).join('&');
            apiUrl += `&${categoryParams}`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();
        hitokotoText.textContent = data.hitokoto;
        hitokotoFrom.textContent = `— 「${data.from || '未知来源'}」`;
    } catch (error) {
        console.error("获取一言失败:", error);
        hitokotoText.textContent = '获取一言失败，请稍后再试。';
        hitokotoFrom.textContent = '';
    } finally {
        hitokotoText.classList.remove('opacity-0');
        hitokotoFrom.classList.remove('opacity-0');
        setTimeout(() => { isUpdatingQuote = false; }, 600);
    }
}

export function initializeHitokoto(settings) {
    appSettings = settings;

    const hitokotoCard = document.getElementById('hitokoto-card');
    if (hitokotoCard) {
        hitokotoCard.addEventListener('click', fetchHitokoto);
    }

    fetchHitokoto(); // Initial fetch

    return {
        fetchHitokoto
    };
}
