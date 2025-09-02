import { resetLuckGame } from './luck-game.js';

export function initializeResetSettings() {
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    const resetConfirmOverlay = document.getElementById('reset-confirm-overlay');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const resetConfirmState = document.getElementById('reset-confirm-state');
    const resetSuccessState = document.getElementById('reset-success-state');

    const openResetModal = () => {
        // Ensure the modal is in the correct initial state when opening
        if(resetConfirmState) resetConfirmState.classList.remove('hidden');
        if(resetSuccessState) resetSuccessState.classList.add('hidden');
        if(confirmResetBtn) confirmResetBtn.disabled = false;
        if(cancelResetBtn) cancelResetBtn.disabled = false;

        if (resetConfirmOverlay) {
            resetConfirmOverlay.classList.remove('hidden');
            setTimeout(() => {
                document.body.classList.add('reset-confirm-open');
            }, 10); 
        }
    };

    const closeResetModal = () => {
        document.body.classList.remove('reset-confirm-open');
    };
    
    if (resetConfirmOverlay) {
        resetConfirmOverlay.addEventListener('transitionend', (event) => {
            if (event.propertyName === 'opacity' && !document.body.classList.contains('reset-confirm-open')) {
                resetConfirmOverlay.classList.add('hidden');
            }
        });
    }

    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', openResetModal);
    }
    if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', closeResetModal);
    }
    if (resetConfirmOverlay) {
        resetConfirmOverlay.addEventListener('click', (e) => {
            if (e.target === resetConfirmOverlay) {
                closeResetModal();
            }
        });
    }
    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', () => {
            // Disable buttons immediately to prevent multiple clicks
            confirmResetBtn.disabled = true;
            if(cancelResetBtn) cancelResetBtn.disabled = true;

            // 1. Fade out the confirmation content
            if(resetConfirmState) resetConfirmState.style.opacity = '0';

            // 2. After fade-out, switch content and fade in success message
            setTimeout(() => {
                if(resetConfirmState) resetConfirmState.classList.add('hidden');
                
                if(resetSuccessState) {
                    resetSuccessState.style.opacity = '0'; // Start transparent
                    resetSuccessState.classList.remove('hidden');
                    
                    // A tiny delay to allow the browser to apply display:block before transitioning opacity
                    setTimeout(() => {
                        resetSuccessState.style.opacity = 1;
                    }, 20);
                }

                // 3. Perform the actual reset
                // [NEW] Call the luck game reset function to clear its state and localStorage
                resetLuckGame();
                localStorage.removeItem('qing-homepage-settings');
                localStorage.removeItem('developerModeUnlocked');

                // 4. Reload the page after showing the success message
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }, 250); // This duration should match the CSS transition
        });
    }
}
