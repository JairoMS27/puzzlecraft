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
  isBoxOpen: boolean;
  onSelect: () => void;
  totalInStack: number;
  boxColor: string;
}

// Array of colorful box colors like the reference image
const BOX_COLORS = [
  '#e8b4b8', // Dusty pink
  '#7cc6c6', // Teal
  '#f5e6d3', // Cream/beige
  '#4a90a4', // Steel blue
  '#d4a574', // Tan/camel
  '#b8d4e3', // Light blue
  '#e6c9d4', // Rose pink
  '#8fbc8f', // Sage green
  '#deb887', // Burlywood
  '#87ceeb', // Sky blue
  '#f0e68c', // Khaki
  '#dda0dd', // Plum
  '#98d8c8', // Mint
  '#f4a460', // Sandy brown
  '#c9b1ff', // Lavender
  '#ffb6c1', // Light pink
];

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

// Individual Puzzle Box Component with opening animation
const PuzzleBox: React.FC<PuzzleBoxProps> = ({
  puzzle,
  position,
  index,
  isSelected,
  isBoxOpen,
  onSelect,
  totalInStack,
  boxColor
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const baseRef = useRef<THREE.Mesh>(null);
  const lidRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Animation state
  const targetPosition = useRef(new THREE.Vector3(...position));
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));
  const targetScale = useRef(1);
  const lidRotation = useRef(0);

  // Table position (where the box will go when selected)
  // Table top surface is at y = -2 + 1.8 + 0.15/2 = -0.125
  // Box center should be at table top + boxHeight/2 = -0.125 + 0.175 = 0.05
  const tablePosition = new THREE.Vector3(0, 0.05, 8);

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
        loader.load(PLACEHOLDER_TEXTURE, setTexture);
      }
    );
  }, [puzzle.imageUrl]);

  // Animation for selection and box opening
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    if (isSelected) {
      // Move to table position
      targetPosition.current.copy(tablePosition);
      targetRotation.current.set(0, 0, 0);
      targetScale.current = 1.5;

      // Open the lid when isBoxOpen is true
      if (isBoxOpen) {
        lidRotation.current += (Math.PI * 0.75 - lidRotation.current) * delta * 3;
      }
    } else {
      // Return to shelf position
      targetPosition.current.set(...position);
      targetRotation.current.set(0, 0, 0);
      targetScale.current = 1;
      lidRotation.current += (0 - lidRotation.current) * delta * 5;
    }

    // Smooth interpolation
    const lerpSpeed = isSelected ? 4 : 5;
    groupRef.current.position.lerp(targetPosition.current, delta * lerpSpeed);

    groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * delta * 5;
    groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * delta * 5;

    const currentScale = groupRef.current.scale.x;
    const newScale = currentScale + (targetScale.current - currentScale) * delta * 5;
    groupRef.current.scale.setScalar(newScale);

    // Animate lid opening
    if (lidRef.current) {
      lidRef.current.rotation.x = -lidRotation.current;
    }

    // Hover float effect when not selected
    if (!isSelected && baseRef.current && hovered) {
      baseRef.current.position.y = Math.sin(time * 3) * 0.03;
    } else if (baseRef.current && !isSelected) {
      baseRef.current.position.y *= 0.9;
    }
  });

  // Box dimensions
  const boxWidth = 2.8;
  const boxHeight = 0.35;
  const boxDepth = 2.2;
  const lidHeight = 0.08;
  const baseHeight = boxHeight - lidHeight;

  return (
    <group ref={groupRef} position={position} rotation={[0, 0, 0]}>
      {/* Glow lights when selected */}
      {isSelected && (
        <>
          <pointLight position={[0, 2, 1]} color="#ffffff" intensity={4} distance={12} />
          <pointLight position={[-2, 1, 1]} color="#ffd700" intensity={2} distance={6} />
          <pointLight position={[2, 1, 1]} color="#ffd700" intensity={2} distance={6} />
        </>
      )}

      {/* Box Base (bottom part) */}
      <mesh
        ref={baseRef}
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
        position={[0, baseHeight / 2, 0]}
      >
        <boxGeometry args={[boxWidth, baseHeight, boxDepth]} />
        <meshStandardMaterial color={boxColor} roughness={0.6} />
      </mesh>

      {/* Box Lid (top part that opens) - pivots from back edge */}
      <group
        ref={lidRef}
        position={[0, baseHeight, -boxDepth / 2]}
      >
        <mesh position={[0, lidHeight / 2, boxDepth / 2]}>
          <boxGeometry args={[boxWidth, lidHeight, boxDepth]} />
          {/* Multi-material for lid */}
          <meshStandardMaterial attach="material-0" color={boxColor} roughness={0.6} />
          <meshStandardMaterial attach="material-1" color={boxColor} roughness={0.6} />
          {/* Top of lid - shows puzzle image */}
          <meshStandardMaterial
            attach="material-2"
            map={texture}
            roughness={0.3}
            emissive="#ffffff"
            emissiveIntensity={hovered || isSelected ? 0.4 : 0.2}
            emissiveMap={texture}
          />
          <meshStandardMaterial attach="material-3" color={boxColor} roughness={0.7} />
          <meshStandardMaterial attach="material-4" color={boxColor} roughness={0.6} />
          <meshStandardMaterial attach="material-5" color={boxColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Image inside the box (visible when opened) */}
      {isBoxOpen && (
        <mesh position={[0, baseHeight - 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[boxWidth * 0.9, boxDepth * 0.9]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.4}
            emissive="#ffffff"
            emissiveIntensity={0.3}
            emissiveMap={texture}
          />
        </mesh>
      )}

      {/* Hover indicator */}
      {hovered && !isSelected && (
        <Html position={[0, 0.8, boxDepth / 2 + 0.3]} center>
          <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium whitespace-nowrap border border-white/30 shadow-lg">
            Click to select
          </div>
        </Html>
      )}
    </group>
  );
};

// Wooden Shelf Structure - warm oak color like the reference
const WoodenShelf: React.FC<{ y: number; width: number }> = ({ y, width }) => {
  return (
    <group position={[0, y, 0]}>
      {/* Main shelf board */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[width, 0.2, 3.5]} />
        <meshStandardMaterial color="#b8956e" roughness={0.7} metalness={0.02} />
      </mesh>

      {/* Front edge detail */}
      <mesh position={[0, -0.025, 1.65]}>
        <boxGeometry args={[width, 0.15, 0.2]} />
        <meshStandardMaterial color="#a07850" roughness={0.65} />
      </mesh>

      {/* Support brackets - darker wood */}
      {[-width/2 + 0.5, width/2 - 0.5].map((x, i) => (
        <mesh key={i} position={[x, -0.45, 0.8]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#8b6914" roughness={0.75} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
};

// Back Panel - warm wood back
const BackPanel: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  return (
    <mesh position={[0, height / 2 - 1, -1.5]}>
      <boxGeometry args={[width + 0.5, height + 1, 0.15]} />
      <meshStandardMaterial color="#5c4a32" roughness={0.85} />
    </mesh>
  );
};

// Side Panels - matching warm wood
const SidePanel: React.FC<{ x: number; height: number }> = ({ x, height }) => {
  return (
    <mesh position={[x, height / 2 - 1, 0.5]}>
      <boxGeometry args={[0.2, height + 1, 4]} />
      <meshStandardMaterial color="#8b7355" roughness={0.75} />
    </mesh>
  );
};

// Wooden Table for displaying selected puzzle
const WoodenTable: React.FC = () => {
  const tableWidth = 6;
  const tableDepth = 4;
  const tableHeight = 0.15;
  const legHeight = 1.8;
  const legSize = 0.2;

  return (
    <group position={[0, -2, 8]}>
      {/* Table top */}
      <mesh position={[0, legHeight, 0]}>
        <boxGeometry args={[tableWidth, tableHeight, tableDepth]} />
        <meshStandardMaterial color="#a07850" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Table top edge detail */}
      <mesh position={[0, legHeight - 0.08, tableDepth / 2 - 0.1]}>
        <boxGeometry args={[tableWidth + 0.1, 0.08, 0.15]} />
        <meshStandardMaterial color="#8b6914" roughness={0.65} />
      </mesh>

      {/* Table legs */}
      {[
        [-tableWidth / 2 + 0.3, -tableDepth / 2 + 0.3],
        [tableWidth / 2 - 0.3, -tableDepth / 2 + 0.3],
        [-tableWidth / 2 + 0.3, tableDepth / 2 - 0.3],
        [tableWidth / 2 - 0.3, tableDepth / 2 - 0.3],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, legHeight / 2, z]}>
          <boxGeometry args={[legSize, legHeight, legSize]} />
          <meshStandardMaterial color="#6b5344" roughness={0.7} />
        </mesh>
      ))}

      {/* Cross beam under table */}
      <mesh position={[0, legHeight * 0.3, 0]}>
        <boxGeometry args={[tableWidth - 1, 0.1, 0.1]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
    </group>
  );
};

// Main 3D Scene
const LibraryScene: React.FC<{
  puzzles: SavedPuzzle[];
  selectedId: string | null;
  isBoxOpen: boolean;
  onSelectPuzzle: (id: string) => void;
  onClose: () => void;
}> = ({ puzzles, selectedId, isBoxOpen, onSelectPuzzle, onClose }) => {
  const { camera } = useThree();

  // Calculate layout - create stacks of boxes like the reference image
  // Stack configuration: boxes per stack, stacks per shelf
  const maxBoxesPerStack = 4;
  const stacksPerShelf = 3;
  const shelfWidth = 14;
  const shelfSpacing = 5;

  // Calculate how many shelves we need
  const totalStacks = Math.ceil(puzzles.length / maxBoxesPerStack);
  const shelfCount = Math.ceil(totalStacks / stacksPerShelf) || 1;

  // Camera animation for selection - move to look at table
  useFrame((state, delta) => {
    const targetZ = selectedId ? 14 : 12;
    const targetY = selectedId ? 1.5 : 3;
    const targetX = 0;

    camera.position.z += (targetZ - camera.position.z) * delta * 2.5;
    camera.position.y += (targetY - camera.position.y) * delta * 2.5;
    camera.position.x += (targetX - camera.position.x) * delta * 2.5;
  });

  // Calculate positions for stacked boxes - using useMemo to avoid recalculation
  const boxPositions = useMemo(() => {
    // Seeded random for consistent positions
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    return puzzles.map((_, index) => {
      const stackIndex = Math.floor(index / maxBoxesPerStack);
      const positionInStack = index % maxBoxesPerStack;
      const shelfIndex = Math.floor(stackIndex / stacksPerShelf);
      const stackOnShelf = stackIndex % stacksPerShelf;

      // Horizontal position - spread stacks across the shelf
      const stackSpacing = shelfWidth / (stacksPerShelf + 1);
      const xOffset = (seededRandom(index * 7) - 0.5) * 0.4;
      const x = -shelfWidth / 2 + stackSpacing * (stackOnShelf + 1) + xOffset;

      // Vertical position - stack boxes on top of each other
      // Shelf top surface is at: shelfIndex * shelfSpacing - 1
      const boxHeight = 0.35; // Match PuzzleBox dimensions
      const shelfTopY = shelfIndex * shelfSpacing - 1;
      const baseY = shelfTopY + boxHeight / 2 + 0.05; // Place box center above shelf top
      const y = baseY + positionInStack * (boxHeight + 0.05);

      // Small deterministic Z offset for natural look - push boxes toward front of shelf
      const z = 0.3 + (seededRandom(index * 13) - 0.5) * 0.2;

      // Small rotation offset for natural stacking
      const rotationY = (seededRandom(index * 17) - 0.5) * 0.15;

      return { position: [x, y, z] as [number, number, number], stackIndex, rotationY };
    });
  }, [puzzles.length, maxBoxesPerStack, stacksPerShelf, shelfWidth, shelfSpacing]);

  return (
    <>
      {/* Enhanced Lighting for brighter scene */}
      <ambientLight intensity={1.8} />
      <hemisphereLight args={['#ffeedd', '#8888aa', 1.2]} />
      <spotLight
        position={[0, 15, 12]}
        angle={0.5}
        penumbra={0.8}
        intensity={2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Strong front fill light to illuminate puzzle faces */}
      <directionalLight position={[0, 5, 10]} intensity={2.0} color="#ffffff" />
      <directionalLight position={[-5, 3, 8]} intensity={1.0} color="#fff5e6" />
      <directionalLight position={[5, 3, 8]} intensity={1.0} color="#e6f0ff" />

      {/* Soft fill lights from sides */}
      <pointLight position={[-10, 4, 6]} intensity={1.0} color="#ffd4a3" />
      <pointLight position={[10, 4, 6]} intensity={1.0} color="#a3d4ff" />
      <pointLight position={[0, 0, 8]} intensity={0.8} color="#ffffff" />

      {/* Dynamic spotlight for selected item */}
      {selectedId && (
        <spotLight
          position={[0, 8, 12]}
          target-position={[0, 2.5, 6]}
          angle={0.5}
          penumbra={0.6}
          intensity={4}
          color="#ffffff"
        />
      )}

      {/* Shelf structure with warmer wood color */}
      <BackPanel width={shelfWidth} height={shelfCount * shelfSpacing + 3} />
      <SidePanel x={-shelfWidth/2 - 0.1} height={shelfCount * shelfSpacing + 3} />
      <SidePanel x={shelfWidth/2 + 0.1} height={shelfCount * shelfSpacing + 3} />

      {/* Shelves */}
      {Array.from({ length: shelfCount + 1 }).map((_, shelfIndex) => (
        <WoodenShelf
          key={shelfIndex}
          y={shelfIndex * shelfSpacing - 1}
          width={shelfWidth}
        />
      ))}

      {/* Puzzle boxes - stacked vertically */}
      <Suspense fallback={null}>
        {puzzles.map((puzzle, index) => {
          const { position, stackIndex } = boxPositions[index];
          const boxColor = BOX_COLORS[index % BOX_COLORS.length];

          return (
            <PuzzleBox
              key={puzzle.id}
              puzzle={puzzle}
              position={position}
              index={index}
              isSelected={selectedId === puzzle.id}
              isBoxOpen={selectedId === puzzle.id && isBoxOpen}
              onSelect={() => onSelectPuzzle(puzzle.id)}
              totalInStack={Math.min(maxBoxesPerStack, puzzles.length - stackIndex * maxBoxesPerStack)}
              boxColor={boxColor}
            />
          );
        })}
      </Suspense>

      {/* Wooden Table in front of shelves */}
      <WoodenTable />

      {/* Floor - warm wood floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 4]}>
        <planeGeometry args={[30, 25]} />
        <meshStandardMaterial color="#3d3022" roughness={0.8} />
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
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const selectedPuzzle = history.find(p => p.id === selectedId);

  // Handle selection - move to table, then open box, then show menu
  const handleSelectPuzzle = (id: string) => {
    setSelectedId(id);
    setIsBoxOpen(false);
    setShowMenu(false);

    // After box reaches table, open the lid
    setTimeout(() => {
      setIsBoxOpen(true);
    }, 800);

    // After lid opens, show the menu
    setTimeout(() => {
      setShowMenu(true);
    }, 1600);
  };

  const handlePlay = (difficulty: Difficulty) => {
    if (selectedPuzzle) {
      onSelect({
        imageUrl: selectedPuzzle.imageUrl,
        difficulty
      });
    }
  };

  const handleClose = () => {
    setShowMenu(false);
    setIsBoxOpen(false);
    setTimeout(() => {
      setSelectedId(null);
    }, 300);
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
        camera={{ position: [0, 3, 14], fov: 45 }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={['#1a1512']} />
        <fog attach="fog" args={['#1a1512', 20, 45]} />

        <LibraryScene
          puzzles={history}
          selectedId={selectedId}
          isBoxOpen={isBoxOpen}
          onSelectPuzzle={handleSelectPuzzle}
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

      {/* Difficulty selector overlay - shows after box opens on table */}
      {selectedPuzzle && showMenu && (
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
