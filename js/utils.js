export function createCrossfader(layers) {
    let activeIndex = 0;

    // Return an update function that handles the cross-fade
    const update = (newUrl, isBackgroundImage = false) => {
        return new Promise((resolve, reject) => {
            const nextIndex = (activeIndex + 1) % 2;
            const activeLayer = layers[activeIndex];
            const nextLayer = layers[nextIndex];

            if (!nextLayer || !activeLayer) {
                return reject('Cross-fade layers not found.');
            }

            const preloader = new Image();
            preloader.src = newUrl;

            preloader.onload = () => {
                // Apply the new image to the hidden layer
                if (isBackgroundImage) {
                    nextLayer.style.backgroundImage = `url('${newUrl}')`;
                } else {
                    nextLayer.src = newUrl;
                }

                // Trigger the cross-fade
                activeLayer.classList.remove('active');
                nextLayer.classList.add('active');

                // Update the active index for the next cycle
                activeIndex = nextIndex;
                resolve(); // Transition has started
            };

            preloader.onerror = () => {
                console.error(`Crossfader failed to load image: ${newUrl}`);
                reject('Image load error');
            };
        });
    };

    return { update };
}

export function isNewYearPeriod() {
    const today = new Date();
    const lunarDate = new Dianaday(today);

    // Case 1: It's the first lunar month, from day 1 to day 10.
    if (lunarDate.month === 1 && lunarDate.day >= 1 && lunarDate.day <= 10) {
        return true;
    }

    // Case 2: It's the last day of the 12th lunar month (New Year's Eve).
    if (lunarDate.month === 12) {
        const daysInLastMonth = monthDays(lunarDate.year, 12);
        if (lunarDate.day === daysInLastMonth) {
            return true;
        }
    }

    return false;
}
