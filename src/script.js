import { easeInOutQuad } from './utils.js';
import init from './init.js';
import loadElevator from './loadElevator.js';
import addEventListeners from './addEventListeners.js';

let currentMaterial;
const cameraData = {
  orig: 4,
  isDetailZoomedIn: false, // To track Detail 1 zoom state
  lastCameraPosition: new THREE.Vector3(), // To store the last camera position
  lastCameraQuaternion: new THREE.Quaternion(), // To store the last camera orientation
  cameraAnimationProgress: 0,
  cameraAnimationDuration: 60, // Frames (adjust as needed)
  cameraAnimationStartPosition: new THREE.Vector3(),
  cameraAnimationEndPosition: new THREE.Vector3(),
  cameraAnimationStartQuaternion: new THREE.Quaternion(),
  cameraAnimationEndQuaternion: new THREE.Quaternion(),
  isAnimatingCamera: false,
  isAutoRotating: true,
};
const rotationSpeed = 0.001; // Adjust as needed
const components = {};

const { scene, camera, renderer, materials, elevatorGroup, controls } = init();

currentMaterial = materials.metalTexture;

loadElevator(
  components,
  camera,
  materials,
  animate,
  currentMaterial,
  elevatorGroup,
  controls,
  cameraData,
);

addEventListeners(
  currentMaterial,
  elevatorGroup,
  materials,
  controls,
  camera,
  cameraData,
  renderer,
  components,
);
// Variables for animation

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

  if (cameraData.isAutoRotating) {
    // Rotate the elevator group
    elevatorGroup.rotation.y += rotationSpeed;
  }

  // Update camera animation if in progress
  if (cameraData.isAnimatingCamera) {
    cameraData.cameraAnimationProgress += 1;
    let t =
      cameraData.cameraAnimationProgress / cameraData.cameraAnimationDuration;
    t = Math.min(t, 1);
    t = easeInOutQuad(t);

    // Interpolate position
    camera.position.lerpVectors(
      cameraData.cameraAnimationStartPosition,
      cameraData.cameraAnimationEndPosition,
      t,
    );
    // Interpolate rotation
    THREE.Quaternion.slerp(
      cameraData.cameraAnimationStartQuaternion,
      cameraData.cameraAnimationEndQuaternion,
      camera.quaternion,
      t,
    );

    // Update controls
    controls.update();

    if (
      cameraData.cameraAnimationProgress >= cameraData.cameraAnimationDuration
    ) {
      cameraData.isAnimatingCamera = false;
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
        mesh: components.wallFront,
        normal: wallNormals['Wall_Front'],
        associatedMeshes: [
          components.button,
          components.doorButton,
          components.floorButton,
          components.floor,
        ],
        invertDotForComponents: true, // Indicate that we need to invert dot product
      },
      {
        mesh: components.wallBack,
        normal: wallNormals['Wall_Back'],
        associatedMeshes: [],
        invertDotForComponents: false,
      },
      {
        mesh: components.wallLeft,
        normal: wallNormals['Wall_Left'],
        associatedMeshes: [components.handleLeft],
        invertDotForComponents: false,
      },
      {
        mesh: components.wallRight,
        normal: wallNormals['Wall_Right'],
        associatedMeshes: [components.handleRight],
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

        if (cameraData.isDetailZoomedIn) {
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

        if (cameraData.isDetailZoomedIn) {
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
