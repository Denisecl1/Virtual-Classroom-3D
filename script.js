import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/webxr/VRButton.js';

// CONTENEDOR
const contenedor = document.getElementById("contenedor3D");

// ESCENA (Con el nuevo color de cielo)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// CAMARA
const camera = new THREE.PerspectiveCamera(
    75,
    contenedor.clientWidth / contenedor.clientHeight,
    0.1,
    1000
);
camera.position.set(0, 2, 8); 

// RENDER (Ahora con soporte para sombras)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
renderer.xr.enabled = true; 
renderer.shadowMap.enabled = true; // Activar sombras en el motor
contenedor.appendChild(renderer.domElement);

// BOTÓN VR
document.body.appendChild(VRButton.createButton(renderer));

// --- CONTROLES (PRIMERA PERSONA) ---
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
const clickPrompter = document.getElementById('click-prompter');

if (instrucciones && clickPrompter) {
    clickPrompter.addEventListener('click', function () {
        controls.lock(); 
    });
    
    controls.addEventListener('lock', function () {
        instrucciones.style.pointerEvents = 'none'; 
        clickPrompter.style.display = 'none';       
    });
    
    controls.addEventListener('unlock', function () {
        instrucciones.style.pointerEvents = 'auto'; 
        clickPrompter.style.display = 'block';      
    });
}

// Detectar teclas
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

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
// ------------------------------------------

// --- LUCES MEJORADAS ---
// 1. Luz de Hemisferio (Cielo blanco, Suelo gris oscuro)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// 2. Luz Direccional (Sol) con sombras
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(-5, 10, 5);
dirLight.castShadow = true; // El sol proyecta sombras

// Configuración de calidad de sombra
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
scene.add(dirLight);
// ------------------------------------------

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

        // --- TRUCO PARA SOMBRAS EN SKETCHUP ---
        // Le decimos a cada parte del modelo que genere y reciba sombras
        modelo.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        // --------------------------------------

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

    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); 

        if (moveForward || moveBackward) velocity.z -= direction.z * 40.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 40.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    prevTime = time;
    renderer.render(scene, camera);
});