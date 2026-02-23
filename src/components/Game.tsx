import React, { useEffect, useRef, useState } from 'react';
import { Car, Driver } from '../types';
import { BASE_LEVEL_DISTANCE, LEVEL_DISTANCE_INCREMENT } from '../constants';

interface GameProps {
  car: Car;
  driver: Driver;
  car2?: Car;
  driver2?: Driver;
  mode: 'infinite' | 'levels' | 'multiplayer';
  world?: number;
  level?: number;
  onGameOver: (coins: number, score: number, stars?: number, victory?: boolean, winner?: string) => void;
}

export default function Game({ car, driver, car2, driver2, mode, world: initialWorld = 1, level, onGameOver }: GameProps) {
  const world = mode === 'infinite' ? 1 : initialWorld;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [abilityReady, setAbilityReady] = useState(true);
  const [abilityActive, setAbilityActive] = useState(false);
  const [abilityReady2, setAbilityReady2] = useState(true);
  const [abilityActive2, setAbilityActive2] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [health, setHealth] = useState(3);
  const [health2, setHealth2] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  const worldOffset = (world - 1) * 500;
  const targetDistance = mode === 'levels' && level ? worldOffset + BASE_LEVEL_DISTANCE + (level - 1) * LEVEL_DISTANCE_INCREMENT : (mode === 'multiplayer' ? 2000 : Infinity);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();
    let keys: { [key: string]: boolean } = {};
    let isDragging = false;
    let dragOffsetY = 0;

    const scale = Math.max(1, dimensions.height / 400);
    const baseWidth = 70 * scale;
    const baseHeight = 40 * scale;

    const isRaceMode = (mode === 'levels' && (world === 2 || (world === 1 && level === 10))) || mode === 'multiplayer';
    const player = {
      x: 100 * scale,
      y: isRaceMode ? 30 * scale : dimensions.height / 2 - (baseHeight / 2),
      width: baseWidth,
      height: baseHeight,
      baseSpeedX: car.speed * 1.5,
      vy: 0, // Vertical velocity for slippery handling
      abilityTimer: 0,
      abilityCooldown: 0,
      isInvincible: false,
      isMagnet: false,
      isBulldozer: false,
      isTimeHacked: false,
      isTimeStopped: false,
      isEMPActive: false,
    };

    const player2 = (car2 && driver2) ? {
      x: 100 * scale,
      y: isRaceMode ? 90 * scale : dimensions.height / 2 + (baseHeight / 2),
      width: baseWidth,
      height: baseHeight,
      baseSpeedX: car2.speed * 1.5,
      vy: 0, // Vertical velocity for slippery handling
      abilityTimer: 0,
      abilityCooldown: 0,
      isInvincible: false,
      isMagnet: false,
      isBulldozer: false,
      isTimeHacked: false,
      isTimeStopped: false,
      isEMPActive: false,
    } : null;

    const enemies: any[] = [];
    const coins: any[] = [];
    const particles: any[] = [];
    const shurikens: any[] = [];
    const missiles: any[] = [];
    const shieldCars: any[] = [];
    let roadOffset = 0;
    let distance = 0;
    let distance2 = 0;
    let sessionCoins = 0;
    let currentHealth = health;
    let currentHealth2 = health2;
    let finished = false;
    let shake = 0;
    let countdown = isRaceMode ? 3 : 0;
    let countdownTimer = 1000;

    const rivals: any[] = [];
    const levelDifficulty = (world - 1) * 10 + level;
    const baseRivalSpeed = 2.5 + (levelDifficulty * 0.4); // Adjusted for better progression

    const getObjX = (obj: any) => {
      if (obj.isPlayer) return obj.ownerId === 1 ? player.x : player2!.x;
      if (isRaceMode && obj.distance !== undefined) {
        const leaderDist = player2 ? Math.max(distance, distance2) : distance;
        return (100 * scale) + (obj.distance - leaderDist) * (15 * scale);
      }
      return obj.x;
    };

    if (isRaceMode && mode !== 'multiplayer') {
      const rivalCount = world === 1 ? 1 : 5;
      const laneHeight = (canvas.height - 40) / (rivalCount + 1);
      for (let i = 0; i < rivalCount; i++) {
        rivals.push({
          id: `rival-${i}`,
          x: 100 * scale,
          y: 40 + i * laneHeight,
          width: baseWidth,
          height: baseHeight,
          speedY: (Math.random() * 2 + 1) * scale,
          baseSpeedX: baseRivalSpeed * (0.85 + Math.random() * 0.3),
          distance: 0,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
          targetY: 0,
          changeTargetTimer: 0,
          isStunned: false,
          stunTimer: 0
        });
      }
    }

    const spawnEnemy = () => {
      if (finished || isRaceMode) return;
      const width = baseWidth;
      const height = baseHeight;
      const y = Math.random() * (canvas.height - height - 40) + 20;
      const speed = baseRivalSpeed * 0.8 + Math.random() * 2;
      enemies.push({ x: canvas.width + width, y, width, height, speed, color: `hsl(${Math.random() * 360}, 70%, 50%)` });
    };

    const spawnCoin = () => {
      if (finished || isRaceMode) return;
      const y = Math.random() * (canvas.height - 60) + 30;
      coins.push({ x: canvas.width + 20, y, radius: 10 * scale, collected: false });
    };

    const createExplosion = (x: number, y: number, color: string, intense = false) => {
      const count = intense ? 40 : 20;
      shake = intense ? 15 : 8;
      for (let i = 0; i < count; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * (intense ? 15 : 10),
          vy: (Math.random() - 0.5) * (intense ? 15 : 10),
          size: Math.random() * 4 + 2,
          life: 1,
          color,
          glow: intense
        });
      }
    };

    let enemySpawnTimer = 0;
    let coinSpawnTimer = 0;

    const activateAbility = (d: Driver, p: any, setReady: any, setActive: any, pHealth: number, setPHealth: any, ownerId: number) => {
      if (d.id === 'maruto') {
        shurikens.push({
          x: p.x + p.width,
          y: p.y + p.height / 2,
          radius: 15 * scale,
          speed: 15,
          rotation: 0,
          ownerId
        });
        p.abilityTimer = 500;
      } else if (d.id === 'overlord') {
        // ... (rest of overlord logic)
        enemies.forEach(e => {
          createExplosion(e.x + e.width/2, e.y + e.height/2, e.color, true);
        });
        enemies.length = 0;

        shurikens.forEach(s => {
          createExplosion(s.x, s.y, '#94a3b8', true);
        });
        shurikens.length = 0;

        missiles.forEach(m => {
          createExplosion(m.x + m.width/2, m.y + m.height/2, m.color, true);
        });
        missiles.length = 0;

        for (let i = shieldCars.length - 1; i >= 0; i--) {
          const s = shieldCars[i];
          if (s.ownerId !== ownerId) {
            createExplosion(s.x + s.width/2, s.y + s.height/2, '#475569', true);
            shieldCars.splice(i, 1);
          }
        }
        
        p.abilityTimer = 500;
      } else if (d.id === 'nees') {
        if (pHealth < 3) {
          setPHealth(pHealth + 1);
          createExplosion(p.x + p.width/2, p.y + p.height/2, '#4ade80', false);
          p.abilityTimer = 500;
        } else {
          return;
        }
      } else if (d.id === 'mender') {
        if (pHealth < 3) {
          setPHealth(3);
          createExplosion(p.x + p.width/2, p.y + p.height/2, '#4ade80', false);
          p.abilityTimer = 500;
        } else {
          return;
        }
      } else if (d.id === 'kalleb') {
        const otherPlayer = ownerId === 1 ? player2 : player;
        const potentialTargets = [
          ...enemies, 
          ...shieldCars.filter(s => s.ownerId !== ownerId),
          ...missiles.filter(m => m.ownerId !== ownerId)
        ];
        if (otherPlayer && otherPlayer.x > p.x && !otherPlayer.isInvincible) {
          potentialTargets.push({ ...otherPlayer, isPlayer: true, ownerId: ownerId === 1 ? 2 : 1 });
        }

        const targets = potentialTargets
          .filter(e => {
            const ex = getObjX(e);
            return ex > p.x;
          })
          .sort((a, b) => {
            const ax = getObjX(a);
            const ay = a.isPlayer ? (a.ownerId === 1 ? player.y : player2!.y) : a.y;
            const distA = Math.sqrt(Math.pow(ax - p.x, 2) + Math.pow(ay - p.y, 2));
            const bx = getObjX(b);
            const by = b.isPlayer ? (b.ownerId === 1 ? player.y : player2!.y) : b.y;
            const distB = Math.sqrt(Math.pow(bx - p.x, 2) + Math.pow(by - p.y, 2));
            return distA - distB;
          })
          .slice(0, 3);

        for (let i = 0; i < 3; i++) {
          missiles.push({
            x: p.x + p.width,
            y: p.y + p.height / 2,
            target: targets[i] || null,
            speed: 6,
            vx: 5,
            vy: (i - 1) * 2,
            width: 20 * scale,
            height: 10 * scale,
            color: '#fbbf24',
            ownerId
          });
        }
        p.abilityTimer = 500;
      } else if (d.id === 'gojo') {
        const otherPlayer = ownerId === 1 ? player2 : player;
        const potentialTargets = [
          ...enemies, 
          ...shieldCars.filter(s => s.ownerId !== ownerId),
          ...missiles.filter(m => m.ownerId !== ownerId)
        ];
        if (otherPlayer && !otherPlayer.isInvincible) {
          potentialTargets.push({ ...otherPlayer, isPlayer: true, ownerId: ownerId === 1 ? 2 : 1 });
        }

        const target = potentialTargets
          .filter(e => getObjX(e) > p.x - 100)
          .sort((a, b) => {
            const ax = getObjX(a);
            const ay = a.isPlayer ? (a.ownerId === 1 ? player.y : player2!.y) : a.y;
            const distA = Math.sqrt(Math.pow(ax - p.x, 2) + Math.pow(ay - p.y, 2));
            const bx = getObjX(b);
            const by = b.isPlayer ? (b.ownerId === 1 ? player.y : player2!.y) : b.y;
            const distB = Math.sqrt(Math.pow(bx - p.x, 2) + Math.pow(by - p.y, 2));
            return distA - distB;
          })[0];

        missiles.push({
          x: p.x + p.width,
          y: p.y + p.height / 2,
          target: target || null,
          speed: 8,
          vx: 6,
          vy: 0,
          width: 40 * scale,
          height: 40 * scale,
          color: '#a855f7',
          ownerId,
          isVazioRoxo: true
        });
        p.abilityTimer = 500;
      } else if (d.id === 'leader') {
        const laneHeight = (canvas.height - 40) / 3;
        const centers = [
          20 + laneHeight / 2,
          20 + laneHeight + laneHeight / 2,
          20 + laneHeight * 2 + laneHeight / 2
        ];
        const ownerDist = ownerId === 1 ? distance : distance2;
        centers.forEach(laneY => {
          shieldCars.push({
            distance: ownerDist + 15,
            y: laneY - (25 * scale),
            width: 80 * scale,
            height: 50 * scale,
            color: '#000000',
            ownerId,
            life: 1
          });
        });
        p.abilityTimer = 500;
      } else {
        p.abilityTimer = d.id === 'racer' ? 2000 : 
                         d.id === 'rookie' ? 3000 : 
                         d.id === 'ghost' ? 5000 : 
                         d.id === 'chrono' ? 3000 :
                         d.id === 'stellar' ? 8000 :
                         d.id === 'prime' ? 10000 : 5000;
      }
      p.abilityCooldown = 10000;
      setReady(false);
      setActive(true);
    };

    const update = (dt: number) => {
      if (isPaused) return;

      if (countdown > 0) {
        countdownTimer -= dt;
        if (countdownTimer <= 0) {
          countdown--;
          countdownTimer = 1000;
        }
        return;
      }

      if (finished) {
        if (isRaceMode) return;
        player.x += 5;
        if (player2) player2.x += 5;
        if (player.x > canvas.width + 100 && (!player2 || player2.x > canvas.width + 100)) {
          onGameOver(sessionCoins, Math.floor(distance), currentHealth, true, "Jogador 1");
        }
        return;
      }

      const moveSpeed = car.handling * 1.2;
      if (world === 3) {
        // Slippery handling for World 3
        if (keys['w']) player.vy -= 0.5 * (car.handling / 10);
        if (keys['s']) player.vy += 0.5 * (car.handling / 10);
        player.vy *= 0.95; // Friction
        player.y += player.vy;
      } else {
        if (keys['w']) player.y -= moveSpeed;
        if (keys['s']) player.y += moveSpeed;
      }

      if (player.y < 20) player.y = 20;
      if (player.y > canvas.height - player.height - 20) player.y = canvas.height - player.height - 20;

      if (player2 && car2) {
        const moveSpeed2 = car2.handling * 1.2;
        if (world === 3) {
          // Slippery handling for World 3
          if (keys['ArrowUp']) player2.vy -= 0.5 * (car2.handling / 10);
          if (keys['ArrowDown']) player2.vy += 0.5 * (car2.handling / 10);
          player2.vy *= 0.95; // Friction
          player2.y += player2.vy;
        } else {
          if (keys['ArrowUp']) player2.y -= moveSpeed2;
          if (keys['ArrowDown']) player2.y += moveSpeed2;
        }

        if (player2.y < 20) player2.y = 20;
        if (player2.y > canvas.height - player2.height - 20) player2.y = canvas.height - player2.height - 20;
      }

      if (keys[' '] && player.abilityCooldown <= 0) {
        activateAbility(driver, player, setAbilityReady, setAbilityActive, currentHealth, setHealth, 1);
      }

      if (player2 && driver2 && keys['Enter'] && player2.abilityCooldown <= 0) {
        activateAbility(driver2, player2, setAbilityReady2, setAbilityActive2, currentHealth2, setHealth2, 2);
      }

      const updatePlayerAbility = (p: any, d: Driver, setActive: any) => {
        p.isInvincible = false;
        p.isMagnet = false;
        p.isBulldozer = false;
        p.isTimeHacked = false;
        p.isTimeStopped = false;
        p.isEMPActive = false;
        let speedMult = 1;

        if (p.abilityTimer > 0) {
          p.abilityTimer -= dt;
          if (d.id === 'racer') {
            speedMult = 2.5;
            p.isInvincible = true;
          } else if (d.id === 'rookie' || d.id === 'ghost' || d.id === 'stellar' || d.id === 'prime') {
            p.isInvincible = true;
            if (d.id === 'stellar') speedMult = 3;
            if (d.id === 'prime') {
              speedMult = 2.5;
              p.isMagnet = true;
            }
          } else if (d.id === 'bruiser') {
            p.isBulldozer = true;
          } else if (d.id === 'collector') {
            p.isMagnet = true;
          } else if (d.id === 'tech') {
            p.isTimeHacked = true;
          } else if (d.id === 'chrono') {
            p.isTimeStopped = true;
          }
          if (p.abilityTimer <= 0) setActive(false);
        }
        return speedMult;
      };

      const speedMult1 = updatePlayerAbility(player, driver, setAbilityActive);
      const speedMult2 = player2 && driver2 ? updatePlayerAbility(player2, driver2, setAbilityActive2) : 1;

      const p1Speed = (player.baseSpeedX * speedMult1 * 2) * (player2?.isTimeHacked ? 0.5 : 1) * (player2?.isTimeStopped ? 0 : 1);
      const p2Speed = player2 ? (player2.baseSpeedX * speedMult2 * 2) * (player.isTimeHacked ? 0.5 : 1) * (player.isTimeStopped ? 0 : 1) : 0;

      const roadSpeed = Math.max(p1Speed, p2Speed);
      roadOffset = (roadOffset - roadSpeed) % 40;
      
      distance += p1Speed / 100;
      if (player2) distance2 += p2Speed / 100;

      if (mode === 'multiplayer' && player2) {
        const leaderDist = Math.max(distance, distance2);
        player.x = 100 + (distance - leaderDist) * 15;
        player2.x = 100 + (distance2 - leaderDist) * 15;
        
        // Victory Check
        if (distance >= targetDistance && !finished) {
          finished = true;
          onGameOver(sessionCoins, Math.floor(distance), 0, true, "Jogador 1");
        } else if (distance2 >= targetDistance && !finished) {
          finished = true;
          onGameOver(sessionCoins, Math.floor(distance2), 0, true, "Jogador 2");
        }
        
        setScore(Math.floor(Math.max(distance, distance2)));
      } else {
        setScore(Math.floor(distance));
        if (mode === 'levels' && distance >= targetDistance) {
          if (!finished) {
            finished = true;
            onGameOver(sessionCoins, Math.floor(distance), currentHealth, true, "Jogador 1");
          }
        }
      }

      if (player.abilityCooldown > 0) {
        player.abilityCooldown -= dt;
        if (player.abilityCooldown <= 0) setAbilityReady(true);
      }

      if (player2 && player2.abilityCooldown > 0) {
        player2.abilityCooldown -= dt;
        if (player2.abilityCooldown <= 0) setAbilityReady2(true);
      }

      enemySpawnTimer -= dt;
      if (enemySpawnTimer <= 0) {
        spawnEnemy();
        const spawnInterval = Math.max(300, 1500 - (levelDifficulty * 40));
        enemySpawnTimer = (Math.random() * spawnInterval + spawnInterval/2) * (player.isTimeHacked ? 2 : 1);
      }

      if (isRaceMode && !finished) {
        for (const rival of rivals) {
          // Rival AI - Movement
          if (rival.stunTimer > 0) {
            rival.stunTimer -= dt;
            if (rival.stunTimer <= 0) rival.isStunned = false;
          }

          if (!rival.isStunned) {
            rival.changeTargetTimer -= dt;
            if (rival.changeTargetTimer <= 0) {
              rival.targetY = Math.random() * (canvas.height - rival.height - 40) + 20;
              rival.changeTargetTimer = Math.random() * 2000 + 1000;
            }

            if (rival.y < rival.targetY) rival.y += rival.speedY;
            if (rival.y > rival.targetY) rival.y -= rival.speedY;
          }

          // Rival Speed & Distance
          const rivalBaseSpeed = (player.isTimeStopped || rival.isStunned) ? 0 : rival.baseSpeedX;
          
          let finalRivalSpeed = rivalBaseSpeed;

          const rivalRoadSpeed = (finalRivalSpeed * 2) * (player.isTimeHacked ? 0.5 : 1);
          rival.distance += rivalRoadSpeed / 100;

          // Rival X position relative to player
          rival.x = 100 + (rival.distance - distance) * 15;

          // Rival Victory Check
          if (rival.distance >= targetDistance) {
            onGameOver(sessionCoins, Math.floor(distance), 0, false);
            finished = true;
            return;
          }

          // Rival Collision
          if (
            player.x < rival.x + rival.width &&
            player.x + player.width > rival.x &&
            player.y < rival.y + rival.height &&
            player.y + player.height > rival.y
          ) {
            if (!player.isInvincible) {
              if (car.id === 'kaiser') {
                player.baseSpeedX += 0.5;
              }
              currentHealth -= 1;
              setHealth(currentHealth);
              createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000', true);
              player.isInvincible = true;
              player.abilityTimer = 1500;
              if (currentHealth <= 0) {
                onGameOver(sessionCoins, Math.floor(distance), 0, false);
                finished = true;
                return;
              }
            }
          }
        }
      }

      coinSpawnTimer -= dt;
      if (coinSpawnTimer <= 0) {
        spawnCoin();
        coinSpawnTimer = (Math.random() * 2000 + 500) * (player.isTimeHacked ? 2 : 1);
      }

      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const enemySpeed = player.isTimeStopped || player2?.isTimeStopped ? 0 : e.speed;
        e.x -= (roadSpeed + enemySpeed) * (player.isTimeHacked || player2?.isTimeHacked ? 0.5 : 1);
        
        const checkCollision = (p: any, isP1: boolean) => {
          if (
            p.x < e.x + e.width &&
            p.x + p.width > e.x &&
            p.y < e.y + e.height &&
            p.y + p.height > e.y
          ) {
            if (p.isBulldozer) {
              createExplosion(e.x + e.width/2, e.y + e.height/2, e.color, true);
              enemies.splice(i, 1);
              return true;
            } else if (!p.isInvincible) {
              if (isP1 && car.id === 'kaiser') {
                p.baseSpeedX += 0.5;
              }
              
              if (isP1) {
                currentHealth -= 1;
                setHealth(currentHealth);
              } else {
                currentHealth2 -= 1;
                setHealth2(currentHealth2);
              }

              createExplosion(p.x + p.width/2, p.y + p.height/2, '#ff0000', true);
              enemies.splice(i, 1);
              
              p.isInvincible = true;
              p.abilityTimer = 1000;
              
              const pHealth = isP1 ? currentHealth : currentHealth2;
              if (pHealth <= 0) {
                if (!player2) {
                  onGameOver(sessionCoins, Math.floor(distance), 0, false);
                } else if (currentHealth <= 0 && currentHealth2 <= 0) {
                  onGameOver(sessionCoins, Math.floor(distance), 0, false);
                }
              }
              return true;
            }
          }
          return false;
        };

        if (checkCollision(player, true)) continue;
        if (player2 && checkCollision(player2, false)) continue;

        if (e.x < -e.width) enemies.splice(i, 1);
      }

      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        
        const magnetPlayer = (player.isMagnet ? player : (player2?.isMagnet ? player2 : null));
        if (magnetPlayer) {
          const dx = (magnetPlayer.x + magnetPlayer.width/2) - c.x;
          const dy = (magnetPlayer.y + magnetPlayer.height/2) - c.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 200) {
            c.x += (dx / dist) * 10;
            c.y += (dy / dist) * 10;
          } else {
            c.x -= roadSpeed;
          }
        } else {
          c.x -= roadSpeed;
        }

        const checkCoinCollect = (p: any) => {
          const px = p.x + p.width/2;
          const py = p.y + p.height/2;
          const dx = px - c.x;
          const dy = py - c.y;
          if (Math.sqrt(dx*dx + dy*dy) < c.radius + p.height/2) {
            sessionCoins++;
            setCoinsCollected(sessionCoins);
            coins.splice(i, 1);
            shake = Math.max(shake, 2);
            return true;
          }
          return false;
        };

        if (checkCoinCollect(player)) continue;
        if (player2 && checkCoinCollect(player2)) continue;

        if (c.x < -20) coins.splice(i, 1);
      }

      // Player-Player Collision
      if (player2 && !finished) {
        if (
          player.x < player2.x + player2.width &&
          player.x + player.width > player2.x &&
          player.y < player2.y + player2.height &&
          player.y + player.height > player2.y
        ) {
          // Repulsion
          const dy = player.y - player2.y;
          if (dy > 0) {
            player.y += 40;
            player2.y -= 40;
          } else {
            player.y -= 40;
            player2.y += 40;
          }

          if (player.isBulldozer && !player2.isInvincible) {
            currentHealth2 -= 1;
            setHealth2(currentHealth2);
            createExplosion(player2.x + player2.width/2, player2.y + player2.height/2, '#ff0000', true);
            player2.isInvincible = true;
            player2.abilityTimer = 1000;
          } else if (player2.isBulldozer && !player.isInvincible) {
            currentHealth -= 1;
            setHealth(currentHealth);
            createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000', true);
            player.isInvincible = true;
            player.abilityTimer = 1000;
          } else if (!player.isInvincible && !player2.isInvincible) {
            currentHealth -= 1;
            currentHealth2 -= 1;
            setHealth(currentHealth);
            setHealth2(currentHealth2);
            createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000', true);
            createExplosion(player2.x + player2.width/2, player2.y + player2.height/2, '#ff0000', true);
            player.isInvincible = true;
            player.abilityTimer = 1000;
            player2.isInvincible = true;
            player2.abilityTimer = 1000;
          }

          if (currentHealth <= 0 || currentHealth2 <= 0) {
            let winnerName = "";
            if (currentHealth <= 0 && currentHealth2 <= 0) {
              winnerName = "EMPATE";
            } else {
              winnerName = currentHealth > currentHealth2 ? "Jogador 1" : "Jogador 2";
            }
            onGameOver(sessionCoins, Math.floor(distance), 0, true, winnerName);
            finished = true;
          }
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt / 800;
        if (p.life <= 0) particles.splice(i, 1);
      }

      for (let i = shieldCars.length - 1; i >= 0; i--) {
        const s = shieldCars[i];
        const ownerDist = s.ownerId === 1 ? distance : distance2;
        const ownerSpeed = s.ownerId === 1 ? p1Speed : p2Speed;
        
        // Keep distance constant relative to owner
        s.distance = ownerDist + 15;
        
        const leaderDist = player2 ? Math.max(distance, distance2) : distance;
        s.x = 100 + (s.distance - leaderDist) * 15;
        
        // Collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (
            s.x < e.x + e.width &&
            s.x + s.width > e.x &&
            s.y < e.y + e.height &&
            s.y + s.height > e.y
          ) {
            createExplosion(e.x + e.width/2, e.y + e.height/2, e.color, true);
            enemies.splice(j, 1);
            createExplosion(s.x + s.width/2, s.y + s.height/2, '#000000', true);
            shieldCars.splice(i, 1);
            break;
          }
        }
        if (!shieldCars[i]) continue;

        // Collision with other player in multiplayer
        if (player2) {
          const otherPlayer = s.ownerId === 1 ? player2 : player;
          const isP1Owner = s.ownerId === 1;
          
          if (
            otherPlayer.x < s.x + s.width &&
            otherPlayer.x + otherPlayer.width > s.x &&
            otherPlayer.y < s.y + s.height &&
            otherPlayer.y + otherPlayer.height > s.y
          ) {
            if (!otherPlayer.isInvincible) {
              if (isP1Owner) {
                currentHealth2 -= 1;
                setHealth2(currentHealth2);
              } else {
                currentHealth -= 1;
                setHealth(currentHealth);
              }
              createExplosion(otherPlayer.x + otherPlayer.width/2, otherPlayer.y + otherPlayer.height/2, '#ff0000', true);
              otherPlayer.isInvincible = true;
              otherPlayer.abilityTimer = 1000;
              
              createExplosion(s.x + s.width/2, s.y + s.height/2, '#000000', true);
              shieldCars.splice(i, 1);

              if (currentHealth <= 0 || currentHealth2 <= 0) {
                let winnerName = "";
                if (currentHealth <= 0 && currentHealth2 <= 0) {
                  winnerName = "EMPATE";
                } else {
                  winnerName = currentHealth > currentHealth2 ? "Jogador 1" : "Jogador 2";
                }
                onGameOver(sessionCoins, Math.floor(distance), 0, true, winnerName);
                finished = true;
              }
              continue;
            }
          }
        }

        if (s.x < -200) shieldCars.splice(i, 1);
      }

      for (let i = shurikens.length - 1; i >= 0; i--) {
        const s = shurikens[i];
        s.x += s.speed;
        s.rotation += 0.5;

        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (
            s.x + s.radius > e.x &&
            s.x - s.radius < e.x + e.width &&
            s.y + s.radius > e.y &&
            s.y - s.radius < e.y + e.height
          ) {
            createExplosion(e.x + e.width/2, e.y + e.height/2, e.color, true);
            enemies.splice(j, 1);
            shurikens.splice(i, 1);
            break;
          }
        }

        // Shuriken collision with missiles
        if (s) {
          for (let j = missiles.length - 1; j >= 0; j--) {
            const m = missiles[j];
            if (s.ownerId !== m.ownerId) {
              const dx = s.x - (m.x + m.width / 2);
              const dy = s.y - (m.y + m.height / 2);
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < s.radius + m.width / 2) {
                createExplosion(m.x + m.width / 2, m.y + m.height / 2, m.color, true);
                missiles.splice(j, 1);
                shurikens.splice(i, 1);
                break;
              }
            }
          }
        }

        // Shuriken collision with other player
        if (s && player2) {
          if (s.ownerId === 1 && !player2.isInvincible) {
            if (
              s.x + s.radius > player2.x &&
              s.x - s.radius < player2.x + player2.width &&
              s.y + s.radius > player2.y &&
              s.y - s.radius < player2.y + player2.height
            ) {
              currentHealth2 -= 1;
              setHealth2(currentHealth2);
              createExplosion(player2.x + player2.width/2, player2.y + player2.height/2, '#ff0000', true);
              player2.isInvincible = true;
              player2.abilityTimer = 1000;
              shurikens.splice(i, 1);
              if (currentHealth2 <= 0) {
                onGameOver(sessionCoins, Math.floor(distance), 0, true, "Jogador 1");
                finished = true;
              }
              continue;
            }
          } else if (s.ownerId === 2 && !player.isInvincible) {
            if (
              s.x + s.radius > player.x &&
              s.x - s.radius < player.x + player.width &&
              s.y + s.radius > player.y &&
              s.y - s.radius < player.y + player.height
            ) {
              currentHealth -= 1;
              setHealth(currentHealth);
              createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000', true);
              player.isInvincible = true;
              player.abilityTimer = 1000;
              shurikens.splice(i, 1);
              if (currentHealth <= 0) {
                onGameOver(sessionCoins, Math.floor(distance), 0, true, "Jogador 2");
                finished = true;
              }
              continue;
            }
          }
        }

        if (s && s.x > canvas.width + 50) shurikens.splice(i, 1);
      }

      for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];
        
        // Homing logic
        const isTargetValid = m.target && (
          enemies.includes(m.target) || 
          shieldCars.includes(m.target) ||
          missiles.includes(m.target) ||
          (m.target.isPlayer && (m.target.ownerId === 1 ? player : player2))
        );

        if (m.target && isTargetValid) {
          const targetX = getObjX(m.target);
          const targetY = m.target.isPlayer ? (m.target.ownerId === 1 ? player.y : player2!.y) : m.target.y;
          const targetWidth = m.target.isPlayer ? (m.target.ownerId === 1 ? player.width : player2!.width) : m.target.width;
          const targetHeight = m.target.isPlayer ? (m.target.ownerId === 1 ? player.height : player2!.height) : m.target.height;

          const dx = targetX + targetWidth/2 - m.x;
          const dy = targetY + targetHeight/2 - m.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 5) {
            m.vx += (dx / dist) * 0.8; // Increased homing strength
            m.vy += (dy / dist) * 0.8;
          }
        } else {
          // If target is gone, find new one or just go straight
          const nextTarget = enemies.find(e => e.x > m.x);
          if (nextTarget) {
            m.target = nextTarget;
          } else if (player2) {
            const otherP = m.ownerId === 1 ? player2 : player;
            m.target = { ...otherP, isPlayer: true, ownerId: m.ownerId === 1 ? 2 : 1 };
          }
          m.vx += 0.2;
        }

        // Limit speed to 6
        const currentSpeed = Math.sqrt(m.vx*m.vx + m.vy*m.vy);
        if (currentSpeed > m.speed) {
          m.vx = (m.vx / currentSpeed) * m.speed;
          m.vy = (m.vy / currentSpeed) * m.speed;
        }

        m.x += m.vx;
        m.y += m.vy;

        // Collision with other player
        if (player2) {
          if (m.ownerId === 1 && !player2.isInvincible) {
            if (
              m.x < player2.x + player2.width &&
              m.x + m.width > player2.x &&
              m.y < player2.y + player2.height &&
              m.y + m.height > player2.y
            ) {
              const damage = m.isVazioRoxo ? 2 : 1;
              currentHealth2 -= damage;
              setHealth2(currentHealth2);
              createExplosion(player2.x + player2.width/2, player2.y + player2.height/2, '#ff0000', true);
              player2.isInvincible = true;
              player2.abilityTimer = 1000;
              missiles.splice(i, 1);
              if (currentHealth2 <= 0) {
                onGameOver(sessionCoins, Math.floor(distance), 0, true, "Jogador 1");
                finished = true;
              }
              continue;
            }
          } else if (m.ownerId === 2 && !player.isInvincible) {
            if (
              m.x < player.x + player.width &&
              m.x + m.width > player.x &&
              m.y < player.y + player.height &&
              m.y + m.height > player.y
            ) {
              const damage = m.isVazioRoxo ? 2 : 1;
              currentHealth -= damage;
              setHealth(currentHealth);
              createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000', true);
              player.isInvincible = true;
              player.abilityTimer = 1000;
              missiles.splice(i, 1);
              if (currentHealth <= 0) {
                onGameOver(sessionCoins, Math.floor(distance), 0, true, "Jogador 2");
                finished = true;
              }
              continue;
            }
          }
        }

        // Collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (
            m.x < e.x + e.width &&
            m.x + m.width > e.x &&
            m.y < e.y + e.height &&
            m.y + m.height > e.y
          ) {
            createExplosion(e.x + e.width/2, e.y + e.height/2, e.color, true);
            enemies.splice(j, 1);
            missiles.splice(i, 1);
            break;
          }
        }

        // Collision with shieldCars
        if (m) {
          for (let j = shieldCars.length - 1; j >= 0; j--) {
            const s = shieldCars[j];
            if (m.ownerId !== s.ownerId) {
              if (
                m.x < s.x + s.width &&
                m.x + m.width > s.x &&
                m.y < s.y + s.height &&
                m.y + m.height > s.y
              ) {
                createExplosion(s.x + s.width/2, s.y + s.height/2, '#475569', true);
                shieldCars.splice(j, 1);
                missiles.splice(i, 1);
                break;
              }
            }
          }
        }

        // Collision with other missiles
        if (m) {
          for (let j = missiles.length - 1; j >= 0; j--) {
            if (i === j) continue;
            const otherM = missiles[j];
            if (m.ownerId !== otherM.ownerId) {
              if (
                m.x < otherM.x + otherM.width &&
                m.x + m.width > otherM.x &&
                m.y < otherM.y + otherM.height &&
                m.y + m.height > otherM.y
              ) {
                createExplosion(m.x + m.width / 2, m.y + m.height / 2, m.color, true);
                createExplosion(otherM.x + otherM.width / 2, otherM.y + otherM.height / 2, otherM.color, true);
                missiles.splice(Math.max(i, j), 1);
                missiles.splice(Math.min(i, j), 1);
                break;
              }
            }
          }
        }

        if (m && (m.x > canvas.width + 100 || m.x < -1000 || m.y < -100 || m.y > canvas.height + 100)) {
          missiles.splice(i, 1);
        }
      }

      if (shake > 0) {
        shake *= 0.9;
        if (shake < 0.1) shake = 0;
      }
    };

    const draw = () => {
      ctx.save();
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }

      // Background based on world
      if (world === 1) {
        ctx.fillStyle = '#0f172a'; // Deep blue for city
      } else if (world === 2) {
        ctx.fillStyle = '#451a03'; // Deep orange/brown for desert
      } else if (world === 3) {
        ctx.fillStyle = '#e0f2fe'; // Light blue for ice world
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road
      if (world === 1) {
        ctx.fillStyle = '#1e293b';
      } else if (world === 2) {
        ctx.fillStyle = '#78350f';
      } else if (world === 3) {
        ctx.fillStyle = '#f8fafc'; // White/Ice road
      }
      ctx.fillRect(0, 20, canvas.width, canvas.height - 40);

      // Road Lines
      if (world === 1) {
        ctx.strokeStyle = '#334155';
      } else if (world === 2) {
        ctx.strokeStyle = '#92400e';
      } else if (world === 3) {
        ctx.strokeStyle = '#bae6fd'; // Light blue lines
      }
      ctx.lineWidth = 4;
      ctx.setLineDash([40, 40]);
      ctx.lineDashOffset = -roadOffset * 4; // Even faster effect
      
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 3);
      ctx.lineTo(canvas.width, canvas.height / 3);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, (canvas.height / 3) * 2);
      ctx.lineTo(canvas.width, (canvas.height / 3) * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;

      // Neon Edges
      ctx.shadowBlur = 15;
      if (world === 1) {
        ctx.shadowColor = '#2dd4bf';
        ctx.fillStyle = '#2dd4bf';
      } else if (world === 2) {
        ctx.shadowColor = '#f59e0b';
        ctx.fillStyle = '#f59e0b';
      } else if (world === 3) {
        ctx.shadowColor = '#38bdf8';
        ctx.fillStyle = '#38bdf8';
      }
      ctx.fillRect(0, 18, canvas.width, 4);
      ctx.fillRect(0, canvas.height - 22, canvas.width, 4);
      ctx.shadowBlur = 0;

      const showFinishLine = (mode === 'levels' && (world === 2 || (world === 1 && level === 10))) || mode === 'multiplayer';
      if (showFinishLine) {
        const leaderDist = mode === 'multiplayer' ? Math.max(distance, distance2) : distance;
        const finishX = 100 + (targetDistance - leaderDist) * 15;
        if (finishX < canvas.width + 500 && finishX > -500) {
          ctx.fillStyle = '#fff';
          for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 5; j++) {
              if ((i + j) % 2 === 0) {
                ctx.fillRect(finishX + j * 10, 20 + i * (canvas.height - 40) / 10, 10, (canvas.height - 40) / 10);
              }
            }
          }
        }
      }

      coins.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(e.x + 10, e.y + 5, 15, e.height - 10);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x + 2, e.y + 2, 4, 8);
        ctx.fillRect(e.x + 2, e.y + e.height - 10, 4, 8);
      });

      rivals.forEach(r => {
        ctx.save();
        ctx.fillStyle = r.color;
        ctx.fillRect(r.x, r.y, r.width, r.height);
        
        // Windows
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(r.x + 40, r.y + 5, 15, r.height - 10);
        
        // Headlights (facing right)
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(r.x + r.width - 6, r.y + 2, 4, 8);
        ctx.fillRect(r.x + r.width - 6, r.y + r.height - 10, 4, 8);
        ctx.restore();
      });

      const drawPlayer = (p: any, c: Car, d: Driver, active: boolean) => {
        ctx.save();
        if (p.isInvincible && Math.floor(performance.now() / 100) % 2 === 0) {
          ctx.globalAlpha = 0.5;
        }
        
        if (p.abilityTimer > 0) {
          ctx.shadowBlur = 20;
          if (d.id === 'racer') ctx.shadowColor = '#3b82f6';
          if (d.id === 'rookie') ctx.shadowColor = '#eab308';
          if (d.id === 'bruiser') ctx.shadowColor = '#ef4444';
          if (d.id === 'collector') ctx.shadowColor = '#a855f7';
          if (d.id === 'maruto') ctx.shadowColor = '#94a3b8';
          if (d.id === 'ghost') ctx.shadowColor = '#ffffff';
          if (d.id === 'tech') ctx.shadowColor = '#2dd4bf';
          if (d.id === 'overlord') ctx.shadowColor = '#f97316';
          if (d.id === 'kalleb') ctx.shadowColor = '#eab308';
        }

        const isPrimeGodMode = d.id === 'prime' && active;
        const carColor = isPrimeGodMode ? '#ffffff' : c.color;
        const headlightColor = isPrimeGodMode ? '#38bdf8' : '#fef08a';

        ctx.fillStyle = carColor;
        if (d.id === 'ghost' && p.abilityTimer > 0) ctx.globalAlpha = 0.3;

        // Unique Designs for World 3
        if (c.id === 'frost') {
          // Sharp, crystalline wedge with multiple ice shards
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + p.height / 2);
          ctx.lineTo(p.x + p.width * 0.3, p.y);
          ctx.lineTo(p.x + p.width * 0.6, p.y + p.height * 0.2);
          ctx.lineTo(p.x + p.width, p.y);
          ctx.lineTo(p.x + p.width * 0.8, p.y + p.height / 2);
          ctx.lineTo(p.x + p.width, p.y + p.height);
          ctx.lineTo(p.x + p.width * 0.6, p.y + p.height * 0.8);
          ctx.lineTo(p.x + p.width * 0.3, p.y + p.height);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Shard details
          ctx.beginPath();
          ctx.moveTo(p.x + p.width * 0.2, p.y + p.height / 2);
          ctx.lineTo(p.x + p.width * 0.5, p.y + p.height / 2);
          ctx.stroke();
        } else if (c.id === 'glacier') {
          ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(p.x + 10, p.y);
          ctx.lineTo(p.x + 20, p.y - 5);
          ctx.lineTo(p.x + 30, p.y);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(p.x + 40, p.y + p.height);
          ctx.lineTo(p.x + 50, p.y + p.height + 5);
          ctx.lineTo(p.x + 60, p.y + p.height);
          ctx.fill();
          ctx.fillStyle = carColor;
        } else if (c.id === 'blizzard') {
          // Swirling, asymmetrical vortex shape with dynamic wind trails
          ctx.save();
          ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
          ctx.rotate(Date.now() * 0.005);
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const r = (p.width / 2) * (0.8 + Math.sin(Date.now() * 0.01 + i) * 0.2);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath();
          ctx.moveTo(p.x - 10, p.y + p.height / 2);
          ctx.lineTo(p.x + p.width + 10, p.y + p.height / 2);
          ctx.stroke();
        } else if (c.id === 'tundra') {
          // Heavy, wide tank-like design with reinforced front
          ctx.fillRect(p.x, p.y + 2, p.width, p.height - 4);
          ctx.fillStyle = '#334155';
          ctx.fillRect(p.x, p.y - 4, p.width, 6); // Top tread
          ctx.fillRect(p.x, p.y + p.height - 2, p.width, 6); // Bottom tread
          ctx.fillStyle = carColor;
          ctx.fillRect(p.x + p.width - 10, p.y - 2, 10, p.height + 4); // Heavy bumper
        } else if (c.id === 'avalanche') {
          // Massive, tiered structure like a heavy snow-plow
          ctx.fillRect(p.x, p.y + p.height * 0.2, p.width * 0.6, p.height * 0.6);
          ctx.beginPath();
          ctx.moveTo(p.x + p.width * 0.6, p.y);
          ctx.lineTo(p.x + p.width, p.y + p.height / 2);
          ctx.lineTo(p.x + p.width * 0.6, p.y + p.height);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(p.x + p.width * 0.2, p.y + p.height * 0.3, p.width * 0.3, p.height * 0.4);
          ctx.fillStyle = carColor;
        } else if (c.id === 'aurora') {
          // Sleek, flowing organic shape with shifting colors
          const gradient = ctx.createLinearGradient(p.x, p.y, p.x + p.width, p.y + p.height);
          gradient.addColorStop(0, carColor);
          gradient.addColorStop(0.5, '#4ade80');
          gradient.addColorStop(1, '#2dd4bf');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + p.height / 2);
          ctx.bezierCurveTo(p.x + p.width * 0.2, p.y - 10, p.x + p.width * 0.8, p.y - 10, p.x + p.width, p.y + p.height / 2);
          ctx.bezierCurveTo(p.x + p.width * 0.8, p.y + p.height + 10, p.x + p.width * 0.2, p.y + p.height + 10, p.x, p.y + p.height / 2);
          ctx.fill();
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#4ade80';
        } else if (c.id === 'crystal') {
          // Cluster of crystals with internal pulsing glow
          const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
          ctx.globalAlpha = pulse;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const ox = i * 15;
            ctx.moveTo(p.x + ox, p.y + p.height / 2);
            ctx.lineTo(p.x + ox + 20, p.y);
            ctx.lineTo(p.x + ox + 40, p.y + p.height / 2);
            ctx.lineTo(p.x + ox + 20, p.y + p.height);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        } else if (c.id === 'borealis') {
          // Ethereal, flowing wave shape with multiple layers
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + p.height / 2);
          for (let i = 0; i <= p.width; i += 2) {
            ctx.lineTo(p.x + i, p.y + p.height / 2 + Math.sin(i * 0.15 + Date.now() * 0.01) * 12);
          }
          ctx.lineTo(p.x + p.width, p.y + p.height);
          ctx.lineTo(p.x, p.y + p.height);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + p.height / 2);
          for (let i = 0; i <= p.width; i += 2) {
            ctx.lineTo(p.x + i, p.y + p.height / 2 - Math.sin(i * 0.15 + Date.now() * 0.01) * 12);
          }
          ctx.lineTo(p.x + p.width, p.y);
          ctx.lineTo(p.x, p.y);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          ctx.fillRect(p.x, p.y, p.width, p.height);
        }

        ctx.globalAlpha = 1;
        
        ctx.shadowBlur = 0;
        if (c.id !== 'blizzard' && c.id !== 'frost' && c.id !== 'borealis') {
          ctx.fillStyle = c.id === 'phantom' ? '#334155' : '#94a3b8';
          ctx.fillRect(p.x + 40, p.y + 5, 15, p.height - 10);
        }
        ctx.fillStyle = headlightColor;
        ctx.fillRect(p.x + p.width - 6, p.y + 2, 4, 8);
        ctx.fillRect(p.x + p.width - 6, p.y + p.height - 10, 4, 8);
        ctx.restore();
      };

      drawPlayer(player, car, driver, abilityActive);
      if (player2 && car2 && driver2) {
        drawPlayer(player2, car2, driver2, abilityActive2);
      }

      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (p.glow) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      shieldCars.forEach(s => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(s.x, s.y, s.width, s.height);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x, s.y, s.width, s.height);
        
        // Windows
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(s.x + 40, s.y + 5, 15, s.height - 10);
      });

      shurikens.forEach(s => {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.moveTo(0, 0);
          ctx.lineTo(s.radius, 0);
          ctx.lineTo(0, s.radius / 3);
        }
        ctx.fill();
        ctx.restore();
      });

      missiles.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        if (m.isVazioRoxo) {
          // Purple ball
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#a855f7';
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(m.width / 2, m.height / 2, m.width / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(m.width / 2, m.height / 2, m.width / 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const angle = Math.atan2(m.vy, m.vx);
          ctx.rotate(angle);
          ctx.fillStyle = m.color;
          ctx.fillRect(0, 0, m.width, m.height);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(-10, 2, 10, 6);
        }
        ctx.restore();
      });

      ctx.globalAlpha = 1;
      ctx.restore();

      if (countdown > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 80px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2 + 30);
      }
    };

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      update(dt);
      draw();
      animationId = requestAnimationFrame(loop);
    };

    const handleKeyDown = (e: KeyboardEvent) => { 
      keys[e.key] = true; 
      if (e.key === 'Escape' && mode !== 'multiplayer') {
        setIsPaused(prev => !prev);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

      if (
        mouseX >= player.x &&
        mouseX <= player.x + player.width &&
        mouseY >= player.y &&
        mouseY <= player.y + player.height
      ) {
        isDragging = true;
        dragOffsetY = mouseY - player.y;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
        player.y = mouseY - dragOffsetY;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mouseX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (touch.clientY - rect.top) * (canvas.height / rect.height);

        if (
          mouseX >= player.x &&
          mouseX <= player.x + player.width &&
          mouseY >= player.y &&
          mouseY <= player.y + player.height
        ) {
          isDragging = true;
          dragOffsetY = mouseY - player.y;
          e.preventDefault();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mouseY = (touch.clientY - rect.top) * (canvas.height / rect.height);
        player.y = mouseY - dragOffsetY;
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    animationId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationId);
    };
  }, [car, driver, car2, driver2, onGameOver, mode, level, targetDistance, dimensions]);

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full">
        
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Jogador 1</div>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full ${i < health ? 'bg-red-500' : 'bg-slate-700'} border border-white/20`} />
              ))}
            </div>
          </div>

          {car2 && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Jogador 2</div>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full ${i < health2 ? 'bg-red-500' : 'bg-slate-700'} border border-white/20`} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-2">
            <div className="text-xl font-black italic text-yellow-400 drop-shadow-md tracking-tighter">COINS: {coinsCollected}</div>
            <div className="text-sm font-bold text-white/70 drop-shadow-md">
              {mode === 'levels' || mode === 'multiplayer' ? `${mode === 'levels' ? `NÍVEL ${level}` : 'CORRIDA'} - ${score}/${targetDistance}m` : `${score}m`}
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-4">
          <div className="flex flex-col items-end">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">P1: {driver.abilityName}</div>
            <div className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-tighter ${abilityActive ? 'bg-yellow-500 text-black animate-pulse' : abilityReady ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
              {abilityActive ? 'ATIVO!' : abilityReady ? 'ESPAÇO' : 'RECARREGANDO'}
            </div>
          </div>

          {driver2 && (
            <div className="flex flex-col items-end">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">P2: {driver2.abilityName}</div>
              <div className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-tighter ${abilityActive2 ? 'bg-yellow-500 text-black animate-pulse' : abilityReady2 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                {abilityActive2 ? 'ATIVO!' : abilityReady2 ? 'ENTER' : 'RECARREGANDO'}
              </div>
            </div>
          )}
        </div>

        <canvas
          ref={canvasRef}
          className="w-full h-full bg-slate-800"
        />
        
        {(mode === 'levels' || mode === 'multiplayer') && (
          <div className="absolute bottom-4 left-4 right-4 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="h-full bg-purple-500 transition-all duration-300" 
              style={{ width: `${Math.min(100, (score / targetDistance) * 100)}%` }} 
            />
          </div>
        )}

      </div>
    </div>
  );
}
