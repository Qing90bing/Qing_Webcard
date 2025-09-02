// --- [NEW] Card Slider Logic ---
export function createCardSlider(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const wrapper = container.querySelector('.slider-wrapper');
    const track = container.querySelector('.slider-track');
    const slides = Array.from(container.querySelectorAll('.card-slide'));
    const dotsContainer = container.querySelector('.slider-dots');

    if (!wrapper || !track || !slides.length || !dotsContainer) {
        console.error('Slider missing required elements.');
        return;
    }

    let hasDragged = false;

    let state = {
        slidesToShow: 3,
        slidesToScroll: 3,
        totalSlides: slides.length,
        currentPage: 0,
        totalPages: 1,
        isDragging: false,
        startX: 0,
        currentTranslate: 0,
        startTranslate: 0,
        lastX: 0,
        velocity: 0,
        animationFrame: null,
    };

    const FRICTION = 0.92;
    const THRESHOLD = 50; // Min distance in px to trigger a slide

    function updateSliderConfig() {
        const screenWidth = window.innerWidth;
        if (screenWidth < 768) { // On mobile and small tablets, show 2 cards
            state.slidesToShow = 2;
            state.slidesToScroll = 2;
        } else { // On larger screens, show 3 cards
            state.slidesToShow = 3;
            state.slidesToScroll = 3;
        }
        state.totalPages = Math.ceil(state.totalSlides / state.slidesToScroll);
    }

    function applySlideWidths() {
        const gap = 16; // 1rem, from `gap-4`
        const style = window.getComputedStyle(wrapper);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        const contentWidth = wrapper.clientWidth - paddingLeft - paddingRight;
        const slideWidth = (contentWidth - (gap * (state.slidesToShow - 1))) / state.slidesToShow;
        slides.forEach(slide => {
            slide.style.width = `${slideWidth}px`;
        });
    }

    function createDots() {
        dotsContainer.innerHTML = '';
        if (state.totalPages <= 1) {
            container.style.display = 'none'; // Hide the whole thing
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

    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === state.currentPage);
        });
    }
    
    function goToPage(page, animated = true) {
        state.currentPage = Math.max(0, Math.min(page, state.totalPages - 1));
        
        const gap = 16;
        const style = window.getComputedStyle(wrapper);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        const contentWidth = wrapper.clientWidth - paddingLeft - paddingRight;
        
        // Since slidesToScroll is always equal to slidesToShow, the total distance
        // to scroll for one page is the width of the content area plus one gap.
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
        state.animationFrame = requestAnimationFrame(updateVelocity);
    }

    function onDragMove(event) {
        if (!state.isDragging) return;
        const currentX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
        const dx = currentX - state.startX;
        if (Math.abs(dx) > 10) {
            hasDragged = true;
        }
        state.currentTranslate = state.startTranslate + dx;
        track.style.transform = `translateX(${state.currentTranslate}px)`;
    }
    
    function updateVelocity() {
        const now = performance.now();
        const currentX = state.lastX;
        const dx = currentX - state.lastX;
        const dt = now - (state.lastTime || now);
        state.lastTime = now;
        
        if (dt > 0) {
            state.velocity = (dx / dt) * 10; // Scale up for more oomph
        }
        state.lastX = currentX;
        state.animationFrame = requestAnimationFrame(updateVelocity);
    }

    function onDragEnd() {
        if (!state.isDragging) return;
        state.isDragging = false;
        wrapper.classList.remove('grabbing');
        cancelAnimationFrame(state.animationFrame);

        const dragDistance = state.currentTranslate - state.startTranslate;
        const targetPage = state.currentPage;

        if (Math.abs(dragDistance) > THRESHOLD) {
            // Move to next/prev page
            const direction = dragDistance < 0 ? 1 : -1;
            goToPage(state.currentPage + direction);
        } else {
            // Snap back to current page
            goToPage(state.currentPage);
        }
    }

    function init() {
        updateSliderConfig();
        applySlideWidths();
        createDots();
        goToPage(0, false); // Initialize position

        slides.forEach(slide => {
            slide.addEventListener('click', (e) => {
                if (hasDragged) {
                    e.preventDefault();
                }
            });
        });

        wrapper.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        wrapper.addEventListener('mouseleave', onDragEnd);

        wrapper.addEventListener('touchstart', onDragStart, { passive: true });
        wrapper.addEventListener('touchmove', onDragMove, { passive: true });
        wrapper.addEventListener('touchend', onDragEnd);
        wrapper.addEventListener('touchcancel', onDragEnd);

        let lastWheelTime = 0;
        const wheelThrottle = 500; // 500ms delay between wheel scrolls

        wrapper.addEventListener('wheel', (event) => {
            // Ignore wheel events that are more horizontal than vertical
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                return;
            }

            event.preventDefault();
            const now = Date.now();
            if (now - lastWheelTime < wheelThrottle) {
                return;
            }
            lastWheelTime = now;

            const direction = event.deltaY > 0 ? 1 : -1;
            const newPage = state.currentPage + direction;

            if (newPage >= 0 && newPage < state.totalPages) {
                goToPage(newPage);
            }
        }, { passive: false });
    }

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
