
import React, { useEffect, useRef, useState } from 'react';
import { Difficulty, Piece } from '../types';
import { calculateGrid, getConnectors, drawJigsawPath } from '../utils/puzzleUtils';
import { RotateCcw, CheckCircle, Share2, Download, ArrowLeft } from 'lucide-react';

interface GameViewProps {
  imageUrl: string;
  difficulty: Difficulty;
  onReset: () => void;
}

const GameView: React.FC<GameViewProps> = ({ imageUrl, difficulty, onReset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  
  // Game constants
  const SNAP_DISTANCE = 20;

  // Initialize puzzle
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.crossOrigin = "Anonymous"; // Enable CORS for screenshot
    img.onload = () => {
      setImage(img);
      generatePieces(img);
    };
  }, [imageUrl, difficulty]);

  const generatePieces = (img: HTMLImageElement) => {
    const { rows, cols } = calculateGrid(difficulty);
    const shapes = getConnectors(rows, cols);
    const pieceWidth = img.width / cols;
    const pieceHeight = img.height / rows;
    
    // Scale logic
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const scale = Math.min((screenW * 0.6) / img.width, (screenH * 0.6) / img.height);
    
    const finalW = pieceWidth * scale;
    const finalH = pieceHeight * scale;

    const newPieces: Piece[] = [];

    shapes.forEach((shape, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const scatterMargin = 100;
      const randX = Math.random() * (screenW - finalW - scatterMargin) + scatterMargin/2;
      const randY = Math.random() * (screenH - finalH - scatterMargin) + scatterMargin/2;

      newPieces.push({
        id: index,
        correctRow: row,
        correctCol: col,
        currentX: randX,
        currentY: randY,
        solved: false,
        shape: shape,
        width: finalW,
        height: finalH
      });
    });

    setPieces(newPieces);
  };

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || pieces.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // Background
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw Frame/Board Ghost outline
      const { rows, cols } = calculateGrid(difficulty);
      const totalW = pieces[0].width * cols;
      const totalH = pieces[0].height * rows;
      const startX = (canvas.width - totalW) / 2;
      const startY = (canvas.height - totalH) / 2;

      ctx.strokeStyle = '#27272a'; 
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, totalW, totalH);

      const renderPiece = (p: Piece) => {
        ctx.save();
        const srcW = image.width / cols;
        const srcH = image.height / rows;
        const srcX = p.correctCol * srcW;
        const srcY = p.correctRow * srcH;
        const scale = p.width / srcW;

        ctx.beginPath();
        drawJigsawPath(ctx, p.currentX, p.currentY, p.width, p.height, p.shape, 1);
        ctx.clip();
        
        ctx.drawImage(
            image, 
            0, 0, image.width, image.height, 
            p.currentX - srcX * scale, 
            p.currentY - srcY * scale, 
            image.width * scale, 
            image.height * scale
        );
        
        // Border
        ctx.strokeStyle = p.solved ? '#222' : '#000';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Highlight selected
        if (p.id === selectedPieceId) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
        }

        ctx.restore();
      };

      // Z-index sorting: solved pieces bottom, unsolved top, selected very top
      const sortedPieces = [...pieces].sort((a, b) => {
        if (a.id === selectedPieceId) return 1;
        if (b.id === selectedPieceId) return -1;
        if (a.solved && !b.solved) return -1;
        if (!a.solved && b.solved) return 1;
        return 0;
      });

      sortedPieces.forEach(renderPiece);

      if (!isComplete) {
          animationId = requestAnimationFrame(render);
      } else {
          // If complete, perform one last high-quality render then capture
          // We rely on the fact that state update triggers re-render. 
          // If screenshot already taken, stop.
          if (!screenshotUrl) {
             // Optional: Draw a watermark or simple text
             ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
             ctx.font = "20px Inter";
             ctx.fillText("PuzzleCraft 3D - Completed", 20, canvas.height - 20);
             
             const dataUrl = canvas.toDataURL('image/png');
             setScreenshotUrl(dataUrl);
          }
      }
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [pieces, image, selectedPieceId, difficulty, isComplete, screenshotUrl]);


  const handleMouseDown = (e: React.MouseEvent) => {
    if (isComplete) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Iterate backwards to click top items first
    for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        if (p.solved) continue;
        
        if (x >= p.currentX && x <= p.currentX + p.width &&
            y >= p.currentY && y <= p.currentY + p.height) {
            
            setSelectedPieceId(p.id);
            setDragOffset({ x: x - p.currentX, y: y - p.currentY });
            break;
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedPieceId === null) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;

    setPieces(prev => prev.map(p => {
        if (p.id === selectedPieceId) {
            return { ...p, currentX: newX, currentY: newY };
        }
        return p;
    }));
  };

  const handleMouseUp = () => {
    if (selectedPieceId === null) return;
    
    const piece = pieces.find(p => p.id === selectedPieceId);
    if (piece) {
        const { rows, cols } = calculateGrid(difficulty);
        const canvas = canvasRef.current!;
        const totalW = piece.width * cols;
        const totalH = piece.height * rows;
        const boardStartX = (canvas.width - totalW) / 2;
        const boardStartY = (canvas.height - totalH) / 2;
        
        const targetX = boardStartX + piece.correctCol * piece.width;
        const targetY = boardStartY + piece.correctRow * piece.height;
        
        const dist = Math.hypot(piece.currentX - targetX, piece.currentY - targetY);
        
        if (dist < SNAP_DISTANCE) {
            setPieces(prev => prev.map(p => {
                if (p.id === selectedPieceId) {
                    return { ...p, currentX: targetX, currentY: targetY, solved: true };
                }
                return p;
            }));
        }
    }

    setSelectedPieceId(null);
  };

  // Check win logic
  useEffect(() => {
      if (pieces.length > 0 && pieces.every(p => p.solved)) {
          setIsComplete(true);
      }
  }, [pieces]);

  const handleDownload = () => {
    if (screenshotUrl) {
        const link = document.createElement('a');
        link.download = 'puzzlecraft-completed.png';
        link.href = screenshotUrl;
        link.click();
    }
  };

  const handleShare = () => {
    // Auto-download the image
    handleDownload();

    // Clean tweet text without blob URL or "via" param
    const text = encodeURIComponent("I just completed my custom puzzle on PuzzleCraft! 🧩✨\n\n(I've attached my result below 👇)\n\n@ej3mplo");
    
    // We intentionally omit the 'url' parameter because window.location.href in preview environments is often a blob URL
    // which looks broken in tweets. 
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div className="relative w-full h-screen bg-zinc-950 overflow-hidden cursor-grab active:cursor-grabbing">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block"
      />
      
      <div className="absolute top-6 left-6 pointer-events-none">
        <h2 className="text-2xl font-bold text-white tracking-widest">WORKBENCH</h2>
        <p className="text-zinc-500">Drag pieces to the frame</p>
      </div>

      <div className="absolute top-6 right-6 flex gap-2 z-50">
          <button 
            onClick={onReset}
            className="bg-zinc-900/80 hover:bg-zinc-800 text-white px-4 py-2 rounded-full border border-zinc-700 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <button 
            onClick={() => window.location.reload()} // Simple reset
            className="bg-zinc-900/80 hover:bg-zinc-800 text-white p-2 rounded-full border border-zinc-700 transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
      </div>

      {/* Win Modal */}
      {isComplete && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
           <div className="bg-zinc-950 border border-zinc-800 text-white p-8 rounded-2xl text-center max-w-lg mx-4 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-white" />
              <h3 className="text-3xl font-bold mb-2">Puzzle Solved!</h3>
              <p className="text-zinc-400 mb-6">You have mastered the pieces.</p>
              
              {/* Screenshot Preview */}
              {screenshotUrl && (
                  <div className="mb-6 p-2 bg-zinc-900 rounded-lg border border-zinc-800 rotate-1 hover:rotate-0 transition-transform duration-500">
                      <img src={screenshotUrl} alt="Solved Puzzle" className="w-full h-48 object-cover rounded shadow-lg" />
                  </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <button 
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl font-medium transition-colors"
                    >
                    <Download className="w-4 h-4" />
                    Download
                    </button>
                    <button 
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 bg-white text-black px-4 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                    >
                    <Share2 className="w-4 h-4" />
                    Share on X
                    </button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                   Image will download automatically when you share!
                </p>

                <button 
                  onClick={onReset}
                  className="mt-4 text-zinc-400 hover:text-white underline text-sm"
                >
                  Return to Library
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
    