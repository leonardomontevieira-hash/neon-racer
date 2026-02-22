import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Car as CarIcon, User, Play } from 'lucide-react';
import { CarId, DriverId, Screen } from '../types';
import { CARS, DRIVERS } from '../constants';

interface MultiplayerSetupProps {
  onNavigate: (screen: Screen) => void;
  ownedCars: CarId[];
  ownedDrivers: DriverId[];
  selectedCar1: CarId;
  selectedDriver1: DriverId;
  selectedCar2: CarId;
  selectedDriver2: DriverId;
  onSelectCar1: (id: CarId) => void;
  onSelectDriver1: (id: DriverId) => void;
  onSelectCar2: (id: CarId) => void;
  onSelectDriver2: (id: DriverId) => void;
  onStart: () => void;
}

export default function MultiplayerSetup({
  onNavigate,
  ownedCars,
  ownedDrivers,
  selectedCar1,
  selectedDriver1,
  selectedCar2,
  selectedDriver2,
  onSelectCar1,
  onSelectDriver1,
  onSelectCar2,
  onSelectDriver2,
  onStart
}: MultiplayerSetupProps) {
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [tab, setTab] = useState<'cars' | 'drivers'>('cars');

  const currentCar = activePlayer === 1 ? selectedCar1 : selectedCar2;
  const currentDriver = activePlayer === 1 ? selectedDriver1 : selectedDriver2;

  const handleSelectCar = (id: CarId) => {
    if (activePlayer === 1) onSelectCar1(id);
    else onSelectCar2(id);
  };

  const handleSelectDriver = (id: DriverId) => {
    if (activePlayer === 1) onSelectDriver1(id);
    else onSelectDriver2(id);
  };

  return (
    <div className="h-full bg-slate-900 text-white p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('mode_select')}
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Configuração Multiplayer</h1>
          </div>
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-green-900/20"
          >
            <Play className="w-6 h-6 fill-current" />
            INICIAR CORRIDA
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Player Selection Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <button
              onClick={() => setActivePlayer(1)}
              className={`w-full p-6 rounded-2xl border-2 transition-all ${activePlayer === 1 ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50'}`}
            >
              <div className="text-sm font-bold text-blue-400 uppercase mb-2">Jogador 1 (WASD)</div>
              <div className="text-xl font-black">{CARS[selectedCar1].name}</div>
              <div className="text-slate-400 text-sm">{DRIVERS[selectedDriver1].name}</div>
            </button>

            <button
              onClick={() => setActivePlayer(2)}
              className={`w-full p-6 rounded-2xl border-2 transition-all ${activePlayer === 2 ? 'border-red-500 bg-red-500/10' : 'border-slate-700 bg-slate-800/50'}`}
            >
              <div className="text-sm font-bold text-red-400 uppercase mb-2">Jogador 2 (SETAS)</div>
              <div className="text-xl font-black">{CARS[selectedCar2].name}</div>
              <div className="text-slate-400 text-sm">{DRIVERS[selectedDriver2].name}</div>
            </button>
          </div>

          {/* Main Selection Area */}
          <div className="lg:col-span-3">
            <div className="flex gap-4 mb-8">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tab === 'cars' && [...(ownedCars || [])]
                .filter(id => !!CARS[id])
                .sort((a, b) => CARS[a].cost - CARS[b].cost)
                .map((id) => {
                  const car = CARS[id];
                  const isSelected = currentCar === id;
                  const isOtherPlayerUsing = (activePlayer === 1 ? selectedCar2 : selectedCar1) === id;

                  return (
                    <div
                      key={id}
                      onClick={() => handleSelectCar(id)}
                      className={`bg-slate-800 rounded-2xl p-4 border-2 cursor-pointer transition-all hover:scale-102 ${
                        isSelected ? (activePlayer === 1 ? 'border-blue-500' : 'border-red-500') : 'border-slate-700'
                      } ${isOtherPlayerUsing ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold" style={{ color: car.color }}>{car.name}</h2>
                        {isSelected && <CheckCircle2 className={`w-5 h-5 ${activePlayer === 1 ? 'text-blue-500' : 'text-red-500'}`} />}
                      </div>
                    </div>
                  );
                })}

              {tab === 'drivers' && [...(ownedDrivers || [])]
                .filter(id => !!DRIVERS[id])
                .sort((a, b) => DRIVERS[a].cost - DRIVERS[b].cost)
                .map((id) => {
                  const driver = DRIVERS[id];
                  const isSelected = currentDriver === id;
                  const isOtherPlayerUsing = (activePlayer === 1 ? selectedDriver2 : selectedDriver1) === id;

                  return (
                    <div
                      key={id}
                      onClick={() => handleSelectDriver(id)}
                      className={`bg-slate-800 rounded-2xl p-4 border-2 cursor-pointer transition-all hover:scale-102 ${
                        isSelected ? (activePlayer === 1 ? 'border-blue-500' : 'border-red-500') : 'border-slate-700'
                      } ${isOtherPlayerUsing ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-purple-400">{driver.name}</h2>
                        {isSelected && <CheckCircle2 className={`w-5 h-5 ${activePlayer === 1 ? 'text-blue-500' : 'text-red-500'}`} />}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
