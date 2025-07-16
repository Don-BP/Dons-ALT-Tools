// js/tools/dice-roller.js

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.19.0/dist/cannon-es.js';
import { playSound } from '../utils.js';

// --- Module-level scope for renderer and camera so they can be accessed by other functions ---
let scene, camera, renderer, world, floorMesh;
let dice = [];
const canvasContainer = document.getElementById('dice-canvas-container');
const TABLE_IMAGE_KEY = 'brainPowerDiceTableImage';

function forceResize() {
    if (!renderer || !camera || !canvasContainer) return;
    
    const { clientWidth, clientHeight } = canvasContainer;
    
    if (clientWidth === 0 || clientHeight === 0) return;

    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
}

function enterFullscreen() {
    setTimeout(forceResize, 50);
}

function exitFullscreen() {
    // A small delay helps if the transition is animated
    setTimeout(forceResize, 50);
}

function init() {
    // --- DOM Elements ---
    const rollBtn = document.getElementById('dr-roll-btn');
    const diceCountSelect = document.getElementById('dr-dice-count');
    const gravitySelect = document.getElementById('dr-gravity-level'); 
    const resultPopup = document.getElementById('dice-result-popup');
    const resultTotalDisplay = document.getElementById('dice-result-total');
    const resultCloseBtn = document.getElementById('dice-result-close-btn');
    const tableImageUpload = document.getElementById('dr-table-image-upload');
    const removeTableImageBtn = document.getElementById('dr-remove-table-image-btn');

    // --- State ---
    let isRolling = false;
    let settleTimeout, failsafeTimeout;

    // --- Constants ---
    const DICE_SCALE = 4.0; 
    const GRAVITY_LEVELS = { 
        '1': -90, // Normal
        '2': -50, // Floaty
        '3': -20, // Super Floaty
        '4': -5   // Moon
    };
    // NEW: Define different failsafe timeouts for each gravity level (in milliseconds)
    const FAILSAFE_TIMEOUTS = {
        '1': 2500, // Normal: 2.5 seconds
        '2': 4000, // Floaty: 4 seconds
        '3': 6000, // Super Floaty: 6 seconds
        '4': 8000  // Moon: 8 seconds
    };

    // --- Setup ---
    function setupScene() {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        canvasContainer.appendChild(renderer.domElement);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 100);
        camera.position.set(0, 18, 18);
        camera.lookAt(0, 0, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const initialGravityY = GRAVITY_LEVELS[gravitySelect.value] || -90;
        world = new CANNON.World({ gravity: new CANNON.Vec3(0, initialGravityY, 0) });

        const floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
        floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        world.addBody(floorBody);
        
        floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 }));
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.receiveShadow = true;
        scene.add(floorMesh);
        scene.add(new THREE.GridHelper(20, 20, 0x000000, 0x000000));
        
        const wallShapes = [
            { pos: [0, 0, -10], rot: [0, 0, 0] }, { pos: [0, 0, 10], rot: [0, Math.PI, 0] },
            { pos: [-10, 0, 0], rot: [0, Math.PI / 2, 0] }, { pos: [10, 0, 0], rot: [0, -Math.PI / 2, 0] }
        ];
        wallShapes.forEach(ws => {
            const wall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
            wall.position.set(...ws.pos);
            wall.quaternion.setFromEuler(...ws.rot);
            world.addBody(wall);
        });
        
        loadTableImage();
        forceResize();
    }
    
    function updateGravity() {
        if (!world || !gravitySelect) return;
        const newGravityY = GRAVITY_LEVELS[gravitySelect.value];
        if (newGravityY) {
            world.gravity.y = newGravityY;
        }
    }

    // --- Dice Creation ---
    function createFaceTexture(text, size, bgColor) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;
        
        context.fillStyle = bgColor;
        context.fillRect(0, 0, size, size);
        
        context.font = `bold ${size * 0.7}px Arial`;
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, size / 2, size / 2 + size * 0.05);
        
        return new THREE.CanvasTexture(canvas);
    }
    
    function createDie() {
        const geometry = new THREE.BoxGeometry(DICE_SCALE, DICE_SCALE, DICE_SCALE);
        const dieColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.6).getStyle();
        
        const values = [6, 1, 2, 5, 3, 4];
        const materials = values.map(value => new THREE.MeshStandardMaterial({
            map: createFaceTexture(value, 128, dieColor),
            color: 0xffffff,
            roughness: 0.2, metalness: 0.1
        }));
        
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        
        const shape = new CANNON.Box(new CANNON.Vec3(DICE_SCALE/2, DICE_SCALE/2, DICE_SCALE/2));
        const body = new CANNON.Body({ mass: 1, shape });
        body.allowSleep = true;
        body.sleepSpeedLimit = 0.2;
        body.sleepTimeLimit = 0.5;

        return { mesh, body, values };
    }
    
    function applyTableTexture(dataUrl) {
        new THREE.TextureLoader().load(dataUrl, (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            floorMesh.material.map = texture;
            floorMesh.material.color.set(0xffffff);
            floorMesh.material.needsUpdate = true;
        });
    }

    function removeTableTexture() {
        floorMesh.material.map = null;
        floorMesh.material.color.set(0xcccccc);
        floorMesh.material.needsUpdate = true;
    }

    function loadTableImage() {
        const savedImage = localStorage.getItem(TABLE_IMAGE_KEY);
        if (savedImage) {
            applyTableTexture(savedImage);
            removeTableImageBtn.classList.remove('hidden');
        }
    }

    function rollTheDice() {
        if (isRolling) return;
        isRolling = true;
        rollBtn.disabled = true;
        resultPopup.classList.add('hidden');
        
        dice.forEach(d => {
            scene.remove(d.mesh);
            world.removeBody(d.body);
        });
        dice = [];
        
        const count = parseInt(diceCountSelect.value);
        
        for (let i = 0; i < count; i++) {
            const die = createDie();
            die.body.position.set(Math.random() * 6 - 3, 5 + i * 4, Math.random() * 6 - 3);
            die.body.quaternion.setFromEuler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
            die.body.angularVelocity.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
            
            dice.push(die);
            scene.add(die.mesh);
            world.addBody(die.body);
        }
        
        try {
            playSound('assets/sounds/spin_start.mp3'); 
        } catch (e) {
            console.warn("Could not play sound, but dice will still roll.", e);
        }
        
        clearTimeout(settleTimeout);
        clearTimeout(failsafeTimeout);
        checkIfSettled();

        // MODIFIED: Use the dynamic timeout based on the current gravity selection
        const gravityLevel = gravitySelect.value;
        const timeoutDuration = FAILSAFE_TIMEOUTS[gravityLevel] || 2500; // Default to 2.5s if not found
        failsafeTimeout = setTimeout(showResult, timeoutDuration);
    }
    
    function checkIfSettled() {
        if (!isRolling) return;

        let settled = dice.every(d => {
            const vel = d.body.velocity.lengthSquared();
            const angVel = d.body.angularVelocity.lengthSquared();
            return vel < 0.01 && angVel < 0.01;
        });

        if (settled && dice.length > 0) {
            showResult();
        } else {
            settleTimeout = setTimeout(checkIfSettled, 100);
        }
    }
    
    function showResult() {
        if (!isRolling) return; 
        isRolling = false;
        rollBtn.disabled = false;
        clearTimeout(settleTimeout);
        clearTimeout(failsafeTimeout);

        let total = 0;
        dice.forEach(die => {
            total += getD6Result(die);
        });
        resultTotalDisplay.textContent = total;
        resultPopup.classList.remove('hidden');
        try {
            playSound('assets/sounds/winner_reveal.mp3');
        } catch (e) {
            console.warn("Could not play sound for result.", e);
        }
    }

    function getD6Result(die) {
        const up = new CANNON.Vec3(0, 1, 0);
        let maxDot = -Infinity;
        let topFaceIndex = -1;
        const localAxes = [
            new CANNON.Vec3(1, 0, 0), new CANNON.Vec3(-1, 0, 0),
            new CANNON.Vec3(0, 1, 0), new CANNON.Vec3(0, -1, 0),
            new CANNON.Vec3(0, 0, 1), new CANNON.Vec3(0, 0, -1)
        ];
        for (let i = 0; i < localAxes.length; i++) {
            const worldAxis = die.body.quaternion.vmult(localAxes[i]);
            const dot = worldAxis.dot(up);
            if (dot > maxDot) {
                maxDot = dot;
                topFaceIndex = i;
            }
        }
        return die.values[topFaceIndex];
    }
    
    function animate() {
        requestAnimationFrame(animate);
        world.step(1 / 60);
        dice.forEach(d => {
            d.mesh.position.copy(d.body.position);
            d.mesh.quaternion.copy(d.body.quaternion);
        });
        renderer.render(scene, camera);
    }
    
    rollBtn.addEventListener('click', rollTheDice);
    resultCloseBtn.addEventListener('click', () => resultPopup.classList.add('hidden'));
    gravitySelect.addEventListener('change', updateGravity);

    tableImageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                localStorage.setItem(TABLE_IMAGE_KEY, dataUrl);
                applyTableTexture(dataUrl);
                removeTableImageBtn.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
    
    removeTableImageBtn.addEventListener('click', () => {
        localStorage.removeItem(TABLE_IMAGE_KEY);
        removeTableTexture();
        removeTableImageBtn.classList.add('hidden');
    });

    const resizeObserver = new ResizeObserver(forceResize);
    resizeObserver.observe(canvasContainer);

    setupScene();
    animate();
}

export const DiceRoller = {
    init: init,
    enterFullscreen: enterFullscreen,
    exitFullscreen: exitFullscreen
};