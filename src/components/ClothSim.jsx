import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function Cloth() {
  const mesh = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const positions = mesh.current.geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      const wave =
        Math.sin(x * 2.5 + t * 1.5) * 0.15 +
        Math.cos(y * 3 + t * 1.2) * 0.1;

      positions.setZ(i, wave);
    }

    positions.needsUpdate = true;
  });

  return (
    <mesh ref={mesh} rotation={[-0.4, 0, 0]}>
      <planeGeometry args={[8, 8, 64, 64]} />
      <meshStandardMaterial
        color="#080808"
        metalness={0.4}
        roughness={0.3}
        wireframe={false}
      />
    </mesh>
  );
}

export default function ClothSim() {
  return (
    <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 3, 4]} intensity={1.5} />
        <Cloth />
      </Canvas>
    </div>
  );
}