// js/tools/timer.js

import { playSound } from '../utils.js';

export function initTimer() {
    let timerInterval = null;
    let heartInterval = null;
    let pugAnimationInterval = null;
    let totalSeconds = 300;
    let initialSeconds = 300;
    let isTimerRunning = false;
    let complexTimerData = {};
    let animationFrameId = null;
    let matterEngine = null;
    let matterRunner = null;

    const timerDisplay = document.getElementById('timer-display');
    const startStopBtn = document.getElementById('timer-start-stop');
    const resetBtn = document.getElementById('timer-reset');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const customInput = document.getElementById('timer-custom-input');
    const setCustomBtn = document.getElementById('timer-set-custom-btn');
    const progress = document.getElementById('timer-progress');
    const timerThemeSelect = document.getElementById('timer-theme');
    const timerThemes = document.querySelectorAll('.timer-theme');
    const timerLayoutContainer = document.querySelector('.timer-layout-container');

    const waterLevel = document.querySelector('#timer-theme-bucket .water');
    const flowerStem = document.getElementById('flower-stem');
    const flowerLeaves = document.querySelectorAll('#flower-stem .leaf');
    const flowerHead = document.getElementById('flower-head');
    const flowerPetals = document.querySelectorAll('#flower-head .petal');
    const marblesContainer = document.getElementById('marbles-container');
    const swimmer = document.getElementById('shark-swimmer');
    const shark = document.getElementById('shark');
    const sharkHug = document.getElementById('shark-hug');
    const pugDog = document.getElementById('pug-dog');
    const pugFoodContainer = document.getElementById('pug-food-container');

    const TIMER_THEME_KEY = 'brainPowerTimerTheme';

    function startMarblePhysics() {
        if (matterEngine) return;
        const { Engine, Runner, World, Bodies } = Matter;
        matterEngine = Engine.create({ gravity: { y: 1 } });
        matterRunner = Runner.create();
        const scene = document.querySelector('.marbles-scene');
        const containerWidth = scene.clientWidth;
        const containerHeight = scene.clientHeight;
        const ground = Bodies.rectangle(containerWidth / 2, containerHeight, containerWidth, 20, { isStatic: true, render: { visible: false } });
        const leftWall = Bodies.rectangle(0, containerHeight/2, 20, containerHeight, { isStatic: true, render: { visible: false } });
        const rightWall = Bodies.rectangle(containerWidth, containerHeight/2, 20, containerHeight, { isStatic: true, render: { visible: false } });
        World.add(matterEngine.world, [ground, leftWall, rightWall]);
        Runner.run(matterRunner, matterEngine);
        (function renderLoop() {
            animationFrameId = requestAnimationFrame(renderLoop);
            if (!matterEngine) return;
            const bodies = Matter.Composite.allBodies(matterEngine.world);
            for (let i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                if (body.isStatic || !body.domElement) continue;
                const { x, y } = body.position;
                const angle = body.angle;
                body.domElement.style.transform = `translate(${x - body.domRadius}px, ${y - body.domRadius}px) rotate(${angle}rad)`;
            }
        })();
    }

    function stopMarblePhysics() {
        if (!matterEngine) return;
        const { Runner, World, Engine } = Matter;
        Runner.stop(matterRunner);
        World.clear(matterEngine.world);
        Engine.clear(matterEngine);
        cancelAnimationFrame(animationFrameId);
        matterEngine = null;
        matterRunner = null;
        animationFrameId = null;
        marblesContainer.innerHTML = '';
    }
    
    function stopPugAnimation() {
        if (pugAnimationInterval) {
            clearInterval(pugAnimationInterval);
            pugAnimationInterval = null;
        }
    }
    
    function startPugAnimation(type, frameCount, interval) {
        stopPugAnimation();
        let currentFrame = 1;
        pugAnimationInterval = setInterval(() => {
            pugDog.style.backgroundImage = `url('assets/pug_timer/pug-${type}/${type}-frame${currentFrame}.png')`;
            currentFrame = (currentFrame % frameCount) + 1;
        }, interval);
    }
    
    function pugEatNextFood() {
        if (!isTimerRunning) return;

        const { foodItems, isPugBusy, pugPos, timePerFoodItem, eatenCount } = complexTimerData;

        if (isPugBusy || !foodItems || eatenCount >= foodItems.length) {
            return;
        }

        let closestFood = null;
        let minDistance = Infinity;

        foodItems.forEach(foodData => {
            if (!foodData.eaten) {
                const dx = foodData.pos.x - pugPos.x;
                const dy = foodData.pos.y - pugPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestFood = foodData;
                }
            }
        });

        if (closestFood) {
            closestFood.eaten = true;
            complexTimerData.eatenCount++;
            startEatingSequence(closestFood, timePerFoodItem);
        }
    }

    function startEatingSequence(foodData, duration) {
        complexTimerData.isPugBusy = true;
        stopPugAnimation();
    
        const { element: foodEl, pos: foodPos, foodType } = foodData;
    
        const travelTimeMs = Math.min(800, duration * 1000 * 0.25);
        const eatingTimeMs = (duration * 1000) - travelTimeMs;
    
        pugDog.style.transition = `left ${travelTimeMs}ms ease-in-out, bottom ${travelTimeMs}ms ease-in-out`;
    
        const foodTop = foodEl.offsetTop;
        const foodHeight = foodEl.offsetHeight;
        const pugHeight = pugDog.offsetHeight;
        const targetPugLeft = foodEl.offsetLeft + foodEl.offsetWidth - 30;
    
        pugDog.style.left = `${targetPugLeft}px`;
        pugDog.style.bottom = `calc(100% - ${foodTop + foodHeight / 2 + pugHeight / 2}px)`;
        pugDog.style.transform = 'none';
        
        complexTimerData.pugPos = { x: foodPos.x, y: foodPos.y };
    
        setTimeout(() => {
            if (!isTimerRunning) {
                complexTimerData.isPugBusy = false;
                startPugAnimation('idle', 2, 750);
                return;
            }
    
            startPugAnimation('eating', 4, 125);
    
            const timePerBite = eatingTimeMs / 4;
            for (let i = 0; i < 4; i++) {
                const foodFrame = i + 2;
                setTimeout(() => {
                    if (foodEl) foodEl.style.backgroundImage = `url('assets/pug_timer/food-${foodType}/food${foodType}-frame${foodFrame}.png')`;
                }, i * timePerBite);
            }
    
        }, travelTimeMs);
    
        setTimeout(() => {
            complexTimerData.isPugBusy = false;
            pugEatNextFood(); 
        }, duration * 1000);
    }

    function resetAllThemeStates() {
        if (heartInterval) { clearInterval(heartInterval); heartInterval = null; }
        stopPugAnimation();

        if (flowerStem) {
            flowerStem.style.height = '0px';
            flowerHead.style.transform = 'translateX(-50%) scale(0)';
            flowerHead.style.opacity = '0';

            flowerLeaves.forEach((leaf) => {
                leaf.style.opacity = '0';
                // FIX: Leaf images are pre-oriented. No need for conditional flipping.
                leaf.style.transform = 'scale(0)';
            });

            flowerPetals.forEach((p, i) => {
                 p.style.opacity = '0';
                 const baseAngle = 60 * i;
                 // FIX: Petals grow from the base. This sets the initial state for scale(0).
                 // verticalOffset = (1-0) * 56 = 56. Target Y = -65 + 56 = -9.
                 p.style.transform = `translate(-50%, -50%) rotate(${baseAngle}deg) translateY(-9px) scale(0)`;
            });
            
            flowerLeaves.forEach(l => l.classList.remove('grown'));
            flowerHead.classList.remove('grown');
            flowerPetals.forEach(p => p.classList.remove('grown'));
        }
        if (timerThemeSelect.value === 'marbles') { stopMarblePhysics(); }
        if (shark) {
            shark.style.left = '100%';
            swimmer.style.left = '10%';
            shark.classList.remove('hidden');
            swimmer.classList.remove('hidden');
            sharkHug.classList.remove('visible');
        }
        if (pugDog) {
            pugFoodContainer.innerHTML = '';
            pugDog.style.left = '50%';
            pugDog.style.bottom = '5%';
            pugDog.style.transform = 'translateX(-50%)';
            pugDog.style.backgroundImage = `url('assets/pug_timer/pug-idle/idle-frame1.png')`;
            pugDog.style.transition = 'left 0.8s ease-in-out, bottom 0.8s ease-in-out';
        }
        complexTimerData = {};
    }

    function createHeartParticle() {
        if (!sharkHug || !sharkHug.classList.contains('visible')) return;
        const heart = document.createElement('div');
        heart.className = 'heart-particle';
        const startX = Math.random() * sharkHug.offsetWidth;
        const startY = Math.random() * sharkHug.offsetHeight;
        heart.style.left = `${startX}px`;
        heart.style.top = `${startY}px`;
        sharkHug.appendChild(heart);
        setTimeout(() => { heart.remove(); }, 2000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const percentageLeft = (initialSeconds > 0) ? (totalSeconds / initialSeconds) * 100 : 0;
        const percentageDone = 100 - percentageLeft;
        const selectedTheme = timerThemeSelect.value;
        if (totalSeconds === initialSeconds && isTimerRunning) { resetAllThemeStates(); setupComplexTimers(); }
        
        if (selectedTheme === 'bar') { progress.style.width = `${percentageLeft}%`; } 
        else if (selectedTheme === 'bucket') { if (waterLevel) waterLevel.style.height = `${percentageLeft}%`; } 
        else if (selectedTheme === 'flower') {
            const STEM_END_PERCENT = 60;
            const LEAF1_START_PERCENT = 10;
            const LEAF1_END_PERCENT = 50;
            const LEAF2_START_PERCENT = 20;
            const LEAF2_END_PERCENT = 60;
            const HEAD_START_PERCENT = 55;
            const HEAD_END_PERCENT = 75;
            const PETALS_START_PERCENT = 70;
            const PETALS_END_PERCENT = 100;

            const calculatePhaseProgress = (start, end) => {
                if (percentageDone < start) return 0;
                if (percentageDone > end) return 1;
                return (percentageDone - start) / (end - start);
            };

            const stemMaxHeight = 350;
            const stemProgress = calculatePhaseProgress(0, STEM_END_PERCENT);
            const currentStemHeight = stemProgress * stemMaxHeight;
            flowerStem.style.height = `${currentStemHeight}px`;

            const potTopPosition = 110;
            const headVerticalOffset = 125;
            flowerHead.style.bottom = `${potTopPosition + currentStemHeight - headVerticalOffset}px`;

            const leaf1Progress = calculatePhaseProgress(LEAF1_START_PERCENT, LEAF1_END_PERCENT);
            if (leaf1Progress > 0) {
                flowerLeaves[0].style.opacity = '1';
                flowerLeaves[0].style.transform = `scale(${leaf1Progress})`;
            }

            const leaf2Progress = calculatePhaseProgress(LEAF2_START_PERCENT, LEAF2_END_PERCENT);
            if (leaf2Progress > 0) {
                flowerLeaves[1].style.opacity = '1';
                // FIX: The leaf2.png image is already oriented for the right side, so we remove the flip.
                flowerLeaves[1].style.transform = `scale(${leaf2Progress})`;
            }
            
            const headProgress = calculatePhaseProgress(HEAD_START_PERCENT, HEAD_END_PERCENT);
            if(headProgress > 0) {
                flowerHead.style.opacity = '1';
                flowerHead.style.transform = `translateX(-50%) scale(${headProgress})`;
            }

            if (percentageDone >= PETALS_START_PERCENT) {
                const petalsOverallProgress = calculatePhaseProgress(PETALS_START_PERCENT, PETALS_END_PERCENT);
                const progressPerPetal = 1.0 / flowerPetals.length;

                flowerPetals.forEach((petal, i) => {
                    const petalStartProgress = i * progressPerPetal;
                    const singlePetalProgress = Math.max(0, Math.min(1, (petalsOverallProgress - petalStartProgress) / progressPerPetal));
                    
                    if (singlePetalProgress > 0) {
                        petal.style.opacity = '1';
                        const baseAngle = 60 * i;
                        // FIX: To make petals grow from their base, we add a vertical offset that
                        // counteracts the scaling from the center. Petal height is ~112px.
                        const verticalOffset = (1 - singlePetalProgress) * 56; // 56 is half petal height
                        const finalTranslateY = -65 + verticalOffset;
                        
                        petal.style.transform = `translate(-50%, -50%) rotate(${baseAngle}deg) translateY(${finalTranslateY}px) scale(${singlePetalProgress})`;
                    }
                });
            }

        } else if (selectedTheme === 'marbles') {
            const { totalMarbles, timePerMarble, marbleBodies } = complexTimerData;
            if (!marbleBodies || timePerMarble === 0) return;
            const marblesThatShouldBeGone = Math.floor((initialSeconds - totalSeconds) / timePerMarble);
            const marblesToRemove = marbleBodies.length - (totalMarbles - marblesThatShouldBeGone);
            if (marblesToRemove > 0) {
                for (let i = 0; i < marblesToRemove; i++) {
                    if (marbleBodies.length > 0) {
                        const marbleBody = marbleBodies.pop();
                        Matter.World.remove(matterEngine.world, marbleBody);
                        marbleBody.domElement.classList.add('removing');
                        setTimeout(() => { if (marbleBody.domElement.parentElement) { marbleBody.domElement.parentElement.removeChild(marbleBody.domElement); } }, 500);
                    }
                }
            }
        } else if (selectedTheme === 'shark') {
            const sharkStart = 100, sharkEnd = 10;
            const swimmerPos = 10;
            const sharkPos = sharkStart - (sharkStart - sharkEnd) * (percentageDone / 100);
            shark.style.left = `${sharkPos}%`;
            swimmer.style.left = `${swimmerPos}%`;
        } else if (selectedTheme === 'pug') {
            // All pug logic is now handled by the pugEatNextFood() chain.
        }
    }

    function triggerEndAnimation() {
        playSound('assets/sounds/time-end.mp3');
        const selectedTheme = timerThemeSelect.value;
        if (selectedTheme === 'shark' && shark) {
            shark.classList.add('hidden');
            swimmer.classList.add('hidden');
            sharkHug.classList.add('visible');
            if (heartInterval) clearInterval(heartInterval);
            heartInterval = setInterval(createHeartParticle, 150);
            setTimeout(() => { if (heartInterval) clearInterval(heartInterval); }, 4000);
        } else if (selectedTheme === 'pug' && pugDog) {
            stopPugAnimation();
            startPugAnimation('happy', 2, 500);
        } else if (selectedTheme === 'marbles') {
            if (complexTimerData.marbleBodies) {
                complexTimerData.marbleBodies.forEach(body => {
                    Matter.World.remove(matterEngine.world, body);
                    body.domElement.classList.add('removing');
                    setTimeout(() => body.domElement.remove(), 500);
                });
                complexTimerData.marbleBodies = [];
            }
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    function setupComplexTimers() {
        const selectedTheme = timerThemeSelect.value;
        if (selectedTheme === 'marbles') {
            startMarblePhysics();
            marblesContainer.innerHTML = '';
            complexTimerData.marbleBodies = [];
            const numMarbles = 250;
            complexTimerData.totalMarbles = numMarbles;
            if (initialSeconds === 0) { complexTimerData.timePerMarble = 0; return; }
            complexTimerData.timePerMarble = initialSeconds / numMarbles;
            const scene = document.querySelector('.marbles-scene');

            const isFullscreen = marblesContainer.closest('.tool-card.fullscreen-mode');
            const radiusMultiplier = isFullscreen ? 0.04 : 0.035;
            const minRadius = isFullscreen ? 18 : 8;
            const maxRadius = isFullscreen ? 24 : 18;
            const radius = Math.max(minRadius, Math.min(maxRadius, scene.clientWidth * radiusMultiplier));

            for (let i = 0; i < numMarbles; i++) {
                const marbleDOM = document.createElement('div');
                marbleDOM.className = 'marble';
                marbleDOM.style.width = `${radius * 2}px`;
                marbleDOM.style.height = `${radius * 2}px`;
                marbleDOM.style.backgroundImage = `url('assets/marbles_timer/marble${(i % 5) + 1}.png')`;
                marblesContainer.appendChild(marbleDOM);
                const marbleBody = Matter.Bodies.circle(radius + Math.random() * (scene.clientWidth - radius * 2), radius + Math.random() * (scene.clientHeight / 2), radius, { restitution: 0.6, friction: 0.01, slop: 0.5 });
                marbleBody.domElement = marbleDOM;
                marbleBody.domRadius = radius;
                complexTimerData.marbleBodies.push(marbleBody);
            }
            Matter.World.add(matterEngine.world, complexTimerData.marbleBodies);
        } else if (selectedTheme === 'pug') {
            pugFoodContainer.innerHTML = '';
            
            let gridPositions = [];
            for(let row = 0; row < 6; row++) {
                for(let col = 0; col < 10; col++) {
                    if (row < 2 && col > 3 && col < 6) continue;
                    gridPositions.push({ top: 5 + row * 15, left: 5 + col * 9 });
                }
            }
            shuffleArray(gridPositions);
            
            const numFood = Math.max(1, Math.min(gridPositions.length, Math.floor(initialSeconds / 5)));
            
            complexTimerData.foodItems = [];
            for (let i = 0; i < numFood; i++) {
                const food = document.createElement('div');
                food.className = 'pug-food-item';
                food.id = `food-${i}`;
                const pos = gridPositions[i];
                food.style.top = `${pos.top}%`;
                food.style.left = `${pos.left}%`;
                
                const foodType = Math.floor(Math.random() * 3) + 1;
                food.dataset.foodType = foodType;
                food.style.backgroundImage = `url('assets/pug_timer/food-${foodType}/food${foodType}-frame1.png')`;
                
                pugFoodContainer.appendChild(food);
                
                complexTimerData.foodItems.push({
                    element: food,
                    pos: { x: food.offsetLeft + food.offsetWidth / 2, y: food.offsetTop + food.offsetHeight / 2 },
                    eaten: false,
                    foodType: foodType
                });
            }
            
            complexTimerData.timePerFoodItem = initialSeconds > 0 ? initialSeconds / numFood : 0;
            complexTimerData.eatenCount = 0;
            complexTimerData.isPugBusy = false;
            
            const pugRect = pugDog.getBoundingClientRect();
            const containerRect = pugFoodContainer.getBoundingClientRect();
            complexTimerData.pugPos = {
                x: (pugRect.left - containerRect.left) + (pugRect.width / 2),
                y: (pugRect.top - containerRect.top) + (pugRect.height / 2)
            };

            pugDog.style.backgroundImage = `url('assets/pug_timer/pug-idle/idle-frame1.png')`;
        }
    }

    function setTimer(seconds) {
        if (isTimerRunning) stopTimer();
        totalSeconds = Math.max(0, seconds);
        initialSeconds = Math.max(0, seconds);
        resetAllThemeStates();
        setupComplexTimers();
        updateTimerDisplay();

        if (timerThemeSelect.value === 'pug' && !isTimerRunning) {
            startPugAnimation('idle', 2, 750);
        }
    }

    function startTimer() {
        if (totalSeconds <= 0 || isTimerRunning) return;
        isTimerRunning = true;
        startStopBtn.textContent = 'Pause';
        
        if (timerThemeSelect.value === 'pug') {
            startPugAnimation('idle', 2, 750);
            setTimeout(pugEatNextFood, 100); 
        }
        
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            if (!isTimerRunning) return;
            totalSeconds--;
            updateTimerDisplay();
            if (totalSeconds <= 0) {
                stopTimer();
                triggerEndAnimation();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        if (heartInterval) { clearInterval(heartInterval); heartInterval = null; }
        isTimerRunning = false;
        if (timerThemeSelect.value === 'pug') {
            stopPugAnimation();
            pugDog.style.backgroundImage = `url('assets/pug_timer/pug-idle/idle-frame1.png')`;
            complexTimerData.isPugBusy = false;
        }
        startStopBtn.textContent = 'Start';
    }

    startStopBtn.addEventListener('click', () => { if (isTimerRunning) { stopTimer(); } else { startTimer(); } });
    
    resetBtn.addEventListener('click', () => {
        setTimer(initialSeconds);
    });

    presetBtns.forEach(button => { button.addEventListener('click', () => { const seconds = parseInt(button.dataset.time, 10); setTimer(seconds); customInput.value = ''; }); });
    setCustomBtn.addEventListener('click', () => {
        const timeParts = customInput.value.split(':').map(part => parseInt(part, 10) || 0);
        let seconds = 0;
        if (timeParts.length === 2) { seconds = timeParts[0] * 60 + timeParts[1]; } 
        else if (timeParts.length === 1) { seconds = timeParts[0]; }
        setTimer(seconds);
    });
    timerThemeSelect.addEventListener('change', () => {
        const wasRunning = isTimerRunning;
        if (wasRunning) stopTimer();
        resetAllThemeStates();
        const selectedTheme = timerThemeSelect.value;
        const sideBySideThemes = ['bucket', 'flower', 'marbles', 'pug'];
        timerLayoutContainer.classList.toggle('is-shark-theme', selectedTheme === 'shark');
        timerThemes.forEach(theme => { theme.classList.toggle('active', theme.id === `timer-theme-${selectedTheme}`); });
        timerLayoutContainer.classList.toggle('side-by-side-theme-active', sideBySideThemes.includes(selectedTheme));
        localStorage.setItem(TIMER_THEME_KEY, selectedTheme);
        setTimer(initialSeconds);
        if(wasRunning) startTimer();
    });
    
    function loadTimerTheme() {
        const savedTheme = localStorage.getItem(TIMER_THEME_KEY) || 'bar';
        timerThemeSelect.value = savedTheme;
        timerThemeSelect.dispatchEvent(new Event('change'));
    }
    loadTimerTheme();
    setTimer(initialSeconds);
}