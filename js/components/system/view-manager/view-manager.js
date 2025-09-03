/**
 * @file view-manager.js
 * @description
 * 本文件负责管理主内容区域的视图切换，主要是在“GitHub贡献图”和“天气信息”之间进行切换。
 * 它还处理设置面板中与此相关的UI交互。
 *
 * @module components/system/view-manager
 */
import { appSettings, saveSettings } from '../../../core/settings.js';
import { setupGitHubChartLoader } from '../../features/github/github-chart.js';
import { fetchAndDisplayWeather } from '../../features/weather/weather.js';

/**
 * @description 根据 `appSettings` 中的设置，应用当前的主视图。
 * 它会隐藏不活动的视图，显示活动的视图，并触发相应视图的内容加载。
 */
function applyCurrentView() {
    const githubView = document.getElementById('github-view');
    const weatherView = document.getElementById('weather-view');

    if (appSettings.view === 'weather') {
        githubView.classList.add('hidden');
        weatherView.classList.remove('hidden');
        fetchAndDisplayWeather(); // 加载天气信息
    } else {
        weatherView.classList.add('hidden');
        githubView.classList.remove('hidden');
        setupGitHubChartLoader(); // 加载GitHub贡献图
    }
}

/**
 * @description 更新设置面板中与视图切换相关的UI元素的状态。
 */
function updateViewToggleUI() {
    const cityInputWrapper = document.getElementById('manual-city-input-wrapper');
    const cityInput = document.getElementById('weather-city-input');

    // 根据当前的视图和天气来源，确定哪个单选按钮应该被选中
    let selectedViewValue;
    if (appSettings.view === 'github') {
        selectedViewValue = 'github';
    } else { // view is 'weather'
        selectedViewValue = `weather-${appSettings.weather.source}`;
    }

    const radio = document.querySelector(`input[name="view-source"][value="${selectedViewValue}"]`);
    if (radio) {
        radio.checked = true;
    }

    // 控制“手动输入城市”输入框的显示/隐藏
    const isManual = appSettings.view === 'weather' && appSettings.weather.source === 'manual';
    cityInputWrapper.style.maxHeight = isManual ? '60px' : '0';
    cityInputWrapper.style.marginTop = isManual ? '0.75rem' : '0';

    if (isManual) {
        cityInput.placeholder = appSettings.weather.city || '输入城市后回车 (例如: 北京)';
        cityInput.value = appSettings.weather.city || '';
    }
}

/**
 * @description 初始化视图管理器的所有事件监听器。
 */
export function initializeViewManager() {
    const cityInput = document.getElementById('weather-city-input');
    const saveCityBtn = document.getElementById('save-city-btn');
    const confirmCityIcon = document.getElementById('confirm-city-icon');
    const cityInputError = document.getElementById('city-input-error');

    /**
     * @description 保存用户手动输入的城市名称。
     */
    const saveCity = () => {
        const newCity = cityInput.value.trim();

        // 输入验证
        if (newCity.length > 20) {
            cityInput.classList.add('invalid');
            cityInputError.textContent = '内容过长 (最多20个字符)';
            cityInputError.classList.add('visible');
            cityInputError.classList.remove('hidden');
            return;
        }

        // 清除之前的错误提示
        cityInput.classList.remove('invalid');
        cityInputError.classList.remove('visible');
        setTimeout(() => { cityInputError.classList.add('hidden'); }, 200);

        // 保存逻辑
        appSettings.weather.city = newCity;
        applyCurrentView(); // 立即应用新城市的天气
        saveSettings();
        cityInput.blur();

        // 提供保存成功的视觉反馈动画
        saveCityBtn.style.opacity = '0';
        confirmCityIcon.classList.remove('hidden');
        setTimeout(() => { 
            confirmCityIcon.style.opacity = '1';
            confirmCityIcon.style.transform = 'scale(1)';
        }, 10);

        setTimeout(() => {
            confirmCityIcon.style.opacity = '0';
            confirmCityIcon.style.transform = 'scale(0.9)';
            setTimeout(() => {
                confirmCityIcon.classList.add('hidden');
                saveCityBtn.style.opacity = '1';
            }, 200);
        }, 2000); 
    };

    // 为所有视图切换单选按钮添加事件监听
    document.querySelectorAll('input[name="view-source"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const value = radio.value;
            if (value === 'github') {
                appSettings.view = 'github';
            } else {
                appSettings.view = 'weather';
                if (value === 'weather-auto') {
                    appSettings.weather.source = 'auto';
                    appSettings.weather.city = null; // 切换到自动时清除手动城市
                } else { // weather-manual
                    appSettings.weather.source = 'manual';
                }
            }
            
            applyCurrentView();
            updateViewToggleUI();
            saveSettings();
        });
    });

    // 城市输入框的事件监听
    cityInput.addEventListener('focus', () => {
        cityInput.classList.remove('invalid');
        cityInputError.classList.remove('visible');
        setTimeout(() => { cityInputError.classList.add('hidden'); }, 200);
    });

    cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCity();
        }
    });

    saveCityBtn.addEventListener('click', saveCity);
}

// 导出需要被外部模块（如main.js, settings-updater.js）调用的函数
export { applyCurrentView, updateViewToggleUI };
