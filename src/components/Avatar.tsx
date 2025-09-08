import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarProps {
  musicIntensity: number;
  levelState: number;
  audioData: {
    bass: number;
    mid: number;
    treble: number;
  };
}

const Avatar: React.FC<AvatarProps> = ({ musicIntensity, levelState, audioData }) => {
  const group = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // For when you have a .glb model with animations:
  // const { scene, animations } = useGLTF('/path/to/your/model.glb');
  // const { actions } = useAnimations(animations, group);
  
  // Animation mixer for .glb models
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  
  // Initialize animations when .glb model is loaded
  useEffect(() => {
    // Uncomment when using .glb model:
    // if (animations.length > 0 && scene) {
    //   mixer.current = new THREE.AnimationMixer(scene);
    //   animations.forEach((clip) => {
    //     const action = mixer.current!.clipAction(clip);
    //     action.play();
    //   });
    // }
  }, []);

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Update animation mixer for .glb models
    if (mixer.current) {
      const scaledDelta = delta * (0.5 + musicIntensity * 2);
      mixer.current.update(scaledDelta);
    }

    // Procedural animation based on music intensity and level
    const time = state.clock.getElapsedTime();
    
    // Base movement intensity based on level
    const baseIntensity = levelState * 0.2;
    const musicMultiplier = 1 + musicIntensity * 2;
    
    // Different movements for different audio frequencies
    const bassMovement = Math.sin(time * 2) * audioData.bass * baseIntensity;
    const midMovement = Math.sin(time * 4) * audioData.mid * baseIntensity;
    const trebleMovement = Math.sin(time * 8) * audioData.treble * baseIntensity;
    
    // Apply movements to the avatar
    meshRef.current.rotation.y = bassMovement * 0.5;
    meshRef.current.position.y = midMovement * 0.3;
    meshRef.current.rotation.x = trebleMovement * 0.2;
    
    // Scale based on overall music intensity
    const scale = 1 + musicIntensity * 0.3;
    meshRef.current.scale.setScalar(scale);
    
    // Color changes based on level
    if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      const hue = (levelState * 60) / 360; // Red to yellow to green progression
      const saturation = 0.7 + musicIntensity * 0.3;
      const lightness = 0.5 + musicIntensity * 0.2;
      
      meshRef.current.material.color.setHSL(hue, saturation, lightness);
      meshRef.current.material.emissive.setHSL(hue, saturation * 0.3, lightness * 0.1);
    }
  });

  return (
    <group ref={group} position={[0, -1, 0]}>
      {/* For .glb models, use: */}
      {/* <primitive object={scene} scale={0.2} /> */}
      
      {/* Procedural avatar (remove when using .glb model) */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 2, 0.5]} />
        <meshStandardMaterial 
          color="#6c22a3"
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* Avatar "head" */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color="#8b5cf6"
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
      
      {/* Avatar "arms" */}
      <mesh position={[-0.8, 0.5, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color="#6c22a3" />
      </mesh>
      <mesh position={[0.8, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color="#6c22a3" />
      </mesh>
    </group>
  );
};

export default Avatar;