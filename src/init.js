import { createMaterial } from './utils.js';

export default function () {
  // Set up the scene, camera, and renderer
  const scene = new THREE.Scene();

  // Create a perspective camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  // Create the WebGL renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Initialize OrbitControls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Optional, for smoother interaction
  controls.dampingFactor = 0.05;
  controls.enableZoom = false; // Disable zooming if you prefer
  controls.update();

  //Load textures
  const textureLoader = new THREE.TextureLoader();
  const boucleTexture = textureLoader.load('./Assets/Boucle.jpg');
  const boucleNormalMap = textureLoader.load('./Assets/Boucle_Normal.png');
  const copperColorTexture = textureLoader.load('./Assets/Copper_Color.jpg');
  const copperMetalnessTexture = textureLoader.load(
    './Assets/Copper_Metalness.jpg',
  );
  const copperRoughnessTexture = textureLoader.load(
    './Assets/Copper_Roughness.jpg',
  );

  // Set texture wrapping and repeat for boucle texture
  boucleTexture.wrapS = boucleTexture.wrapT = THREE.RepeatWrapping;
  boucleTexture.repeat.set(4, 4);
  boucleNormalMap.wrapS = boucleNormalMap.wrapT = THREE.RepeatWrapping;
  boucleNormalMap.repeat.set(4, 4);

  // Create the Copper Material
  const copperMaterial = new THREE.MeshStandardMaterial({
    map: copperColorTexture,
    metalnessMap: copperMetalnessTexture,
    roughnessMap: copperRoughnessTexture,
    color: 0xffffff, // Base color
    metalness: 0.5, // Updated metalness value
    roughness: 1.0,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
  });

  // Material for boucle texture
  const boucleMaterial = new THREE.MeshStandardMaterial({
    map: boucleTexture,
    normalMap: boucleNormalMap,
    normalScale: new THREE.Vector2(0.5, 0.5), // Reduce the influence of the normal map
    metalness: 0.05, // Decrease metalness
    roughness: 0.8, // Increase roughness
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide, // Ensure both sides are rendered
  });

  const materials = {
    metalTexture: createMaterial(textureLoader.load('./Assets/metal.jpg')),
    metalTexture2: createMaterial(textureLoader.load('./Assets/metal2.jpg')),
    metalTexture3: createMaterial(textureLoader.load('./Assets/metal3.jpg')),
    lightWoodTexture: createMaterial(
      textureLoader.load('./Assets/lightwood.jpg'),
    ),
    darkWoodTexture: createMaterial(
      textureLoader.load('./Assets/darkwood.jpg'),
    ),
    oakWoodTexture: createMaterial(textureLoader.load('./Assets/oakwood.jpg')),
    boucleMaterial,
    copperMaterial,
  };

  // Create a group to hold the elevator and rotate it
  const elevatorGroup = new THREE.Group();
  scene.add(elevatorGroup);
  // Add lights with adjusted intensity
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Reduced intensity
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Reduced intensity
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  return {
    scene,
    camera,
    renderer,
    materials,
    elevatorGroup,
    controls,
  };
}
