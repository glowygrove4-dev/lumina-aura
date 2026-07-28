import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import * as fs from "fs";

const loader = new GLTFLoader();
const data = fs.readFileSync("/tmp/perfume.glb");
const gltf = await loader.parseAsync(data.buffer, "");
const scene = gltf.scene;

console.log("Scene children:", scene.children.length);
scene.traverse((obj) => {
  if (obj.isMesh) {
    console.log("Mesh:", obj.name, "type:", obj.type);
    console.log("  position:", obj.position);
    console.log("  rotation:", obj.rotation);
    console.log("  scale:", obj.scale);
    if (obj.geometry) {
      const box = new THREE.Box3().setFromObject(obj);
      console.log("  bounding box:", box.min.toArray(), box.max.toArray());
    }
    if (obj.material) {
      console.log("  material name:", obj.material.name);
    }
  }
});

// Compute bounding box of the whole scene
const box = new THREE.Box3().setFromObject(scene);
console.log("\nWhole scene bounding box:", box.min.toArray(), box.max.toArray());
const center = box.getCenter(new THREE.Vector3());
const size = box.getSize(new THREE.Vector3());
console.log("Center:", center.toArray(), "Size:", size.toArray());
