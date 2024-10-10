import { wallNormals } from './utils.js';

let walls = [];

export default function updateWallOpacity(
  elevatorGroup,
  components,
  camera,
  cameraData,
) {
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
