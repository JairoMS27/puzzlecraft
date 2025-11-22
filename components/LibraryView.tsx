import React from 'react';
import { SavedPuzzle, Difficulty, PuzzleConfig } from '../types';
import { ArrowLeft, Play } from 'lucide-react';

interface LibraryViewProps {
  history: SavedPuzzle[];
  onSelect: (config: PuzzleConfig) => void;
  onBack: () => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ history, onSelect, onBack }) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [difficulty, setDifficulty] = React.useState<Difficulty>(Difficulty.EASY);

  const handlePlay = (puzzle: SavedPuzzle) => {
    onSelect({
      imageUrl: puzzle.imageUrl,
      difficulty: difficulty
    });
  };

  return (
    <div className="w-full min-h-screen bg-black text-white p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-zinc-900 transition-colors border border-zinc-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold tracking-tighter">PUZZLE LIBRARY</h1>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 border border-zinc-900 rounded-2xl bg-zinc-900/20">
            <p className="text-zinc-500 text-xl">Your shelf is empty.</p>
            <button 
              onClick={onBack}
              className="mt-6 text-white border border-white px-6 py-2 rounded-full hover:bg-white hover:text-black transition-colors"
            >
              Create your first puzzle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {history.map((puzzle) => (
              <div 
                key={puzzle.id} 
                className={`group relative aspect-square bg-zinc-900 rounded-xl overflow-hidden border transition-all duration-300 ${selectedId === puzzle.id ? 'border-white ring-1 ring-white scale-[1.02]' : 'border-zinc-800 hover:border-zinc-600'}`}
                onClick={() => setSelectedId(puzzle.id)}
              >
                <img 
                  src={puzzle.imageUrl} 
                  alt="Puzzle" 
                  className={`w-full h-full object-cover transition-opacity duration-500 ${selectedId === puzzle.id ? 'opacity-40' : 'opacity-80 group-hover:opacity-100'}`}
                />
                
                {/* Overlay for selection */}
                {selectedId === puzzle.id && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 animate-fade-in">
                    <h3 className="font-bold mb-4 tracking-widest text-sm uppercase">Select Difficulty</h3>
                    <div className="grid grid-cols-2 gap-2 w-full mb-6">
                       {[
                          { label: 'Easy', val: Difficulty.EASY },
                          { label: 'Med', val: Difficulty.MEDIUM },
                          { label: 'Hard', val: Difficulty.HARD },
                          { label: 'Exp', val: Difficulty.EXPERT }
                       ].map(opt => (
                         <button
                            key={opt.val}
                            onClick={(e) => { e.stopPropagation(); setDifficulty(opt.val); }}
                            className={`text-xs py-2 rounded border ${difficulty === opt.val ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}
                         >
                           {opt.label}
                         </button>
                       ))}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePlay(puzzle); }}
                      className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors w-full justify-center"
                    >
                      <Play className="w-4 h-4 fill-current" /> PLAY
                    </button>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <p className="text-xs text-zinc-400">{new Date(puzzle.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryView;