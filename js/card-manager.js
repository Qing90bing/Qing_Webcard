import { updateTimeCapsule } from './time-capsule.js';
import { fetchAndRenderCommits, updateCommitMask } from './commit-history.js';

// --- Module-level state and element cache ---
let aboutCardHasAnimated = false;
let rightColumn, timeCapsuleCard, holidayListCard, aboutCard, profileCard, aboutCardTrigger, closeAboutCardBtn, refreshCommitsBtn, closeTimeCapsuleBtn;

/**
 * Animates the right column cards into view with a bounce effect.
 */
export function animateRightColumnIn() {
    if (!rightColumn) return;
    const elementsToAnimate = rightColumn.querySelectorAll(':scope > div');
    elementsToAnimate.forEach(el => {
        el.classList.remove('bounce-in');
        void el.offsetWidth; // Trigger reflow to restart animation
        el.classList.add('bounce-in');
    });
}

/**
 * Hides all overlaying cards and shows the main right column.
 */
function showRightColumn() {
    if (!rightColumn) return;
    timeCapsuleCard.classList.add('hidden');
    holidayListCard.classList.add('hidden');
    aboutCard.classList.add('hidden');
    rightColumn.classList.remove('hidden');
    animateRightColumnIn();
}

/**
 * Hides all cards and the right column. Used before showing a specific card.
 */
function hideAllViews() {
    if (!rightColumn) return;
    rightColumn.classList.add('hidden');
    timeCapsuleCard.classList.add('hidden');
    holidayListCard.classList.add('hidden');
    aboutCard.classList.add('hidden');
}

/**
 * Toggles the visibility of the "About" card.
 */
export function toggleAboutCard() {
    if (!aboutCard) return;
    const isHidden = aboutCard.classList.contains('hidden');

    if (isHidden) {
        hideAllViews();
        aboutCard.classList.remove('hidden');

        if (!aboutCardHasAnimated) {
            aboutCard.classList.add('bounce-in');
            aboutCardHasAnimated = true;
        }

        const commitsContainer = document.getElementById('recent-commits-container');
        if (commitsContainer && !SimpleBar.instances.get(commitsContainer)) {
            const simplebarInstance = new SimpleBar(commitsContainer);
            simplebarInstance.getScrollElement().addEventListener('scroll', updateCommitMask);
        }

        fetchAndRenderCommits();
    } else {
        showRightColumn();
    }
}

/**
 * Toggles the visibility of the "Time Capsule" card.
 */
function toggleTimeCapsuleCard() {
    if (!timeCapsuleCard) return;
    const isHidden = timeCapsuleCard.classList.contains('hidden');

    if (isHidden) {
        hideAllViews();
        timeCapsuleCard.classList.remove('hidden');
        timeCapsuleCard.classList.add('bounce-in');
        updateTimeCapsule();
    } else {
        showRightColumn();
    }
}

/**
 * Checks if a card is open and closes it.
 * @returns {boolean} - True if a card was closed, false otherwise.
 */
export function closeOpenCard() {
    if (aboutCard && !aboutCard.classList.contains('hidden')) {
        showRightColumn();
        return true;
    }
    if (holidayListCard && !holidayListCard.classList.contains('hidden')) {
        showRightColumn();
        return true;
    }
    if (timeCapsuleCard && !timeCapsuleCard.classList.contains('hidden')) {
        showRightColumn();
        return true;
    }
    return false;
}

/**
 * Initializes all event listeners related to card management.
 */
export function initializeCardManager() {
    // Cache DOM elements for performance and convenience
    rightColumn = document.getElementById('right-column');
    timeCapsuleCard = document.getElementById('time-capsule-card');
    holidayListCard = document.getElementById('holiday-list-card');
    aboutCard = document.getElementById('about-card');
    profileCard = document.getElementById('profile-card');
    aboutCardTrigger = document.getElementById('about-card-trigger');
    closeAboutCardBtn = document.getElementById('close-about-card');
    refreshCommitsBtn = document.getElementById('refresh-commits-btn');
    closeTimeCapsuleBtn = document.getElementById('close-time-capsule');

    // --- Event Listener Setup ---

    if (profileCard) {
        profileCard.addEventListener('click', (e) => {
            // Prevent toggling if a link inside the card was clicked
            if (e.target.closest('a')) {
                return;
            }
            toggleTimeCapsuleCard();
        });
    }

    if (closeTimeCapsuleBtn) {
        closeTimeCapsuleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showRightColumn();
        });
    }

    if (aboutCardTrigger) {
        aboutCardTrigger.addEventListener('click', toggleAboutCard);
    }

    if (closeAboutCardBtn) {
        closeAboutCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAboutCard(); // Calling toggle will hide it if it's visible
        });
    }

    if (refreshCommitsBtn) {
        refreshCommitsBtn.addEventListener('click', () => {
            fetchAndRenderCommits();
        });
    }
}
