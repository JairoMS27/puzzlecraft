import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface TableBoxViewProps {
  imageUrl: string;
  onOpen: () => void;
}

// Placeholder texture for loading
const PLACEHOLDER_TEXTURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// Individual puzzle piece component
const PuzzlePiece: React.FC<{
  texture: THREE.Texture | null;
  index: number;
  totalPieces: number;
  isRevealed: boolean;
  boxBounds: { width: number; depth: number };
  pieceSize: number;
}> = ({ texture, index, totalPieces, isRevealed, boxBounds, pieceSize }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = useRef(-0.5);
  const targetY = useRef(0.02);
  const delay = useRef(index * 0.05);
  const startTime = useRef<number | null>(null);

  // Calculate grid position for the piece
  const cols = Math.ceil(Math.sqrt(totalPieces));
  const rows = Math.ceil(totalPieces / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);

  // UV coordinates for this piece
  const uvOffsetX = col / cols;
  const uvOffsetY = 1 - (row + 1) / rows;
  const uvScaleX = 1 / cols;
  const uvScaleY = 1 / rows;

  // Random scatter position within box
  const scatterPos = useMemo(() => {
    const margin = pieceSize / 2;
    const maxX = (boxBounds.width / 2) - margin - 0.1;
    const maxZ = (boxBounds.depth / 2) - margin - 0.1;
    return {
      x: (Math.random() - 0.5) * 2 * maxX,
      z: (Math.random() - 0.5) * 2 * maxZ,
      rotation: Math.random() * Math.PI * 2
    };
  }, [boxBounds, pieceSize]);

  useFrame((state) => {
    if (!meshRef.current) return;

    if (isRevealed) {
      if (startTime.current === null) {
        startTime.current = state.clock.elapsedTime;
      }

      const elapsed = state.clock.elapsedTime - startTime.current - delay.current;

      if (elapsed > 0) {
        const progress = Math.min(elapsed / 0.5, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        meshRef.current.position.y = initialY.current + (targetY.current - initialY.current) * eased;
        meshRef.current.scale.setScalar(eased);
      }
    } else {
      startTime.current = null;
      meshRef.current.position.y = initialY.current;
      meshRef.current.scale.setScalar(0);
    }
  });

  // Create modified texture with UV offset
  const pieceTexture = useMemo(() => {
    if (!texture) return null;
    const clonedTexture = texture.clone();
    clonedTexture.offset.set(uvOffsetX, uvOffsetY);
    clonedTexture.repeat.set(uvScaleX, uvScaleY);
    clonedTexture.needsUpdate = true;
    return clonedTexture;
  }, [texture, uvOffsetX, uvOffsetY, uvScaleX, uvScaleY]);

  return (
    <mesh
      ref={meshRef}
      position={[scatterPos.x, initialY.current, scatterPos.z]}
      rotation={[-Math.PI / 2, 0, scatterPos.rotation]}
      scale={0}
    >
      <planeGeometry args={[pieceSize, pieceSize]} />
      <meshStandardMaterial
        map={pieceTexture}
        roughness={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Puzzle Box Component with opening animation
const PuzzleBox: React.FC<{
  imageUrl: string;
  isOpen: boolean;
  piecesRevealed: boolean;
  onClick: () => void;
}> = ({ imageUrl, isOpen, piecesRevealed, onClick }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [hovered, setHovered] = useState(false);
  const lidRotation = useRef(0);

  // Box dimensions
  const boxWidth = 3.5;
  const boxHeight = 0.5;
  const boxDepth = 2.8;
  const lidHeight = 0.1;
  const baseHeight = boxHeight - lidHeight;
  const boxColor = '#e8b4b8';

  // Load texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl || PLACEHOLDER_TEXTURE,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
      },
      undefined,
      () => {
        loader.load(PLACEHOLDER_TEXTURE, setTexture);
      }
    );
  }, [imageUrl]);

  // Animation for box opening
  useFrame((_, delta) => {
    if (!lidRef.current) return;

    const targetRotation = isOpen ? Math.PI * 0.85 : 0;
    lidRotation.current += (targetRotation - lidRotation.current) * delta * 3;
    lidRef.current.rotation.x = -lidRotation.current;
  });

  // Number of pieces to show
  const numPieces = 16;
  const pieceSize = 0.4;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Glow effect when hovered */}
      {hovered && !isOpen && (
        <pointLight position={[0, 1, 0]} color="#ffffff" intensity={2} distance={4} />
      )}

      {/* Box Base (bottom part) */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (!isOpen) onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!isOpen) {
            document.body.style.cursor = 'pointer';
            setHovered(true);
          }
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

      {/* Inner box walls for depth */}
      <mesh position={[0, baseHeight / 2, 0]}>
        <boxGeometry args={[boxWidth - 0.1, baseHeight - 0.05, boxDepth - 0.1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} side={THREE.BackSide} />
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
            emissiveIntensity={hovered ? 0.3 : 0.1}
            emissiveMap={texture}
          />
          <meshStandardMaterial attach="material-3" color={boxColor} roughness={0.7} />
          <meshStandardMaterial attach="material-4" color={boxColor} roughness={0.6} />
          <meshStandardMaterial attach="material-5" color={boxColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Puzzle pieces inside the box */}
      {Array.from({ length: numPieces }).map((_, index) => (
        <PuzzlePiece
          key={index}
          texture={texture}
          index={index}
          totalPieces={numPieces}
          isRevealed={piecesRevealed}
          boxBounds={{ width: boxWidth - 0.3, depth: boxDepth - 0.3 }}
          pieceSize={pieceSize}
        />
      ))}

      {/* Hover text */}
      {hovered && !isOpen && (
        <mesh position={[0, 0.8, 0]}>
          <planeGeometry args={[2, 0.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
};

// Wooden Table Component (top-down view)
const WoodenTable: React.FC = () => {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Table top surface */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial
          color="#8b6914"
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Wood grain detail - subtle lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-5 + i * 1.5, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.02, 10]} />
          <meshStandardMaterial color="#7a5a10" roughness={0.8} />
        </mesh>
      ))}

      {/* Table edge shadow */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.5, 7, 64]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

// Ambient particles
const DustParticles: React.FC<{ count?: number }> = ({ count = 30 }) => {
  const meshRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      sizes[i] = Math.random() * 0.03 + 0.01;
    }

    return { positions, sizes };
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.0005;
      positions[i * 3] += Math.cos(state.clock.elapsedTime * 0.2 + i * 0.5) * 0.0003;
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
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.2}
        sizeAttenuation
      />
    </points>
  );
};

// Main Scene Component
const TableScene: React.FC<{
  imageUrl: string;
  isBoxOpen: boolean;
  piecesRevealed: boolean;
  onBoxClick: () => void;
}> = ({ imageUrl, isBoxOpen, piecesRevealed, onBoxClick }) => {
  const { camera } = useThree();

  // Smooth camera movement when box opens
  useFrame((_, delta) => {
    const targetY = isBoxOpen ? 5 : 6;
    const targetZ = isBoxOpen ? 2 : 0.1;

    camera.position.y += (targetY - camera.position.y) * delta * 2;
    camera.position.z += (targetZ - camera.position.z) * delta * 2;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#ffeedd', '#8888aa', 0.6]} />

      {/* Main top-down light */}
      <spotLight
        position={[0, 10, 2]}
        angle={0.6}
        penumbra={0.8}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Fill lights */}
      <pointLight position={[-4, 5, 3]} intensity={0.5} color="#ffd4a3" />
      <pointLight position={[4, 5, 3]} intensity={0.5} color="#a3d4ff" />
      <pointLight position={[0, 3, -3]} intensity={0.3} color="#ffffff" />

      {/* Extra light when box is open */}
      {isBoxOpen && (
        <spotLight
          position={[0, 4, 1]}
          target-position={[0, 0, 0]}
          angle={0.4}
          penumbra={0.5}
          intensity={3}
          color="#ffffff"
        />
      )}

      {/* Table */}
      <WoodenTable />

      {/* Puzzle Box */}
      <PuzzleBox
        imageUrl={imageUrl}
        isOpen={isBoxOpen}
        piecesRevealed={piecesRevealed}
        onClick={onBoxClick}
      />

      {/* Dust particles */}
      <DustParticles count={40} />
    </>
  );
};

// Main Component
const TableBoxView: React.FC<TableBoxViewProps> = ({ imageUrl, onOpen }) => {
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [piecesRevealed, setPiecesRevealed] = useState(false);

  const handleBoxClick = () => {
    if (!isBoxOpen) {
      setIsBoxOpen(true);

      // Show pieces after lid starts opening
      setTimeout(() => {
        setPiecesRevealed(true);
      }, 500);

      // Auto-start puzzle after pieces animation completes
      setTimeout(() => {
        onOpen();
      }, 2000);
    }
  };

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 text-center bg-gradient-to-b from-black via-black/60 to-transparent">
        <h1 className="text-3xl font-bold tracking-tighter">THE COLLECTION</h1>
        <p className="text-zinc-500 text-sm mt-1">Your latest acquisition awaits inspection.</p>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 6, 0.1], fov: 50 }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', 8, 20]} />

        <TableScene
          imageUrl={imageUrl}
          isBoxOpen={isBoxOpen}
          piecesRevealed={piecesRevealed}
          onBoxClick={handleBoxClick}
        />
      </Canvas>

      {/* Instructions overlay */}
      {!isBoxOpen && (
        <div className="absolute bottom-8 left-0 right-0 text-center animate-pulse">
          <p className="text-zinc-400 text-lg">Click the box to open it</p>
        </div>
      )}
    </div>
  );
};

export default TableBoxView;
