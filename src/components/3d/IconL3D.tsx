'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface LMeshProps {
  isHovered: boolean;
  mousePos: { x: number; y: number };
}

function LMesh({ isHovered, mousePos }: LMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Rotação sutil contínua
    const autoRotY = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    const targetRotX = isHovered ? mousePos.y * 0.4 : Math.cos(state.clock.getElapsedTime() * 0.4) * 0.1;
    const targetRotY = isHovered ? mousePos.x * 0.5 + autoRotY : autoRotY;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 4);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 4);
    
    const targetScale = isHovered ? 1.05 : 1.0;
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 4)
    );
  });

  // Criando a forma 3D da letra "L" com cantos chanfrados e proporções elegantes
  const shape = React.useMemo(() => {
    const s = new THREE.Shape();
    // Haste vertical e base horizontal do "L"
    s.moveTo(-0.6, 1.2);
    s.lineTo(-0.1, 1.2);
    s.lineTo(-0.1, -0.7);
    s.lineTo(0.7, -0.7);
    s.lineTo(0.7, -1.1);
    s.lineTo(-0.6, -1.1);
    s.closePath();
    return s;
  }, []);

  const extrudeSettings = React.useMemo(() => ({
    steps: 1,
    depth: 0.35,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelOffset: 0,
    bevelSegments: 3, // Reduzido de 5 para 3 sem perda visual perceptível
  }), []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh position={[0, 0, -0.175]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color="#C9A96B"
          metalness={0.92}
          roughness={0.15}
          envMapIntensity={2.5}
        />
      </mesh>
    </group>
  );
}

export interface IconL3DProps {
  className?: string;
}

export const IconL3D: React.FC<IconL3DProps> = ({ className = 'w-48 h-48 md:w-64 md:h-64' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setMousePos({ x, y });
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
    >
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={2.0} />
        <directionalLight position={[5, 8, 5]} intensity={4.0} color="#FFF8E7" />
        <directionalLight position={[-5, -4, 3]} intensity={3.0} color="#D4B87A" />
        <pointLight position={[0, 0, 5]} intensity={3.5} color="#FFF5D6" />
        <pointLight position={[4, -3, 2]} intensity={2.5} color="#C9A96B" />
        <spotLight position={[0, 6, 8]} intensity={4.0} angle={0.6} penumbra={1} color="#FFFFFF" />

        <Sparkles count={15} scale={5} size={1.8} speed={0.3} opacity={0.5} color="#C9A96B" />

        <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.4}>
          <LMesh isHovered={isHovered} mousePos={mousePos} />
        </Float>
      </Canvas>
    </div>
  );
};
