import React, { useState, useEffect } from 'react';
import Menu from './components/Menu';
import Game from './components/Game';
import Shop from './components/Shop';
import Garage from './components/Garage';
import ModeSelection from './components/ModeSelection';
import WorldSelection from './components/WorldSelection';
import LevelSelection from './components/LevelSelection';
import Codes from './components/Codes';
import { Screen, PlayerState, CarId, DriverId, GameMode } from './types';
import { CARS, DRIVERS, INITIAL_STATE, WORLDS, BASE_LEVEL_DISTANCE, LEVEL_DISTANCE_INCREMENT } from './constants';
import { Star } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('infinite');
  const [selectedWorld, setSelectedWorld] = useState<number>(1);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [gameState, setGameState] = useState<PlayerState>(() => {
    const saved = localStorage.getItem('neonRacerStateV4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Check if levels is the old structure
        if (parsed.levels && !parsed.levels[1][1]) {
           return INITIAL_STATE;
        }
        if (parsed.ownedCars && parsed.ownedDrivers && parsed.levels) {
          const sanitized = { ...INITIAL_STATE, ...parsed };
          // Filter out non-existent cars and drivers
          sanitized.ownedCars = sanitized.ownedCars.filter(id => !!CARS[id]);
          sanitized.ownedDrivers = sanitized.ownedDrivers.filter(id => !!DRIVERS[id]);
          
          // Ensure selected car/driver exists
          if (!CARS[sanitized.selectedCar]) sanitized.selectedCar = INITIAL_STATE.selectedCar;
          if (!DRIVERS[sanitized.selectedDriver]) sanitized.selectedDriver = INITIAL_STATE.selectedDriver;
          
          return sanitized;
        }
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [gameOverStats, setGameOverStats] = useState<{coins: number, score: number, stars?: number, victory?: boolean, starBonus?: number} | null>(null);

  useEffect(() => {
    localStorage.setItem('neonRacerStateV4', JSON.stringify(gameState));
  }, [gameState]);

  const handleGameOver = (coinsEarned: number, score: number, stars: number = 0, victory: boolean = false) => {
    let starBonus = 0;
    if (gameMode === 'levels' && victory) {
      starBonus = (stars * 10) + (selectedLevel - 1) * 5 + (selectedWorld - 1) * 100;
    }

    setGameState(prev => {
      const newState = {
        ...prev,
        coins: prev.coins + coinsEarned + starBonus,
        highScore: Math.max(prev.highScore, score)
      };

      if (gameMode === 'levels' && victory) {
        const worldLevels = prev.levels[selectedWorld];
        const currentLevelProgress = worldLevels[selectedLevel];
        const newStars = Math.max(currentLevelProgress.stars, stars);
        
        newState.levels = {
          ...prev.levels,
          [selectedWorld]: {
            ...worldLevels,
            [selectedLevel]: { ...currentLevelProgress, stars: newStars }
          }
        };

        const maxLevelsInWorld = WORLDS[selectedWorld as keyof typeof WORLDS].levels;
        if (selectedLevel < maxLevelsInWorld) {
          const nextLevel = selectedLevel + 1;
          newState.levels[selectedWorld][nextLevel] = { ...worldLevels[nextLevel], unlocked: true };
        } else if (selectedWorld === 1) {
          // Finished World 1, unlock World 2 Level 1
          newState.levels[2][1] = { ...prev.levels[2][1], unlocked: true };
        }
      }

      return newState;
    });

    setGameOverStats({ coins: coinsEarned, score, stars, victory, starBonus });
    setScreen('menu');
  };

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'infinite') {
      setScreen('game');
    } else {
      setScreen('world_select');
    }
  };

  const handleSelectWorld = (world: number) => {
    setSelectedWorld(world);
    setScreen('level_select');
  };

  const handleSelectLevel = (level: number) => {
    setSelectedLevel(level);
    setScreen('game');
  };

  const handleNextLevel = () => {
    const maxLevelsInWorld = WORLDS[selectedWorld as keyof typeof WORLDS].levels;
    if (selectedLevel < maxLevelsInWorld) {
      setSelectedLevel(prev => prev + 1);
      setGameOverStats(null);
      setScreen('game');
    }
  };

  const handleBuyCar = (id: CarId, cost: number) => {
    setGameState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      ownedCars: [...prev.ownedCars, id]
    }));
  };

  const handleBuyDriver = (id: DriverId, cost: number) => {
    setGameState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      ownedDrivers: [...prev.ownedDrivers, id]
    }));
  };

  const handleSelectCar = (id: CarId) => {
    setGameState(prev => ({
      ...prev,
      selectedCar: id
    }));
  };

  const handleSelectDriver = (id: DriverId) => {
    setGameState(prev => ({
      ...prev,
      selectedDriver: id
    }));
  };

  const handleRedeemCode = (code: string): 'success' | 'used' | 'error' => {
    const upperCode = code.toUpperCase();
    
    if (upperCode === 'HKZIN') {
      setGameState(prev => ({
        ...prev,
        ownedCars: Object.keys(CARS) as CarId[],
        ownedDrivers: (Object.keys(DRIVERS) as DriverId[]).filter(id => id !== 'prime' && id !== 'kalleb')
      }));
      return 'success';
    }

    if (upperCode === 'WVFH') {
      setGameState(prev => ({
        ...prev,
        ownedDrivers: Array.from(new Set([...prev.ownedDrivers, 'prime' as DriverId]))
      }));
      return 'success';
    }

    if (upperCode === 'NEON100') {
      const usedCodes = gameState.usedCodes || [];
      if (usedCodes.includes('NEON100')) {
        return 'used';
      }
      setGameState(prev => ({
        ...prev,
        coins: prev.coins + 100,
        usedCodes: [...(prev.usedCodes || []), 'NEON100']
      }));
      return 'success';
    }

    if (upperCode === 'W1') {
      const usedCodes = gameState.usedCodes || [];
      if (usedCodes.includes('W1')) {
        return 'used';
      }
      
      const unlockedLevels: Record<number, { stars: number, unlocked: boolean }> = {};
      for (let i = 1; i <= 10; i++) {
        unlockedLevels[i] = { stars: 3, unlocked: true };
      }

      setGameState(prev => ({
        ...prev,
        levels: { 
          ...prev.levels, 
          1: { ...prev.levels[1], ...unlockedLevels },
          2: { ...prev.levels[2], 1: { stars: 0, unlocked: true } }
        },
        usedCodes: [...(prev.usedCodes || []), 'W1']
      }));
      return 'success';
    }

    return 'error';
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden font-sans selection:bg-blue-500/30">
      {screen === 'menu' && (
        <div className="relative h-full w-full">
          <Menu onNavigate={setScreen} coins={gameState.coins} />
          
          {gameOverStats && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
                <h2 className={`text-4xl font-black italic mb-2 ${gameOverStats.victory ? 'text-green-500' : 'text-red-500'}`}>
                  {gameOverStats.victory ? 'VITÓRIA!' : 'FIM DE JOGO'}
                </h2>
                
                {gameMode === 'levels' && gameOverStats.victory && (
                  <div className="flex justify-center gap-2 my-4">
                    {[1, 2, 3].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-12 h-12 ${s <= (gameOverStats.stars || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} 
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-4 my-8">
                  <div className="bg-slate-900/50 p-4 rounded-xl">
                    <div className="text-slate-400 text-sm uppercase font-bold mb-1">Distância</div>
                    <div className="text-3xl font-bold text-white">{gameOverStats.score}m</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl">
                    <div className="text-slate-400 text-sm uppercase font-bold mb-1">Moedas Coletadas</div>
                    <div className="text-3xl font-bold text-yellow-400">+{gameOverStats.coins}</div>
                  </div>
                  {gameOverStats.starBonus ? (
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-yellow-500/30">
                      <div className="text-yellow-500 text-sm uppercase font-bold mb-1">Bônus de Estrelas</div>
                      <div className="text-3xl font-bold text-yellow-400">+{gameOverStats.starBonus}</div>
                    </div>
                  ) : null}
                </div>
                
                <div className="flex flex-col gap-3">
                  {gameOverStats.victory && gameMode === 'levels' && selectedLevel < WORLDS[selectedWorld as keyof typeof WORLDS].levels && (
                    <button 
                      onClick={handleNextLevel}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      PRÓXIMA FASE
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setGameOverStats(null)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors"
                  >
                    {gameOverStats.victory && gameMode === 'levels' ? 'VOLTAR AO MENU' : 'CONTINUAR'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {screen === 'mode_select' && (
        <ModeSelection onNavigate={setScreen} onSelectMode={handleSelectMode} />
      )}

      {screen === 'world_select' && (
        <WorldSelection 
          onNavigate={setScreen} 
          levels={gameState.levels} 
          onSelectWorld={handleSelectWorld} 
        />
      )}

      {screen === 'level_select' && (
        <LevelSelection 
          onNavigate={setScreen} 
          world={selectedWorld}
          levels={gameState.levels[selectedWorld]} 
          onSelectLevel={handleSelectLevel} 
        />
      )}
      
      {screen === 'game' && (
        <Game 
          car={CARS[gameState.selectedCar]} 
          driver={DRIVERS[gameState.selectedDriver]}
          mode={gameMode}
          world={selectedWorld}
          level={selectedLevel}
          onGameOver={handleGameOver} 
        />
      )}
      
      {screen === 'shop' && (
        <Shop 
          onNavigate={setScreen} 
          coins={gameState.coins}
          ownedCars={gameState.ownedCars}
          ownedDrivers={gameState.ownedDrivers}
          onBuyCar={handleBuyCar}
          onBuyDriver={handleBuyDriver}
        />
      )}
      
      {screen === 'garage' && (
        <Garage 
          onNavigate={setScreen}
          ownedCars={gameState.ownedCars}
          selectedCar={gameState.selectedCar}
          ownedDrivers={gameState.ownedDrivers}
          selectedDriver={gameState.selectedDriver}
          onSelectCar={handleSelectCar}
          onSelectDriver={handleSelectDriver}
        />
      )}

      {screen === 'codes' && (
        <Codes 
          onNavigate={setScreen}
          onRedeem={handleRedeemCode}
        />
      )}
    </div>
  );
}
