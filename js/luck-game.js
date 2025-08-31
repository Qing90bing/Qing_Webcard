// --- [NEW] 今日人品 功能逻辑 ---
const luckTiers = {
    0: ["是不是操作系统的锅？要不重启一下？", "今日不宜出门，建议和床锁死。", "你这运气，是不是忘给老天爷续费了？", "没事，重在参与，下次一定。"],
    1: ["还好吗？要不要给你点一首《凉凉》？", "emm...今天可能只适合躺平。", "水逆本逆，万事小心！", "别担心，触底才能反弹！"],
    2: ["运气值正在充值中，请稍后再试。", "今天的主线任务是：活着。", "一份耕耘，一份收获...但今天可能要加倍耕耘。", "建议：多喝热水，少做决定。"],
    3: ["运气正在加载，但网速有点慢...", "有点崎岖，但问题不大，稳住！", "风水轮流转，明天就到你家。", "保持冷静，佛系面对一切。"],
    4: ["不好不坏，也是一种安稳的幸福。", "运气平平，但努力可以创造奇迹。", "今天适合当个安静的美男子/女子。", "在？为什么不努力？就会怪运气？"],
    5: ["及格了！又是平常的一天呢。", "稳中向好，未来可期。", "比上不足，比下有余，知足常乐。", "你的好运正在派送中，请耐心等待。"],
    6: ["今天运气不错，可以尝试一些新东西。", "感觉良好，好像有什么好事要发生？", "万事开头难，但你今天开头不难。", "状态在线，宜积极向上。"],
    7: ["好运正在向你招手！", "今天你就是自己的锦鲤！", "走，去买张彩票试试手气！", "心情不错，看什么都顺眼。"],
    8: ["哇哦！是金色传说！", "欧气满满，可以出去“横”着走了。", "今天你是不是偷偷拜过谁了？", "水逆退散，诸事皆宜！"],
    9: ["太强了，宇宙的能量都汇聚于你！", "你就是天选之子，好运爆棚！", "欧皇附体，所向披靡！", "建议直接去龙王那儿上班，别在这儿屈才了。"],
    10: ["100分！完美！今天地球为你而转！", "这是什么神仙运气？快去拯救世界！", "系统提示：您的好运已溢出！", "我算出来了，你就是爽文/爽剧主角。"]
};
let dailyLuckData = null; // Stored as { date, value, phrase }
const luckMilestoneMessages = {
    50: "手速不错，继续保持！",
    100: "你已解锁「百连点击」成就！",
    200: "鼠标：我当时害怕极了。",
    500: "这就是单身20年的手速吗？",
    1000: "你...莫非就是传说中的点赞狂魔？",
    2000: "已通知吉尼斯世界纪录官方人员。",
    5000: "停下！你的鼠标在冒烟了！",
    10000: "您好，地球人，看来我们暴露了..."
};
let luckGameState = 'initial'; // initial, result_shown, prompt_1, prompt_2, prompt_3, counting
let luckClickCount = 0;
let countdownAnimationHandle = null; // Add this to the global scope
let luckResetTimer = null;
let hasPlayedGameToday = false;
let resetClickCount = 0;
let resetClickTimer = null;

function getScoreColorClass(score) {
    if (score >= 90) return 'text-amber-500';
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-sky-400'; // Default accent color
    return 'text-gray-400';
}

// --- Inlined Particle Animation Logic ---
const particleEffects = (() => {
    /*
     * --- [开发者指南] 如何添加自定义SVG粒子形状 ---
     *
     * 要使用您自己的SVG图标扩展粒子效果，请遵循以下步骤：
     *
     * 1. 在下方的 `svgShapes` 数组中添加一个新的JavaScript对象。
     * 2. 每个对象至少需要 `svg` 和 `randomColor` 属性，并可选择性地添加 `size`。
     *
     * --- [重要] SVG代码准备 ---
     *
     * [!!] 警告：请勿直接使用从设计软件（如Illustrator、Figma）导出的原始SVG代码。
     * 原始代码常常包含XML声明、元数据(<metadata>)、定义(<defs>)和剪切路径(<clipPath>)等
     * 非可视元素，这会导致粒子无法正常渲染。
     *
     * 清洁指南：
     * 1. 打开SVG文件，只复制 `<svg ...>` 标签及其内部的所有路径(<path>)、
     *    编组(<g>)等绘图元素。
     * 2. 确保您的 `<svg>` 标签中含有 `viewBox` 属性，这是正确缩放的关键。
     * 3. 将清洁后的代码作为单行JavaScript字符串粘贴到配置中。
     *
     * --- 配置属性详情 ---
     *
     * `svg`: (字符串)
     *   - 您清洁后的、单行的SVG代码字符串。
     *
     * `randomColor`: (布尔值)
     *   - `true`: 粒子将被赋予一个随机颜色。要使此功能生效，您的SVG代码中
     *     的 `fill` 属性必须被设置为 `currentColor`。
     *   - `false`: 粒子将保持其在SVG代码中定义的固定颜色。
     *
     * `size`: (数字, 可选)
     *   - 为此特定SVG粒子设置一个固定的尺寸（单位为像素）。
     *   - 如果不提供此属性，粒子将使用默认的随机尺寸范围 (8-15px)。
     *
     * --- 完整示例 ---
     *
     * svgShapes: [
     *   // 示例1: 固定颜色，自定义大尺寸
     *   { 
     *     svg: '<svg viewBox="0 0 24 24" fill="#E74C3C">...</svg>',
     *     randomColor: false,
     *     size: 30
     *   },
     *   // 示例2: 随机颜色，使用默认随机尺寸
     *   { 
     *     svg: '<svg viewBox="0 0 24 24" fill="currentColor">...</svg>',
     *     randomColor: true 
     *   },
     *   // ... 在此添加更多SVG对象
     * ]
     */
    const PARTICLE_CONFIG = {
        shapes: ['circle', 'square', 'triangle', 'heart', 'star'],
        // [JULES] Add a new array for custom SVG shapes.
        // For 'randomColor: true', ensure the SVG's fill property is set to "currentColor".
        // For 'randomColor: false', the SVG will use its own hardcoded fill colors.
        svgShapes: [
            {
                svg: '<svg viewBox="0 0 3840 1984" version="1.1" xmlns="http://www.w3.org/2000/svg"><g><path fill="currentColor" d="M 2372.53125 1499.746094 L 2752.230469 1499.746094 L 2125.871094 596.851562 C 2082.519531 534.171875 2021.230469 484.921875 1928.550781 484.921875 C 1832.878906 484.921875 1771.589844 538.640625 1728.238281 596.851562 L 1088.421875 1499.746094 L 1453.179688 1499.746094 L 1686.921875 1169.773438 L 1912.691406 1499.746094 L 2292.390625 1499.746094 L 1881.039062 895.75 L 1922.570312 837.121094 Z"/></g></svg>',
                randomColor: true,
                size: 60
            },
            {
                svg: '<svg viewBox="0 0 609 609" version="1.1" xmlns="http://www.w3.org/2000/svg"><g><path fill="currentColor" opacity="1.00" d=" M 178.09 290.24 C 221.60 235.87 247.22 168.49 255.84 99.70 C 270.31 99.54 284.78 99.65 299.24 99.61 C 299.40 158.87 299.23 218.12 299.29 277.37 C 291.77 279.95 284.84 285.04 281.48 292.43 C 275.46 304.41 280.05 320.58 291.81 327.22 C 300.57 332.33 312.13 332.11 320.65 326.58 C 332.26 319.50 336.31 303.07 329.73 291.25 C 326.17 284.59 319.82 279.69 312.69 277.35 C 312.78 218.13 312.62 158.91 312.78 99.69 C 327.22 99.59 341.66 99.59 356.10 99.69 C 360.47 138.24 370.88 176.05 386.49 211.56 C 398.60 239.80 414.78 266.14 433.59 290.40 C 425.11 303.70 416.62 317.03 409.44 331.09 C 396.14 356.77 385.17 383.73 377.84 411.74 C 330.02 411.94 282.20 411.81 234.38 411.80 C 225.19 378.28 211.36 346.10 193.98 316.03 C 189.03 307.22 183.36 298.85 178.09 290.24 Z" /><path fill="currentColor" opacity="1.00" d=" M 227.44 425.74 C 233.83 424.06 240.49 425.13 247.00 425.12 C 284.34 425.19 321.68 424.72 359.02 424.98 C 367.19 425.01 375.46 424.24 383.57 425.55 C 394.59 428.28 399.99 441.78 396.13 451.95 C 393.75 459.12 386.58 464.23 379.03 464.14 C 330.35 464.19 281.68 464.18 233.00 464.14 C 225.75 464.31 218.85 459.47 216.24 452.75 C 211.70 442.82 216.66 429.05 227.44 425.74 Z" /><path fill="currentColor" opacity="1.00" d=" M 229.96 477.29 C 280.70 477.21 331.45 477.29 382.20 477.29 C 382.19 488.90 382.23 500.50 382.21 512.11 C 331.56 512.35 280.91 511.94 230.26 512.32 C 230.09 510.56 229.83 508.81 229.89 507.05 C 230.16 497.13 229.55 487.21 229.96 477.29 Z" /></g></svg>',
                randomColor: true,
                size: 40
            }
        ],
        colors: ['#FF69B4', '#87CEEB', '#FFFACD', '#98FB98', '#E6E6FA', '#FFA500', '#DC143C', '#20B2AA', '#FFD700'],
        size: { min: 12, max: 15 },
        gravity: 0.08,
        // 1. Lowered particle height by reducing initial upward velocity
        initialVelocity: { x_range: [-2.5, 2.5], y_range: [-3.5, -5.5] },
        rotationSpeed: { min: -2, max: 2 },
        fadeOutDuration: 500,
    };
    let particleContainer;
    const rand = (min, max) => Math.random() * (max - min) + min;

    function createParticleElement() {
        const particle = document.createElement('div');
        // Combine default shapes and new SVG shapes for random selection
        const allShapes = [...PARTICLE_CONFIG.shapes, ...(PARTICLE_CONFIG.svgShapes || [])];
        const shape = allShapes[Math.floor(Math.random() * allShapes.length)];
        const color = PARTICLE_CONFIG.colors[Math.floor(Math.random() * PARTICLE_CONFIG.colors.length)];
        
        // NEW: Determine size based on shape config, with a fallback to the default random size.
        const size = (typeof shape === 'object' && typeof shape.size === 'number')
            ? shape.size 
            : rand(PARTICLE_CONFIG.size.min, PARTICLE_CONFIG.size.max);
        
        particle.classList.add('particle');

        // Handle new SVG shape objects
        if (typeof shape === 'object' && shape.svg) {
            // The SVG string is cleaned to remove width/height attributes
            // which might interfere with styling.
            particle.innerHTML = shape.svg.replace(/width=".*?"/g, '').replace(/height=".*?"/g, '');
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            // Default to random color unless explicitly set to false
            if (shape.randomColor !== false) {
                particle.style.color = color;
            }
        } 
        // Handle old string-based shapes
        else {
            particle.classList.add(shape);
            if (shape === 'triangle') {
                particle.style.width = '0';
                particle.style.height = '0';
                particle.style.borderLeft = `${size / 2}px solid transparent`;
                particle.style.borderRight = `${size / 2}px solid transparent`;
                particle.style.borderBottom = `${size}px solid ${color}`;
            } else if (shape === 'heart') {
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.backgroundColor = color;
            } else if (shape === 'star') {
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.setProperty('--star-color', color);
            } else { // circle, square
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.backgroundColor = color;
            }
        }
        return particle;
    }

    function animateParticle(particle, origin) {
        const vx = rand(PARTICLE_CONFIG.initialVelocity.x_range[0], PARTICLE_CONFIG.initialVelocity.x_range[1]);
        let vy = rand(PARTICLE_CONFIG.initialVelocity.y_range[0], PARTICLE_CONFIG.initialVelocity.y_range[1]);
        let x = origin.x;
        let y = origin.y;
        let rot = 0;
        const rotSpeed = rand(PARTICLE_CONFIG.rotationSpeed.min, PARTICLE_CONFIG.rotationSpeed.max);
        
        // [JULES] MODIFICATION: Add fade-in variables
        const FADE_IN_DURATION = 200; // ms
        const creationTime = Date.now();
        let fadeOutStartTime = null;

        function frame() {
            vy += PARTICLE_CONFIG.gravity;
            x += vx;
            y += vy;
            rot += rotSpeed;
            particle.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rot}deg)`;

            // [JULES] MODIFICATION: Combined fade-in and fade-out logic
            const lifeTime = Date.now() - creationTime;
            let opacity = 1;

            // Calculate fade-in
            if (lifeTime < FADE_IN_DURATION) {
                opacity = lifeTime / FADE_IN_DURATION;
            }

            // Calculate fade-out
            const groundLevel = particleContainer.clientHeight * 0.9;
            if (y > groundLevel && fadeOutStartTime === null) {
                fadeOutStartTime = Date.now();
            }

            if (fadeOutStartTime !== null) {
                const fadeOutElapsedTime = Date.now() - fadeOutStartTime;
                const fadeOutProgress = fadeOutElapsedTime / PARTICLE_CONFIG.fadeOutDuration;
                if (fadeOutProgress < 1) {
                    // Apply the lower of the two opacities
                    opacity = Math.min(opacity, 1 - fadeOutProgress);
                } else {
                    if (particle.parentNode) particle.parentNode.removeChild(particle);
                    return; // End animation
                }
            }
            
            particle.style.opacity = opacity;
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    // 2. Corrected particle origin calculation
    function getParticleOrigin() {
        const luckResultEl = document.getElementById('luck-result');
        const luckButtonEl = document.getElementById('luck-button');
        if (!luckResultEl || !luckButtonEl) {
            return { x: particleContainer.clientWidth / 2, y: particleContainer.clientHeight / 2 };
        }
        
        const containerRect = particleContainer.getBoundingClientRect();
        const resultRect = luckResultEl.getBoundingClientRect();
        
        // If the result div has no width, it means it's hidden (e.g. in the clicker game phase).
        // In this case, we should originate from the button's center.
        if (resultRect.width === 0) {
             const buttonRect = luckButtonEl.getBoundingClientRect();
             return {
                x: (buttonRect.left - containerRect.left) + buttonRect.width / 2,
                y: (buttonRect.top - containerRect.top) + buttonRect.height / 2
            };
        }

        // [JULES] MODIFICATION: Pinpoint the number for a more precise origin.
        // Try to find the specific number element (the one with the large text).
        const numberEl = luckResultEl.querySelector('.text-4xl');
        // Use the number's bounding box if it exists, otherwise fall back to the whole container's box.
        const targetRect = numberEl ? numberEl.getBoundingClientRect() : resultRect;
        
        // Return the calculated center of the target element, relative to the particle container.
        return {
            x: (targetRect.left - containerRect.left) + targetRect.width / 2,
            y: (targetRect.top - containerRect.top) + targetRect.height / 2
        };
    }

    return {
        init: () => {
            particleContainer = document.getElementById('particle-container');
            if (!particleContainer) console.error('Particle container #particle-container not found!');
        },
        triggerSingleParticle: () => {
            if (!particleContainer) return;
            const particle = createParticleElement();
            particleContainer.appendChild(particle);
            const origin = getParticleOrigin();
            animateParticle(particle, origin);
        },
        triggerBurstEffect: (count = 20) => {
            if (!particleContainer) return;
            for (let i = 0; i < count; i++) {
                setTimeout(() => particleEffects.triggerSingleParticle(), i * 15);
            }
        }
    };
})();

function displayLuckResult(data, isAnimated = false) {
    const luckResult = document.getElementById('luck-result');
    if (!luckResult) return;

    const contentWrapper = document.createElement('div');
    const colorClass = getScoreColorClass(data.value);
    contentWrapper.innerHTML = `
        <p>你今天的人品值是</p>
        <p class="text-4xl font-bold ${colorClass} leading-tight">${data.value}!</p>
        <p class="min-w-0">${data.phrase}</p>
    `;

    if (isAnimated) {
        contentWrapper.classList.add('bounce-in');
        // 3. Delayed burst animation
        setTimeout(() => {
            particleEffects.triggerBurstEffect(20);
        }, 500);
    }
    
    luckResult.innerHTML = '';
    luckResult.appendChild(contentWrapper);
    
    luckResult.classList.add('flex', 'flex-col', 'justify-center', 'flex-1', 'min-w-0', 'relative');
    requestAnimationFrame(() => {
        luckResult.classList.add('visible');
    });
}

function generateWeightedLuck() {
    // Using Bates distribution (sum of n uniform variables) to approximate a normal distribution.
    // n=4 provides a decent bell curve.
    let x = 0;
    for (let i = 0; i < 4; i++) {
        x += Math.random();
    }
    x = x / 4; // Now x is in [0, 1] with a peak at 0.5

    // Apply a power function with k < 1 to shift the peak upwards, as requested.
    // k=0.5 is tuned to produce a sub-60 score roughly 15-20% of the time.
    const skewedX = Math.pow(x, 0.5);

    // Scale to 0-100. Let's scale to 102 to make 100 a bit more reachable.
    let finalValue = Math.floor(skewedX * 102);
    
    // Cap the value at 100 to handle any edge cases where the result might exceed 100.
    if (finalValue > 100) {
        finalValue = 100;
    }
    return finalValue;
}

function openBlindBox() {
    const value = generateWeightedLuck();
    const tier = value === 100 ? 10 : Math.floor(value / 10);
    const phrases = luckTiers[tier];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    const todayStr = new Date().toISOString().split('T')[0];
    dailyLuckData = { date: todayStr, value, phrase };
    
    try {
        localStorage.setItem('dailyLuckData', JSON.stringify(dailyLuckData));
    } catch (e) {
        console.error("Failed to save luck data to localStorage", e);
    }

    displayLuckResult(dailyLuckData, true);
    luckGameState = 'result_shown';
}

function updateLuckResultText(text, animationClass = null) {
    const luckResult = document.getElementById('luck-result');
    if (!luckResult) return;
    
    luckResult.innerHTML = `<p>${text}</p>`;
    
    if (animationClass === 'luck-shake') {
        luckResult.classList.add(animationClass);
        luckResult.addEventListener('animationend', () => {
            luckResult.classList.remove(animationClass);
        }, { once: true });
    }
}

function displayCounter() {
    const luckResult = document.getElementById('luck-result');
    if (!luckResult) return;
    luckResult.innerHTML = `
        <div id="luck-counter-container" class="flex items-center justify-center" style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;">
            <span class="text-2xl font-bold" style="color: var(--text-color-secondary);">✕</span>
            <span id="luck-counter-value" class="text-5xl font-bold leading-none luck-pop-anim">${luckClickCount}</span>
        </div>
    `;
}

function updateCounter() {
    const milestoneMessage = luckMilestoneMessages[luckClickCount];
    const luckResult = document.getElementById('luck-result');

    particleEffects.triggerSingleParticle();

    if (milestoneMessage) {
        updateLuckResultText(milestoneMessage);
        luckResult.classList.remove('luck-pop-anim');
        void luckResult.offsetWidth;
        luckResult.classList.add('luck-pop-anim');
    } else {
        const counterValue = document.getElementById('luck-counter-value');
        if (counterValue) {
            counterValue.textContent = luckClickCount;
            counterValue.classList.remove('luck-pop-anim');
            void counterValue.offsetWidth;
            counterValue.classList.add('luck-pop-anim');
        } else {
            displayCounter();
        }
    }
}

function handleLuckClick() {
    clearTimeout(luckResetTimer);
    clearTimeout(countdownAnimationHandle); // NEW: Stop any countdown immediately

    if (luckGameState === 'initial') {
        openBlindBox();
        return; // No timer needed
    }

    if (luckGameState === 'result_shown') {
        if (hasPlayedGameToday) {
            luckGameState = 'counting';
            luckClickCount = 1;
            displayCounter();
        } else {
            luckGameState = 'prompt_1';
            updateLuckResultText('你今天已经开过了，还开？', 'luck-shake');
            hasPlayedGameToday = true;
        }
    } else if (luckGameState === 'prompt_1') {
        luckGameState = 'prompt_2';
        updateLuckResultText('还点？', 'luck-shake');
    } else if (luckGameState === 'prompt_2') {
        luckGameState = 'prompt_3';
        updateLuckResultText('那你点吧', 'luck-shake');
    } else if (luckGameState === 'prompt_3') {
        luckGameState = 'counting';
        luckClickCount = 1;
        displayCounter();
    } else if (luckGameState === 'counting') {
        luckClickCount++;
        updateCounter();
    }

    // Set the reset timer for all subsequent clicks
    luckResetTimer = setTimeout(() => {
        if (luckGameState === 'counting') {
            startCountdownAnimation();
        } else {
            // This handles resetting from prompt states
            displayLuckResult(dailyLuckData, false);
            luckGameState = 'result_shown';
        }
    }, 2000);
}

function startCountdownAnimation() {
    clearTimeout(countdownAnimationHandle); // Clear any ongoing animation
    let currentCount = luckClickCount;

    if (currentCount <= 0) {
        displayLuckResult(dailyLuckData, false);
        luckGameState = 'result_shown';
        return;
    }
    
    const counterValue = document.getElementById('luck-counter-value');
    // Make sure the 'x' is visible, in case it was hidden by old logic
    const counterX = document.querySelector('#luck-counter-container > span:first-child');
    if (counterX && counterX.style.opacity === '0') {
        counterX.style.opacity = 1;
    }

    function getDelay(num) {
        if (num > 20) return 15;
        if (num > 10) return 40;
        if (num > 5) return 80;
        return 150;
    }

    function countdownStep(i) {
        if (i > 0) {
            if (counterValue) {
                counterValue.textContent = i;
            }
            const nextDelay = getDelay(i - 1);
            countdownAnimationHandle = setTimeout(() => countdownStep(i - 1), nextDelay);
        } else {
            // Countdown finished. Animate out the counter, then show the result.
            const luckResult = document.getElementById('luck-result');
            const innerContent = luckResult.firstElementChild; // Use firstElementChild to get the actual DIV
            
            if (innerContent) {
                // Fade out the current content (the counter)
                innerContent.classList.add('fade-out-opacity-only');

                // After the fade-out, display the final result with a bounce
                countdownAnimationHandle = setTimeout(() => {
                    // FIX: Set isAnimated to false to prevent re-bursting
                    displayLuckResult(dailyLuckData, false); 
                    luckGameState = 'result_shown';
                    luckClickCount = 0;
                    countdownAnimationHandle = null;
                }, 300); // Wait for fade-out (0.3s) to complete.
            } else {
                // Fallback if something goes wrong, just show the result.
                displayLuckResult(dailyLuckData, false);
                luckGameState = 'result_shown';
                luckClickCount = 0;
                countdownAnimationHandle = null;
            }
        }
    }

    countdownStep(currentCount);
}

function setupLuckFeature() {
    const luckButton = document.getElementById('luck-button');
    if (!luckButton) return;

    const todayStr = new Date().toISOString().split('T')[0];
    
    try {
        const savedLuck = localStorage.getItem('dailyLuckData');
        if (savedLuck) {
            const parsedLuck = JSON.parse(savedLuck);
            if (parsedLuck.date === todayStr) {
                dailyLuckData = parsedLuck;
                displayLuckResult(dailyLuckData, false);
                luckGameState = 'result_shown';
            } else {
                localStorage.removeItem('dailyLuckData');
            }
        }
    } catch (e) {
        console.error("Failed to parse luck data from localStorage", e);
        localStorage.removeItem('dailyLuckData');
    }

    luckButton.addEventListener('click', handleLuckClick);
}
