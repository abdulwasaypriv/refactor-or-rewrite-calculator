/**
 * StarsBackground.jsx
 * Full-screen starfield that orbits with the orb's energy level.
 * The orb's techDebt value controls star density, speed, scale, and spin.
 */

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

function OrbitingStarfield({ techDebt, orbitRotation }) {
  const fieldRef = useRef(null);
  const normalized = Math.min(Math.max((techDebt - 1) / 9, 0), 1);

  const count = Math.round(1800 + normalized * 3200);
  const speed = 0.35 + normalized * 2.15;
  const factor = 3 + normalized * 3;
  const saturation = normalized;
  const depth = 55 + normalized * 35;

  useFrame(({ clock }) => {
    if (!fieldRef.current) return;

    const elapsed = clock.getElapsedTime();
    fieldRef.current.rotation.z = elapsed * (0.012 + normalized * 0.05);
    fieldRef.current.rotation.x =
      orbitRotation.x + Math.sin(elapsed * 0.18) * (0.02 + normalized * 0.04);
    fieldRef.current.rotation.y =
      orbitRotation.y + Math.cos(elapsed * 0.12) * (0.03 + normalized * 0.05);

    const pulse = 1 + Math.sin(elapsed * (0.7 + normalized)) * (0.015 + normalized * 0.03);
    fieldRef.current.scale.setScalar(pulse);
  });

  return (
    <group ref={fieldRef}>
      <Stars
        radius={110}
        depth={depth}
        count={count}
        factor={factor}
        saturation={saturation}
        fade
        speed={speed}
      />
    </group>
  );
}

export default function StarsBackground({
  techDebt = 1,
  orbitRotation = { x: 0, y: 0 },
}) {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, background: "transparent" }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 1], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <OrbitingStarfield techDebt={techDebt} orbitRotation={orbitRotation} />
      </Canvas>
    </div>
  );
}
