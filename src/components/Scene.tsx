import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
//import * as THREE from "three";
import Avatar from './Avatar';

interface SceneProps {
  musicIntensity: number;
  levelState: {
    current: number;
    isWinner: boolean;
  };
  audioData: {
    bass: number;
    mid: number;
    treble: number;
    volume: number;
  };
}

const Scene: React.FC<SceneProps> = ({ musicIntensity, levelState, audioData }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 20], fov: 75 }}
      style={{ background: 'radial-gradient(circle at center, #001122 0%, #000000 100%)' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.2} color="#222244" />
      <spotLight
        position={[0, 15, 15]}
        angle={Math.PI / 4}
        penumbra={0.3}
        intensity={3}
        color="#00FFFF"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight
        position={[-15, 12, 8]}
        angle={Math.PI / 5}
        penumbra={0.4}
        intensity={2.5}
        color="#FF1493"
      />
      <spotLight
        position={[15, 12, 8]}
        angle={Math.PI / 5}
        penumbra={0.4}
        intensity={2.5}
        color="#32CD32"
      />

      {/* Environment */}
      <Environment preset="night" />
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshPhongMaterial 
          color="#ececffff" 
          shininess={200} 
          transparent 
          opacity={0.9} 
        />
      </mesh>

      {/* Stage platform */}
      <mesh position={[0, -2.75, 0]} receiveShadow>
        <cylinderGeometry args={[8, 8, 0.5, 32]} />
        <meshPhongMaterial 
          color="#bcbcd1ff" 
          transparent 
          opacity={0.8} 
          emissive="#c3c3dbff"
        />
      </mesh>

      {/* Contact shadows */}
      <ContactShadows 
        position={[0, -5, 0]} 
        opacity={0.4} 
        scale={10} 
        blur={2} 
        far={4} 
      />

      {/* Avatar */}
      <Suspense fallback={null}>
        <Avatar 
          musicIntensity={musicIntensity}
          levelState={levelState}
          audioData={audioData}
        />
      </Suspense>

      {/* Controls for development (remove in production) */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
      />
    </Canvas>
  );
};

export default Scene;