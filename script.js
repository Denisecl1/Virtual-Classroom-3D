import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// --- CONFIGURACIÓN PRINCIPAL ---
const contenedor = document.getElementById("contenedor3D");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

// --- CAMARA Y EL CARRITO (DOLLY) PARA VR ---
const camera = new THREE.PerspectiveCamera(75, contenedor.clientWidth / contenedor.clientHeight, 0.1, 1000);

const dolly = new THREE.Group();
scene.add(dolly);
dolly.add(camera);

// 1. POSICIÓN INICIAL DE PRUEBA: Afuera y arriba del salón
// Cuando encuentres tus coordenadas ideales en la consola, cámbialas aquí
dolly.position.set(0, 5, 15); 

// --- RENDERIZADOR ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
renderer.xr.enabled = true; 
renderer.shadowMap.enabled = true; 
contenedor.appendChild(renderer.domElement);

// --- BOTÓN VR ---
document.body.appendChild(VRButton.createButton(renderer));

// --- ILUMINACIÓN ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true; 
scene.add(dirLight);

// --- CARGAR MODELO ---
const loader = new GLTFLoader();
loader.load(
    'modelo.glb',
    function (gltf) {
        const modelo = gltf.scene;
        modelo.scale.set(.90, .90, .90);
        modelo.position.set(0, 0, 0);

        modelo.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material.isMeshBasicMaterial) {
                    node.material = new THREE.MeshPhongMaterial({ color: node.material.color });
                }
            }
        });

        scene.add(modelo);
        console.log("Modelo cargado con éxito");
    }
);

// --- SISTEMA DE CONTROLES (PC - WASD) ---
const controls = new PointerLockControls(camera, document.body);

let moveForwardPC = false;
let moveBackwardPC = false;
let moveLeftPC = false;
let moveRightPC = false;
let prevTimePC = performance.now();
const velocityPC = new THREE.Vector3();
const directionPC = new THREE.Vector3();

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForwardPC = true; break;
        case 'ArrowLeft': case 'KeyA': moveLeftPC = true; break;
        case 'ArrowDown': case 'KeyS': moveBackwardPC = true; break;
        case 'ArrowRight': case 'KeyD': moveRightPC = true; break;
    }
});
document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForwardPC = false; break;
        case 'ArrowLeft': case 'KeyA': moveLeftPC = false; break;
        case 'ArrowDown': case 'KeyS': moveBackwardPC = false; break;
        case 'ArrowRight': case 'KeyD': moveRightPC = false; break;
    }
});

contenedor.addEventListener('click', () => { controls.lock(); });

const instructionsBox = document.getElementById('instructions');
controls.addEventListener('lock', () => {
    if (instructionsBox) instructionsBox.style.display = 'none';
});
controls.addEventListener('unlock', () => {
    if (instructionsBox) instructionsBox.style.display = 'block';
});

// --- TRUCO PARA ENCONTRAR COORDENADAS ---
// Al hacer click, imprimirá la posición exacta en la consola
document.addEventListener('mousedown', () => {
    if (controls.isLocked) {
        console.log(`%cTus coordenadas ideales son: X: ${dolly.position.x.toFixed(2)}, Y: ${dolly.position.y.toFixed(2)}, Z: ${dolly.position.z.toFixed(2)}`, 'color: #0dcaf0; font-size: 14px; font-weight: bold;');
    }
});
// -----------------------------------------

// Variables para el movimiento en VR
const directionVR = new THREE.Vector3();
const rightVR = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

// --- RESPONSIVE ---
window.addEventListener('resize', () => {
    camera.aspect = contenedor.clientWidth / contenedor.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
});

// --- BUCLE DE ANIMACIÓN PRINCIPAL ---
renderer.setAnimationLoop(() => {
    const currentTime = performance.now();
    const delta = (currentTime - prevTimePC) / 1000;

    // -- LÓGICA PC (WASD) --
    if (controls.isLocked === true) {
        velocityPC.x -= velocityPC.x * 10.0 * delta;
        velocityPC.z -= velocityPC.z * 10.0 * delta;

        directionPC.z = Number(moveForwardPC) - Number(moveBackwardPC);
        directionPC.x = Number(moveRightPC) - Number(moveLeftPC);
        directionPC.normalize(); 

        if (moveForwardPC || moveBackwardPC) velocityPC.z -= directionPC.z * 40.0 * delta;
        if (moveLeftPC || moveRightPC) velocityPC.x -= directionPC.x * 40.0 * delta;

        controls.moveRight(-velocityPC.x * delta);
        controls.moveForward(-velocityPC.z * delta);
    }

    // -- 2. LÓGICA VR CON CONTROL BLUETOOTH --
    if (renderer.xr.isPresenting) {
        let gamepadMoved = false;
        
        camera.getWorldDirection(directionVR);
        directionVR.y = 0; 
        directionVR.normalize();
        
        rightVR.crossVectors(upVector, directionVR).normalize();

        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp) {
                const axisY = gp.axes[1] || 0; 
                const axisX = gp.axes[0] || 0;

                if (Math.abs(axisY) > 0.1 || Math.abs(axisX) > 0.1) {
                    gamepadMoved = true;
                    dolly.position.addScaledVector(directionVR, -axisY * 3.0 * delta);
                    dolly.position.addScaledVector(rightVR, axisX * 3.0 * delta);
                }
            }
        }

        if (!gamepadMoved) {
            if (moveForwardPC) dolly.position.addScaledVector(directionVR, 3.0 * delta);
            if (moveBackwardPC) dolly.position.addScaledVector(directionVR, -3.0 * delta);
            if (moveLeftPC) dolly.position.addScaledVector(rightVR, -3.0 * delta);
            if (moveRightPC) dolly.position.addScaledVector(rightVR, 3.0 * delta);
        }
    }

    prevTimePC = currentTime;
    renderer.render(scene, camera);
});