import React, { useState } from 'react';
import { ArrowLeft, Lock, Unlock, Car as CarIcon, User } from 'lucide-react';
import { CarId, DriverId, Screen } from '../types';
import { CARS, DRIVERS } from '../constants';

interface ShopProps {
  onNavigate: (screen: Screen) => void;
  coins: number;
  ownedCars: CarId[];
  ownedDrivers: DriverId[];
  onBuyCar: (id: CarId, cost: number) => void;
  onBuyDriver: (id: DriverId, cost: number) => void;
}

export default function Shop({ onNavigate, coins, ownedCars, ownedDrivers, onBuyCar, onBuyDriver }: ShopProps) {
  const [tab, setTab] = useState<'cars' | 'drivers'>('cars');
  const [worldTab, setWorldTab] = useState<number>(1);

  return (
    <div className="h-full bg-slate-900 text-white p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('menu')}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black italic tracking-tighter">LOJA</h1>
          <div className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full font-bold flex items-center gap-2 border border-yellow-500/50">
            {coins} Moedas
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setTab('cars')}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${tab === 'cars' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <CarIcon className="w-5 h-5" />
            CARROS
          </button>
          <button
            onClick={() => setTab('drivers')}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${tab === 'drivers' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <User className="w-5 h-5" />
            MOTORISTAS
          </button>
        </div>

        <div className="flex gap-2 mb-8 bg-slate-800/50 p-1 rounded-xl">
          {[1, 2].map(w => (
            <button
              key={w}
              onClick={() => setWorldTab(w)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${worldTab === w ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              MUNDO {w}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {tab === 'cars' && (Object.keys(CARS) as CarId[])
            .filter(id => CARS[id] && CARS[id].world === worldTab)
            .sort((a, b) => (CARS[a]?.cost || 0) - (CARS[b]?.cost || 0))
            .map((id) => {
            const car = CARS[id];
            const isOwned = (ownedCars || []).includes(id);
            const canAfford = coins >= car.cost;

            return (
              <div key={id} className={`bg-slate-800 rounded-2xl p-6 border-2 ${isOwned ? 'border-green-500/50' : 'border-slate-700'} relative overflow-hidden`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: car.color }}>{car.name}</h2>
                    <p className="text-slate-400 text-sm mt-1">{car.description}</p>
                  </div>
                  <div className="w-16 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: car.color }}>
                    <CarIcon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Velocidade</span>
                      <span>{car.id === 'kaiser' ? '?/10' : `${car.speed}/10`}</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: car.id === 'kaiser' ? '70%' : `${(car.speed / 10) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Controle</span>
                      <span>{car.handling}/10</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(car.handling / 10) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {isOwned ? (
                  <button disabled className="w-full py-3 rounded-xl font-bold bg-slate-700 text-slate-400 flex items-center justify-center gap-2">
                    <Unlock className="w-5 h-5" />
                    COMPRADO
                  </button>
                ) : (
                  <button
                    onClick={() => canAfford && onBuyCar(id, car.cost)}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                      canAfford 
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-black' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-5 h-5" />
                    {car.cost} MOEDAS
                  </button>
                )}
              </div>
            );
          })}

          {tab === 'drivers' && (Object.keys(DRIVERS) as DriverId[])
            .filter(id => DRIVERS[id] && DRIVERS[id].world === worldTab)
            .sort((a, b) => (DRIVERS[a]?.cost || 0) - (DRIVERS[b]?.cost || 0))
            .map((id) => {
            const driver = DRIVERS[id];
            const isOwned = (ownedDrivers || []).includes(id);
            const canAfford = coins >= driver.cost;

            return (
              <div key={id} className={`bg-slate-800 rounded-2xl p-6 border-2 ${isOwned ? 'border-green-500/50' : 'border-slate-700'} relative overflow-hidden`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-purple-400">{driver.name}</h2>
                    <p className="text-slate-400 text-sm mt-1">{driver.description}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                </div>

                <div className="bg-slate-900/50 p-3 rounded-xl mb-6 border border-slate-700/50">
                  <div className="text-xs font-bold text-yellow-500 uppercase mb-1">Habilidade: {driver.abilityName}</div>
                  <div className="text-sm text-slate-300">{driver.abilityDescription}</div>
                </div>

                {isOwned ? (
                  <button disabled className="w-full py-3 rounded-xl font-bold bg-slate-700 text-slate-400 flex items-center justify-center gap-2">
                    <Unlock className="w-5 h-5" />
                    COMPRADO
                  </button>
                ) : (
                  <button
                    onClick={() => canAfford && onBuyDriver(id, driver.cost)}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                      canAfford 
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-black' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-5 h-5" />
                    {driver.cost} MOEDAS
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
