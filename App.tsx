
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Play, Trophy, Clock, HelpCircle, X, RotateCcw, NotebookText, Eye, EyeOff, Medal, Calendar, ArrowRight, Grid3X3, Lock, Unlock, Settings2, ChevronRight } from 'lucide-react';
import { BRANDS, DEFAULT_GAME_SIZE } from './constants';
import { BrandId, GameStatus, HistoryEntry, GameRecord } from './types';
import { SodaCan } from './components/SodaCan';
import { HistoryRow } from './components/HistoryRow';
import { playSound } from './utils/audio';

const App: React.FC = () => {
  // Game State
  const [gameSize, setGameSize] = useState<number>(DEFAULT_GAME_SIZE);
  const [targetSequence, setTargetSequence] = useState<BrandId[]>([]);
  const [currentSlots, setCurrentSlots] = useState<(BrandId | null)[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [records, setRecords] = useState<GameRecord[]>([]);
  
  // Progression State
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(DEFAULT_GAME_SIZE);
  
  // Timer State
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);

  // UI State
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showRecords, setShowRecords] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [showLevelMenu, setShowLevelMenu] = useState<boolean>(false);

  // Touch Drag State
  const [touchDragItem, setTouchDragItem] = useState<{ source: 'inventory' | 'slot', brandId: BrandId, index?: number } | null>(null);
  const [touchDragPos, setTouchDragPos] = useState<{ x: number, y: number } | null>(null);

  // Derived State
  const activeBrands = BRANDS.slice(0, gameSize);

  // Dynamic Sizing Logic
  const getResponsiveSize = () => {
    if (gameSize >= 9) return 'xs';
    if (gameSize >= 6) return 'sm';
    return 'md';
  };

  const getGapClass = () => {
    if (gameSize >= 9) return 'gap-1 md:gap-2';
    if (gameSize >= 6) return 'gap-2 md:gap-3';
    return 'gap-3 md:gap-6';
  };

  const currentCanSize = getResponsiveSize();
  const currentGapClass = getGapClass();

  // Initialize Game
  const initGame = useCallback((size: number = gameSize) => {
    // Ensure we don't exceed available brands
    const safeSize = Math.min(size, BRANDS.length);
    const currentActiveBrands = BRANDS.slice(0, safeSize);

    // Create a shuffled copy of brands for the target
    const shuffled = [...currentActiveBrands].sort(() => Math.random() - 0.5);
    setTargetSequence(shuffled.map(b => b.id));
    
    // Reset player slots to all null
    setCurrentSlots(Array(safeSize).fill(null));
    
    setHistory([]);
    setGameStatus('playing');
    setShowWinModal(false);
    setShowLevelMenu(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    playSound('click');
  }, [gameSize]); // Depend on gameSize if called without args, but usually passed or updated

  // Trigger initGame when gameSize changes intentionally, or on first load
  // We use a ref or just call initGame in useEffect dependent on nothing to start default
  useEffect(() => {
    // Load persisted data
    const savedRecords = localStorage.getItem('soda_sort_records');
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch (e) {
        console.error("Failed to parse records", e);
      }
    }

    const savedMaxLevel = localStorage.getItem('soda_sort_max_level');
    if (savedMaxLevel) {
      const level = parseInt(savedMaxLevel, 10);
      if (!isNaN(level)) {
        setMaxUnlockedLevel(Math.min(level, BRANDS.length));
      }
    }

    initGame(DEFAULT_GAME_SIZE);
  }, []); // Only run once on mount

  // Timer logic
  useEffect(() => {
    let interval: number;
    if (gameStatus === 'playing' && !showInstructions && !showLevelMenu) {
      if (startTime === 0) setStartTime(Date.now()); // Reset start time if just closing instructions
      
      interval = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, startTime, showInstructions, showLevelMenu]);

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper: Get available brands (Inventory)
  const availableInventory = activeBrands.filter(brand => !currentSlots.includes(brand.id));

  // --- Core Move Logic (Used by both Mouse and Touch) ---
  const executeMove = (
    source: 'inventory' | 'slot',
    sourceBrandId: BrandId,
    sourceIndex: number | undefined,
    targetType: 'inventory' | 'slot',
    targetIndex?: number
  ) => {
    const newSlots = [...currentSlots];

    // Case 1: Dropping ONTO a slot
    if (targetType === 'slot' && typeof targetIndex === 'number') {
      if (source === 'inventory') {
        // From Inventory -> Slot
        newSlots[targetIndex] = sourceBrandId;
        playSound('drop');
      } else if (source === 'slot' && typeof sourceIndex === 'number') {
        // From Slot -> Slot (Swap)
        const existingAtTarget = newSlots[targetIndex];
        newSlots[targetIndex] = sourceBrandId;
        newSlots[sourceIndex] = existingAtTarget; 
        playSound('drop');
      }
    } 
    // Case 2: Dropping BACK to inventory (Removing from slot)
    else if (targetType === 'inventory') {
      if (source === 'slot' && typeof sourceIndex === 'number') {
        newSlots[sourceIndex] = null;
        playSound('remove');
      }
    }

    setCurrentSlots(newSlots);
  };

  // --- Mouse Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, source: 'inventory' | 'slot', brandId: string, index?: number) => {
    if (gameStatus !== 'playing') {
      e.preventDefault();
      return;
    }
    playSound('pickup');
    e.dataTransfer.setData('source', source);
    e.dataTransfer.setData('brandId', brandId);
    if (typeof index === 'number') {
      e.dataTransfer.setData('index', index.toString());
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (gameStatus !== 'playing') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnSlot = (e: React.DragEvent, targetIndex: number) => {
    if (gameStatus !== 'playing') return;
    e.preventDefault();
    
    const source = e.dataTransfer.getData('source') as 'inventory' | 'slot';
    const brandId = e.dataTransfer.getData('brandId') as BrandId;
    const sourceIndexRaw = e.dataTransfer.getData('index');
    const sourceIndex = sourceIndexRaw ? parseInt(sourceIndexRaw, 10) : undefined;

    executeMove(source, brandId, sourceIndex, 'slot', targetIndex);
  };

  const handleDropOnInventory = (e: React.DragEvent) => {
    if (gameStatus !== 'playing') return;
    e.preventDefault();
    const source = e.dataTransfer.getData('source') as 'inventory' | 'slot';
    const brandId = e.dataTransfer.getData('brandId') as BrandId; // Not strictly needed for removal but good for type safety
    const sourceIndexRaw = e.dataTransfer.getData('index');
    const sourceIndex = sourceIndexRaw ? parseInt(sourceIndexRaw, 10) : undefined;
    
    executeMove(source, brandId, sourceIndex, 'inventory');
  };

  // --- Touch Event Handlers (Mobile) ---

  const handleTouchStart = (e: React.TouchEvent, source: 'inventory' | 'slot', brandId: BrandId, index?: number) => {
    if (gameStatus !== 'playing') return;
    // Prevent default to stop scrolling while dragging, but be careful with buttons
    // We handle visual dragging manually
    
    const touch = e.touches[0];
    setTouchDragItem({ source, brandId, index });
    setTouchDragPos({ x: touch.clientX, y: touch.clientY });
    playSound('pickup');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragItem) return;
    // Prevent scrolling logic needs to be on the element via CSS touch-action usually, 
    // or e.preventDefault() here if the event is not passive. React events are passive by default for wheel/touch?
    // In React 18+ we might need CSS touch-action: none on draggable elements.
    
    const touch = e.touches[0];
    setTouchDragPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchDragItem || !touchDragPos) return;

    // We need to find what element was under the finger when released
    // changedTouches[0] gives the release coordinate
    const touch = e.changedTouches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);

    setTouchDragItem(null);
    setTouchDragPos(null);

    if (!targetElement) return;

    // Traverse up to find a slot or inventory drop zone
    const slotElement = targetElement.closest('[data-slot-index]');
    const inventoryElement = targetElement.closest('[data-drop-zone="inventory"]');

    if (slotElement) {
      const targetIndex = parseInt(slotElement.getAttribute('data-slot-index') || '-1', 10);
      if (targetIndex !== -1) {
        executeMove(touchDragItem.source, touchDragItem.brandId, touchDragItem.index, 'slot', targetIndex);
      }
    } else if (inventoryElement) {
      executeMove(touchDragItem.source, touchDragItem.brandId, touchDragItem.index, 'inventory');
    }
  };

  // Fallback Click Handlers
  const handleInventoryClick = (brandId: BrandId) => {
    if (gameStatus !== 'playing') return;
    // Simple click to move to first available slot
    const firstEmptyIndex = currentSlots.indexOf(null);
    if (firstEmptyIndex !== -1) {
      const newSlots = [...currentSlots];
      newSlots[firstEmptyIndex] = brandId;
      setCurrentSlots(newSlots);
      playSound('drop');
    } else {
      playSound('click'); // Inventory full
    }
  };

  const handleSlotClick = (index: number) => {
    if (gameStatus !== 'playing') return;
    if (currentSlots[index] !== null) {
      const newSlots = [...currentSlots];
      newSlots[index] = null;
      setCurrentSlots(newSlots);
      playSound('remove');
    }
  };

  const checkSolution = () => {
    if (currentSlots.some(s => s === null)) return; 

    playSound('confirm');

    const currentGuess = currentSlots as BrandId[];
    
    // Calculate correct positions
    let correctCount = 0;
    currentGuess.forEach((brand, index) => {
      if (brand === targetSequence[index]) {
        correctCount++;
      }
    });

    // Add to history
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      arrangement: [...currentGuess],
      correctCount,
      timestamp: Date.now()
    };
    
    const newHistory = [newEntry, ...history];
    setHistory(newHistory);

    // Check Win Condition
    if (correctCount === gameSize) {
      // Check for unlock
      if (gameSize === maxUnlockedLevel && gameSize < BRANDS.length) {
        const nextLevel = gameSize + 1;
        setMaxUnlockedLevel(nextLevel);
        localStorage.setItem('soda_sort_max_level', nextLevel.toString());
      }

      setTimeout(() => {
        playSound('win');
        setGameStatus('won');
        setShowWinModal(true);
        
        // Save Record
        const newRecord: GameRecord = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          attempts: newHistory.length,
          durationSeconds: elapsedTime,
          difficulty: gameSize,
          targetSequence: [...targetSequence] // Save correct sequence
        };
        
        const updatedRecords = [...records, newRecord];
        setRecords(updatedRecords);
        localStorage.setItem('soda_sort_records', JSON.stringify(updatedRecords));
      }, 500); // Small delay to let confirm sound finish
    }
  };

  const handleNextLevel = () => {
    if (gameSize < BRANDS.length) {
      const newSize = gameSize + 1;
      setGameSize(newSize);
      initGame(newSize);
    }
  };

  const handleRetryLevel = () => {
    initGame(gameSize);
  };

  const handleSelectLevel = (level: number) => {
    if (level <= maxUnlockedLevel) {
      setGameSize(level);
      initGame(level);
    } else {
      playSound('click'); // Feedback for locked
    }
  };

  // Sort records: Difficulty (desc), then Attempts (asc), then Time (asc)
  const sortedRecords = [...records].sort((a, b) => {
    if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty; // Higher difficulty first
    if (a.attempts !== b.attempts) return a.attempts - b.attempts;
    return a.durationSeconds - b.durationSeconds;
  });

  return (
    <div className="min-h-screen bg-[#2d2a2e] relative overflow-hidden font-sans selection:bg-rose-500/30 touch-manipulation pb-24 md:pb-0">
      
      {/* Table Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent mix-blend-overlay"></div>
      
      {/* Drag Ghost (Touch Only) */}
      {touchDragItem && touchDragPos && (
        <div 
          className="fixed pointer-events-none z-50 opacity-80"
          style={{ 
            left: touchDragPos.x, 
            top: touchDragPos.y,
            transform: 'translate(-50%, -50%) scale(1.1)' 
          }}
        >
          <SodaCan brandId={touchDragItem.brandId} size={currentCanSize} selected />
        </div>
      )}

      {/* Header Info (Floating on table) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col md:flex-row gap-4 items-start md:items-center text-slate-400">
         <div>
            <h1 className="text-xl font-bold text-slate-200 tracking-tight">汽水排序挑战</h1>
            <div className="flex items-center gap-3 mt-1">
               <button 
                  onClick={() => { setShowLevelMenu(true); playSound('click'); }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors group cursor-pointer"
               >
                  <Settings2 size={12} className="text-slate-400 group-hover:text-amber-400" />
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white">难度: {gameSize} 罐</span>
                  <ChevronRight size={12} className="text-slate-500 group-hover:text-white" />
               </button>
               <span className="text-xs opacity-60">•</span>
               <span className="text-xs opacity-60">第 {history.length + 1} 轮尝试</span>
            </div>
         </div>
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-3">
         <div className="bg-black/30 backdrop-blur border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-300 shadow-lg">
             <Clock size={16} className="text-amber-500" />
             <span className="font-mono font-bold text-lg">{formatTime(elapsedTime)}</span>
         </div>
      </div>

      {/* Main Play Area */}
      <main className="w-full h-screen flex flex-col md:flex-row items-center justify-center p-2 md:p-8 gap-4 md:gap-8 relative z-10">
        
        {/* Game Mat (Center Stage) */}
        <div 
          className={`
            transition-all duration-500 ease-in-out
            flex flex-col items-center justify-center
            ${showHistory ? 'md:w-3/5 lg:w-2/3' : 'md:w-3/4'}
            w-full max-w-5xl
            max-h-full
          `}
        >
           {/* The Mat */}
           <div className="bg-slate-800/90 rounded-[2rem] md:rounded-[3rem] p-4 md:p-10 shadow-2xl border-[8px] md:border-[12px] border-slate-900 relative w-full flex flex-col gap-4 md:gap-8 max-h-[85vh] overflow-y-auto scrollbar-hide">
              
              {/* Mat Texture */}
              <div className="absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] border-2 border-white/5 pointer-events-none"></div>

              {/* SECTION 1: Target (Hidden) */}
              <div className="relative w-full">
                 <div className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-400 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border border-slate-700 shadow-lg whitespace-nowrap z-20">
                    {gameStatus === 'won' ? '真相大白' : '目标排列'}
                 </div>
                 
                 <div className={`flex justify-center flex-nowrap ${currentGapClass} px-2 md:px-4 py-4 bg-black/20 rounded-2xl border border-white/5 min-h-[90px] md:min-h-[100px] items-center overflow-x-auto scrollbar-hide w-full`}>
                    {targetSequence.map((brand, i) => (
                      <div key={i} className="transform transition-all flex-shrink-0">
                        <SodaCan 
                          brandId={brand} 
                          isHidden={gameStatus !== 'won'} 
                          size={currentCanSize}
                        />
                      </div>
                    ))}
                 </div>
              </div>

              {/* FEEDBACK SECTION (Prominent Result Display) */}
              <div className="flex justify-center h-14 md:h-20 items-center z-10 my-1 md:my-0">
                {history.length > 0 ? (
                  <div key={history[0].id} className="animate-pulse flex items-center gap-3 md:gap-4 bg-slate-900/95 border-2 border-slate-600/50 px-6 md:px-8 py-2 md:py-3 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md transform transition-all hover:scale-105">
                     <div className={`text-3xl md:text-5xl font-black drop-shadow-lg ${history[0].correctCount === gameSize ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {history[0].correctCount}
                     </div>
                     <div className="flex flex-col border-l-2 border-white/10 pl-3 md:pl-4">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">上轮结果</span>
                        <span className="text-sm md:text-lg text-slate-100 font-bold whitespace-nowrap">个位置正确</span>
                     </div>
                  </div>
                ) : (
                  <div className="text-slate-600/40 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase select-none border border-dashed border-slate-700/50 px-4 md:px-6 py-2 rounded-full">
                     等待确认
                  </div>
                )}
              </div>

              {/* SECTION 2: Player Slots */}
              <div className="relative w-full">
                 <div className="absolute -top-6 md:-top-5 left-1/2 -translate-x-1/2 text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest z-20">
                    你的排列
                 </div>
                 
                 <div className={`flex justify-center flex-nowrap items-end ${currentGapClass} pb-2 min-h-[90px] md:min-h-[120px] overflow-x-auto scrollbar-hide w-full`}>
                   {Array.from({ length: gameSize }).map((_, i) => (
                     <div 
                       key={i} 
                       data-slot-index={i}
                       className="flex flex-col items-center gap-2 md:gap-3 relative group flex-shrink-0 touch-none" // touch-none prevents scrolling while dragging
                       onDragOver={handleDragOver}
                       onDrop={(e) => handleDropOnSlot(e, i)}
                     >
                       {/* Wrapper for Touch Events on the Can */}
                       <div
                         onTouchStart={(e) => currentSlots[i] && handleTouchStart(e, 'slot', currentSlots[i]!, i)}
                         onTouchMove={handleTouchMove}
                         onTouchEnd={handleTouchEnd}
                         className="touch-none"
                       >
                         <SodaCan 
                           brandId={currentSlots[i]} 
                           onClick={() => handleSlotClick(i)}
                           draggable={!!currentSlots[i]}
                           onDragStart={(e) => currentSlots[i] && handleDragStart(e, 'slot', currentSlots[i]!, i)}
                           size={currentCanSize}
                           // Dim the original can while dragging via touch
                           className={touchDragItem?.source === 'slot' && touchDragItem.index === i ? 'opacity-30' : ''}
                         />
                       </div>
                       {/* Underline indicator */}
                       <div className="w-[80%] h-1 bg-slate-700 rounded-full opacity-30 group-hover:bg-rose-500/50 transition-colors"></div>
                     </div>
                   ))}
                 </div>
              </div>

           </div>

           {/* Inventory Tray (Below the Mat) */}
           <div 
              className="mt-4 md:mt-8 bg-[#222] rounded-xl p-3 md:p-6 shadow-xl border-t-4 border-slate-700 flex flex-col items-center w-full max-w-2xl relative"
              data-drop-zone="inventory"
              onDragOver={handleDragOver}
              onDrop={handleDropOnInventory}
           >
              <div className="absolute -top-3 bg-slate-700 text-slate-200 px-3 py-0.5 rounded text-[10px] md:text-xs font-bold shadow-md">
                库存区域
              </div>
              
              <div className={`flex flex-wrap justify-center ${currentGapClass} min-h-[4rem] md:min-h-[5rem] w-full items-center`}>
                 {availableInventory.length === 0 && gameStatus !== 'won' ? (
                   <button
                     onClick={checkSolution}
                     disabled={currentSlots.some(s => s === null)}
                     className="animate-bounce bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-8 rounded-full shadow-lg shadow-emerald-900/50 flex items-center gap-2 transition-all text-sm md:text-base"
                   >
                     <Play fill="currentColor" size={16} /> 确认排列
                   </button>
                 ) : (
                   availableInventory.map((brand) => (
                     <div
                        key={brand.id}
                        onTouchStart={(e) => handleTouchStart(e, 'inventory', brand.id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className="touch-none"
                     >
                        <SodaCan 
                          brandId={brand.id}
                          onClick={() => handleInventoryClick(brand.id)}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, 'inventory', brand.id)}
                          size={currentCanSize === 'xs' ? 'xs' : 'sm'} 
                          className={touchDragItem?.source === 'inventory' && touchDragItem.brandId === brand.id ? 'opacity-30' : ''}
                        />
                     </div>
                   ))
                 )}
                 
                 {/* Mobile only Confirm button if inventory not empty */}
                 {availableInventory.length > 0 && !currentSlots.some(s => s === null) && (
                    <button
                     onClick={checkSolution}
                     className="md:hidden ml-auto bg-emerald-600 text-white p-2 rounded-full shadow-lg flex-shrink-0"
                   >
                     <Play fill="currentColor" size={16} />
                   </button>
                 )}
              </div>
           </div>
        </div>

        {/* History Panel (Clipboard Style) */}
        <div 
           className={`
             fixed md:static right-0 top-0 h-full md:h-auto z-30
             bg-[#f0f0f0] md:bg-[#fcfcfc] text-slate-800
             md:rounded-lg shadow-2xl md:shadow-[0_0_15px_rgba(0,0,0,0.5)]
             transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
             transform origin-right
             flex flex-col
             ${showHistory ? 'translate-x-0 w-80 md:w-72 opacity-100 scale-100' : 'translate-x-[120%] w-0 opacity-0 scale-95'}
             border-l-[12px] md:border-l-0 md:border-t-[12px] border-slate-700
           `}
           style={{ maxHeight: '85vh' }}
        >
           {/* Clipboard Clip */}
           <div className="hidden md:flex absolute -top-[20px] left-1/2 -translate-x-1/2 w-24 h-8 bg-slate-400 rounded-t-lg shadow-inner z-10 items-end justify-center pb-1">
              <div className="w-16 h-2 bg-slate-800 rounded-full"></div>
           </div>

           <div className="p-4 bg-slate-200 border-b border-slate-300 flex justify-between items-center">
              <h2 className="font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide text-sm">
                <NotebookText size={18} /> 记录表
              </h2>
              {/* Mobile Close Button */}
              <button onClick={() => setShowHistory(false)} className="md:hidden p-1 bg-slate-300 rounded-full">
                <X size={16} />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-0 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
             {/* Lined Paper Effect CSS handled in HistoryRow mostly, but let's add background */}
              {history.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 space-y-2 italic p-8 text-center">
                  <p>暂无记录</p>
                  <p className="text-xs">当你确认排列后，结果会显示在这里。</p>
                </div>
              ) : (
                history.map((entry, idx) => (
                  <HistoryRow key={entry.id} entry={entry} index={history.length - 1 - idx} />
                ))
              )}
           </div>
           
           {/* Stats Footer */}
           <div className="p-3 bg-slate-100 border-t border-slate-300 text-xs text-slate-500 flex justify-between">
              <span>共 {history.length} 次尝试</span>
              <span>{gameStatus === 'won' ? '已完成' : '进行中...'}</span>
           </div>
        </div>
        
      </main>

      {/* Floating Controls (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-40 flex gap-2 md:gap-3 flex-row items-end justify-end">
         <button 
           onClick={() => initGame(gameSize)}
           className="p-3 bg-rose-600 text-white rounded-full shadow-xl hover:bg-rose-500 transition-all scale-90 md:scale-100"
           title="重新开始"
         >
           <RefreshCw size={24} />
         </button>

         <button 
           onClick={() => { setShowInstructions(true); playSound('click'); }}
           className="p-3 bg-slate-700 text-white rounded-full shadow-xl hover:bg-slate-600 transition-all scale-90 md:scale-100"
           title="帮助"
         >
           <HelpCircle size={24} />
         </button>

         <button 
           onClick={() => { setShowHistory(!showHistory); playSound('click'); }}
           className={`p-3 rounded-full shadow-xl transition-all scale-90 md:scale-100 ${showHistory ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white text-slate-800 hover:bg-slate-100'}`}
           title={showHistory ? "隐藏记录" : "显示记录"}
         >
           {showHistory ? <EyeOff size={24} /> : <Eye size={24} />}
         </button>

         <button 
           onClick={() => { setShowRecords(true); playSound('click'); }}
           className="p-3 bg-amber-500 text-white rounded-full shadow-xl hover:bg-amber-400 transition-all scale-90 md:scale-100"
           title="荣耀榜"
         >
           <Trophy size={24} />
         </button>
      </div>

      {/* Win Modal */}
      {gameStatus === 'won' && showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1e1e1e] border-2 border-amber-500/50 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center transform scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            {/* Close Button to view board */}
            <button 
              onClick={() => { setShowWinModal(false); playSound('click'); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-20"
              title="查看桌面"
            >
              <X size={24} />
            </button>

            {/* Confetti effect placeholder */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>

            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-orange-500/20 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
              <Trophy size={40} className="text-[#1e1e1e] md:w-12 md:h-12" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">挑战成功！</h2>
            <p className="text-slate-400 mb-6 text-sm md:text-base">大师级的推理能力。</p>
            
            {/* Show Correct Sequence */}
            <div className="mb-6 flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700 delay-100 w-full">
               <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
                 最终谜底
               </div>
               <div className="flex justify-center flex-wrap gap-1 md:gap-2 bg-black/40 p-3 rounded-xl border border-white/10 shadow-inner w-full overflow-x-auto">
                  {targetSequence.map((id, i) => (
                    <div key={i} className="transform hover:scale-110 transition-transform flex-shrink-0">
                      <SodaCan brandId={id} size="xs" disabled />
                    </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10">
                <div className="text-xl md:text-2xl font-bold text-amber-400">{history.length}</div>
                <div className="text-[10px] md:text-xs text-slate-500 uppercase font-bold">尝试次数</div>
              </div>
              <div className="bg-white/5 p-3 md:p-4 rounded-2xl border border-white/10">
                <div className="text-xl md:text-2xl font-bold text-amber-400">{formatTime(elapsedTime)}</div>
                <div className="text-[10px] md:text-xs text-slate-500 uppercase font-bold">耗时</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
               {gameSize < BRANDS.length && gameSize < maxUnlockedLevel ? (
                  /* Case: Player replayed an easy level, but has unlocked higher levels */
                  <button 
                    onClick={() => {
                        const next = gameSize + 1;
                        setGameSize(next);
                        initGame(next);
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-sm md:text-base"
                  >
                    <ArrowRight size={20} />
                    下一关 (已解锁)
                  </button>
               ) : gameSize < BRANDS.length ? (
                  /* Case: Player just unlocked a new level */
                  <button 
                    onClick={handleNextLevel}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-sm md:text-base animate-pulse"
                  >
                    <Unlock size={20} />
                    解锁下一难度 ({gameSize + 1} 罐)
                  </button>
               ) : (
                  <div className="w-full bg-slate-700 text-slate-400 font-bold py-3 px-6 rounded-xl text-sm border border-slate-600 cursor-not-allowed">
                     已达到最高难度
                  </div>
               )}
               
               <button 
                 onClick={handleRetryLevel}
                 className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-sm md:text-base"
               >
                 <RotateCcw size={20} />
                 重玩本关
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Selector Modal */}
      {showLevelMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
              <div className="bg-slate-900/50 p-4 border-b border-white/5 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings2 size={18} className="text-rose-500" />
                    选择难度
                 </h2>
                 <button onClick={() => setShowLevelMenu(false)} className="text-slate-500 hover:text-white">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#252525]">
                 {Array.from({ length: BRANDS.length - DEFAULT_GAME_SIZE + 1 }).map((_, i) => {
                    const level = DEFAULT_GAME_SIZE + i;
                    const isUnlocked = level <= maxUnlockedLevel;
                    const isActive = level === gameSize;

                    return (
                       <button
                          key={level}
                          onClick={() => handleSelectLevel(level)}
                          className={`
                             relative p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all
                             ${isActive 
                               ? 'bg-rose-600 border-rose-500 text-white shadow-lg scale-105 z-10' 
                               : isUnlocked 
                                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500' 
                                  : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-70'}
                          `}
                       >
                          {isUnlocked ? (
                             <span className="font-bold text-2xl font-mono">{level}</span>
                          ) : (
                             <Lock size={24} className="mb-1" />
                          )}
                          <span className="text-[10px] uppercase font-bold tracking-wider">
                             {level} 罐挑战
                          </span>
                          {!isUnlocked && (
                             <div className="absolute inset-0 bg-black/20 rounded-xl" />
                          )}
                       </button>
                    );
                 })}
              </div>
              <div className="p-3 bg-slate-900 text-center text-xs text-slate-500">
                 挑战成功可解锁更高难度
              </div>
           </div>
        </div>
      )}

      {/* High Score / Records Modal */}
      {showRecords && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative">
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                 <h2 className="text-xl font-bold flex items-center gap-2">
                   <Trophy size={20} className="text-amber-400" />
                   荣耀榜
                 </h2>
                 <button onClick={() => { setShowRecords(false); playSound('click'); }} className="hover:text-amber-400 transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto bg-slate-50 p-4">
                 {records.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                       <Trophy size={48} className="mx-auto mb-2 opacity-20" />
                       <p>暂无通关记录</p>
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {sortedRecords.map((rec, idx) => (
                          <div key={rec.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3">
                             <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                                    ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                      idx === 1 ? 'bg-slate-200 text-slate-600' :
                                      idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}
                                 `}>
                                    {idx + 1}
                                 </div>
                                 
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                       <Calendar size={12} />
                                       {formatDate(rec.timestamp)}
                                    </div>
                                    <div className="flex gap-4 items-center">
                                       <div className="flex items-center gap-1.5 min-w-[3.5rem]">
                                          <Grid3X3 size={14} className="text-slate-400"/>
                                          <span className="font-bold text-slate-800 text-sm">{rec.difficulty}罐</span>
                                       </div>
                                       <div className="flex items-center gap-1.5">
                                          <span className="text-slate-400 text-xs">尝试</span>
                                          <span className="font-bold text-slate-800">{rec.attempts}</span>
                                       </div>
                                       <div className="flex items-center gap-1.5">
                                          <span className="text-slate-400 text-xs">耗时</span>
                                          <span className="font-mono font-bold text-slate-800">{formatTime(rec.durationSeconds)}</span>
                                       </div>
                                    </div>
                                 </div>

                                 {idx < 3 && <Medal size={20} className={`flex-shrink-0 ${
                                    idx === 0 ? 'text-yellow-400' :
                                    idx === 1 ? 'text-slate-400' :
                                    'text-orange-400'
                                 }`} />}
                             </div>
                             
                             {/* Display Saved Sequence */}
                             {rec.targetSequence && rec.targetSequence.length > 0 && (
                                <div className="bg-slate-100/50 p-2 rounded-lg border border-slate-100 flex items-center justify-center gap-1 flex-wrap">
                                   {rec.targetSequence.map((brandId, i) => (
                                      <div key={i} className="transform scale-[0.7] -my-2 -mx-1">
                                         <SodaCan brandId={brandId} size="xs" disabled />
                                      </div>
                                   ))}
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 )}
              </div>
              <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
                 按难度、尝试次数和耗时排序
              </div>
            </div>
         </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
           <div className="bg-[#f0f0f0] text-slate-900 rounded-sm max-w-lg w-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative border-[8px] border-white -rotate-1">
              <button 
                onClick={() => {
                  setShowInstructions(false);
                  playSound('click');
                  if (startTime === 0) setStartTime(Date.now());
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors"
              >
                <X size={28} />
              </button>

              <div className="bg-slate-200 p-6 border-b border-slate-300">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight uppercase">规则说明</h2>
              </div>
              
              <div className="p-8 space-y-6 font-medium">
                <p className="text-slate-700 leading-relaxed text-lg">
                  桌子上有两组相同的汽水罐。
                  <br/>
                  <span className="bg-amber-200 px-1">一组已经被隐藏起来。</span>
                  <br/>
                  你的任务是用剩下的一组，完美复刻隐藏的排列顺序。
                </p>

                <div className="space-y-4 pl-4 border-l-4 border-slate-300">
                  <div className="flex gap-4 items-start">
                    <span className="bg-slate-800 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">1</span>
                    <span className="text-slate-600">从下方的<strong>库存区域</strong>拖动汽水罐，放置到中间的垫子上。支持手指拖拽！</span>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="bg-slate-800 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">2</span>
                    <span className="text-slate-600">点击<strong>确认</strong>按钮来验证你的猜测。</span>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="bg-slate-800 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">3</span>
                    <span className="text-slate-600">查看中间的<strong>结果提示</strong>。数字代表有几个罐子的位置和品牌都完全吻合。</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded border border-blue-100 text-sm text-blue-800">
                   <strong>进阶挑战：</strong>成功通关后解锁下一级难度！点击左上角可切换已解锁难度。
                </div>
              </div>

              <div className="p-6 pt-2 bg-slate-100">
                <button 
                  onClick={() => {
                    setShowInstructions(false);
                    playSound('click');
                    if (startTime === 0) setStartTime(Date.now());
                  }}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded shadow-xl hover:bg-slate-800 transition-transform active:scale-[0.99] text-lg tracking-widest uppercase"
                >
                  开始挑战
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;
