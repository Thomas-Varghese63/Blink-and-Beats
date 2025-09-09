import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles,OrbitControls, Environment, ContactShadows } from '@react-three/drei';
//import * as THREE from "three";
import Avatar from './Avatar';
import PaperFlares from './Paperflares';

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
      camera={{ position: [0, 0.5, 3], fov: 75 }}
      style={{ background: 'radial-gradient(circle at center, #001122 0%, #000000 100%)' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.2} color="#7ae289" />
      <spotLight
        position={[0, 15, 15]}
        angle={Math.PI / 4}
        penumbra={0.3}
        intensity={3}
        color="#181f1f"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <spotLight
        position={[-15, 12, 8]}
        angle={Math.PI / 5}
        penumbra={0.4}
        intensity={2.5}
        color="#784962"
      />
      <spotLight
        position={[15, 12, 8]}
        angle={Math.PI / 5}
        penumbra={0.4}
        intensity={2.5}
        color="#cd3232"
      />

      {/* Environment */}
      <Environment preset="night" />
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 2]} receiveShadow>
        <planeGeometry args={[50, 200]} />
        <meshPhongMaterial 
          color="#fbfafa" 
          shininess={200} 
          transparent 
          opacity={0.9} 
        />
      </mesh>

      {/* Stage platform */}
      <mesh position={[0, -2.75, -10.5]} receiveShadow>
        <cylinderGeometry args={[9.5, 8, 0.2, 64]} />
        <meshPhongMaterial 
          color="#111010" 
          transparent 
          opacity={0.9} 
          emissive="#021c3b"
        />
      </mesh>

      {/* Contact shadows */}
      <ContactShadows 
        position={[0, -5, 5]} 
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
      

      {/* Party effects when music intensity is high */}
      {musicIntensity >= 3 && (
        <>
          {/* Sparkles effect */}
          <Sparkles
            count={50}
            scale={5}
            size={3}
            color="hotpink"
            speed={0.5}
            position={[0, 1, 0]}
          />
          
          {/* Paper flares effect */}
          <PaperFlares
            musicIntensity={musicIntensity}
            levelState={levelState}
            audioData={audioData}
          />
          
          {/* Additional ambient light for paper flares */}
          <pointLight
            position={[0, 8, 0]}
            intensity={2 + musicIntensity * 2}
            distance={20}
            color="#ff3366"
          />
        </>
      )}

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