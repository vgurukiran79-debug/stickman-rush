/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, GROUND_Y } from './constants.ts';

export type WeatherType = 'CLEAR' | 'CYBER_RAIN' | 'NEON_SNOW';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
}

interface Building {
  x: number;
  width: number;
  height: number;
  hasAntenna: boolean;
  windowRows: number;
  windowCols: number;
  color: string;
}

interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  size: number;
  alpha: number;
  seed: number;
  splashTimer: number;
  splashX: number;
}

export class WorldRenderer {
  private stars: Star[] = [];
  private farMountainOffset: number = 0;
  private midSkylineOffset: number = 0;
  private trackOffset: number = 0;
  private buildings: Building[] = [];
  private screenShakeTime: number = 0;
  private screenShakeIntensity: number = 0;

  // Particle-based weather system
  private weatherParticles: WeatherParticle[] = [];
  private currentWeather: WeatherType = 'CLEAR';
  private targetWeather: WeatherType = 'CYBER_RAIN';
  private weatherTimer: number = 16; // First weather shift occurs after 16s
  private weatherAlpha: number = 0; // Smooth 0 -> 1 fade

  constructor() {
    this.initStars();
    this.initBuildings();
    this.initWeatherParticles();
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * VIRTUAL_WIDTH,
        y: Math.random() * (GROUND_Y - 140),
        size: 1 + Math.random() * 1.8,
        baseAlpha: 0.3 + Math.random() * 0.6,
        twinkleSpeed: 1 + Math.random() * 3,
      });
    }
  }

  private initBuildings() {
    this.buildings = [];
    let currentX = 0;
    while (currentX < VIRTUAL_WIDTH * 2.5) {
      const width = 60 + Math.random() * 90;
      const height = 120 + Math.random() * 180;
      this.buildings.push({
        x: currentX,
        width,
        height,
        hasAntenna: Math.random() > 0.6,
        windowRows: Math.floor(height / 24),
        windowCols: Math.floor(width / 20),
        color: Math.random() > 0.5 ? '#111827' : '#0F172A',
      });
      currentX += width + 10 + Math.random() * 20;
    }
  }

  private initWeatherParticles() {
    this.weatherParticles = [];
    const count = 110;
    for (let i = 0; i < count; i++) {
      this.weatherParticles.push({
        x: Math.random() * (VIRTUAL_WIDTH + 240) - 40,
        y: Math.random() * (GROUND_Y + 40) - 40,
        vx: -60 - Math.random() * 80,
        vy: 550 + Math.random() * 220,
        length: 16 + Math.random() * 14,
        size: 1.5 + Math.random() * 2,
        alpha: 0.4 + Math.random() * 0.5,
        seed: Math.random() * 100,
        splashTimer: 0,
        splashX: 0,
      });
    }
  }

  public triggerScreenShake(intensity: number = 10, duration: number = 0.35) {
    this.screenShakeIntensity = intensity;
    this.screenShakeTime = duration;
  }

  public getWeather(): WeatherType {
    return this.currentWeather;
  }

  public update(dt: number, speed: number) {
    // Parallax scrolling
    this.farMountainOffset = (this.farMountainOffset + speed * 0.08 * dt) % VIRTUAL_WIDTH;
    this.midSkylineOffset = (this.midSkylineOffset + speed * 0.32 * dt) % (VIRTUAL_WIDTH * 1.5);
    this.trackOffset = (this.trackOffset + speed * dt) % 40;

    // Shake countdown
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
      if (this.screenShakeTime <= 0) {
        this.screenShakeIntensity = 0;
      }
    }

    // Weather transition logic (randomly toggles during gameplay)
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      if (this.currentWeather === 'CLEAR') {
        // Toggle to weather: 60% chance cyber rain, 40% neon snow
        this.currentWeather = Math.random() < 0.6 ? 'CYBER_RAIN' : 'NEON_SNOW';
        this.weatherTimer = 22 + Math.random() * 14; // Duration 22-36s
      } else {
        // Return to clear
        this.currentWeather = 'CLEAR';
        this.weatherTimer = 18 + Math.random() * 12; // Clear period 18-30s
      }
    }

    // Smooth weather fade in/out
    if (this.currentWeather !== 'CLEAR') {
      this.weatherAlpha = Math.min(1, this.weatherAlpha + dt * 0.6);
    } else {
      this.weatherAlpha = Math.max(0, this.weatherAlpha - dt * 0.5);
    }

    // Update weather particles if visible
    if (this.weatherAlpha > 0.01) {
      this.updateWeatherParticles(dt, speed);
    }
  }

  private updateWeatherParticles(dt: number, speed: number) {
    const isRain = this.currentWeather === 'CYBER_RAIN' || (this.currentWeather === 'CLEAR' && this.weatherAlpha > 0);

    for (let i = 0; i < this.weatherParticles.length; i++) {
      const p = this.weatherParticles[i];

      // Update splash if active
      if (p.splashTimer > 0) {
        p.splashTimer -= dt;
      }

      if (isRain) {
        // Cyber Rain physics: high vertical speed with speed-dependent slant
        p.y += p.vy * dt;
        p.x += (p.vx - speed * 0.42) * dt;

        // Ground collision & splash
        if (p.y >= GROUND_Y) {
          p.splashTimer = 0.16;
          p.splashX = p.x;
          // Respawn at top
          p.y = -20 - Math.random() * 40;
          p.x = Math.random() * (VIRTUAL_WIDTH + 260) - 20;
        }

        // Horizontal wrap
        if (p.x < -60) {
          p.x = VIRTUAL_WIDTH + Math.random() * 100;
          p.y = -10 - Math.random() * 30;
        }
      } else {
        // Neon Snow physics: gentle drift with harmonic sway
        p.y += (65 + (p.seed % 40)) * dt;
        p.x += (-speed * 0.22 + Math.sin(p.y * 0.015 + p.seed) * 22) * dt;

        if (p.y >= GROUND_Y + 12) {
          p.y = -10;
          p.x = Math.random() * (VIRTUAL_WIDTH + 140) - 20;
        }

        if (p.x < -40) {
          p.x = VIRTUAL_WIDTH + Math.random() * 60;
          p.y = Math.random() * (GROUND_Y * 0.7);
        }
      }
    }
  }

  public beginFrame(ctx: CanvasRenderingContext2D, elapsed: number) {
    ctx.save();

    // Apply screen shake if active
    if (this.screenShakeIntensity > 0) {
      const decay = Math.max(0, this.screenShakeTime / 0.35);
      const shakeX = (Math.random() * 2 - 1) * this.screenShakeIntensity * decay;
      const shakeY = (Math.random() * 2 - 1) * this.screenShakeIntensity * decay;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Sky Gradient (deep navy to dark twilight purple)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    if (this.currentWeather === 'CYBER_RAIN' && this.weatherAlpha > 0.3) {
      // Slightly stormier cyan-tinted deep sky
      skyGrad.addColorStop(0, '#040714');
      skyGrad.addColorStop(0.5, '#07122E');
      skyGrad.addColorStop(1, '#12163A');
    } else if (this.currentWeather === 'NEON_SNOW' && this.weatherAlpha > 0.3) {
      // Aurora violet-tinted deep sky
      skyGrad.addColorStop(0, '#060517');
      skyGrad.addColorStop(0.5, '#120D2C');
      skyGrad.addColorStop(1, '#231342');
    } else {
      skyGrad.addColorStop(0, '#060814');
      skyGrad.addColorStop(0.5, '#0B0F2A');
      skyGrad.addColorStop(1, '#1A1438');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // 2. Stars
    for (const star of this.stars) {
      const alpha = (star.baseAlpha + Math.sin(elapsed * star.twinkleSpeed) * 0.25) * (1 - this.weatherAlpha * 0.5);
      if (alpha > 0.05) {
        ctx.fillStyle = `rgba(224, 231, 255, ${Math.max(0.05, Math.min(1, alpha))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Neon Moon in distance
    this.drawMoon(ctx);

    // 4. Distant Mountain Silhouettes (Layer 1 parallax)
    this.drawDistantMountains(ctx);

    // 5. Midground City Skyline (Layer 2 parallax)
    this.drawSkyline(ctx);

    // 6. Running Track & Ground
    this.drawGround(ctx);
  }

  public endFrame(ctx: CanvasRenderingContext2D, speed: number) {
    // 7. Render dynamic weather particles over the environment
    if (this.weatherAlpha > 0.01) {
      this.drawWeather(ctx, speed);
    }

    // 8. Draw subtle speed lines if running fast
    if (speed > 520) {
      this.drawSpeedLines(ctx, speed);
    }

    ctx.restore();
  }

  private drawWeather(ctx: CanvasRenderingContext2D, speed: number) {
    ctx.save();
    const isRain = this.currentWeather === 'CYBER_RAIN' || (this.currentWeather === 'CLEAR' && this.weatherAlpha > 0);

    if (isRain) {
      // Draw cyber rain streaks
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.48 * this.weatherAlpha})`;

      ctx.beginPath();
      const slantX = 6 + speed * 0.025;
      for (let i = 0; i < this.weatherParticles.length; i++) {
        const p = this.weatherParticles[i];
        if (p.y < GROUND_Y) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - slantX, p.y + p.length);
        }
      }
      ctx.stroke();

      // Draw splash ripples on the track
      ctx.fillStyle = `rgba(34, 211, 238, ${0.35 * this.weatherAlpha})`;
      for (let i = 0; i < this.weatherParticles.length; i++) {
        const p = this.weatherParticles[i];
        if (p.splashTimer > 0) {
          const splashProgress = 1 - p.splashTimer / 0.16;
          const radius = 2 + splashProgress * 4;
          ctx.beginPath();
          ctx.ellipse(p.splashX, GROUND_Y + 1, radius * 2, radius * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Draw neon snow / floating embers
      ctx.fillStyle = `rgba(192, 132, 252, ${0.72 * this.weatherAlpha})`;
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 6;

      for (let i = 0; i < this.weatherParticles.length; i++) {
        const p = this.weatherParticles[i];
        if (p.y < GROUND_Y + 6) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  private drawMoon(ctx: CanvasRenderingContext2D) {
    const moonX = VIRTUAL_WIDTH - 180;
    const moonY = 120;
    const radius = 48;

    ctx.save();
    // Atmospheric aura
    const moonGlow = ctx.createRadialGradient(moonX, moonY, radius * 0.4, moonX, moonY, radius * 2.2);
    moonGlow.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
    moonGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.12)');
    moonGlow.addColorStop(1, 'rgba(6, 8, 20, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    const moonBody = ctx.createLinearGradient(moonX - radius, moonY - radius, moonX + radius, moonY + radius);
    moonBody.addColorStop(0, '#E0E7FF');
    moonBody.addColorStop(1, '#A78BFA');
    ctx.fillStyle = moonBody;
    ctx.shadowColor = 'rgba(167, 139, 250, 0.8)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(moonX, moonY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Geometric neon orbit ring around moon
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(moonX, moonY, radius * 1.5, radius * 0.45, -0.28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawDistantMountains(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = '#0F172A';
    ctx.globalAlpha = 0.55;

    const baseHeight = GROUND_Y - 90;
    const segW = 160;

    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);

    for (let x = -segW; x <= VIRTUAL_WIDTH + segW; x += segW) {
      const peakX = x - (this.farMountainOffset % segW);
      const peakY = baseHeight - 35 - Math.sin((x + 100) * 0.015) * 45;
      ctx.lineTo(peakX, peakY);
      ctx.lineTo(peakX + segW / 2, baseHeight + 10);
    }

    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawSkyline(ctx: CanvasRenderingContext2D) {
    ctx.save();

    for (const b of this.buildings) {
      let drawX = b.x - this.midSkylineOffset;
      while (drawX < -b.width) {
        drawX += VIRTUAL_WIDTH * 2.5;
      }
      if (drawX > VIRTUAL_WIDTH) continue;

      const drawY = GROUND_Y - b.height;

      // Building silhouette
      ctx.fillStyle = '#111827';
      ctx.fillRect(drawX, drawY, b.width, b.height);

      // Rooftop edge light
      ctx.strokeStyle = '#312E81';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(drawX, drawY, b.width, b.height);

      // Antenna beacon
      if (b.hasAntenna) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(drawX + b.width / 2, drawY);
        ctx.lineTo(drawX + b.width / 2, drawY - 24);
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(drawX + b.width / 2, drawY - 24, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Windows
      for (let r = 1; r < b.windowRows - 1; r++) {
        for (let c = 1; c < b.windowCols; c++) {
          const winX = drawX + c * 18;
          const winY = drawY + r * 22;
          const isLit = ((r * 7 + c * 13) % 5) === 0;

          if (isLit) {
            ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(34, 211, 238, 0.4)' : 'rgba(245, 158, 11, 0.35)';
            ctx.fillRect(winX, winY, 6, 8);
          }
        }
      }
    }

    ctx.restore();
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. Underground gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, VIRTUAL_HEIGHT);
    groundGrad.addColorStop(0, '#0F172A');
    groundGrad.addColorStop(1, '#020617');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - GROUND_Y);

    // 2. Track Top Glowing Line
    ctx.shadowColor = '#06B6D4';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y);
    ctx.stroke();

    // Secondary violet under-line
    ctx.shadowColor = '#8B5CF6';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#A78BFA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 5);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y + 5);
    ctx.stroke();

    // 3. Scrolling Track Hashmarks
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
    const spacing = 40;
    for (let x = -spacing; x <= VIRTUAL_WIDTH + spacing; x += spacing) {
      const markX = x - this.trackOffset;
      ctx.fillRect(markX, GROUND_Y + 14, 20, 3);
    }

    // 4. Lower structural girders
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.lineWidth = 1.5;
    for (let x = -80; x <= VIRTUAL_WIDTH + 80; x += 80) {
      const girderX = x - (this.trackOffset * 2) % 80;
      ctx.beginPath();
      ctx.moveTo(girderX, GROUND_Y + 20);
      ctx.lineTo(girderX, VIRTUAL_HEIGHT);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawSpeedLines(ctx: CanvasRenderingContext2D, speed: number) {
    ctx.save();
    const count = Math.min(8, Math.floor((speed - 500) / 30));
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < count; i++) {
      const lineY = 80 + ((i * 57) % (GROUND_Y - 140));
      const lineLen = 60 + ((i * 31) % 120);
      const lineX = ((speed * 0.4 + i * 190) % (VIRTUAL_WIDTH + 300)) - 100;

      ctx.beginPath();
      ctx.moveTo(lineX, lineY);
      ctx.lineTo(lineX + lineLen, lineY);
      ctx.stroke();
    }
    ctx.restore();
  }
}
