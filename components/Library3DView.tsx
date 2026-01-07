import React, { useRef, useState, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { SavedPuzzle, Difficulty, PuzzleConfig } from '../types';
import { ArrowLeft, Play, X } from 'lucide-react';

interface Library3DViewProps {
  history: SavedPuzzle[];
  onSelect: (config: PuzzleConfig) => void;
  onBack: () => void;
}

interface PuzzleBoxProps {
  puzzle: SavedPuzzle;
  position: [number, number, number];
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  totalInStack: number;
}

// Placeholder texture for loading
const PLACEHOLDER_TEXTURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// Floating dust particles for atmosphere
const DustParticles: React.FC<{ count?: number }> = ({ count = 50 }) => {
  const meshRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 10 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      sizes[i] = Math.random() * 0.05 + 0.02;
    }

    return { positions, sizes };
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.001;
      positions[i * 3] += Math.cos(state.clock.elapsedTime * 0.3 + i * 0.5) * 0.0005;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
};

// Individual Puzzle Box Component
const PuzzleBox: React.FC<PuzzleBoxProps> = ({
  puzzle,
  position,
  index,
  isSelected,
  onSelect,
  totalInStack
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Target positions for animation
  const targetPosition = useRef(new THREE.Vector3(...position));
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));
  const targetScale = useRef(1);

  // Load texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      puzzle.imageUrl || PLACEHOLDER_TEXTURE,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        // On error, load placeholder
        loader.load(PLACEHOLDER_TEXTURE, setTexture);
      }
    );
  }, [puzzle.imageUrl]);

  // Animation for selection
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    if (isSelected) {
      // Move to center front position with floating effect
      targetPosition.current.set(0, 0.8 + Math.sin(time * 1.5) * 0.1, 4.5);
      // Gentle rotation when selected
      targetRotation.current.set(
        Math.sin(time * 0.8) * 0.05,
        Math.sin(time * 0.5) * 0.08,
        0
      );
      targetScale.current = 1.4;
    } else {
      // Return to shelf position
      targetPosition.current.set(...position);
      targetRotation.current.set(-0.1, 0, 0);
      targetScale.current = 1;
    }

    // Smooth interpolation - faster for selection
    const lerpSpeed = isSelected ? 4 : 5;
    groupRef.current.position.lerp(targetPosition.current, delta * lerpSpeed);

    groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * delta * 5;
    groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * delta * 5;

    const currentScale = groupRef.current.scale.x;
    const newScale = currentScale + (targetScale.current - currentScale) * delta * 5;
    groupRef.current.scale.setScalar(newScale);

    // Hover float effect when not selected
    if (!isSelected && meshRef.current && hovered) {
      meshRef.current.position.y = Math.sin(time * 3) * 0.08;
      meshRef.current.position.z = Math.sin(time * 2) * 0.03;
    } else if (meshRef.current && !isSelected) {
      meshRef.current.position.y *= 0.9;
      meshRef.current.position.z *= 0.9;
    }
  });

  const boxWidth = 2.5;
  const boxHeight = 3.2;
  const boxDepth = 0.3;

  return (
    <group ref={groupRef} position={position} rotation={[-0.1, 0, 0]}>
      {/* Glow lights when selected - multiple for dramatic effect */}
      {isSelected && (
        <>
          <pointLight position={[0, 0, 2]} color="#ffffff" intensity={2.5} distance={8} />
          <pointLight position={[-1.5, 0, 1]} color="#6366f1" intensity={1} distance={4} />
          <pointLight position={[1.5, 0, 1]} color="#ec4899" intensity={1} distance={4} />
        </>
      )}

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
          setHovered(false);
        }}
      >
        <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />

        {/* Right */}
        <meshStandardMaterial attach="material-0" color="#1a1a1a" roughness={0.9} />
        {/* Left */}
        <meshStandardMaterial attach="material-1" color="#1a1a1a" roughness={0.9} />
        {/* Top */}
        <meshStandardMaterial attach="material-2" color="#252525" roughness={0.8} />
        {/* Bottom */}
        <meshStandardMaterial attach="material-3" color="#0a0a0a" roughness={0.9} />
        {/* Front - The Image */}
        <meshStandardMaterial
          attach="material-4"
          map={texture}
          roughness={0.6}
          emissive={hovered || isSelected ? "#222222" : "#000000"}
          emissiveIntensity={hovered || isSelected ? 0.3 : 0}
        />
        {/* Back */}
        <meshStandardMaterial attach="material-5" color="#111111" roughness={0.9} />
      </mesh>

      {/* Hover indicator */}
      {hovered && !isSelected && (
        <Html position={[0, boxHeight / 2 + 0.5, 0]} center>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium whitespace-nowrap border border-white/20 shadow-lg">
            Click to select
          </div>
        </Html>
      )}
    </group>
  );
};

// Wooden Shelf Structure
const WoodenShelf: React.FC<{ y: number; width: number }> = ({ y, width }) => {
  return (
    <group position={[0, y, 0]}>
      {/* Main shelf board */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[width, 0.15, 2.5]} />
        <meshStandardMaterial color="#2a2015" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Front edge detail */}
      <mesh position={[0, -0.025, 1.15]}>
        <boxGeometry args={[width, 0.1, 0.2]} />
        <meshStandardMaterial color="#1f180f" roughness={0.8} />
      </mesh>

      {/* Support brackets */}
      {[-width/2 + 0.3, width/2 - 0.3].map((x, i) => (
        <mesh key={i} position={[x, -0.35, 0.8]}>
          <boxGeometry args={[0.15, 0.5, 0.15]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
};

// Back Panel
const BackPanel: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  return (
    <mesh position={[0, height / 2 - 1, -1]}>
      <boxGeometry args={[width + 0.5, height + 1, 0.1]} />
      <meshStandardMaterial color="#0a0a0a" roughness={0.95} />
    </mesh>
  );
};

// Side Panels
const SidePanel: React.FC<{ x: number; height: number }> = ({ x, height }) => {
  return (
    <mesh position={[x, height / 2 - 1, 0.3]}>
      <boxGeometry args={[0.15, height + 1, 3]} />
      <meshStandardMaterial color="#1a1410" roughness={0.85} />
    </mesh>
  );
};

// Main 3D Scene
const LibraryScene: React.FC<{
  puzzles: SavedPuzzle[];
  selectedId: string | null;
  onSelectPuzzle: (id: string) => void;
  onClose: () => void;
}> = ({ puzzles, selectedId, onSelectPuzzle, onClose }) => {
  const { camera } = useThree();

  // Calculate layout - puzzles stacked on shelves
  const puzzlesPerShelf = 4;
  const shelfCount = Math.ceil(puzzles.length / puzzlesPerShelf) || 1;
  const shelfWidth = 12;
  const shelfSpacing = 4;

  // Camera animation for selection
  useFrame((state, delta) => {
    const targetZ = selectedId ? 8 : 10;
    const targetY = selectedId ? 1.5 : 2;

    camera.position.z += (targetZ - camera.position.z) * delta * 3;
    camera.position.y += (targetY - camera.position.y) * delta * 3;
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.25} />
      <spotLight
        position={[0, 12, 10]}
        angle={0.35}
        penumbra={0.9}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Accent lights for atmosphere */}
      <pointLight position={[-8, 4, 5]} intensity={0.5} color="#ff6b35" />
      <pointLight position={[8, 4, 5]} intensity={0.5} color="#3b82f6" />
      <pointLight position={[0, -1, 6]} intensity={0.3} color="#8b5cf6" />

      {/* Dynamic spotlight for selected item */}
      {selectedId && (
        <spotLight
          position={[0, 6, 8]}
          target-position={[0, 0.8, 4.5]}
          angle={0.3}
          penumbra={0.5}
          intensity={2}
          color="#ffffff"
        />
      )}

      {/* Shelf structure */}
      <BackPanel width={shelfWidth} height={shelfCount * shelfSpacing + 2} />
      <SidePanel x={-shelfWidth/2 - 0.1} height={shelfCount * shelfSpacing + 2} />
      <SidePanel x={shelfWidth/2 + 0.1} height={shelfCount * shelfSpacing + 2} />

      {/* Shelves */}
      {Array.from({ length: shelfCount + 1 }).map((_, shelfIndex) => (
        <WoodenShelf
          key={shelfIndex}
          y={shelfIndex * shelfSpacing - 1.5}
          width={shelfWidth}
        />
      ))}

      {/* Puzzle boxes */}
      <Suspense fallback={null}>
        {puzzles.map((puzzle, index) => {
          const shelfIndex = Math.floor(index / puzzlesPerShelf);
          const positionInShelf = index % puzzlesPerShelf;
          const totalInThisShelf = Math.min(puzzlesPerShelf, puzzles.length - shelfIndex * puzzlesPerShelf);

          // Calculate x position (spread evenly on shelf)
          const startX = -(totalInThisShelf - 1) * 2.8 / 2;
          const x = startX + positionInShelf * 2.8;
          const y = shelfIndex * shelfSpacing + 0.3;
          const z = 0;

          return (
            <PuzzleBox
              key={puzzle.id}
              puzzle={puzzle}
              position={[x, y, z]}
              index={index}
              isSelected={selectedId === puzzle.id}
              onSelect={() => onSelectPuzzle(puzzle.id)}
              totalInStack={totalInThisShelf}
            />
          );
        })}
      </Suspense>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 2]}>
        <planeGeometry args={[20, 15]} />
        <meshStandardMaterial color="#080808" roughness={0.9} />
      </mesh>

      {/* Atmospheric dust particles */}
      <DustParticles count={60} />

      {/* Click outside to deselect */}
      {selectedId && (
        <mesh
          position={[0, 0, -5]}
          onClick={onClose}
          visible={false}
        >
          <planeGeometry args={[50, 50]} />
        </mesh>
      )}
    </>
  );
};

// Difficulty Selector Panel (HTML overlay)
const DifficultySelector: React.FC<{
  puzzle: SavedPuzzle;
  onPlay: (difficulty: Difficulty) => void;
  onClose: () => void;
}> = ({ puzzle, onPlay, onClose }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.EASY);

  const difficulties = [
    { label: 'Easy', sublabel: '3×3 = 9 pcs', value: Difficulty.EASY },
    { label: 'Medium', sublabel: '5×5 = 25 pcs', value: Difficulty.MEDIUM },
    { label: 'Hard', sublabel: '8×8 = 64 pcs', value: Difficulty.HARD },
    { label: 'Expert', sublabel: '10×10 = 100 pcs', value: Difficulty.EXPERT },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <div className="pointer-events-auto bg-black/80 backdrop-blur-xl border border-zinc-700 rounded-2xl p-8 max-w-md w-full mx-4 animate-fade-in shadow-2xl shadow-black/50">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5 text-zinc-400" />
        </button>

        {/* Preview image */}
        <div className="w-full aspect-video rounded-lg overflow-hidden mb-6 border border-zinc-800">
          <img
            src={puzzle.imageUrl}
            alt="Puzzle preview"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Date */}
        <p className="text-zinc-500 text-sm mb-4">
          Created on {new Date(puzzle.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>

        {/* Difficulty selector */}
        <h3 className="text-white font-bold text-lg mb-4 tracking-wide">SELECT DIFFICULTY</h3>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {difficulties.map((diff) => (
            <button
              key={diff.value}
              onClick={() => setSelectedDifficulty(diff.value)}
              className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                selectedDifficulty === diff.value
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900/50 text-white border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
              }`}
            >
              <span className="font-bold block">{diff.label}</span>
              <span className={`text-xs ${selectedDifficulty === diff.value ? 'text-zinc-600' : 'text-zinc-500'}`}>
                {diff.sublabel}
              </span>
            </button>
          ))}
        </div>

        {/* Play button */}
        <button
          onClick={() => onPlay(selectedDifficulty)}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors"
        >
          <Play className="w-5 h-5 fill-current" />
          START PUZZLE
        </button>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="text-center p-8 border border-zinc-800 rounded-2xl bg-zinc-900/30 max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
          <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your shelf is empty</h2>
        <p className="text-zinc-500 mb-6">Create your first puzzle to start building your collection.</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors"
        >
          Create your first puzzle
        </button>
      </div>
    </div>
  );
};

// Main Component
const Library3DView: React.FC<Library3DViewProps> = ({ history, onSelect, onBack }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPuzzle = history.find(p => p.id === selectedId);

  const handlePlay = (difficulty: Difficulty) => {
    if (selectedPuzzle) {
      onSelect({
        imageUrl: selectedPuzzle.imageUrl,
        difficulty
      });
    }
  };

  const handleClose = () => {
    setSelectedId(null);
  };

  if (history.length === 0) {
    return <EmptyState onBack={onBack} />;
  }

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 flex items-center gap-4 bg-gradient-to-b from-black via-black/80 to-transparent">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-zinc-800 transition-colors border border-zinc-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tighter">PUZZLE LIBRARY</h1>
          <p className="text-zinc-500 text-sm">{history.length} puzzle{history.length !== 1 ? 's' : ''} in your collection</p>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 2, 10], fov: 45 }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 8, 25]} />

        <LibraryScene
          puzzles={history}
          selectedId={selectedId}
          onSelectPuzzle={setSelectedId}
          onClose={handleClose}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          minAzimuthAngle={-Math.PI / 6}
          maxAzimuthAngle={Math.PI / 6}
        />
      </Canvas>

      {/* Difficulty selector overlay */}
      {selectedPuzzle && (
        <DifficultySelector
          puzzle={selectedPuzzle}
          onPlay={handlePlay}
          onClose={handleClose}
        />
      )}

      {/* Instructions */}
      {!selectedId && (
        <div className="absolute bottom-8 left-0 right-0 text-center text-zinc-600 text-sm pointer-events-none">
          Click on a puzzle box to select it • Drag to rotate the view
        </div>
      )}
    </div>
  );
};

export default Library3DView;
