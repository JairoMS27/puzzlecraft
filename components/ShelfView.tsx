import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SavedPuzzle } from '../types';

interface ShelfViewProps {
  userImageUrl: string;
  history: SavedPuzzle[];
  onSelect: () => void;
}

interface ShelfBoxProps {
  position: [number, number, number];
  rotation: [number, number, number];
  imageUrl?: string;
  isHero?: boolean;
  onSelect?: () => void;
}

// A safe 1x1 gray pixel base64 to use as a fallback texture so useLoader never fails on fetch
const PLACEHOLDER_TEXTURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// Physical Shelf Structure
const ShelfStructure = () => {
  const material = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.8, metalness: 0.2 });
  
  return (
    <group>
       {/* Bottom Board */}
       <mesh position={[0, -2.1, -1]} material={material}>
         <boxGeometry args={[20, 0.2, 5]} />
       </mesh>
       {/* Middle Board (Above) */}
       <mesh position={[0, 2.5, -1]} material={material}>
         <boxGeometry args={[20, 0.2, 5]} />
       </mesh>
       {/* Back Panel */}
       <mesh position={[0, 0, -3.5]} material={material}>
         <boxGeometry args={[20, 10, 0.1]} />
       </mesh>
    </group>
  );
};

// A generic puzzle box (from history or decoy)
const ShelfBox: React.FC<ShelfBoxProps> = ({ position, rotation, imageUrl, isHero = false, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  
  // Always load a texture. If imageUrl is missing/undefined, use the placeholder.
  // useLoader throws a promise, so this component must be wrapped in Suspense.
  const texture = useLoader(THREE.TextureLoader, imageUrl || PLACEHOLDER_TEXTURE);

  useFrame((state) => {
    if (isHero && meshRef.current) {
       // Hero box float and glow movement
       meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
       meshRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group>
      {isHero && (
        <pointLight position={[position[0], position[1], position[2] + 1]} color="#fff" intensity={1.5} distance={4} />
      )}
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        onClick={isHero ? onSelect : undefined}
        onPointerOver={() => { if(isHero) { document.body.style.cursor = 'pointer'; setHover(true); } }}
        onPointerOut={() => { if(isHero) { document.body.style.cursor = 'auto'; setHover(false); } }}
      >
        {/* Box Dimensions: Width 3, Height 4, Depth 0.8 */}
        <boxGeometry args={[3, 4, 0.8]} />
        
        <meshStandardMaterial color="#222" attach="material-0" /> {/* Right */}
        <meshStandardMaterial color="#222" attach="material-1" /> {/* Left */}
        <meshStandardMaterial color="#222" attach="material-2" /> {/* Top */}
        <meshStandardMaterial color="#222" attach="material-3" /> {/* Bottom */}
        
        {/* Front Face - The Image */}
        <meshStandardMaterial map={texture} attach="material-4" emissive={isHero ? "#222" : "#000"} />
        
        <meshStandardMaterial color="#222" attach="material-5" /> {/* Back */}
      </mesh>

      {isHero && hovered && (
        <Html position={[position[0], position[1] + 2.5, position[2]]} center>
           <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-white font-bold whitespace-nowrap border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
             OPEN THIS BOX
           </div>
        </Html>
      )}
    </group>
  );
};

const ShelfView: React.FC<ShelfViewProps> = ({ userImageUrl, history, onSelect }) => {
  // Limit history items to show on shelf
  const shelfItems = history.filter(h => h.imageUrl !== userImageUrl).slice(0, 5);

  return (
    <div className="w-full h-screen relative bg-zinc-950">
      <div className="absolute top-12 left-0 w-full text-center z-10 pointer-events-none">
        <h2 className="text-4xl text-white font-extrabold tracking-tighter">THE COLLECTION</h2>
        <p className="text-zinc-500 text-lg mt-2">Your latest acquisition awaits inspection.</p>
      </div>

      <Canvas camera={{ position: [0, 1, 10], fov: 40 }}>
        <color attach="background" args={['#09090b']} />
        <fog attach="fog" args={['#09090b', 5, 20]} />
        
        <ambientLight intensity={0.4} />
        <spotLight position={[5, 10, 10]} angle={0.5} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-5, 2, 5]} intensity={0.5} color="#4444ff" />

        <ShelfStructure />

        <Suspense fallback={null}>
          {/* Background Puzzles (History) - Placed to the left */}
          {shelfItems.map((item, idx) => (
             <ShelfBox 
               key={idx} 
               imageUrl={item.imageUrl} 
               position={[-4 - (idx * 1.5), 0, -1.5 - (idx * 0.2)] as [number, number, number]} // Staggered back
               rotation={[0, 0.1 + (idx * 0.05), 0] as [number, number, number]} 
             />
          ))}

          {/* Filler boxes on the right if history is empty or small - USING PLACEHOLDER TEXTURE IMPLICITLY */}
          {shelfItems.length < 3 && (
             <>
              <ShelfBox position={[5, 0, -1.5]} rotation={[0, -0.2, 0]} />
              <ShelfBox position={[6.5, 0, -1.8]} rotation={[0, -0.1, 0]} />
             </>
          )}

          {/* HERO BOX - The user's current one */}
          <ShelfBox 
            imageUrl={userImageUrl} 
            isHero={true} 
            position={[0.5, 0, 0]} 
            rotation={[0, -0.1, 0]} 
            onSelect={onSelect} 
          />
        </Suspense>

      </Canvas>
    </div>
  );
};

export default ShelfView;