import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PaperFlaresProps {
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

const PaperFlares: React.FC<PaperFlaresProps> = ({ musicIntensity, levelState, audioData }) => {
  const groupRef = useRef<THREE.Group>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  
  // Create paper flare particles
  const particleCount = levelState.isWinner ? 500 : 200 + (levelState.current * 50);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < particleCount; i++) {
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 30,
          Math.random() * 20 + 5,
          (Math.random() - 0.5) * 30
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          Math.random() * 8 + 2,
          (Math.random() - 0.5) * 10
        ),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        scale: Math.random() * 0.5 + 0.3,
        life: Math.random() * 5 + 3,
        maxLife: Math.random() * 5 + 3,
        color: new THREE.Color().setHSL(
          Math.random(),
          0.7 + Math.random() * 0.3,
          0.5 + Math.random() * 0.3
        ),
        explosionForce: Math.random() * 2 + 1,
        gravity: -0.02 - Math.random() * 0.01,
        flutter: Math.random() * 0.1 + 0.05
      });
    }
    return temp;
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!instancedMeshRef.current) return;

    const time = state.clock.getElapsedTime();
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    // Music-reactive explosion intensity
    const explosionIntensity = 1 + musicIntensity * 3;
    const bassBoost = 1 + audioData.bass * 2;
    const trebleFlutter = audioData.treble * 0.5;

    particles.forEach((particle, i) => {
      // Update particle physics
      particle.velocity.y += particle.gravity;
      particle.velocity.x += Math.sin(time * 2 + i) * particle.flutter * trebleFlutter;
      particle.velocity.z += Math.cos(time * 2 + i) * particle.flutter * trebleFlutter;
      
      // Apply explosion force based on music
      const explosionForce = particle.explosionForce * explosionIntensity * bassBoost;
      particle.position.add(particle.velocity.clone().multiplyScalar(delta * explosionForce));
      
      // Rotation
      particle.rotation += particle.rotationSpeed * (1 + musicIntensity);
      
      // Life cycle
      particle.life -= delta;
      
      // Reset particle if it dies or falls too low
      if (particle.life <= 0 || particle.position.y < -10) {
        particle.position.set(
          (Math.random() - 0.5) * 5,
          Math.random() * 5 + 10,
          (Math.random() - 0.5) * 5
        );
        particle.velocity.set(
          (Math.random() - 0.5) * 15 * explosionIntensity,
          Math.random() * 12 + 5,
          (Math.random() - 0.5) * 15 * explosionIntensity
        );
        particle.life = particle.maxLife;
        
        // Winner state creates more colorful explosions
        if (levelState.isWinner) {
          particle.color.setHSL(
            (time * 0.5 + i * 0.1) % 1,
            0.9,
            0.6 + Math.sin(time * 3 + i) * 0.2
          );
        } else {
          // Level-based color progression
          const hue = (levelState.current * 0.15 + Math.random() * 0.3) % 1;
          particle.color.setHSL(hue, 0.7, 0.5 + musicIntensity * 0.3);
        }
      }
      
      // Calculate alpha based on life and music intensity
      const lifeRatio = particle.life / particle.maxLife;
      const alpha = Math.min(1, lifeRatio * (0.6 + musicIntensity * 0.4));
      
      // Set matrix for instanced mesh
      matrix.makeRotationZ(particle.rotation);
      matrix.setPosition(particle.position);
      matrix.scale(new THREE.Vector3(
        particle.scale * (0.5 + musicIntensity * 0.5),
        particle.scale * (0.5 + musicIntensity * 0.5),
        0.1
      ));
      
      instancedMeshRef.current!.setMatrixAt(i, matrix);
      
      // Set color with music-reactive brightness
      color.copy(particle.color);
      color.multiplyScalar(0.8 + audioData.mid * 0.5);
      instancedMeshRef.current?.setMatrixAt(i, matrix);
    });
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Paper flare particles */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, particleCount]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexColors={true}
        />
      </instancedMesh>
      
      {/* Central explosion source */}
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={levelState.isWinner ? "#FFD700" : "#FF6B6B"}
          transparent
          opacity={0.3 + musicIntensity * 0.7}
          emissive={levelState.isWinner ? "#FFD700" : "#FF6B6B"}
          emissiveIntensity={musicIntensity * 2}
        />
      </mesh>
      
      {/* Winner state additional effects */}
      {levelState.isWinner && (
        <>
          {/* Ring explosion effect */}
          <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2, 4, 32]} />
            <meshBasicMaterial
              color="#FFD700"
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Secondary ring */}
          <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4, 6, 32]} />
            <meshBasicMaterial
              color="#FF1493"
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}
      
      {/* Confetti burst for high levels */}
      {levelState.current >= 4 && (
        <group>
          {Array.from({ length: 50 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin(i * 0.5) * (5 + musicIntensity * 10),
                8 + Math.cos(i * 0.3) * 3,
                Math.cos(i * 0.5) * (5 + musicIntensity * 10)
              ]}
              rotation={[
                Math.sin(Date.now() * 0.01 + i) * 0.5,
                Math.cos(Date.now() * 0.01 + i) * 0.5,
                i * 0.1
              ]}
            >
              <boxGeometry args={[0.2, 0.2, 0.05]} />
              <meshBasicMaterial
                color={new THREE.Color().setHSL(
                  (i * 0.1 + Date.now() * 0.001) % 1,
                  0.8,
                  0.6
                )}
                transparent
                opacity={0.7 + audioData.treble * 0.3}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export default PaperFlares;