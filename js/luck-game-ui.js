/**
 * @file Initializes the hidden "reset luck game" feature.
 * This feature is triggered by clicking the title icon on the time capsule card 5 times.
 */

/**
 * Sets up a hidden click listener on the time capsule title icon
 * to allow resetting the daily luck game for debugging or testing purposes.
 */
export function initializeLuckGameUI() {
    const luckTitleIcon = document.querySelector('#time-capsule-card h2 svg');
    if (!luckTitleIcon) {
        // If the element doesn't exist, do nothing.
        return;
    }

    let resetClickCount = 0;
    let resetClickTimer;

    luckTitleIcon.addEventListener('click', () => {
        resetClickCount++;
        clearTimeout(resetClickTimer);

        if (resetClickCount >= 5) {
            resetClickCount = 0;

            // Call the global reset function, which is expected to be defined in luck-game.js
            if (typeof resetLuckGame === 'function') {
                resetLuckGame();
                console.log('Daily luck game has been reset.');
            } else {
                console.error('The global function resetLuckGame() is not available.');
            }
        } else {
            // Reset the counter if the user doesn't click 5 times within 3 seconds.
            resetClickTimer = setTimeout(() => {
                resetClickCount = 0;
            }, 3000);
        }
    });
}
