import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/webxr/VRButton.js';

const contenedor = document.getElementById("contenedor3D");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Cielo azul claro

// --- CAMARA Y EL CARRITO (DOLLY) PARA VR ---
const camera = new THREE.PerspectiveCamera(75, contenedor.clientWidth / contenedor.clientHeight, 0.1, 1000);

const dolly = new THREE.Group();
// Posición inicial segura dentro del salón (puedes ajustar el '2' para estar más cerca/lejos)
dolly.position.set(0, 1.6, 5); 
scene.add(dolly);

dolly.add(camera);
camera.position.set(0, 0, 0); 
camera.lookAt(0, 1.6, 0); // Mirar hacia adelante a la altura de los ojos
// ------------------------------------------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
renderer.xr.enabled = true; // Activar WebXR
renderer.shadowMap.enabled = true; 
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
contenedor.appendChild(renderer.domElement);

// Botón VR flotante sobre el footer
const vrButton = VRButton.createButton(renderer);
vrButton.style.position = 'absolute';
vrButton.style.bottom = '10vh';
vrButton.style.zIndex = '1000';
document.body.appendChild(vrButton);

// --- CONTROLES PC (W,A,S,D) ---
const controls = new PointerLockControls(camera, document.body);

let moveForwardPC = false;
let moveBackwardPC = false;
let moveLeftPC = false;
let moveRightPC = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const instrucciones = document.getElementById('instrucciones');
const clickPrompter = document.getElementById('click-prompter');

if (instrucciones && clickPrompter) {
    clickPrompter.addEventListener('click', function () { controls.lock(); });
    controls.addEventListener('lock', function () {
        instrucciones.style.pointerEvents = 'none'; 
        clickPrompter.style.display = 'none';       
    });
    controls.addEventListener('unlock', function () {
        instrucciones.style.pointerEvents = 'auto'; 
        clickPrompter.style.display = 'block';      
    });
}

const onKeyDown = function (event) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForwardPC = true; break;
        case 'ArrowLeft': case 'KeyA': moveLeftPC =PC; break; // Corregido moveLeftPC
        case 'ArrowDown': case 'KeyS': moveBackwardPC = true; break;
        case 'ArrowRight': case 'KeyD': moveRightPC = true; break;
    }
};

const onKeyUp = function (event) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForwardPC = false; break;
        case 'ArrowLeft': case 'KeyA': moveLeftPC = false; break;
        case 'ArrowDown': case 'KeyS': moveBackwardPC = false; break;
        case 'ArrowRight': case 'KeyD': moveRightPC = false; break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// --- LUCES ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-5, 10, 5);
scene.add(dirLight);

// Grid de referencia grande
const grid = new THREE.GridHelper(50, 50, 0x444444, 0x888888); 
scene.add(grid);

// --- CARGAR MODELO ---
const loader = new GLTFLoader();
loader.load(
    'modelo.glb',
    function(gltf){
        const modelo = gltf.scene;
        // Mantenemos tu escala actual
        modelo.scale.set(.90, .90, .90);
        modelo.position.set(0, 0, 0);

        modelo.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        scene.add(modelo);
        console.log("Modelo de SketchUp cargado.");
    },
    undefined,
    function(error){ console.error(error); }
);

window.addEventListener('resize', () => {
    camera.aspect = contenedor.clientWidth / contenedor.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
});

// --- LÓGICA VR DE MOVIMIENTO POR CLICK (SEGURO) ---
let isClickingVR = false;
const directionVR = new THREE.Vector3();

// Escuchar eventos de click en el renderizador (pantalla del celular)
renderer.domElement.addEventListener('touchstart', function() {
    isClickingVR = true;
});
renderer.domElement.addEventListener('touchend', function() {
    isClickingVR = false;
});
// También escuchamos eventos de mouse por si acaso (visores con control)
renderer.domElement.addEventListener('mousedown', function() {
    if (renderer.xr.isPresenting) isClickingVR = true;
});
renderer.domElement.addEventListener('mouseup', function() {
    if (renderer.xr.isPresenting) isClickingVR = false;
});
// ----------------------------------------------------

// --- ANIMACION ---
renderer.setAnimationLoop(function () {
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // 1. SI ESTAMOS EN LA PC (controls.isLocked es true)
    if (controls.isLocked === true) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForwardPC) - Number(moveBackwardPC);
        direction.x = Number(moveRightPC) - Number(moveLeftPC);
        direction.normalize(); 

        if (moveForwardPC || moveBackwardPC) velocity.z -= direction.z * 40.0 * delta;
        if (moveLeftPC || moveRightPC) velocity.x -= direction.x * 40.0 * delta;

        // Movemos el dolly, no la cámara
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    // 2. LÓGICA VR: Rotación y Caminado SEGURO (Solo con click)
    // Three.js maneja la rotación por giroscopio automáticamente (si hay HTTPS).
    
    if (renderer.xr.isPresenting) {
        // SI MANTENEMOS EL CLICK PRESIONADO
        if (isClickingVR) {
            // Obtenemos hacia dónde mira tu cabeza
            camera.getWorldDirection(directionVR);
            
            // Movemos hacia adelante en ese plano horizontal
            directionVR.y = 0; 
            directionVR.normalize();
            
            // Caminamos hacia adelante (Velocidad 3.0)
            dolly.position.addScaledVector(directionVR, 3.0 * delta); 
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
});

// --- LÓGICA ADAPTATIVA PARA VR ---
renderer.xr.addEventListener('sessionstart', function () {
    const recuadro = document.getElementById('instrucciones');
    if (recuadro) recuadro.style.display = 'none';
});

renderer.xr.addEventListener('sessionend', function () {
    const recuadro = document.getElementById('instrucciones');
    if (recuadro) recuadro.style.display = 'block';
});