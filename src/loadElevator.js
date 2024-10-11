import { findObjectByName } from './utils.js';

export default function (
  components,
  camera,
  materials,
  animate,
  elevatorGroup,
  controls,
  cameraData,
) {
  // Load the GLTF model
  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.load('./Assets/elevator.glb', (gltf) => {
    let addOnComponents = []; // Will be populated after loading the model
    const elevator = gltf.scene;

    // Apply the current material to all child meshes
    elevator.traverse((child) => {
      if (child.isMesh) {
        // Set materials based on object type
        if (child.name.startsWith('Wall_')) {
          // Walls
          child.material = materials.metalTexture;
          child.material.side = THREE.BackSide; // Render only outside faces
          child.renderOrder = 0;
        } else {
          // Other objects (handles, buttons, etc.)
          child.material = materials.metalTexture;
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
    components.wallFront = findObjectByName(elevator, 'Wall_Front');
    components.wallBack = findObjectByName(elevator, 'Wall_Back');
    components.wallLeft = findObjectByName(elevator, 'Wall_Left');
    components.wallRight = findObjectByName(elevator, 'Wall_Right');

    // Find handles by name
    components.handleLeft = findObjectByName(elevator, 'HandleLeft');
    components.handleRight = findObjectByName(elevator, 'HandleRight');

    // Find floor button, button, door button
    components.floorButton = findObjectByName(elevator, 'FloorButton');
    components.button = findObjectByName(elevator, 'Button');
    components.doorButton = findObjectByName(elevator, 'DoorButton');

    // Find 'Floor' component
    components.floor = findObjectByName(elevator, 'Floor');

    // Find 'Top' and 'Bottom' components
    components.topComponent = findObjectByName(elevator, 'Top');
    components.bottomComponent = findObjectByName(elevator, 'Bottom');

    // Apply boucle material to 'Top' and 'Bottom'
    [components.topComponent, components.bottomComponent].forEach(
      (component) => {
        if (component) {
          component.traverse((child) => {
            if (child.isMesh) {
              child.material = materials.boucleMaterial.clone();
              child.material.side = THREE.DoubleSide; // Ensure both sides are rendered
              child.material.needsUpdate = true;
            }
          });
        } else {
          console.warn(
            'Component not found:',
            component === components.topComponent ? 'Top' : 'Bottom',
          );
        }
      },
    );

    // Ensure each wall has its own material instance
    [
      components.wallFront,
      components.wallBack,
      components.wallLeft,
      components.wallRight,
    ].forEach((mesh) => {
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
      components.handleLeft,
      components.handleRight,
      components.button,
      components.doorButton,
      components.floorButton,
      components.floor,
    ];

    // Apply the Copper Material to add-on components
    addOnComponents.forEach((object) => {
      if (object) {
        object.traverse((child) => {
          if (child.isMesh) {
            child.material = materials.copperMaterial.clone();
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
    cameraData.orig = camera.position.distanceTo(controls.target);
    cameraData.min = cameraData.orig * 0.5; // Adjust as needed
    cameraData.max = cameraData.orig * 2; // Adjust as needed

    // Start the animation loop
    animate();
  });
}
