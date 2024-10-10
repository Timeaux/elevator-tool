const addOnComponentNames = [
  'HandleLeft',
  'HandleRight',
  'Button',
  'DoorButton',
  'FloorButton',
  'Floor',
];

export const rotationSpeed = 0.001;

export const defaultCameraData = {
  orig: 4,
  isDetailZoomedIn: false, // To track Detail 1 zoom state
  lastCameraPosition: new THREE.Vector3(), // To store the last camera position
  lastCameraQuaternion: new THREE.Quaternion(), // To store the last camera orientation
  cameraAnimationProgress: 0,
  cameraAnimationDuration: 60, // Frames
  cameraAnimationStartPosition: new THREE.Vector3(),
  cameraAnimationEndPosition: new THREE.Vector3(),
  cameraAnimationStartQuaternion: new THREE.Quaternion(),
  cameraAnimationEndQuaternion: new THREE.Quaternion(),
  isAnimatingCamera: false,
  isAutoRotating: true,
};

// Wall normals (assuming model is axis-aligned and normals point outward)
export const wallNormals = {
  Wall_Front: new THREE.Vector3(0, 0, 1), // Front wall faces +Z
  Wall_Back: new THREE.Vector3(0, 0, -1),
  Wall_Left: new THREE.Vector3(1, 0, 0),
  Wall_Right: new THREE.Vector3(-1, 0, 0),
};

// Easing function (easeInOutQuad)
export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Function to update model material
export function updateModelMaterial(elevatorGroup, currentMaterial) {
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

// Define materials
export function createMaterial(mapTexture) {
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

// Function to find objects by name, even if they are nested
export function findObjectByName(object, name) {
  if (object.name === name) return object;
  for (let i = 0; i < object.children.length; i++) {
    const result = findObjectByName(object.children[i], name);
    if (result) return result;
  }
  return null;
}

// Function to start camera animation
export function startCameraAnimation(
  startPos,
  endPos,
  startQuat,
  endQuat,
  cameraData,
) {
  cameraData.cameraAnimationProgress = 0;
  cameraData.cameraAnimationStartPosition.copy(startPos);
  cameraData.cameraAnimationEndPosition.copy(endPos);
  cameraData.cameraAnimationStartQuaternion.copy(startQuat);
  cameraData.cameraAnimationEndQuaternion.copy(endQuat);
  cameraData.isAnimatingCamera = true;
}
