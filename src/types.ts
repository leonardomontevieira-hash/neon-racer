export type CarId = 'basic' | 'sport' | 'heavy' | 'hover' | 'phantom' | 'beast' | 'neon' | 'kaiser' | 
  'vortex' | 'titan' | 'glider' | 'shadow' | 'zenith' | 'omega' | 'nebula' | 'void' |
  'frost' | 'glacier' | 'blizzard' | 'tundra' | 'avalanche' | 'aurora' | 'crystal' | 'borealis';
export type DriverId = 'rookie' | 'racer' | 'bruiser' | 'collector' | 'maruto' | 'ghost' | 'tech' | 'nees' | 
  'overlord' | 'chrono' | 'mender' | 'stellar' | 'prime' | 'kalleb' | 'leader' | 'gojo';

export interface Car {
  id: CarId;
  name: string;
  description: string;
  speed: number;
  handling: number;
  color: string;
  cost: number;
  world: number;
}

export interface Driver {
  id: DriverId;
  name: string;
  description: string;
  abilityName: string;
  abilityDescription: string;
  cost: number;
  world: number;
}

export interface LevelProgress {
  stars: number;
  unlocked: boolean;
}

export interface PlayerState {
  coins: number;
  ownedCars: CarId[];
  selectedCar: CarId;
  selectedCar2?: CarId;
  ownedDrivers: DriverId[];
  selectedDriver: DriverId;
  selectedDriver2?: DriverId;
  highScore: number;
  levels: Record<number, Record<number, LevelProgress>>; // world -> level -> progress
  usedCodes: string[];
}

export type Screen = 'menu' | 'game' | 'shop' | 'garage' | 'mode_select' | 'world_select' | 'level_select' | 'codes' | 'multiplayer_setup';
export type GameMode = 'infinite' | 'levels' | 'multiplayer';
