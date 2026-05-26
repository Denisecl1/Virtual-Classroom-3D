import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/webxr/VRButton.js';

const contenedor = document.getElementById("contenedor3D");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// --- CAMARA Y EL CARRITO (DOLLY) PARA VR ---
const camera = new THREE.PerspectiveCamera(75, contenedor.clientWidth / contenedor.clientHeight, 0.1, 1000);

// Creamos un "carrito" que transportará la cámara
const dolly = new THREE.Group();
dolly.position.set(0, 2, 8); // Posición inicial en el salón
scene.add(dolly);

// Metemos la cámara al carrito (posición 0,0,0 relativa al carrito)
dolly.add(camera);
camera.position.set(0, 0, 0); 
// ------------------------------------------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
renderer.xr.enabled = true; 
renderer.shadowMap.enabled = true; 
contenedor.appendChild(renderer.domElement);

document.body.appendChild(VRButton.createButton(renderer));

// --- CONTROLES PC (W,A,S,D) ---
// Ahora los controles mueven el carrito, no solo la cámara
const controls = new PointerLockControls(camera, document.body);

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const directionVR = new THREE.Vector3(); // Vector para el movimiento con lentes

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
        case 'ArrowUp': case 'KeyW': moveForward = true; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
        case 'ArrowDown': case 'KeyS': moveBackward = true; break;
        case 'ArrowRight': case 'KeyD': moveRight = true; break;
    }
};

const onKeyUp = function (event) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = false; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
        case 'ArrowDown': case 'KeyS': moveBackward = false; break;
        case 'ArrowRight': case 'KeyD': moveRight = false; break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// --- LUCES ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(-5, 10, 5);
dirLight.castShadow = true; 
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const grid = new THREE.GridHelper(20, 20);
scene.add(grid);

// --- CARGAR MODELO ---
const loader = new GLTFLoader();
loader.load(
    'modelo.glb',
    function(gltf){
        const modelo = gltf.scene;
        modelo.scale.set(.90, .90, .90);
        modelo.position.set(0, 0, 0);

        modelo.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        scene.add(modelo);
    },
    undefined,
    function(error){ console.error(error); }
);

window.addEventListener('resize', () => {
    camera.aspect = contenedor.clientWidth / contenedor.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
});

// --- ANIMACION Y LÓGICA DE CAMINADO ---
renderer.setAnimationLoop(function () {
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // 1. SI ESTAMOS EN LA PC (Usando W, A, S, D)
    if (controls.isLocked === true) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); 

        if (moveForward || moveBackward) velocity.z -= direction.z * 40.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 40.0 * delta;

        // Movemos el carrito, no la cámara directamente
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    // 2. SI ESTAMOS EN EL CELULAR CON LOS LENTES VR
    if (renderer.xr.isPresenting) {
        // Obtenemos hacia dónde está mirando tu cabeza
        camera.getWorldDirection(directionVR);

        // Si miras hacia el piso (inclinación negativa en Y)
        if (directionVR.y < -0.2) {
            directionVR.y = 0; // Evita que vueles o te entierres en el piso
            directionVR.normalize();
            
            // Mueve el carrito hacia adelante en la dirección que miras
            // Puedes cambiar el "3.0" para caminar más rápido o más lento
            dolly.position.addScaledVector(directionVR, 3.0 * delta); 
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
});