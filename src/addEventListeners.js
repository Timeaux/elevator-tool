import { updateModelMaterial, startCameraAnimation } from './utils.js';

export default function (
  currentMaterial,
  elevatorGroup,
  materials,
  controls,
  camera,
  cameraData,
  renderer,
  components,
) {
  // Event listeners for material change
  document.getElementById('material1').addEventListener('click', () => {
    currentMaterial = materials.metalTexture;
    updateModelMaterial(elevatorGroup, currentMaterial);
  });
  document.getElementById('material2').addEventListener('click', () => {
    currentMaterial = materials.lightWoodTexture;
    updateModelMaterial(elevatorGroup, currentMaterial);
  });
  document.getElementById('material3').addEventListener('click', () => {
    currentMaterial = materials.darkWoodTexture;
    updateModelMaterial(elevatorGroup, currentMaterial);
  });
  document.getElementById('material4').addEventListener('click', () => {
    currentMaterial = materials.metalTexture2;
    updateModelMaterial(elevatorGroup, currentMaterial);
  });
  document.getElementById('material5').addEventListener('click', () => {
    currentMaterial = materials.metalTexture3;
    updateModelMaterial(elevatorGroup, currentMaterial);
  });
  document.getElementById('material6').addEventListener('click', () => {
    currentMaterial = materials.oakWoodTexture;
    updateModelMaterial(elevatorGroup, currentMaterial);
  });

  // Event listener for zoom slider
  document.getElementById('zoomSlider').addEventListener('input', () => {
    if (!controls.target) return;
    const zoomValue = document.getElementById('zoomSlider').value;
    const zoomFactor = zoomValue / 100; // Normalize between 0 and 1

    const distance =
      cameraData.min + (cameraData.max - cameraData.min) * (1 - zoomFactor);

    const direction = camera.position.clone().sub(controls.target).normalize();
    camera.position
      .copy(controls.target)
      .add(direction.multiplyScalar(distance));
    controls.update();
  });

  // Event listener for Detail 1 button (Toggle Button)
  document.getElementById('detail1').addEventListener('click', onDetailClick);

  // Disable auto-rotation when user interacts
  controls.addEventListener('start', () => {
    cameraData.isAutoRotating = false;
  });

  // Re-enable auto-rotation after interaction
  controls.addEventListener('end', () => {
    // Only re-enable auto-rotation if not in Detail 1 mode
    if (!cameraData.isDetailZoomedIn) {
      cameraData.isAutoRotating = true;
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

  function onDetailClick() {
    if (!controls.target) return;
    const detailButton = document.getElementById('detail1');
    if (cameraData.isDetailZoomedIn) {
      // Return to the last camera position with animation
      startCameraAnimation(
        camera.position,
        cameraData.lastCameraPosition,
        camera.quaternion,
        cameraData.lastCameraQuaternion,
        cameraData,
      );
      cameraData.isDetailZoomedIn = false;
      detailButton.textContent = 'Detail 1';

      // Resume auto-rotation
      cameraData.isAutoRotating = true;
    } else {
      // Save current camera position and orientation
      cameraData.lastCameraPosition.copy(camera.position);
      cameraData.lastCameraQuaternion.copy(camera.quaternion);

      // Ensure components.doorButton is defined
      if (!components.doorButton) {
        console.warn('components.doorButton not found');
        return;
      }

      // Get the world position of the components.doorButton
      const detailTarget = new THREE.Vector3();
      components.doorButton.getWorldPosition(detailTarget);

      // Adjust the camera's vertical position to match the components.doorButton
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
        .setY(cameraHeight); // Set camera's Y position to match the components.doorButton + 1

      // Adjust the camera's up vector if needed
      camera.up.set(0, 1, 0);

      // Calculate the quaternion for the camera to look at the detailTarget
      camera.lookAt(detailTarget);
      const detailQuaternion = camera.quaternion.clone();

      // Restore the original camera position and quaternion
      camera.position.copy(cameraData.lastCameraPosition);
      camera.quaternion.copy(cameraData.lastCameraQuaternion);

      // Start camera animation
      startCameraAnimation(
        camera.position,
        detailPosition,
        camera.quaternion,
        detailQuaternion,
        cameraData,
      );

      cameraData.isDetailZoomedIn = true;
      detailButton.textContent = 'Back';

      // Pause auto-rotation
      cameraData.isAutoRotating = false;
    }
  }
}
