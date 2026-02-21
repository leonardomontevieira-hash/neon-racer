import React, { useEffect, useRef, useState } from 'react';
import { Car, Driver } from '../types';
import { BASE_LEVEL_DISTANCE, LEVEL_DISTANCE_INCREMENT } from '../constants';

interface GameProps {
  car: Car;
  driver: Driver;
  mode: 'infinite' | 'levels';
  world?: number;
  level?: number;
  onGameOver: (coins: number, score: number, stars?: number, victory?: boolean) => void;
}

export default function Game({ car, driver, mode, world = 1, level, onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [abilityReady, setAbilityReady] = useState(true);
  const [abilityActive, setAbilityActive] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [health, setHealth] = useState(3);

  const worldOffset = (world - 1) * 500;
  const targetDistance = mode === 'levels' && level ? worldOffset + BASE_LEVEL_DISTANCE + (level - 1) * LEVEL_DISTANCE_INCREMENT : Infinity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();
    let keys: { [key: string]: boolean } = {};

    const isRaceMode = mode === 'levels' && (world === 2 || (world === 1 && level === 10));
    const player = {
      x: 100,
      y: isRaceMode ? 30 : canvas.height / 2 - 20, // Start in lane 1 if racing
      width: 70,
      height: 40,
      baseSpeedX: car.speed * 1.5,
      abilityTimer: 0,
      abilityCooldown: 0,
      isInvincible: false,
      isMagnet: false,
      isBulldozer: false,
      isTimeHacked: false,
      isTimeStopped: false,
      isEMPActive: false,
    };

    const enemies: any[] = [];
    const coins: any[] = [];
    const particles: any[] = [];
    const shurikens: any[] = [];
    const missiles: any[] = [];
    let roadOffset = 0;
    let distance = 0;
    let sessionCoins = 0;
    let currentHealth = 3;
    let finished = false;
    let shake = 0;
    let countdown = isRaceMode ? 3 : 0;
    let countdownTimer = 1000;

    const rivals: any[] = [];
    const levelDifficulty = (world - 1) * 10 + level;
    const baseRivalSpeed = 2.5 + (levelDifficulty * 0.4); // Adjusted for better progression

    if (isRaceMode) {
      const rivalCount = world === 1 ? 1 : 5;
      for (let i = 0; i < rivalCount; i++) {
        rivals.push({
          id: `rival-${i}`,
          x: 100,
          y: world === 1 ? 330 : 90 + i * 60,
          width: 70,
          height: 40,
          speedY: Math.random() * 2 + 1,
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
      const width = 70;
      const height = 40;
      const y = Math.random() * (canvas.height - height - 40) + 20;
      const speed = baseRivalSpeed * 0.8 + Math.random() * 2;
      enemies.push({ x: canvas.width + width, y, width, height, speed, color: `hsl(${Math.random() * 360}, 70%, 50%)` });
    };

    const spawnCoin = () => {
      if (finished || isRaceMode) return;
      const y = Math.random() * (canvas.height - 60) + 30;
      coins.push({ x: canvas.width + 20, y, radius: 10, collected: false });
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

    const update = (dt: number) => {
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
        if (player.x > canvas.width + 100) {
          onGameOver(sessionCoins, Math.floor(distance), currentHealth, true);
        }
        return;
      }

      const moveSpeed = car.handling * 1.2;
      if (keys['ArrowUp'] || keys['w']) player.y -= moveSpeed;
      if (keys['ArrowDown'] || keys['s']) player.y += moveSpeed;

      if (player.y < 20) player.y = 20;
      if (player.y > canvas.height - player.height - 20) player.y = canvas.height - player.height - 20;

      if (keys[' '] && player.abilityCooldown <= 0) {
        if (driver.id === 'maruto') {
          shurikens.push({
            x: player.x + player.width,
            y: player.y + player.height / 2,
            radius: 15,
            speed: 15,
            rotation: 0
          });
          player.abilityTimer = 500;
        } else if (driver.id === 'overlord') {
          enemies.forEach(e => createExplosion(e.x + e.width/2, e.y + e.height/2, e.color, true));
          enemies.length = 0;
          player.abilityTimer = 1000;
        } else if (driver.id === 'nees' || driver.id === 'mender') {
          const healAmount = driver.id === 'mender' ? 3 : 1;
          if (currentHealth < 3) {
            currentHealth = Math.min(3, currentHealth + healAmount);
            setHealth(currentHealth);
            createExplosion(player.x + player.width/2, player.y + player.height/2, '#4ade80', false);
            player.abilityTimer = 500;
          } else {
            return;
          }
        } else if (driver.id === 'kalleb') {
          const targets = [...enemies]
            .filter(e => e.x > player.x)
            .sort((a, b) => {
              const distA = Math.sqrt(Math.pow(a.x - player.x, 2) + Math.pow(a.y - player.y, 2));
              const distB = Math.sqrt(Math.pow(b.x - player.x, 2) + Math.pow(b.y - player.y, 2));
              return distA - distB;
            })
            .slice(0, 3);

          targets.forEach((target, i) => {
            missiles.push({
              x: player.x + player.width,
              y: player.y + player.height / 2,
              target: target,
              speed: 6,
              vx: 5,
              vy: (i - 1) * 2,
              width: 20,
              height: 10,
              color: '#f87171'
            });
          });
          player.abilityTimer = 500;
        } else {
          player.abilityTimer = driver.id === 'racer' ? 2000 : 
                               driver.id === 'rookie' ? 3000 : 
                               driver.id === 'ghost' ? 5000 : 
                               driver.id === 'chrono' ? 3000 :
                               driver.id === 'stellar' ? 8000 :
                               driver.id === 'prime' ? 10000 : 5000;
        }
        player.abilityCooldown = 10000;
        setAbilityReady(false);
        setAbilityActive(true);
      }

      let currentSpeedX = player.baseSpeedX;
      player.isInvincible = false;
      player.isMagnet = false;
      player.isBulldozer = false;
      player.isTimeHacked = false;
      player.isTimeStopped = false;
      player.isEMPActive = false;

      if (player.abilityTimer > 0) {
        player.abilityTimer -= dt;
        if (driver.id === 'racer') {
          currentSpeedX *= 2.5;
          player.isInvincible = true;
        } else if (driver.id === 'rookie' || driver.id === 'ghost' || driver.id === 'stellar' || driver.id === 'prime') {
          player.isInvincible = true;
          if (driver.id === 'stellar') currentSpeedX *= 3;
          if (driver.id === 'prime') {
            currentSpeedX *= 2.5;
            player.isMagnet = true;
          }
        } else if (driver.id === 'bruiser') {
          player.isBulldozer = true;
        } else if (driver.id === 'collector') {
          player.isMagnet = true;
        } else if (driver.id === 'tech') {
          player.isTimeHacked = true;
        } else if (driver.id === 'chrono') {
          player.isTimeStopped = true;
        }
        if (player.abilityTimer <= 0) setAbilityActive(false);
      }

      if (player.abilityCooldown > 0) {
        player.abilityCooldown -= dt;
        if (player.abilityCooldown <= 0) setAbilityReady(true);
      }

      const roadSpeed = (currentSpeedX * 2) * (player.isTimeHacked ? 0.5 : 1);
      roadOffset = (roadOffset - roadSpeed) % 40;
      distance += roadSpeed / 100;
      setScore(Math.floor(distance));

      if (mode === 'levels' && distance >= targetDistance) {
        if (!finished) {
          finished = true;
          onGameOver(sessionCoins, Math.floor(distance), currentHealth, true);
        }
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
        const enemySpeed = player.isTimeStopped ? 0 : e.speed;
        e.x -= (roadSpeed + enemySpeed) * (player.isTimeHacked ? 0.5 : 1);
        
        if (
          player.x < e.x + e.width &&
          player.x + player.width > e.x &&
          player.y < e.y + e.height &&
          player.y + player.height > e.y
        ) {
          if (player.isBulldozer) {
            createExplosion(e.x + e.width/2, e.y + e.height/2, e.color, true);
            enemies.splice(i, 1);
            continue;
          } else if (!player.isInvincible) {
            if (car.id === 'kaiser') {
              player.baseSpeedX += 0.5;
            }
            currentHealth -= 1;
            setHealth(currentHealth);
            createExplosion(player.x + player.width/2, player.y + player.height/2, '#ff0000', true);
            enemies.splice(i, 1);
            
            player.isInvincible = true;
            player.abilityTimer = 1000;
            
            if (currentHealth <= 0) {
              onGameOver(sessionCoins, Math.floor(distance), 0, false);
              return;
            }
            continue;
          }
        }

        if (e.x < -e.width) enemies.splice(i, 1);
      }

      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        
        if (player.isMagnet) {
          const dx = (player.x + player.width/2) - c.x;
          const dy = (player.y + player.height/2) - c.y;
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

        const px = player.x + player.width/2;
        const py = player.y + player.height/2;
        const dx = px - c.x;
        const dy = py - c.y;
        if (Math.sqrt(dx*dx + dy*dy) < c.radius + player.height/2) {
          sessionCoins++;
          setCoinsCollected(sessionCoins);
          coins.splice(i, 1);
          // Small shake on coin collect
          shake = Math.max(shake, 2);
          continue;
        }

        if (c.x < -20) coins.splice(i, 1);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt / 800;
        if (p.life <= 0) particles.splice(i, 1);
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
        if (s && s.x > canvas.width + 50) shurikens.splice(i, 1);
      }

      for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];
        
        // Homing logic
        if (m.target && enemies.includes(m.target)) {
          const dx = m.target.x + m.target.width/2 - m.x;
          const dy = m.target.y + m.target.height/2 - m.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 5) {
            m.vx += (dx / dist) * 0.5;
            m.vy += (dy / dist) * 0.5;
          }
        } else {
          // If target is gone, find new one or just go straight
          const nextTarget = enemies.find(e => e.x > m.x);
          if (nextTarget) m.target = nextTarget;
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

        // Collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (
            m.x < e.x + e.width &&
            m.x + m.width > e.x &&
            m.y < e.y + e.height &&
            m.y + m.height > e.y
          ) {
            // Overlord explosion effect (big and powerful)
            createExplosion(e.x + e.width/2, e.y + e.height/2, e.color, true);
            enemies.splice(j, 1);
            missiles.splice(i, 1);
            break;
          }
        }

        if (m && (m.x > canvas.width + 100 || m.x < -100 || m.y < -100 || m.y > canvas.height + 100)) {
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
      } else {
        ctx.fillStyle = '#451a03'; // Deep orange/brown for desert
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road
      ctx.fillStyle = world === 1 ? '#1e293b' : '#78350f';
      ctx.fillRect(0, 20, canvas.width, canvas.height - 40);

      // Road Lines
      ctx.strokeStyle = world === 1 ? '#334155' : '#92400e';
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -roadOffset;
      
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
      ctx.shadowColor = world === 1 ? '#2dd4bf' : '#f59e0b';
      ctx.fillStyle = world === 1 ? '#2dd4bf' : '#f59e0b';
      ctx.fillRect(0, 18, canvas.width, 4);
      ctx.fillRect(0, canvas.height - 22, canvas.width, 4);
      ctx.shadowBlur = 0;

      const showFinishLine = mode === 'levels' && (world === 2 || (world === 1 && level === 10));
      if (showFinishLine) {
        const finishX = 100 + (targetDistance - distance) * 15;
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

      ctx.save();
      if (player.isInvincible && Math.floor(performance.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      
      if (player.abilityTimer > 0) {
        ctx.shadowBlur = 20;
        if (driver.id === 'racer') ctx.shadowColor = '#3b82f6';
        if (driver.id === 'rookie') ctx.shadowColor = '#eab308';
        if (driver.id === 'bruiser') ctx.shadowColor = '#ef4444';
        if (driver.id === 'collector') ctx.shadowColor = '#a855f7';
        if (driver.id === 'maruto') ctx.shadowColor = '#94a3b8';
        if (driver.id === 'ghost') ctx.shadowColor = '#ffffff';
        if (driver.id === 'tech') ctx.shadowColor = '#2dd4bf';
        if (driver.id === 'overlord') ctx.shadowColor = '#f97316';
      }

      const isPrimeGodMode = driver.id === 'prime' && abilityActive;
      const carColor = isPrimeGodMode ? '#ffffff' : car.color;
      const headlightColor = isPrimeGodMode ? '#38bdf8' : '#fef08a';

      ctx.fillStyle = carColor;
      if (driver.id === 'ghost' && player.abilityTimer > 0) ctx.globalAlpha = 0.3;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.globalAlpha = 1;
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = car.id === 'phantom' ? '#334155' : '#94a3b8';
      ctx.fillRect(player.x + 40, player.y + 5, 15, player.height - 10);
      ctx.fillStyle = headlightColor;
      ctx.fillRect(player.x + player.width - 6, player.y + 2, 4, 8);
      ctx.fillRect(player.x + player.width - 6, player.y + player.height - 10, 4, 8);
      ctx.restore();

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
        const angle = Math.atan2(m.vy, m.vx);
        ctx.rotate(angle);
        ctx.fillStyle = m.color;
        ctx.fillRect(0, 0, m.width, m.height);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-10, 2, 10, 6);
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

    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    animationId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [car, driver, onGameOver, mode, level, targetDistance]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-slate-900 text-white font-sans p-4">
      <div className="w-full max-w-4xl relative">
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <div className="text-2xl font-bold text-yellow-400 drop-shadow-md">Moedas: {coinsCollected}</div>
          <div className="text-xl font-bold text-white drop-shadow-md">
            {mode === 'levels' ? `Nível ${level} - ${score}/${targetDistance}m` : `Distância: ${score}m`}
          </div>
          <div className="flex gap-1 mt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-6 h-6 rounded-full ${i < health ? 'bg-red-500' : 'bg-slate-700'} border-2 border-white`} />
            ))}
          </div>
        </div>

        <div className="absolute top-4 right-4 z-10 flex flex-col items-end">
          <div className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-1">Habilidade: {driver.abilityName}</div>
          <div className={`px-4 py-2 rounded-lg font-bold ${abilityActive ? 'bg-yellow-500 text-black animate-pulse' : abilityReady ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
            {abilityActive ? 'ATIVO!' : abilityReady ? 'PRONTO (ESPAÇO)' : 'RECARREGANDO...'}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full aspect-[2/1] rounded-xl shadow-2xl border-4 border-slate-700 bg-slate-800"
        />
        
        {mode === 'levels' && (
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
