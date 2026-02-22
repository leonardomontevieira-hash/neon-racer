import React from 'react';
import { ArrowLeft, Lock, Star } from 'lucide-react';
import { WORLDS } from '../constants';
import { Screen } from '../types';

interface WorldSelectionProps {
  onNavigate: (screen: Screen) => void;
  levels: Record<number, Record<number, { stars: number, unlocked: boolean }>>;
  onSelectWorld: (world: number) => void;
}

export default function WorldSelection({ onNavigate, levels, onSelectWorld }: WorldSelectionProps) {
  const isWorldUnlocked = (worldId: number) => {
    if (worldId === 1) return true;
    // World 2 unlocks if all levels of World 1 are completed (at least 1 star)
    const world1Levels = levels[1];
    return Object.values(world1Levels).every(l => l.stars > 0);
  };

  const getWorldStars = (worldId: number) => {
    const worldLevels = levels[worldId];
    return Object.values(worldLevels).reduce((acc, l) => acc + l.stars, 0);
  };

  const getMaxStars = (worldId: number) => {
    return WORLDS[worldId as keyof typeof WORLDS].levels * 3;
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 text-white p-6 overflow-y-auto overflow-x-hidden">
      <div className="max-w-4xl w-full mx-auto py-12">
        <div className="flex items-center mb-8">
          <button
            onClick={() => onNavigate('mode_select')}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black italic tracking-tighter">SELECIONAR MUNDO</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(WORLDS).map(([id, world]) => {
            const worldId = parseInt(id);
            const unlocked = isWorldUnlocked(worldId);
            const stars = getWorldStars(worldId);
            const maxStars = getMaxStars(worldId);

            return (
              <div
                key={id}
                onClick={() => unlocked && onSelectWorld(worldId)}
                className={`relative group bg-slate-800 rounded-3xl p-8 border-2 transition-all duration-300 ${
                  unlocked 
                    ? 'border-slate-700 cursor-pointer hover:border-blue-500 hover:scale-[1.02] shadow-xl' 
                    : 'border-slate-800 opacity-75 grayscale cursor-not-allowed'
                }`}
              >
                {!unlocked && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center z-10">
                    <Lock className="w-12 h-12 text-slate-500 mb-2" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Complete o Mundo 1</p>
                  </div>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-4xl font-black italic tracking-tighter mb-1" style={{ color: world.color }}>
                      MUNDO {id}
                    </h2>
                    <p className="text-xl font-bold text-white">{world.name}</p>
                  </div>
                  {unlocked && (
                    <div className="bg-slate-900/50 px-3 py-1 rounded-full flex items-center gap-1 border border-slate-700">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-bold">{stars}/{maxStars}</span>
                    </div>
                  )}
                </div>

                <p className="text-slate-400 mb-8 leading-relaxed">
                  {world.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {world.levels} Fases
                  </span>
                  {unlocked && (
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ArrowLeft className="w-6 h-6 rotate-180" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
