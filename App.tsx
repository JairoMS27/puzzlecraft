import React, { useState, useEffect } from 'react';
import { AppState, PuzzleConfig, SavedPuzzle } from './types';
import UploadView from './components/UploadView';
import ShelfView from './components/ShelfView';
import Box3DView from './components/Box3DView';
import GameView from './components/GameView';
import LibraryView from './components/LibraryView';
import Footer from './components/Footer';
import { getPuzzleHistory, savePuzzleToHistory } from './utils/storageUtils';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.UPLOAD);
  const [config, setConfig] = useState<PuzzleConfig | null>(null);
  const [history, setHistory] = useState<SavedPuzzle[]>([]);

  useEffect(() => {
    const loadedHistory = getPuzzleHistory();
    setHistory(loadedHistory);
  }, [state]); // Reload history when state changes (e.g. after playing)

  const handleStart = (newConfig: PuzzleConfig) => {
    setConfig(newConfig);
    // Save to history immediately when created/started
    savePuzzleToHistory(newConfig.imageUrl);
    setState(AppState.SHELF);
  };

  const handleOpenLibrary = () => {
    setState(AppState.LIBRARY);
  };

  const handleSelectFromLibrary = (newConfig: PuzzleConfig) => {
    setConfig(newConfig);
    // Move straight to shelf or inspect? Let's go to Shelf for the "experience"
    setState(AppState.SHELF);
  };

  const handleSelectFromShelf = () => {
    setState(AppState.INSPECT);
  };

  const handleOpenBox = () => {
    setState(AppState.PLAY);
  };

  const handleReset = () => {
    setState(AppState.UPLOAD);
    setConfig(null);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-hidden font-sans">
      
      {state === AppState.UPLOAD && (
        <UploadView onStart={handleStart} onOpenLibrary={handleOpenLibrary} />
      )}

      {state === AppState.LIBRARY && (
        <LibraryView 
          history={history} 
          onSelect={handleSelectFromLibrary} 
          onBack={() => setState(AppState.UPLOAD)} 
        />
      )}

      {state === AppState.SHELF && config && (
        <div className="animate-fade-in">
          <ShelfView 
            userImageUrl={config.imageUrl} 
            history={history}
            onSelect={handleSelectFromShelf} 
          />
        </div>
      )}

      {state === AppState.INSPECT && config && (
        <div className="animate-fade-in">
          <Box3DView imageUrl={config.imageUrl} onOpen={handleOpenBox} />
        </div>
      )}

      {state === AppState.PLAY && config && (
        <div className="animate-scale-up">
           <GameView 
             imageUrl={config.imageUrl} 
             difficulty={config.difficulty} 
             onReset={handleReset}
           />
        </div>
      )}

      <Footer />

      {/* Global Styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-scale-up {
            animation: scaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;