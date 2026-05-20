// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

// Cámara
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 2, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({
    antialias:true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

document.getElementById("contenedor3D")
.appendChild(renderer.domElement);

// Botón VR
document.body.appendChild(VRButton.createButton(renderer));

// Controles
const controls = new THREE.OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;

// Luces
const light1 = new THREE.DirectionalLight(0xffffff, 2);
light1.position.set(5, 10, 7);

scene.add(light1);

const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient);

// Loader GLB
const loader = new THREE.GLTFLoader();

loader.load(
    'modelo.glb',

    function(gltf){

        const modelo = gltf.scene;

        modelo.scale.set(1,1,1);

        scene.add(modelo);
    },

    undefined,

    function(error){
        console.error(error);
    }
);

// Responsive
window.addEventListener('resize', () => {

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

});

// Animación
function animate(){

    controls.update();

    renderer.render(scene, camera);

}

renderer.setAnimationLoop(animate);