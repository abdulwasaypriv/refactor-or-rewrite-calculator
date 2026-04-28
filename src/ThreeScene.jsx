/**
 * ThreeScene.jsx
 * 3D Status Orb — morphs based on Tech Debt level.
 * Dependencies: @react-three/fiber, @react-three/drei, three
 */

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";

/** Lerp between two hex colors given a 0-1 t value */
function lerpColor(hexA, hexB, t) {
  const a = new THREE.Color(hexA);
  const b = new THREE.Color(hexB);
  return a.lerp(b, t);
}

function StatusOrb({ techDebt = 1 }) {
  const meshRef = useRef();
  const glowRef = useRef();

  const normalized = (techDebt - 1) / 9; // 0 (clean) → 1 (destroyed)

  const distort     = normalized * 0.75;
  const speed       = 0.3 + normalized * 2.2;
  const color       = lerpColor("#38bdf8", "#ef4444", normalized);
  const emissive    = lerpColor("#0ea5e9", "#b91c1c", normalized);
  const glowColor   = lerpColor("#0ea5e9", "#dc2626", normalized);
  const glowScale   = 1.35 + normalized * 0.2;
  const glowOpacity = 0.12 + normalized * 0.18;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * (0.12 + normalized * 0.3);
      meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.4) * 0.06 * normalized;
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.04;
      glowRef.current.scale.setScalar(glowScale * pulse);
      glowRef.current.material.opacity = glowOpacity * (0.85 + Math.sin(clock.getElapsedTime() * 1.5) * 0.15);
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.5}>
      {/* Outer glow shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={glowOpacity}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Core orb */}
      <Sphere ref={meshRef} args={[1, 128, 128]}>
        <MeshDistortMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.6 + normalized * 1.2}
          roughness={0.08}
          metalness={0.4}
          distort={distort}
          speed={speed}
          transparent
          opacity={0.96}
        />
      </Sphere>
    </Float>
  );
}

function Rig({ techDebt }) {
  const lightRef = useRef();
  const normalized = (techDebt - 1) / 9;

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(clock.getElapsedTime() * 0.6) * 4;
      lightRef.current.position.y = Math.cos(clock.getElapsedTime() * 0.4) * 3;
    }
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight
        ref={lightRef}
        intensity={3 + normalized * 5}
        color={normalized > 0.5 ? "#ff4444" : "#38bdf8"}
        distance={10}
      />
      <pointLight position={[-4, -3, -2]} intensity={1.2} color="#7c3aed" />
      <pointLight position={[0, 4, 0]} intensity={0.8} color="#e0f2fe" />
    </>
  );
}

function SyncOrbitControls({ techDebt, onViewChange }) {
  const controlsRef = useRef(null);
  const lastRef = useRef({ x: 0, y: 0 });
  const normalized = (techDebt - 1) / 9;

  useFrame(() => {
    if (!controlsRef.current || !onViewChange) return;

    const azimuth = controlsRef.current.getAzimuthalAngle();
    const polar = controlsRef.current.getPolarAngle() - Math.PI / 2;
    const nextX = polar * (0.5 + normalized * 0.25);
    const nextY = azimuth;

    if (
      Math.abs(nextX - lastRef.current.x) > 0.001 ||
      Math.abs(nextY - lastRef.current.y) > 0.001
    ) {
      lastRef.current = { x: nextX, y: nextY };
      onViewChange(lastRef.current);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={false}
      enablePan={false}
      autoRotate
      autoRotateSpeed={0.4}
      minPolarAngle={Math.PI / 3}
      maxPolarAngle={(2 * Math.PI) / 3}
    />
  );
}

/**
 * ThreeScene — drop-in React component.
 * @prop {number} techDebt  1–10
 * @prop {number} [height]  Canvas height in px (default 320)
 */
export default function ThreeScene({ techDebt = 1, height = 320, onViewChange }) {
  return (
    <div style={{ width: "100%", height, background: "transparent" }}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Rig techDebt={techDebt} />
        <StatusOrb techDebt={techDebt} />
        <SyncOrbitControls techDebt={techDebt} onViewChange={onViewChange} />
      </Canvas>
    </div>
  );
}
