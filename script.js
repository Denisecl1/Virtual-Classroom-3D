import * as THREE from 'three';
// Importamos PointerLockControls en lugar de OrbitControls
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// --- CONFIGURACIÓN PRINCIPAL ---
const contenedor = document.getElementById("contenedor3D");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

// --- CAMARA Y EL CARRITO (DOLLY) PARA VR ---
const camera = new THREE.PerspectiveCamera(75, contenedor.clientWidth / contenedor.clientHeight, 0.1, 1000);

// Creamos un carrito virtual que transportará la cámara
// y que será lo que movemos por el salón (tanto WASD como VR gaze)
const dolly = new THREE.Group();
scene.add(dolly);

// Metemos la cámara al carrito (posición relativa 0,0,0)
dolly.add(camera);
// Posición inicial del usuario (carrito) en el salón (2 metros alto, 8 metros atrás)
dolly.position.set(0, 2, 8); 

// --- RENDERIZADOR ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
renderer.xr.enabled = true; // Activar WebXR
renderer.shadowMap.enabled = true; // Activar sombras
contenedor.appendChild(renderer.domElement);

// --- BOTÓN VR ---
document.body.appendChild(VRButton.createButton(renderer));

// --- ILUMINACIÓN ---
// HemisphereLight para interiores (luz suave de techo/piso)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// Luz direccional (como una ventana)
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true; // Que proyecte sombras
scene.add(dirLight);

// --- GRID (Suelo de referencia) ---
const grid = new THREE.GridHelper(50, 50, 0x444444, 0x888888);
scene.add(grid);

// --- CARGAR MODELO ---
const loader = new GLTFLoader();
loader.load(
    'modelo.glb',
    function (gltf) {
        const modelo = gltf.scene;
        // Mantenemos tu escala actual
        modelo.scale.set(.90, .90, .90);
        modelo.position.set(0, 0, 0);

        // Sombras
        modelo.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                // Asegurar que los materiales básicos no se rompan
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
// Ahora PointerLockControls se engancha al cuerpo entero para bloquear mouse
const controls = new PointerLockControls(camera, document.body);

// Variables de estado del teclado
let moveForwardPC = false;
let moveBackwardPC = false;
let moveLeftPC = false;
let moveRightPC = false;
let prevTimePC = performance.now();
const velocityPC = new THREE.Vector3();
const directionPC = new THREE.Vector3();

// Escuchas del teclado
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

// Click para entrar en modo WASD
contenedor.addEventListener('click', () => {
    controls.lock();
});

// Ocultar/Mostrar instrucciones
const instructionsBox = document.getElementById('instructions');
controls.addEventListener('lock', () => {
    if (instructionsBox) instructionsBox.style.display = 'none';
});
controls.addEventListener('unlock', () => {
    if (instructionsBox) instructionsBox.style.display = 'block';
});

// --- SISTEMA DE CONTROLES (VR BOX - GAZE-TO-WALK) ---
let lastTimeVR = performance.now();
const directionVR = new THREE.Vector3();

// --- RESPONSIVE ---
window.addEventListener('resize', () => {
    camera.aspect = contenedor.clientWidth / contenedor.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
});

// --- BUCLE DE ANIMACIÓN PRINCIPAL ---
renderer.setAnimationLoop(() => {
    const currentTime = performance.now();

    // -- LOGICA PC (WASD) --
    if (controls.isLocked === true) {
        const deltaPC = (currentTime - prevTimePC) / 1000;

        // Fricción (frenado suave)
        velocityPC.x -= velocityPC.x * 10.0 * deltaPC;
        velocityPC.z -= velocityPC.z * 10.0 * deltaPC;

        directionPC.z = Number(moveForwardPC) - Number(moveBackwardPC);
        directionPC.x = Number(moveRightPC) - Number(moveLeftPC);
        directionPC.normalize(); // Asegurar velocidad constante en diagonal

        // Velocidad (ajustar el 40 para más rápido/lento)
        if (moveForwardPC || moveBackwardPC) velocityPC.z -= directionPC.z * 40.0 * deltaPC;
        if (moveLeftPC || moveRightPC) velocity.x -= directionPC.x * 40.0 * deltaPC;

        // Movemos el Carrito (Dolly), no la cámara base
        controls.moveRight(-velocityPC.x * deltaPC);
        controls.moveForward(-velocityPC.z * deltaPC);
    }
    prevTimePC = currentTime;

    // -- LOGICA VR BOX (Caminar por mirada) --
    // Solo activamos si estamos en una sesión VR activa en el celular
    if (renderer.xr.isPresenting) {
        const deltaVR = (currentTime - lastTimeVR) / 1000;

        // Obtenemos hacia dónde está mirando la cabeza (cámara)
        camera.getWorldDirection(directionVR);

        // GazeWalk logic: Si miras hacia el suelo (inclinación negativa en Y)
        // El umbral '-0.3' significa que estás mirando la cuadrícula del suelo.
        if (directionVR.y < -0.3) {
            // Caminamos hacia adelante en el plano horizontal (seteamos Y a 0)
            directionVR.y = 0;
            directionVR.normalize();
            // Velocidad de caminata VR (ajustar el 3.0 para velocidad deseada)
            dolly.position.addScaledVector(directionVR, 3.0 * deltaVR); 
        }
    }
    lastTimeVR = currentTime;

    // Renderizado
    renderer.render(scene, camera);
});