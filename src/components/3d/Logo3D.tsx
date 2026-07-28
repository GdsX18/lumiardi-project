'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface EmblemMeshProps {
  isHovered: boolean;
  mousePos: { x: number; y: number };
  scrollProgress: number;
}

function EmblemMesh({ isHovered, mousePos, scrollProgress }: EmblemMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Trava do delta para evitar aceleração ao trocar de aba (máximo de 0.05s por frame)
    const safeDelta = Math.min(delta, 0.05);

    // Rotação constante, elegante e suave no eixo Y
    const autoRotY = state.clock.getElapsedTime() * 0.12 + scrollProgress * Math.PI * 1.0;
    const targetRotX = isHovered 
      ? mousePos.y * 0.25 
      : Math.sin(state.clock.getElapsedTime() * 0.4) * 0.05 + (1.0 - scrollProgress) * 0.08;

    const targetRotY = isHovered ? autoRotY + mousePos.x * 0.3 : autoRotY;
    const targetRotZ = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.03;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, safeDelta * 3);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, safeDelta * 3);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, safeDelta * 3);

    // Escala calibrada sem cortes
    const baseScale = 0.62 + scrollProgress * 0.20;
    const hoverScale = isHovered ? 1.04 : 1.0;
    const finalScale = baseScale * hoverScale;

    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, finalScale, safeDelta * 3)
    );

    // Pulsação sutil de brilho no núcleo
    if (coreRef.current && coreRef.current.material) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.15 + scrollProgress * 0.2;
    }
  });

  const rayCount = 24;
  const rays = Array.from({ length: rayCount });

  return (
    <group ref={groupRef}>
      {/* Núcleo de Ouro Radiante */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#FFF4B8"
          emissive="#C9A96B"
          emissiveIntensity={0.5}
          metalness={0.95}
          roughness={0.08}
          envMapIntensity={3.2}
        />
      </mesh>

      {/* Anel Externo Dourado Polido */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.25, 0.12, 32, 100]} />
        <meshStandardMaterial
          color="#F5D075"
          metalness={0.92}
          roughness={0.12}
          envMapIntensity={3.0}
        />
      </mesh>

      {/* Anel Interno Champanhe */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.58, 0.08, 32, 64]} />
        <meshStandardMaterial
          color="#FFE599"
          metalness={0.95}
          roughness={0.1}
          envMapIntensity={3.2}
        />
      </mesh>

      {/* 24 Raios Radiais 3D com Chanfro e Acabamento Metálico */}
      {rays.map((_, i) => {
        const angle = (i / rayCount) * Math.PI * 2;
        const radius = 1.55;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <mesh
            key={i}
            position={[x, y, 0]}
            rotation={[0, 0, angle + Math.PI / 2]}
          >
            <boxGeometry args={[0.08, 0.75, 0.08]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#F3D78A' : '#C9A96B'}
              metalness={0.88}
              roughness={0.15}
              envMapIntensity={2.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export interface Logo3DProps {
  className?: string;
  scrollProgress?: number;
}

export const Logo3D: React.FC<Logo3DProps> = ({ className = 'w-full h-full', scrollProgress = 0 }) => {
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
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Iluminação de Estúdio & Reflexos Metálicos Dourados */}
        <ambientLight intensity={1.8} />
        <directionalLight position={[6, 8, 6]} intensity={3.8} color="#FFF8E7" />
        <directionalLight position={[-6, -4, 4]} intensity={2.8} color="#FFD700" />
        <spotLight position={[0, 6, 10]} intensity={4.5} angle={0.6} penumbra={1} color="#FFFFFF" />
        <pointLight position={[0, 0, 6]} intensity={3.2} color="#FFF5D6" />

        {/* Ambiente de Estúdio para Reflexos Dourados */}
        <Environment preset="city" />

        {/* Partículas Douradas Efervescentes */}
        <Sparkles
          count={30}
          scale={6.0}
          size={2.2}
          speed={0.3}
          opacity={0.6}
          color="#FFE599"
        />

        <Float speed={1.5} rotationIntensity={0.12} floatIntensity={0.3}>
          <EmblemMesh isHovered={isHovered} mousePos={mousePos} scrollProgress={scrollProgress} />
        </Float>
      </Canvas>
    </div>
  );
};
