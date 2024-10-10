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

// Load textures
const textureLoader = new THREE.TextureLoader();

const metalTexture = textureLoader.load('./Assets/metal.jpg');
const metalTexture2 = textureLoader.load('./Assets/metal2.jpg');
const metalTexture3 = textureLoader.load('./Assets/metal3.jpg');
const lightWoodTexture = textureLoader.load('./Assets/lightwood.jpg');
const darkWoodTexture = textureLoader.load('./Assets/darkwood.jpg');
const oakWoodTexture = textureLoader.load('./Assets/oakwood.jpg');

// Load boucle texture
const boucleTexture = textureLoader.load('./Assets/Boucle.jpg');
const boucleNormalMap = textureLoader.load('./Assets/Boucle_Normal.png');

// Set texture wrapping and repeat for boucle texture
boucleTexture.wrapS = boucleTexture.wrapT = THREE.RepeatWrapping;
boucleTexture.repeat.set(4, 4);

boucleNormalMap.wrapS = boucleNormalMap.wrapT = THREE.RepeatWrapping;
boucleNormalMap.repeat.set(4, 4);

// Load copper textures
const copperColorTexture = textureLoader.load('./Assets/Copper_Color.jpg');
const copperMetalnessTexture = textureLoader.load(
  './Assets/Copper_Metalness.jpg',
);
const copperRoughnessTexture = textureLoader.load(
  './Assets/Copper_Roughness.jpg',
);

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

// Define materials
function createMaterial(mapTexture) {
  const material = new THREE.MeshStandardMaterial({
    map: mapTexture,
    color: 0xffffff, // Lighter base color
    metalness: 0.2, // Adjusted for better brightness
    roughness: 0.8, // Adjusted for better appearance
    transparent: true,
    opacity: 1,
  });
  return material;
}

const material1 = createMaterial(metalTexture);
const material2 = createMaterial(lightWoodTexture);
const material3 = createMaterial(darkWoodTexture);
const material4 = createMaterial(metalTexture2);
const material5 = createMaterial(metalTexture3);
const material6 = createMaterial(oakWoodTexture);

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

// Current material (default to material1)
let currentMaterial = material1;

// Placeholders for wall meshes and other components
let wallFront, wallBack, wallLeft, wallRight;
let handleLeft, handleRight;
let floorButton, button, doorButton;
let floor; // 'Floor' component
let topComponent, bottomComponent; // 'Top' and 'Bottom' components

// List of add-on components and their names (Define globally)
let addOnComponents = []; // Will be populated after loading the model
const addOnComponentNames = [
  'HandleLeft',
  'HandleRight',
  'Button',
  'DoorButton',
  'FloorButton',
  'Floor',
];

// Create a group to hold the elevator and rotate it
const elevatorGroup = new THREE.Group();
scene.add(elevatorGroup);

// Function to find objects by name, even if they are nested
function findObjectByName(object, name) {
  if (object.name === name) return object;
  for (let i = 0; i < object.children.length; i++) {
    const result = findObjectByName(object.children[i], name);
    if (result) return result;
  }
  return null;
}

// Load the GLTF model
const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load('./Assets/elevator.glb', (gltf) => {
  const elevator = gltf.scene;

  // Apply the current material to all child meshes
  elevator.traverse((child) => {
    if (child.isMesh) {
      // Set materials based on object type
      if (child.name.startsWith('Wall_')) {
        // Walls
        child.material = currentMaterial.clone();
        child.material.side = THREE.BackSide; // Render only outside faces
        child.renderOrder = 0;
      } else {
        // Other objects (handles, buttons, etc.)
        child.material = currentMaterial.clone();
        child.material.side = THREE.DoubleSide; // Render all faces
        child.renderOrder = 1;
      }
      child.material.transparent = true;
      child.material.opacity = 1;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Find walls by name
  wallFront = findObjectByName(elevator, 'Wall_Front');
  wallBack = findObjectByName(elevator, 'Wall_Back');
  wallLeft = findObjectByName(elevator, 'Wall_Left');
  wallRight = findObjectByName(elevator, 'Wall_Right');

  // Find handles by name
  handleLeft = findObjectByName(elevator, 'HandleLeft');
  handleRight = findObjectByName(elevator, 'HandleRight');

  // Find floor button, button, door button
  floorButton = findObjectByName(elevator, 'FloorButton');
  button = findObjectByName(elevator, 'Button');
  doorButton = findObjectByName(elevator, 'DoorButton');

  // Find 'Floor' component
  floor = findObjectByName(elevator, 'Floor');

  // Find 'Top' and 'Bottom' components
  topComponent = findObjectByName(elevator, 'Top');
  bottomComponent = findObjectByName(elevator, 'Bottom');

  // Apply boucle material to 'Top' and 'Bottom'
  [topComponent, bottomComponent].forEach((component) => {
    if (component) {
      component.traverse((child) => {
        if (child.isMesh) {
          child.material = boucleMaterial.clone();
          child.material.side = THREE.DoubleSide; // Ensure both sides are rendered
          child.material.needsUpdate = true;
        }
      });
    } else {
      console.warn(
        'Component not found:',
        component === topComponent ? 'Top' : 'Bottom',
      );
    }
  });

  // Ensure each wall has its own material instance
  [wallFront, wallBack, wallLeft, wallRight].forEach((mesh) => {
    if (mesh && mesh.isMesh) {
      mesh.material = mesh.material.clone();
      mesh.material.transparent = true;
      mesh.material.opacity = 1;
      mesh.material.side = THREE.BackSide; // Walls
      mesh.material.needsUpdate = true;
      mesh.renderOrder = 0;
    }
  });

  // Populate addOnComponents array
  addOnComponents = [
    handleLeft,
    handleRight,
    button,
    doorButton,
    floorButton,
    floor,
  ];

  // Apply the Copper Material to add-on components
  addOnComponents.forEach((object) => {
    if (object) {
      object.traverse((child) => {
        if (child.isMesh) {
          child.material = copperMaterial.clone();
          child.material.transparent = true;
          child.material.opacity = 1;
          child.material.side = THREE.DoubleSide;

          // Set depthWrite to false to prevent the silhouette issue
          child.material.depthWrite = false;
          child.material.depthTest = true;
          child.material.alphaTest = 0;

          child.material.needsUpdate = true;
          child.renderOrder = 1;
        }
      });
    }
  });

  // Center and scale the model
  const box = new THREE.Box3().setFromObject(elevator);
  const center = box.getCenter(new THREE.Vector3());
  elevator.position.sub(center);

  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const scaleFactor = 3 / maxDimension; // Adjust as needed
  elevator.scale.set(scaleFactor, scaleFactor, scaleFactor);

  // Add the elevator to the group
  elevatorGroup.add(elevator);

  // Set initial camera position based on model size
  const adjustedSize = size.multiplyScalar(scaleFactor);
  const cameraDistance = adjustedSize.length() * 1.5; // Adjust multiplier as needed
  camera.position.set(0, 0, cameraDistance);
  camera.lookAt(elevatorGroup.position);
  controls.target.copy(elevatorGroup.position);

  // Update camera distance variables
  originalCameraDistance = camera.position.distanceTo(controls.target);
  minCameraDistance = originalCameraDistance * 0.5; // Adjust as needed
  maxCameraDistance = originalCameraDistance * 2; // Adjust as needed

  // Start the animation loop
  animate();
});

// Add lights with adjusted intensity
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Reduced intensity
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Reduced intensity
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Initialize OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Optional, for smoother interaction
controls.dampingFactor = 0.05;
controls.enableZoom = false; // Disable zooming if you prefer
controls.update();

// Variables for rotation speed
const rotationSpeed = 0.001; // Adjust as needed
let isAutoRotating = true; // To control auto-rotation

// Variables for zoom functionality
// Store the initial distance between the camera and the target
let originalCameraDistance = 4; // Default value, will update when model is loaded
let minCameraDistance;
let maxCameraDistance;

// Variables for Detail 1 zoom
let isDetailZoomedIn = false; // To track Detail 1 zoom state
let lastCameraPosition = new THREE.Vector3(); // To store the last camera position
let lastCameraQuaternion = new THREE.Quaternion(); // To store the last camera orientation

// Variables for animation
let cameraAnimationProgress = 0;
let cameraAnimationDuration = 60; // Frames (adjust as needed)
let cameraAnimationStartPosition = new THREE.Vector3();
let cameraAnimationEndPosition = new THREE.Vector3();
let cameraAnimationStartQuaternion = new THREE.Quaternion();
let cameraAnimationEndQuaternion = new THREE.Quaternion();
let isAnimatingCamera = false;

// Easing function (easeInOutQuad)
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Wall normals (assuming model is axis-aligned and normals point outward)
const wallNormals = {
  Wall_Front: new THREE.Vector3(0, 0, 1), // Front wall faces +Z
  Wall_Back: new THREE.Vector3(0, 0, -1),
  Wall_Left: new THREE.Vector3(1, 0, 0),
  Wall_Right: new THREE.Vector3(-1, 0, 0),
};

// Walls and associated meshes
let walls = [];

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (isAutoRotating) {
    // Rotate the elevator group
    elevatorGroup.rotation.y += rotationSpeed;
  }

  // Update camera animation if in progress
  if (isAnimatingCamera) {
    cameraAnimationProgress += 1;
    let t = cameraAnimationProgress / cameraAnimationDuration;
    t = Math.min(t, 1);
    t = easeInOutQuad(t);

    // Interpolate position
    camera.position.lerpVectors(
      cameraAnimationStartPosition,
      cameraAnimationEndPosition,
      t,
    );
    // Interpolate rotation
    THREE.Quaternion.slerp(
      cameraAnimationStartQuaternion,
      cameraAnimationEndQuaternion,
      camera.quaternion,
      t,
    );

    // Update controls
    controls.update();

    if (cameraAnimationProgress >= cameraAnimationDuration) {
      isAnimatingCamera = false;
    }
  } else {
    // Update controls
    controls.update();
  }

  // Update wall opacity based on camera position
  updateWallOpacity();

  // Render the scene
  renderer.render(scene, camera);
}

function updateWallOpacity() {
  if (!elevatorGroup) return;

  // Initialize walls array if not done yet
  if (walls.length === 0) {
    walls = [
      {
        mesh: wallFront,
        normal: wallNormals['Wall_Front'],
        associatedMeshes: [button, doorButton, floorButton, floor],
        invertDotForComponents: true, // Indicate that we need to invert dot product
      },
      {
        mesh: wallBack,
        normal: wallNormals['Wall_Back'],
        associatedMeshes: [],
        invertDotForComponents: false,
      },
      {
        mesh: wallLeft,
        normal: wallNormals['Wall_Left'],
        associatedMeshes: [handleLeft],
        invertDotForComponents: false,
      },
      {
        mesh: wallRight,
        normal: wallNormals['Wall_Right'],
        associatedMeshes: [handleRight],
        invertDotForComponents: false,
      },
    ];
  }

  walls.forEach(
    ({ mesh, normal, associatedMeshes, invertDotForComponents }) => {
      if (mesh && mesh.isMesh) {
        // Clone and apply the group's rotation to the wall's normal
        const wallNormal = normal
          .clone()
          .applyQuaternion(elevatorGroup.quaternion);

        // Get the wall's world position
        const wallPosition = new THREE.Vector3();
        mesh.getWorldPosition(wallPosition);

        // Get the camera's world position
        const cameraPosition = new THREE.Vector3();
        camera.getWorldPosition(cameraPosition);

        // Compute vector from wall to camera
        const wallToCamera = cameraPosition
          .clone()
          .sub(wallPosition)
          .normalize();

        // Compute dot product between wall normal and vector to camera
        const dot = wallNormal.dot(wallToCamera);

        // --- Wall Opacity Calculation ---
        let desiredOpacityWall;
        const fadeAngleStartWalls = Math.PI / 2; // 90 degrees
        const fadeAngleEndWalls = Math.PI; // 180 degrees

        const angleWalls = Math.acos(THREE.MathUtils.clamp(dot, -1, 1));

        if (isDetailZoomedIn) {
          desiredOpacityWall = 1.0; // Fully opaque in detail view
        } else {
          if (angleWalls < fadeAngleStartWalls) {
            desiredOpacityWall = 1.0; // Fully opaque
          } else if (angleWalls > fadeAngleEndWalls) {
            desiredOpacityWall = 0.0; // Fully transparent
          } else {
            desiredOpacityWall = THREE.MathUtils.mapLinear(
              angleWalls,
              fadeAngleStartWalls,
              fadeAngleEndWalls,
              1.0,
              0.0,
            );
          }
        }

        // Smooth transition for walls
        mesh.material.opacity +=
          (desiredOpacityWall - mesh.material.opacity) * 0.1;
        mesh.material.opacity = Math.max(0, Math.min(1, mesh.material.opacity)); // Clamp between 0 and 1
        mesh.material.needsUpdate = true;

        // --- Associated Components Opacity Calculation ---

        // Invert dot product for front wall components if needed
        let dotComponents = invertDotForComponents ? -dot : dot;

        const angleComponents = Math.acos(
          THREE.MathUtils.clamp(dotComponents, -1, 1),
        );

        let desiredOpacityComponents;
        const fadeAngleStartComponents = 0; // Start fading from 0 degrees
        const fadeAngleEndComponents = Math.PI / 1.5; // 90 degrees

        if (isDetailZoomedIn) {
          desiredOpacityComponents = 1.0; // Fully opaque in detail view
        } else {
          if (angleComponents < fadeAngleStartComponents) {
            desiredOpacityComponents = 1.0; // Fully opaque
          } else if (angleComponents > fadeAngleEndComponents) {
            desiredOpacityComponents = 0.0; // Fully transparent
          } else {
            desiredOpacityComponents = THREE.MathUtils.mapLinear(
              angleComponents,
              fadeAngleStartComponents,
              fadeAngleEndComponents,
              1.0,
              0.0,
            );
          }
        }

        // Smooth transition for associated components
        associatedMeshes.forEach((associatedMesh) => {
          if (associatedMesh) {
            associatedMesh.traverse((child) => {
              if (child.isMesh) {
                child.material.opacity +=
                  (desiredOpacityComponents - child.material.opacity) * 0.1;
                child.material.opacity = Math.max(
                  0,
                  Math.min(1, child.material.opacity),
                ); // Clamp between 0 and 1
                child.material.needsUpdate = true;
              }
            });
          }
        });
      }
    },
  );
}

// Event listeners for material change
document.getElementById('material1').addEventListener('click', () => {
  currentMaterial = createMaterial(metalTexture);
  updateModelMaterial();
});
document.getElementById('material2').addEventListener('click', () => {
  currentMaterial = createMaterial(lightWoodTexture);
  updateModelMaterial();
});
document.getElementById('material3').addEventListener('click', () => {
  currentMaterial = createMaterial(darkWoodTexture);
  updateModelMaterial();
});
document.getElementById('material4').addEventListener('click', () => {
  currentMaterial = createMaterial(metalTexture2);
  updateModelMaterial();
});
document.getElementById('material5').addEventListener('click', () => {
  currentMaterial = createMaterial(metalTexture3);
  updateModelMaterial();
});
document.getElementById('material6').addEventListener('click', () => {
  currentMaterial = createMaterial(oakWoodTexture);
  updateModelMaterial();
});

// Function to update model material
function updateModelMaterial() {
  if (elevatorGroup) {
    elevatorGroup.traverse((child) => {
      if (child.isMesh) {
        // Skip 'Top', 'Bottom', and add-on components with custom materials
        if (
          child.name === 'Top' ||
          child.name === 'Bottom' ||
          addOnComponentNames.includes(child.name)
        ) {
          return;
        }
        // Update the material for walls and other components
        const opacity = child.material.opacity;
        const materialSide = child.material.side;
        child.material = currentMaterial.clone();
        child.material.opacity = opacity;
        child.material.side = materialSide; // Preserve side setting
        child.material.needsUpdate = true;
      }
    });
  }
}

// Event listener for zoom slider
document.getElementById('zoomSlider').addEventListener('input', () => {
  if (!controls.target) return;
  const zoomValue = document.getElementById('zoomSlider').value;
  const zoomFactor = zoomValue / 100; // Normalize between 0 and 1

  const distance =
    minCameraDistance +
    (maxCameraDistance - minCameraDistance) * (1 - zoomFactor);

  const direction = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).add(direction.multiplyScalar(distance));
  controls.update();
});

// Event listener for Detail 1 button (Toggle Button)
document.getElementById('detail1').addEventListener('click', () => {
  if (!controls.target) return;
  const detailButton = document.getElementById('detail1');
  if (isDetailZoomedIn) {
    // Return to the last camera position with animation
    startCameraAnimation(
      camera.position,
      lastCameraPosition,
      camera.quaternion,
      lastCameraQuaternion,
    );
    isDetailZoomedIn = false;
    detailButton.textContent = 'Detail 1';

    // Resume auto-rotation
    isAutoRotating = true;
  } else {
    // Save current camera position and orientation
    lastCameraPosition.copy(camera.position);
    lastCameraQuaternion.copy(camera.quaternion);

    // Ensure doorButton is defined
    if (!doorButton) {
      console.warn('doorButton not found');
      return;
    }

    // Get the world position of the doorButton
    const detailTarget = new THREE.Vector3();
    doorButton.getWorldPosition(detailTarget);

    // Adjust the camera's vertical position to match the doorButton
    const cameraHeight = detailTarget.y + 1; // Added +1 to the camera height

    // Define the direction vector pointing forward (since front wall faces +Z)
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(elevatorGroup.quaternion).normalize();

    // Set the distance from the target
    const distanceFromTarget = 0.5; // Adjust for closer or farther view

    // Calculate the camera position
    const detailPosition = new THREE.Vector3();
    detailPosition
      .copy(detailTarget)
      .addScaledVector(direction, -distanceFromTarget)
      .setY(cameraHeight); // Set camera's Y position to match the doorButton + 1

    // Adjust the camera's up vector if needed
    camera.up.set(0, 1, 0);

    // Calculate the quaternion for the camera to look at the detailTarget
    camera.lookAt(detailTarget);
    const detailQuaternion = camera.quaternion.clone();

    // Restore the original camera position and quaternion
    camera.position.copy(lastCameraPosition);
    camera.quaternion.copy(lastCameraQuaternion);

    // Start camera animation
    startCameraAnimation(
      camera.position,
      detailPosition,
      camera.quaternion,
      detailQuaternion,
    );

    isDetailZoomedIn = true;
    detailButton.textContent = 'Back';

    // Pause auto-rotation
    isAutoRotating = false;
  }
});

// Function to start camera animation
function startCameraAnimation(startPos, endPos, startQuat, endQuat) {
  cameraAnimationProgress = 0;
  cameraAnimationStartPosition.copy(startPos);
  cameraAnimationEndPosition.copy(endPos);
  cameraAnimationStartQuaternion.copy(startQuat);
  cameraAnimationEndQuaternion.copy(endQuat);
  isAnimatingCamera = true;
}

// Disable auto-rotation when user interacts
controls.addEventListener('start', () => {
  isAutoRotating = false;
});

// Re-enable auto-rotation after interaction
controls.addEventListener('end', () => {
  // Only re-enable auto-rotation if not in Detail 1 mode
  if (!isDetailZoomedIn) {
    isAutoRotating = true;
  }
});
// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// Accordion functionality
const accordionHeaders = document.querySelectorAll('.accordion-header');
accordionHeaders.forEach((header) => {
  header.addEventListener('click', () => {
    const contentId = header.getAttribute('data-target');
    const content = document.getElementById(contentId);
    const caret = header.querySelector('.caret');
    if (content.style.display === 'flex') {
      content.style.display = 'none';
      caret.classList.remove('rotate');
    } else {
      content.style.display = 'flex';
      caret.classList.add('rotate');
    }
  });
});
