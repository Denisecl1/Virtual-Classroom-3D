import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
// 1. CAMBIO: Importamos PointerLockControls en lugar de OrbitControls
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/webxr/VRButton.js';

// CONTENEDOR
const contenedor = document.getElementById("contenedor3D");

// ESCENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

// CAMARA
const camera = new THREE.PerspectiveCamera(
    75,
    contenedor.clientWidth / contenedor.clientHeight,
    0.1,
    1000
);
// Puedes ajustar el '2' para ser más alto o bajito dentro del salón
camera.position.set(0, 2, 8); 

// RENDER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
renderer.xr.enabled = true; 
contenedor.appendChild(renderer.domElement);

// BOTÓN VR
document.body.appendChild(VRButton.createButton(renderer));

// --- NUEVOS CONTROLES (PRIMERA PERSONA) ---
const controls = new PointerLockControls(camera, document.body);

// Variables físicas para el movimiento
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Eventos del recuadro de instrucciones
const instrucciones = document.getElementById('instrucciones');
if (instrucciones) {
    instrucciones.addEventListener('click', function () {
        controls.lock(); // Esto oculta el mouse y activa la cámara
    });
    controls.addEventListener('lock', function () {
        instrucciones.style.display = 'none'; // Ocultar cuadro
    });
    controls.addEventListener('unlock', function () {
        instrucciones.style.display = 'block'; // Mostrar cuadro al dar ESC
    });
}

// Detectar cuando se presiona una tecla
const onKeyDown = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = true; break;
    }
};

// Detectar cuando se suelta una tecla
const onKeyUp = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = false; break;
    }
};

// Activar los detectores de teclado en la ventana
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
// ------------------------------------------

// LUCES
const ambient = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 3);
directional.position.set(5, 10, 7);
scene.add(directional);

// GRID
const grid = new THREE.GridHelper(20, 20);
scene.add(grid);

// CARGAR MODELO
const loader = new GLTFLoader();
loader.load(
    'modelo.glb',
    function(gltf){
        const modelo = gltf.scene;
        
        modelo.scale.set(.90, .90, .90);
        
        modelo.position.set(0, 0, 0);
        scene.add(modelo);
        console.log("MODELO CARGADO CON ÉXITO");
    },
    undefined,
    function(error){
        console.error("Error al cargar el modelo:", error);
    }
);

// RESPONSIVE
window.addEventListener('resize', () => {
    camera.aspect = contenedor.clientWidth / contenedor.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
});

// ANIMACION CON FÍSICAS DE MOVIMIENTO
renderer.setAnimationLoop(function () {
    const time = performance.now();

    // Solo nos movemos si el usuario hizo click en el recuadro
    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        // Fricción
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // Dirección calculada según las teclas presionadas
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); 

        // Aplicar velocidad
        if (moveForward || moveBackward) velocity.z -= direction.z * 40.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 40.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    prevTime = time;
    renderer.render(scene, camera);
});