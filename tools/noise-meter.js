// js/tools/noise-meter.js

export function initNoiseMeter() {
    // --- DOM Elements ---
    const toolCard = document.getElementById('noise-meter-tool');
    const startBtn = document.getElementById('nm-start-btn');
    const sensitivitySlider = document.getElementById('nm-sensitivity');
    const sensitivityValue = document.getElementById('nm-sensitivity-value');
    const themeSelect = document.getElementById('nm-theme-select');
    const visualContainer = document.getElementById('nm-visual-container');
    const volumeMeterFill = document.getElementById('nm-volume-meter-fill');
    const statusText = document.getElementById('nm-status');
    
    // Theme-specific elements
    const catImage = document.getElementById('nm-cat-image');
    const campfireImage = document.getElementById('nm-campfire-image');
    const windyImage = document.getElementById('nm-windy-image');


    // --- State ---
    let audioContext;
    let microphoneStream;
    let analyser;
    let animationFrameId;
    let isActive = false;
    let lastKnownState = 1; // Generic state for any theme

    // --- Core Functions ---

    /**
     * Updates the visual representation of the current volume.
     * @param {number} volume - A value from 0 to 100.
     */
    function updateVolumeMeter(volume) {
        volumeMeterFill.style.width = `${volume}%`;
        
        // Change color based on volume
        if (volume < 40) {
            volumeMeterFill.style.backgroundColor = '#5cb85c'; // Green
        } else if (volume < 75) {
            volumeMeterFill.style.backgroundColor = '#f0ad4e'; // Yellow
        } else {
            volumeMeterFill.style.backgroundColor = '#d9534f'; // Red
        }
    }

    /**
     * Updates the active theme's visual state based on the volume.
     * @param {number} volume - A value from 0 to 100.
     */
    function updateThemeVisuals(volume) {
        let newState;
        if (volume < 15) {
            newState = 1;
        } else if (volume < 35) {
            newState = 2;
        } else if (volume < 60) {
            newState = 3;
        } else if (volume < 85) {
            newState = 4;
        } else {
            newState = 5;
        }

        // Only update the image source if the state has changed to prevent flickering
        if (newState === lastKnownState) {
            return;
        }
        
        lastKnownState = newState;
        const selectedTheme = themeSelect.value;

        switch (selectedTheme) {
            case 'cat':
                catImage.src = `assets/noise-meter/cat-state${newState}.png`;
                break;
            case 'campfire':
                campfireImage.src = `assets/noise-meter/fire-state${newState}.png`;
                break;
            case 'windy':
                windyImage.src = `assets/noise-meter/windy-state${newState}.png`;
                break;
        }
    }

    /**
     * The main loop that reads microphone data and updates the UI.
     */
    function updateLoop() {
        if (!isActive) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (const amplitude of dataArray) {
            sum += amplitude * amplitude;
        }
        const average = Math.sqrt(sum / dataArray.length);

        // Normalize and apply sensitivity
        // We use a non-linear scale and clamp to make it feel more responsive
        const sensitivity = parseFloat(sensitivitySlider.value);
        const normalizedVolume = (average / 180) * 100; // 140 is an empirical value that works well
        const finalVolume = Math.min(100, normalizedVolume * sensitivity);

        updateVolumeMeter(finalVolume);
        updateThemeVisuals(finalVolume);

        animationFrameId = requestAnimationFrame(updateLoop);
    }
    
    /**
     * Starts the microphone and the analysis loop.
     */
    async function startMeter() {
        if (isActive) return;

        try {
            // Get microphone access
            microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            // Setup Web Audio API
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const source = audioContext.createMediaStreamSource(microphoneStream);
            source.connect(analyser);

            // Start the loop
            isActive = true;
            updateLoop();

            // Update UI
            startBtn.textContent = 'Stop Meter';
            statusText.textContent = 'Listening...';
            statusText.style.color = '#5cb85c';
            toolCard.classList.add('is-active');

        } catch (err) {
            console.error('Error accessing microphone:', err);
            statusText.textContent = 'Microphone access denied!';
            statusText.style.color = '#d9534f';
        }
    }

    /**
     * Stops the microphone and the analysis loop, releasing all resources.
     */
    function stopMeter() {
        if (!isActive) return;

        // Stop the animation loop
        cancelAnimationFrame(animationFrameId);

        // Stop the microphone track
        if (microphoneStream) {
            microphoneStream.getTracks().forEach(track => track.stop());
        }

        // Close the audio context
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close();
        }

        // Reset state
        isActive = false;
        audioContext = null;
        microphoneStream = null;

        // Update UI
        startBtn.textContent = 'Start Meter';
        statusText.textContent = 'Meter is off.';
        statusText.style.color = '#555';
        updateVolumeMeter(0);
        toolCard.classList.remove('is-active');
    }

    // --- Event Listeners ---

    startBtn.addEventListener('click', () => {
        if (isActive) {
            stopMeter();
        } else {
            startMeter();
        }
    });

    sensitivitySlider.addEventListener('input', (e) => {
        sensitivityValue.textContent = parseFloat(e.target.value).toFixed(1);
    });

    themeSelect.addEventListener('change', (e) => {
        // Hide all theme divs
        visualContainer.querySelectorAll('.nm-theme').forEach(themeDiv => {
            themeDiv.classList.remove('active');
        });
        // Show the selected one
        const activeThemeDiv = document.getElementById(`nm-theme-${e.target.value}`);
        if (activeThemeDiv) {
            activeThemeDiv.classList.add('active');
        }
        
        // Reset state for the new theme
        lastKnownState = 1;
        switch (e.target.value) {
            case 'cat':
                catImage.src = 'assets/noise-meter/cat-state1.png';
                break;
            case 'campfire':
                campfireImage.src = 'assets/noise-meter/fire-state1.png';
                break;
            case 'windy':
                windyImage.src = 'assets/noise-meter/windy-state1.png';
                break;
        }
    });

    // --- Initial Setup ---
    sensitivityValue.textContent = parseFloat(sensitivitySlider.value).toFixed(1);
    // Trigger the change event to set the initial theme correctly
    themeSelect.dispatchEvent(new Event('change'));
}