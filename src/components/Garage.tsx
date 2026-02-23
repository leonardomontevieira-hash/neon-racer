import React, { useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, Car as CarIcon, User } from 'lucide-react';
import { CarId, DriverId, Screen } from '../types';
import { CARS, DRIVERS } from '../constants';

interface GarageProps {
  onNavigate: (screen: Screen) => void;
  ownedCars: CarId[];
  selectedCar: CarId;
  ownedDrivers: DriverId[];
  selectedDriver: DriverId;
  onSelectCar: (id: CarId) => void;
  onSelectDriver: (id: DriverId) => void;
}

export default function Garage({ 
  onNavigate, 
  ownedCars, 
  selectedCar, 
  ownedDrivers, 
  selectedDriver, 
  onSelectCar, 
  onSelectDriver 
}: GarageProps) {
  const [tab, setTab] = useState<'cars' | 'drivers'>('cars');

  const sortedOwnedCars = useMemo(() => {
    return [...(ownedCars || [])]
      .filter(id => !!CARS[id])
      .sort((a, b) => (CARS[a]?.cost || 0) - (CARS[b]?.cost || 0));
  }, [ownedCars]);

  const sortedOwnedDrivers = useMemo(() => {
    return [...(ownedDrivers || [])]
      .filter(id => !!DRIVERS[id])
      .sort((a, b) => (DRIVERS[a]?.cost || 0) - (DRIVERS[b]?.cost || 0));
  }, [ownedDrivers]);

  return (
    <div className="h-full bg-slate-900 text-white p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => onNavigate('menu')}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black italic tracking-tighter">GARAGEM</h1>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {tab === 'cars' ? (
            sortedOwnedCars.map((id) => {
              const car = CARS[id];
              const isSelected = selectedCar === id;

              return (
                <div 
                  key={`garage-car-${id}`} 
                  onClick={() => onSelectCar(id)}
                  className={`bg-slate-800 rounded-2xl p-6 border-2 cursor-pointer transition-all hover:scale-105 ${
                    isSelected ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold" style={{ color: car.color }}>{car.name}</h2>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
                  </div>

                  <div className="w-full aspect-video rounded-xl flex items-center justify-center mb-4 relative overflow-hidden" style={{ backgroundColor: `${car.color}20` }}>
                    <div className="w-24 h-12 rounded-md flex items-center" style={{ backgroundColor: car.color }}>
                      <div className="w-6 h-10 bg-slate-900 ml-4 rounded-sm opacity-50" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Velocidade</span>
                      <span>{car.id === 'kaiser' ? '?/10' : `${car.speed}/10`}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Controle</span>
                      <span>{car.handling}/10</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            sortedOwnedDrivers.map((id) => {
              const driver = DRIVERS[id];
              const isSelected = selectedDriver === id;

              return (
                <div 
                  key={`garage-driver-${id}`} 
                  onClick={() => onSelectDriver(id)}
                  className={`bg-slate-800 rounded-2xl p-6 border-2 cursor-pointer transition-all hover:scale-105 ${
                    isSelected ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-purple-400">{driver.name}</h2>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-purple-500" />}
                  </div>

                  <div className="w-full aspect-video rounded-xl flex items-center justify-center mb-4 bg-slate-900/50">
                    <User className="w-16 h-16 text-purple-500/50" />
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg">
                    <span className="font-bold text-yellow-500 block mb-1">{driver.abilityName}</span>
                    {driver.abilityDescription}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
