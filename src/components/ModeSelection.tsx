import React from 'react';
import { ArrowLeft, Infinity, Trophy } from 'lucide-react';
import { Screen, GameMode } from '../types';

interface ModeSelectionProps {
  onNavigate: (screen: Screen) => void;
  onSelectMode: (mode: GameMode) => void;
}

export default function ModeSelection({ onNavigate, onSelectMode }: ModeSelectionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-md w-full">
        <div className="flex items-center mb-12">
          <button
            onClick={() => onNavigate('menu')}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black italic tracking-tighter">MODOS DE JOGO</h1>
        </div>

        <div className="grid gap-6">
          <button
            onClick={() => onSelectMode('infinite')}
            className="group relative flex flex-col items-center gap-4 bg-slate-800 hover:bg-slate-700 p-8 rounded-3xl border-2 border-slate-700 hover:border-blue-500 transition-all hover:scale-105"
          >
            <div className="p-4 bg-blue-500/20 rounded-2xl">
              <Infinity className="w-12 h-12 text-blue-400" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">INFINITO</h2>
              <p className="text-slate-400 text-sm">Sobreviva o máximo que puder!</p>
            </div>
          </button>

          <button
            onClick={() => onSelectMode('levels')}
            className="group relative flex flex-col items-center gap-4 bg-slate-800 hover:bg-slate-700 p-8 rounded-3xl border-2 border-slate-700 hover:border-purple-500 transition-all hover:scale-105"
          >
            <div className="p-4 bg-purple-500/20 rounded-2xl">
              <Trophy className="w-12 h-12 text-purple-400" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">NÍVEIS</h2>
              <p className="text-slate-400 text-sm">10 desafios com linha de chegada.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
