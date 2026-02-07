import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Preload } from "@react-three/drei";
import { AdditiveBlending } from "three";

function randomInSphereFloat32(count, radius) {
  const arr = new Float32Array(count);
  const R = Number(radius) || 1;
  for (let i = 0; i < arr.length; i += 3) {
    const u = Math.random();
    const v = Math.random();
    const w = Math.random();

    const r = Math.cbrt(u) * R;
    const cosTheta = 2 * v - 1;
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
    const phi = 2 * Math.PI * w;

    arr[i] = r * sinTheta * Math.cos(phi);
    arr[i + 1] = r * sinTheta * Math.sin(phi);
    arr[i + 2] = r * cosTheta;
  }
  return arr;
}

function Stars({ color, materialOpacity, size, ...props }) {
  const ref = useRef(null);
  const sphere = useMemo(() => randomInSphereFloat32(12000, 1.9), []);

  useFrame((_state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points
        ref={ref}
        positions={sphere}
        stride={3}
        frustumCulled
        position={[0, 0, -0.8]}
        {...props}
      >
        <PointMaterial
          transparent
          color={color}
          opacity={materialOpacity}
          size={size}
          sizeAttenuation
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export default function StarsCanvas({ theme = "light" }) {
  const isDark = theme === "dark";
  // Higher contrast in light mode so particles are visible.
  const color = isDark ? "#cfe8ff" : "#1d4ed8";
  const layerOpacity = isDark ? 0.55 : 0.55;
  const materialOpacity = isDark ? 0.85 : 0.95;
  const size = isDark ? 0.003 : 0.004;

  return (
    <div className="stars-canvas" style={{ opacity: layerOpacity }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        camera={{ position: [0, 0, 1] }}
      >
        <Stars color={color} materialOpacity={materialOpacity} size={size} />
        <Preload all />
      </Canvas>
    </div>
  );
}
