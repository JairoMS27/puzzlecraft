import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Cpu, Library } from 'lucide-react';
import { Difficulty, PuzzleConfig } from '../types';

interface UploadViewProps {
  onStart: (config: PuzzleConfig) => void;
  onOpenLibrary: () => void;
}

const UploadView: React.FC<UploadViewProps> = ({ onStart, onOpenLibrary }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setSelectedImage(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleStart = () => {
    if (selectedImage) {
      onStart({ imageUrl: selectedImage, difficulty });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 animate-fade-in">
      
      <button 
        onClick={onOpenLibrary}
        className="absolute top-6 right-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-white rounded-full px-4 py-2"
      >
        <Library className="w-4 h-4" />
        <span className="text-sm font-medium">My Library</span>
      </button>

      <div className="max-w-3xl w-full space-y-12">
        
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white">
            PUZZLE<span className="text-zinc-500">CRAFT</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-lg mx-auto">
            Upload a photo. Find it on the shelf. Inspect the box. Solve the mystery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Image Selection */}
          <div className="space-y-6 border border-zinc-800 p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <ImageIcon className="w-6 h-6" /> Image
            </h2>
            
            {!selectedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-white transition-colors group"
              >
                <Upload className="w-12 h-12 text-zinc-500 group-hover:text-white transition-colors mb-4" />
                <span className="text-zinc-500 group-hover:text-white transition-colors">Upload from computer</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="relative group rounded-xl overflow-hidden border border-zinc-700">
                <img src={selectedImage} alt="Selected" className="w-full h-64 object-cover" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Config */}
          <div className="space-y-6 border border-zinc-800 p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Cpu className="w-6 h-6" /> Difficulty
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Easy (3x3)', value: Difficulty.EASY },
                  { label: 'Medium (5x5)', value: Difficulty.MEDIUM },
                  { label: 'Hard (8x8)', value: Difficulty.HARD },
                  { label: 'Expert (10x10)', value: Difficulty.EXPERT }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficulty(opt.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      difficulty === opt.value 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {opt.value} Pieces
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!selectedImage}
              className="w-full bg-white text-black text-xl font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-20 disabled:cursor-not-allowed mt-8"
            >
              CREATE PUZZLE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadView;