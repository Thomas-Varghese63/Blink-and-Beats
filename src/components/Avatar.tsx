// src/components/Avatar.tsx
import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface AvatarProps {
  musicIntensity: number; // 0..1
  levelState: any; // keeps compatible with your Scene (object or number)
  audioData: { bass: number; mid: number; treble: number; volume?: number };
}

const Avatar: React.FC<AvatarProps> = ({ musicIntensity, levelState, audioData }) => {
  const group = useRef<THREE.Group | null>(null);
  // change path if you put the model somewhere else
  const gltf = useGLTF("/models/5_dance_2.glb") as any;
  const { actions, mixer, names } = useAnimations(gltf.animations, group);

  // configure shadows + basic tweaks after model loaded
  useEffect(() => {
    if (!gltf?.scene) return;
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      // Some skinned meshes benefit from disabling frustum culling in r3f
      if ((child as any).isSkinnedMesh) (child as any).frustumCulled = false;
    });
  }, [gltf]);

  // start a dance action (looks for name 'Dance' or first clip)
useEffect(() => {
  if (!actions) return;

  const preferred =
    actions["Dance"] || actions["dance"] || actions[names[0]];

  if (preferred) {
    mixer?.stopAllAction();
    preferred.reset().fadeIn(0.2).play();
    preferred.setLoop(THREE.LoopRepeat,Infinity);
  } else {
    Object.values(actions).forEach((a: any) => a.play());
  }

  // ✅ Cleanup must return void, not the mixer itself
  return () => {
    mixer?.stopAllAction();
  };
}, [actions, mixer, names]);


  // update mixer / speed from musicIntensity and add a little procedural motion
  useFrame((state, delta) => {
    const level = typeof levelState === "number" ? levelState : levelState?.current ?? 1;
    if (mixer) {
      // Speed up the animation when musicIntensity is higher
      mixer.update(delta );
    }
    if (actions) {
      // Also scale the underlying action playback (timeScale)
      Object.values(actions).forEach((a: any) => {
        a.timeScale = 1; // tweak to taste
      });
    }
    // small bob using audio mid
    if (group.current) {
      const t = state.clock.getElapsedTime();
      group.current.position.y = -1 + Math.sin(t * 2) * 0.06 * (audioData.mid || 1) * level;
      group.current.rotation.y = Math.sin(t * 0.5) * 0.05 * musicIntensity;
    }
  });

  return (
    <group ref={group} dispose={null} position={[0, -1, 0]} rotation={[0, 0, 0]}>
      {/* actual model */}
      <primitive object={gltf.scene} />
    </group>
  );
};

useGLTF.preload("/models/5_dance_2.glb");
export default Avatar;
