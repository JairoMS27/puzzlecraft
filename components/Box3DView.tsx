import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface Box3DViewProps {
  imageUrl: string;
  onOpen: () => void;
}

const RealisticPuzzleBox = ({ imageUrl, onOpen }: { imageUrl: string; onOpen: () => void }) => {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    if (groupRef.current && !hovered) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  // Materials
  const cardboardMaterial = new THREE.MeshStandardMaterial({ 
    color: '#1a1a1a', // Dark cardboard
    roughness: 0.7,
    metalness: 0.1 
  });
  
  const imageMaterial = new THREE.MeshStandardMaterial({ 
    map: texture,
    roughness: 0.2,
    metalness: 0.0
  });

  // Box Dimensions (Standard Puzzle Box 4:3 ratio approximately)
  const width = 4.5;
  const height = 3.5;
  const depth = 0.8;

  return (
    <group ref={groupRef} rotation={[0, -0.5, 0]}>
      <group
        onClick={onOpen}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
      >
        {/* Main Box Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[width, height, depth]} />
          {/* Apply material to faces: Right, Left, Top, Bottom, Front, Back */}
          <meshStandardMaterial attach="material-0" {...cardboardMaterial} />
          <meshStandardMaterial attach="material-1" {...cardboardMaterial} />
          <meshStandardMaterial attach="material-2" {...cardboardMaterial} />
          <meshStandardMaterial attach="material-3" {...cardboardMaterial} />
          <primitive object={imageMaterial} attach="material-4" />
          <meshStandardMaterial attach="material-5" {...cardboardMaterial} />
        </mesh>

        {/* Lid Lip (Visual detail to make it look like a real 2-piece box) */}
        <mesh position={[0, 0, -0.05]}> 
          <boxGeometry args={[width + 0.05, height + 0.05, depth * 0.6]} />
           <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>
      
      <Html position={[0, -3, 0]} center>
        <div className={`transition-all duration-500 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
           <button 
             onClick={onOpen}
             className="bg-white text-black px-8 py-3 rounded-full font-bold text-lg tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform"
           >
             OPEN BOX
           </button>
        </div>
      </Html>
    </group>
  );
};

const Box3DView: React.FC<Box3DViewProps> = ({ imageUrl, onOpen }) => {
  return (
    <div className="w-full h-screen relative bg-zinc-950">
      <div className="absolute top-8 left-0 w-full text-center z-10 pointer-events-none">
        <h2 className="text-2xl text-white font-light tracking-widest uppercase">Inspect Box</h2>
        <p className="text-zinc-500 text-sm mt-2">Drag to rotate • Click to open</p>
      </div>
      
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, 5]} intensity={0.5} color="#4444ff" />
        <RealisticPuzzleBox imageUrl={imageUrl} onOpen={onOpen} />
        <OrbitControls enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI * 0.7} />
      </Canvas>
    </div>
  );
};

export default Box3DView;