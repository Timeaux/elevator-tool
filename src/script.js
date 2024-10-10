import { easeInOutQuad, rotationSpeed, defaultCameraData } from './utils.js';
import init from './init.js';
import loadElevator from './loadElevator.js';
import addEventListeners from './addEventListeners.js';
import updateWallOpacity from './updateWallOpacity.js';

const cameraData = {
  ...defaultCameraData,
};
const components = {};
const { scene, camera, renderer, materials, elevatorGroup, controls } = init();

loadElevator(
  components,
  camera,
  materials,
  animate,
  elevatorGroup,
  controls,
  cameraData,
);

addEventListeners(
  elevatorGroup,
  materials,
  controls,
  camera,
  cameraData,
  renderer,
  components,
);

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

    if (
      cameraData.cameraAnimationProgress >= cameraData.cameraAnimationDuration
    ) {
      cameraData.isAnimatingCamera = false;
    }
  }
  controls.update();

  // Update wall opacity based on camera position
  updateWallOpacity(elevatorGroup, components, camera, cameraData);

  // Render the scene
  renderer.render(scene, camera);
}
