/**
 * @file card-slider.js
 * @description
 * 本文件负责创建一个功能齐全、响应式的卡片滑块（轮播）组件。
 * 它支持鼠标拖动、触摸滑动、鼠标滚轮以及导航点点击等多种交互方式。
 *
 * @module components/system/card/card-slider
 */

/**
 * @description 创建并初始化一个卡片滑块实例。
 * @param {string} containerSelector - 滑块容器的CSS选择器。
 */
export function createCardSlider(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // --- DOM元素缓存 ---
    const wrapper = container.querySelector('.slider-wrapper');
    const track = container.querySelector('.slider-track');
    const slides = Array.from(container.querySelectorAll('.card-slide'));
    const dotsContainer = container.querySelector('.slider-dots');

    if (!wrapper || !track || !slides.length || !dotsContainer) {
        console.error('滑块缺少必要的子元素。');
        return;
    }

    let hasDragged = false; // 用于区分拖动和点击

    // --- 状态管理 ---
    let state = {
        slidesToShow: 3,       // 每页显示的卡片数
        slidesToScroll: 3,     // 每次滚动的卡片数
        totalSlides: slides.length,
        currentPage: 0,
        totalPages: 1,
        isDragging: false,     // 是否正在拖动
        startX: 0,             // 拖动起始点的X坐标
        currentTranslate: 0,   // 当前轨道的translateX值
        startTranslate: 0,     // 拖动开始时轨道的translateX值
        lastX: 0,              // 上一帧的X坐标 (用于计算速度)
        velocity: 0,           // 拖动速度
        animationFrame: null,  // requestAnimationFrame的ID
    };

    const THRESHOLD = 50; // 触发翻页所需的最小拖动距离（像素）

    /**
     * @description 根据屏幕宽度更新滑块的配置（每页显示几张卡片）。
     */
    function updateSliderConfig() {
        const screenWidth = window.innerWidth;
        if (screenWidth < 768) { // 移动端
            state.slidesToShow = 2;
            state.slidesToScroll = 2;
        } else { // 桌面端
            state.slidesToShow = 3;
            state.slidesToScroll = 3;
        }
        state.totalPages = Math.ceil(state.totalSlides / state.slidesToScroll);
    }

    /**
     * @description 动态计算并应用每张卡片的宽度。
     */
    function applySlideWidths() {
        const gap = 16; // 间距 (1rem, 来自CSS中的gap-4)
        const style = window.getComputedStyle(wrapper);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        const contentWidth = wrapper.clientWidth - paddingLeft - paddingRight;
        const slideWidth = (contentWidth - (gap * (state.slidesToShow - 1))) / state.slidesToShow;
        slides.forEach(slide => {
            slide.style.width = `${slideWidth}px`;
        });
    }

    /**
     * @description 根据总页数创建导航点。
     */
    function createDots() {
        dotsContainer.innerHTML = '';
        if (state.totalPages <= 1) {
            container.style.display = 'none'; // 如果只有一页或更少，则隐藏整个滑块
            return;
        }
        container.style.display = '';

        for (let i = 0; i < state.totalPages; i++) {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            dot.setAttribute('data-page', i);
            dot.addEventListener('click', () => goToPage(i));
            dotsContainer.appendChild(dot);
        }
    }

    /**
     * @description 更新导航点的激活状态。
     */
    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === state.currentPage);
        });
    }
    
    /**
     * @description 将滑块移动到指定页面。
     * @param {number} page - 目标页面的索引。
     * @param {boolean} [animated=true] - 是否使用动画过渡。
     */
    function goToPage(page, animated = true) {
        state.currentPage = Math.max(0, Math.min(page, state.totalPages - 1));
        
        const gap = 16;
        const style = window.getComputedStyle(wrapper);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        const contentWidth = wrapper.clientWidth - paddingLeft - paddingRight;
        
        const scrollAmount = contentWidth + gap;
        const newTranslate = -state.currentPage * scrollAmount;

        if (animated) {
            track.style.transition = `transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)`;
            track.style.transform = `translateX(${newTranslate}px)`;
        } else {
            track.style.transition = 'none';
            track.style.transform = `translateX(${newTranslate}px)`;
        }

        state.currentTranslate = newTranslate;
        updateDots();
    }

    // --- 拖动事件处理 ---
    function onDragStart(event) {
        hasDragged = false;
        event.preventDefault();
        state.isDragging = true;
        state.startX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
        state.startTranslate = state.currentTranslate;
        state.lastX = state.startX;
        state.velocity = 0;
        
        track.style.transition = 'none';
        wrapper.classList.add('grabbing');
        
        cancelAnimationFrame(state.animationFrame);
    }

    function onDragMove(event) {
        if (!state.isDragging) return;
        const currentX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
        const dx = currentX - state.startX;
        if (Math.abs(dx) > 10) { // 拖动超过10px才算作有效拖动
            hasDragged = true;
        }
        state.currentTranslate = state.startTranslate + dx;
        track.style.transform = `translateX(${state.currentTranslate}px)`;
    }
    
    function onDragEnd() {
        if (!state.isDragging) return;
        state.isDragging = false;
        wrapper.classList.remove('grabbing');
        cancelAnimationFrame(state.animationFrame);

        const dragDistance = state.currentTranslate - state.startTranslate;

        if (Math.abs(dragDistance) > THRESHOLD) {
            // 如果拖动距离超过阈值，则翻页
            const direction = dragDistance < 0 ? 1 : -1;
            goToPage(state.currentPage + direction);
        } else {
            // 否则，弹回当前页
            goToPage(state.currentPage);
        }
    }

    /**
     * @description 初始化所有事件监听器。
     */
    function init() {
        updateSliderConfig();
        applySlideWidths();
        createDots();
        goToPage(0, false); // 初始化位置

        // 如果发生了拖动，则阻止卡片上链接的默认点击行为
        slides.forEach(slide => {
            slide.addEventListener('click', (e) => {
                if (hasDragged) {
                    e.preventDefault();
                }
            });
        });

        // 鼠标事件
        wrapper.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        wrapper.addEventListener('mouseleave', onDragEnd);

        // 触摸事件
        wrapper.addEventListener('touchstart', onDragStart, { passive: true });
        wrapper.addEventListener('touchmove', onDragMove, { passive: true });
        wrapper.addEventListener('touchend', onDragEnd);
        wrapper.addEventListener('touchcancel', onDragEnd);

        // 滚轮事件 (带节流)
        let lastWheelTime = 0;
        const wheelThrottle = 500; // 500ms的延迟

        wrapper.addEventListener('wheel', (event) => {
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                return; // 忽略水平滚动
            }

            event.preventDefault();
            const now = Date.now();
            if (now - lastWheelTime < wheelThrottle) {
                return; // 节流
            }
            lastWheelTime = now;

            const direction = event.deltaY > 0 ? 1 : -1;
            const newPage = state.currentPage + direction;

            if (newPage >= 0 && newPage < state.totalPages) {
                goToPage(newPage);
            }
        }, { passive: false });
    }

    // 使用ResizeObserver来监听容器尺寸变化，实现响应式
    const resizeObserver = new ResizeObserver(() => {
        const oldTotalPages = state.totalPages;
        updateSliderConfig();
        applySlideWidths();
        if (state.totalPages !== oldTotalPages) {
            createDots();
        }
        goToPage(state.currentPage, false);
    });
    resizeObserver.observe(container);

    init();
}
