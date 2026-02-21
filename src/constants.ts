import { Car, CarId, Driver, DriverId, PlayerState } from './types';

export const CARS: Record<CarId, Car> = {
  // Mundo 1
  basic: { id: 'basic', name: 'Básico', description: 'Um carro equilibrado.', speed: 4, handling: 5, color: '#3b82f6', cost: 0, world: 1 },
  sport: { id: 'sport', name: 'Esportivo', description: 'Rápido, mas controle moderado.', speed: 6, handling: 4, color: '#ef4444', cost: 50, world: 1 },
  heavy: { id: 'heavy', name: 'Pesado', description: 'Lento, mas muito estável.', speed: 4, handling: 7, color: '#22c55e', cost: 150, world: 1 },
  hover: { id: 'hover', name: 'Hovercraft', description: 'Velocidade decente, flutua.', speed: 5, handling: 6, color: '#a855f7', cost: 300, world: 1 },
  beast: { id: 'beast', name: 'Beast', description: 'Força bruta nas curvas.', speed: 5, handling: 8, color: '#b91c1c', cost: 450, world: 1 },
  phantom: { id: 'phantom', name: 'Phantom', description: 'Invisível e rápido.', speed: 7, handling: 3, color: '#000000', cost: 600, world: 1 },
  neon: { id: 'neon', name: 'Neon X', description: 'A perfeição em neon.', speed: 7, handling: 7, color: '#2dd4bf', cost: 1200, world: 1 },
  kaiser: { id: 'kaiser', name: 'Kaiser', description: 'Velocidade adaptativa: ganha +0.5 de velocidade a cada colisão.', speed: 8, handling: 6, color: '#1e3a8a', cost: 2000, world: 1 },
  
  // Mundo 2
  vortex: { id: 'vortex', name: 'Vortex', description: 'Manipula o vácuo para acelerar.', speed: 9, handling: 5, color: '#6366f1', cost: 2500, world: 2 },
  titan: { id: 'titan', name: 'Titan', description: 'O rei das estradas cibernéticas.', speed: 7, handling: 10, color: '#475569', cost: 3000, world: 2 },
  glider: { id: 'glider', name: 'Glider', description: 'Desliza suavemente entre inimigos.', speed: 8, handling: 9, color: '#38bdf8', cost: 3500, world: 2 },
  shadow: { id: 'shadow', name: 'Shadow', description: 'Velocidade oculta nas sombras.', speed: 11, handling: 6, color: '#111827', cost: 4000, world: 2 },
  zenith: { id: 'zenith', name: 'Zenith', description: 'O ápice da tecnologia automotiva.', speed: 10, handling: 10, color: '#facc15', cost: 5000, world: 2 },
  omega: { id: 'omega', name: 'Omega', description: 'O fim de todas as corridas.', speed: 12, handling: 8, color: '#dc2626', cost: 6500, world: 2 },
  nebula: { id: 'nebula', name: 'Nebula', description: 'Brilha com a energia das estrelas.', speed: 11, handling: 11, color: '#ec4899', cost: 8000, world: 2 },
  void: { id: 'void', name: 'Void', description: 'Nada pode escapar de sua velocidade.', speed: 15, handling: 15, color: '#000000', cost: 10000, world: 2 }
};

export const DRIVERS: Record<DriverId, Driver> = {
  // Mundo 1
  rookie: { id: 'rookie', name: 'Novato', description: 'Motorista iniciante.', abilityName: 'Escudo', abilityDescription: 'Fica invencível a batidas por 3 segundos.', cost: 0, world: 1 },
  maruto: { id: 'maruto', name: 'Maruto', description: 'Um ninja das pistas.', abilityName: 'Shuriken', abilityDescription: 'Lança uma shuriken que destrói o primeiro carro que atingir.', cost: 25, world: 1 },
  racer: { id: 'racer', name: 'Piloto', description: 'Adora velocidade.', abilityName: 'Nitro', abilityDescription: 'Aumento massivo de velocidade por 2 segundos.', cost: 50, world: 1 },
  bruiser: { id: 'bruiser', name: 'Brutamontes', description: 'Agressivo no volante.', abilityName: 'Trator', abilityDescription: 'Destrói carros inimigos ao tocar por 5 segundos.', cost: 150, world: 1 },
  collector: { id: 'collector', name: 'Colecionador', description: 'Adora dinheiro.', abilityName: 'Ímã de Moedas', abilityDescription: 'Atrai todas as moedas próximas por 5 segundos.', cost: 300, world: 1 },
  ghost: { id: 'ghost', name: 'Fantasma', description: 'Misterioso e sombrio.', abilityName: 'Intangível', abilityDescription: 'Atravessa obstáculos sem sofrer dano por 5 segundos.', cost: 500, world: 1 },
  tech: { id: 'tech', name: 'Tecnólogo', description: 'Mestre da computação.', abilityName: 'Hack de Tempo', abilityDescription: 'Reduz a velocidade de tudo ao redor por 5 segundos.', cost: 800, world: 1 },
  nees: { id: 'nees', name: 'Nees', description: 'Especialista em reparos.', abilityName: 'Reparo Rápido', abilityDescription: 'Recupera 1 ponto de vida se o carro estiver danificado.', cost: 1800, world: 1 },
  
  // Mundo 2
  overlord: { id: 'overlord', name: 'Soberano', description: 'Domina as pistas com punho de ferro.', abilityName: 'Onda de Choque', abilityDescription: 'Limpa todos os inimigos da tela instantaneamente.', cost: 2500, world: 2 },
  chrono: { id: 'chrono', name: 'Chrono', description: 'Controla o fluxo do tempo.', abilityName: 'Parada Temporal', abilityDescription: 'Congela todos os inimigos por 3 segundos.', cost: 3000, world: 2 },
  mender: { id: 'mender', name: 'Mender', description: 'Nanotecnologia de reparo.', abilityName: 'Auto-Reparo', abilityDescription: 'Recupera toda a vida do carro.', cost: 4500, world: 2 },
  stellar: { id: 'stellar', name: 'Stellar', description: 'Energia cósmica pura.', abilityName: 'Supernova', abilityDescription: 'Fica invencível e ultra rápido por 8 segundos.', cost: 9000, world: 2 },
  kalleb: { id: 'kalleb', name: 'Kalleb', description: 'Mestre da artilharia pesada.', abilityName: 'Mísseis Homing', abilityDescription: 'Lança 3 mísseis teleguiados nos inimigos mais próximos.', cost: 12000, world: 2 },
  prime: { id: 'prime', name: 'Prime', description: 'O motorista definitivo.', abilityName: 'Modo Deus', abilityDescription: 'Invencibilidade, velocidade e ímã permanentes por 10s.', cost: 15000, world: 0 }
};

export const WORLDS = {
  1: { name: 'Cidade Neon', description: 'As ruas iluminadas da metrópole.', color: '#2dd4bf', levels: 10 },
  2: { name: 'Cyber Deserto', description: 'Dunas tecnológicas e perigosas.', color: '#f59e0b', levels: 15 }
};

export const LEVELS_COUNT = 10; // Legacy, but keeping for compatibility if needed
export const BASE_LEVEL_DISTANCE = 100;
export const LEVEL_DISTANCE_INCREMENT = 50;

export const INITIAL_STATE: PlayerState = {
  coins: 0,
  ownedCars: ['basic'],
  selectedCar: 'basic',
  ownedDrivers: ['rookie'],
  selectedDriver: 'rookie',
  highScore: 0,
  levels: {
    1: {
      1: { stars: 0, unlocked: true },
      ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 2, { stars: 0, unlocked: false }]))
    },
    2: {
      ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [i + 1, { stars: 0, unlocked: false }]))
    }
  },
  usedCodes: []
};
