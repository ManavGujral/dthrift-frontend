"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";

function Model() {
  return (
    <Float speed={2} rotationIntensity={1}>
      <mesh>
        <boxGeometry args={[2, 3, 0.5]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.2} />
      </mesh>
    </Float>
  );
}

export default function ProductViewer() {
  return (
    <section className="py-32">
      <div className="h-[500px] w-full">
        <Canvas>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 5, 2]} />
          <Model />
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>

      <div className="text-center mt-10">
        <h3 className="text-3xl font-semibold">DTHRIFT CORE</h3>
        <p className="text-white/40 mt-2">Minimal. Sharp. Timeless.</p>
      </div>
    </section>
  );
}