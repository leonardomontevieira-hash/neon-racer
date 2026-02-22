import React from 'react';
import { ArrowLeft, Lock, Star } from 'lucide-react';
import { Screen, LevelProgress } from '../types';
import { WORLDS } from '../constants';

interface LevelSelectionProps {
  onNavigate: (screen: Screen) => void;
  world: number;
  levels: Record<number, LevelProgress>;
  onSelectLevel: (level: number) => void;
}

export default function LevelSelection({ onNavigate, world, levels, onSelectLevel }: LevelSelectionProps) {
  const levelsCount = WORLDS[world as keyof typeof WORLDS].levels;

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 text-white p-6 overflow-y-auto overflow-x-hidden">
      <div className="max-w-4xl w-full mx-auto py-12">
        <div className="flex items-center mb-12">
          <button
            onClick={() => onNavigate('world_select')}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black italic tracking-tighter">MUNDO {world} - SELECIONAR NÍVEL</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: levelsCount }, (_, i) => i + 1).map((levelNum) => {
            const level = levels[levelNum];
            const isUnlocked = level?.unlocked;

            return (
              <button
                key={levelNum}
                disabled={!isUnlocked}
                onClick={() => onSelectLevel(levelNum)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all relative ${
                  isUnlocked 
                    ? 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-purple-500 active:scale-95' 
                    : 'bg-slate-900/50 border-2 border-slate-800 opacity-50 cursor-not-allowed'
                }`}
              >
                {!isUnlocked && <Lock className="w-6 h-6 text-slate-600 mb-1" />}
                <span className={`text-3xl font-black ${isUnlocked ? 'text-white' : 'text-slate-700'}`}>
                  {levelNum}
                </span>
                
                {isUnlocked && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= (level?.stars || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} 
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
