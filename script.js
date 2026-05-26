import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// --- CONFIGURACIÓN PRINCIPAL ---
const contenedor = document.getElementById("contenedor3D");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020); // Puedes cambiarlo a tu color de cielo si gustas

// --- CAMARA Y EL CARRITO (DOLLY) PARA VR ---
const camera = new THREE.PerspectiveCamera(75, contenedor.clientWidth / contenedor.clientHeight, 0.1, 1000);

const dolly = new THREE.Group();
scene.add(dolly);
dolly.add(camera);

// 1. SOLUCIÓN A LA POSICIÓN: Aquí decides dónde apareces al iniciar.
// X (izquierda/derecha), Y (altura), Z (adelante/atrás). 
// ¡CLAVE PARA VR!: Ponemos la altura (Y) en 0. Así el visor usa tu altura física real en el suelo.
// Puse "3" y "3" para sacarte de la pared. Si sigues en una butaca o pared, cambia estos "3" por otros números (ej. -2, 5, etc.) hasta que caigas en el pasillo.
dolly.position.set(3, 0, 3); 

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
        
        // Obtenemos hacia dónde apunta tu cabeza
        camera.getWorldDirection(directionVR);
        directionVR.y = 0; // Mantener el movimiento plano sobre el piso
        directionVR.normalize();
        
        // Calculamos el vector lateral (para dar pasos de lado si el joystick lo permite)
        rightVR.crossVectors(upVector, directionVR).normalize();

        // Detectar Control Bluetooth (Gamepad API)
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp) {
                // Ejes del joystick (Normalmente axis 1 es arriba/abajo, axis 0 es izquierda/derecha)
                const axisY = gp.axes[1] || 0; 
                const axisX = gp.axes[0] || 0;

                // Zona muerta (para que no camine solo si el joystick está un poquito flojo)
                if (Math.abs(axisY) > 0.1 || Math.abs(axisX) > 0.1) {
                    gamepadMoved = true;
                    // Velocidad de caminata en VR (Ajusta el 3.0 si quieres ir más rápido o lento)
                    dolly.position.addScaledVector(directionVR, -axisY * 3.0 * delta);
                    dolly.position.addScaledVector(rightVR, axisX * 3.0 * delta);
                }
            }
        }

        // Respaldo: Algunos controles de VR Box en modo "@" o "Key" mandan señales de teclado en lugar de joystick
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