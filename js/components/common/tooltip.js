// --- [NEW] JS-Powered Tooltip Logic ---
export function setupTooltips() {
    let tooltipEl = null;
    let showTimer = null;

    function createTooltipElement() {
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.classList.add('js-tooltip');
            document.body.appendChild(tooltipEl);
        }
    }

    function showTooltip(target) {
        const tooltipText = target.getAttribute('data-tooltip');
        if (!tooltipText) return;

        createTooltipElement();
        tooltipEl.textContent = tooltipText;
        positionTooltip(target);

        tooltipEl.style.opacity = '1';
        tooltipEl.style.transform = 'scale(1) translateY(0)';
    }

    function hideTooltip() {
        if (tooltipEl) {
            tooltipEl.style.opacity = '0';
            tooltipEl.style.transform = 'scale(0.95) translateY(5px)';
        }
    }

    function positionTooltip(target) {
        if (!tooltipEl || !target) return;

        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();
        const offset = 10; 

        let top = targetRect.top - tooltipRect.height - offset;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        if (top < 0) {
            top = targetRect.bottom + offset;
        }
        if (left < 0) {
            left = 5;
        }
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 5;
        }

        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
    }
    
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            clearTimeout(showTimer);
            showTimer = setTimeout(() => {
                showTooltip(target);
            }, 200);
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            clearTimeout(showTimer);
            hideTooltip();
        }
    });

    window.addEventListener('scroll', () => {
        clearTimeout(showTimer);
        hideTooltip();
    }, true);
}
