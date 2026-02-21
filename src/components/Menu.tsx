import React from 'react';
import { Play, ShoppingCart, Wrench, Key } from 'lucide-react';
import { Screen } from '../types';

interface MenuProps {
  onNavigate: (screen: Screen) => void;
  coins: number;
}

export default function Menu({ onNavigate, coins }: MenuProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <div className="absolute top-6 right-6 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full font-bold flex items-center gap-2 border border-yellow-500/50">
        <span className="w-4 h-4 rounded-full bg-yellow-400 inline-block" />
        {coins} Moedas
      </div>

      <div className="text-center mb-12">
        <h1 className="text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2 transform -skew-x-6 px-4">
          NEON RACER
        </h1>
        <p className="text-slate-400 tracking-widest uppercase text-sm">Corrida de Alta Velocidade</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => onNavigate('mode_select')}
          className="group relative flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold text-xl transition-all hover:scale-105 active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
          <Play className="w-6 h-6 fill-current" />
          JOGAR
        </button>

        <button
          onClick={() => onNavigate('garage')}
          className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 border border-slate-700"
        >
          <Wrench className="w-5 h-5" />
          GARAGEM
        </button>

        <button
          onClick={() => onNavigate('shop')}
          className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 border border-slate-700"
        >
          <ShoppingCart className="w-5 h-5" />
          LOJA
        </button>

        <button
          onClick={() => onNavigate('codes')}
          className="flex items-center justify-center gap-3 bg-slate-800/50 hover:bg-slate-700 text-white p-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 border border-slate-700/50"
        >
          <Key className="w-5 h-5" />
          CÓDIGOS
        </button>
      </div>
    </div>
  );
}
