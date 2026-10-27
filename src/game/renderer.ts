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

interface FarSpire {
  x: number;
  width: number;
  height: number;
  spireHeight: number;
  beaconColor: string;
}

interface MetropolisTower {
  x: number;
  width: number;
  height: number;
  antennaHeight: number;
  windowRows: number;
  windowCols: number;
  accentColor: string;
  hasHoloRing: boolean;
}

interface CyberDistrictBuilding {
  x: number;
  width: number;
  height: number;
  billboardText?: string;
  billboardColor: string;
  roofTrimColor: string;
}

interface AmbientMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
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
  private farSpires: FarSpire[] = [];
  private midTowers: MetropolisTower[] = [];
  private nearBuildings: CyberDistrictBuilding[] = [];
  private ambientMotes: AmbientMote[] = [];

  // Parallax offsets
  private farSpireOffset: number = 0;
  private midMetropolisOffset: number = 0;
  private nearDistrictOffset: number = 0;
  private transitOffset: number = 0;
  private trackOffset: number = 0;

  // Screen shake
  private screenShakeTime: number = 0;
  private screenShakeIntensity: number = 0;

  // Particle-based weather system
  private weatherParticles: WeatherParticle[] = [];
  private currentWeather: WeatherType = 'CLEAR';
  private weatherTimer: number = 18;
  private weatherAlpha: number = 0;

  // Transit train pulse
  private transitPulseX: number = -200;

  constructor() {
    this.initStars();
    this.initFarSpires();
    this.initMidTowers();
    this.initNearDistrict();
    this.initAmbientMotes();
    this.initWeatherParticles();
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 75; i++) {
      this.stars.push({
        x: Math.random() * VIRTUAL_WIDTH,
        y: Math.random() * (GROUND_Y - 160),
        size: 0.8 + Math.random() * 1.8,
        baseAlpha: 0.25 + Math.random() * 0.65,
        twinkleSpeed: 1 + Math.random() * 3,
      });
    }
  }

  private initFarSpires() {
    this.farSpires = [];
    let currentX = 0;
    while (currentX < VIRTUAL_WIDTH * 2.8) {
      const width = 80 + Math.random() * 110;
      const height = 180 + Math.random() * 220;
      this.farSpires.push({
        x: currentX,
        width,
        height,
        spireHeight: 30 + Math.random() * 60,
        beaconColor: Math.random() > 0.4 ? '#06B6D4' : '#EF4444',
      });
      currentX += width + 20 + Math.random() * 30;
    }
  }

  private initMidTowers() {
    this.midTowers = [];
    let currentX = 0;
    while (currentX < VIRTUAL_WIDTH * 2.6) {
      const width = 70 + Math.random() * 95;
      const height = 130 + Math.random() * 170;
      this.midTowers.push({
        x: currentX,
        width,
        height,
        antennaHeight: 18 + Math.random() * 26,
        windowRows: Math.floor(height / 20),
        windowCols: Math.floor(width / 18),
        accentColor: Math.random() > 0.5 ? '#06B6D4' : '#8B5CF6',
        hasHoloRing: Math.random() > 0.65,
      });
      currentX += width + 15 + Math.random() * 25;
    }
  }

  private initNearDistrict() {
    this.nearBuildings = [];
    const ads = ['RUSH', 'CYBER', 'NEON', 'OVERDRIVE', 'GRID', 'FLOW'];
    let currentX = 0;
    let adIdx = 0;

    while (currentX < VIRTUAL_WIDTH * 2.4) {
      const width = 65 + Math.random() * 85;
      const height = 80 + Math.random() * 110;
      const hasAd = Math.random() > 0.45;

      this.nearBuildings.push({
        x: currentX,
        width,
        height,
        billboardText: hasAd ? ads[adIdx++ % ads.length] : undefined,
        billboardColor: Math.random() > 0.5 ? '#22D3EE' : '#F43F5E',
        roofTrimColor: Math.random() > 0.5 ? '#8B5CF6' : '#06B6D4',
      });
      currentX += width + 18 + Math.random() * 30;
    }
  }

  private initAmbientMotes() {
    this.ambientMotes = [];
    for (let i = 0; i < 28; i++) {
      this.ambientMotes.push({
        x: Math.random() * VIRTUAL_WIDTH,
        y: 60 + Math.random() * (GROUND_Y - 100),
        vx: -20 - Math.random() * 40,
        vy: (Math.random() - 0.5) * 12,
        size: 1.2 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? '#22D3EE' : '#C084FC',
      });
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
    // Multi-tier parallax offsets
    this.farSpireOffset = (this.farSpireOffset + speed * 0.05 * dt) % (VIRTUAL_WIDTH * 1.5);
    this.midMetropolisOffset = (this.midMetropolisOffset + speed * 0.16 * dt) % (VIRTUAL_WIDTH * 1.6);
    this.nearDistrictOffset = (this.nearDistrictOffset + speed * 0.38 * dt) % (VIRTUAL_WIDTH * 1.8);
    this.transitOffset = (this.transitOffset + speed * 0.65 * dt) % 120;
    this.trackOffset = (this.trackOffset + speed * dt) % 48;

    // High-speed transit train pulse in background
    this.transitPulseX += (speed * 0.95 + 180) * dt;
    if (this.transitPulseX > VIRTUAL_WIDTH + 400) {
      this.transitPulseX = -300 - Math.random() * 600;
    }

    // Ambient floating energy motes
    for (const mote of this.ambientMotes) {
      mote.x += (mote.vx - speed * 0.2) * dt;
      mote.y += mote.vy * dt;
      if (mote.x < -20) {
        mote.x = VIRTUAL_WIDTH + Math.random() * 40;
        mote.y = 60 + Math.random() * (GROUND_Y - 100);
      }
    }

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
        this.currentWeather = Math.random() < 0.6 ? 'CYBER_RAIN' : 'NEON_SNOW';
        this.weatherTimer = 22 + Math.random() * 14;
      } else {
        this.currentWeather = 'CLEAR';
        this.weatherTimer = 18 + Math.random() * 12;
      }
    }

    // Smooth weather fade in/out
    if (this.currentWeather !== 'CLEAR') {
      this.weatherAlpha = Math.min(1, this.weatherAlpha + dt * 0.6);
    } else {
      this.weatherAlpha = Math.max(0, this.weatherAlpha - dt * 0.5);
    }

    if (this.weatherAlpha > 0.01) {
      this.updateWeatherParticles(dt, speed);
    }
  }

  private updateWeatherParticles(dt: number, speed: number) {
    const isRain = this.currentWeather === 'CYBER_RAIN' || (this.currentWeather === 'CLEAR' && this.weatherAlpha > 0);

    for (let i = 0; i < this.weatherParticles.length; i++) {
      const p = this.weatherParticles[i];

      if (p.splashTimer > 0) {
        p.splashTimer -= dt;
      }

      if (isRain) {
        p.y += p.vy * dt;
        p.x += (p.vx - speed * 0.42) * dt;

        if (p.y >= GROUND_Y) {
          p.splashTimer = 0.16;
          p.splashX = p.x;
          p.y = -20 - Math.random() * 40;
          p.x = Math.random() * (VIRTUAL_WIDTH + 260) - 20;
        }

        if (p.x < -60) {
          p.x = VIRTUAL_WIDTH + Math.random() * 100;
          p.y = -10 - Math.random() * 30;
        }
      } else {
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

  public beginFrame(ctx: CanvasRenderingContext2D, elapsed: number, distance: number = 0) {
    ctx.save();

    // Apply screen shake if active
    if (this.screenShakeIntensity > 0) {
      const decay = Math.max(0, this.screenShakeTime / 0.35);
      const shakeX = (Math.random() * 2 - 1) * this.screenShakeIntensity * decay;
      const shakeY = (Math.random() * 2 - 1) * this.screenShakeIntensity * decay;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Futuristic Sky Gradient with subtle distance progression
    this.drawFuturisticSky(ctx, distance);

    // 2. Distant Auroral / Nebula Glow
    this.drawNebulaHaze(ctx, elapsed, distance);

    // 3. Stars
    this.drawStars(ctx, elapsed);

    // 4. Stylized Futuristic Cyber Moon
    this.drawMoon(ctx);

    // 5. Layer 1 Parallax: Far Mega-Spire Silhouettes (speed * 0.05)
    this.drawFarSpires(ctx);

    // 6. Layer 2 Parallax: Mid-Distant Metropolis Towers (speed * 0.16)
    this.drawMidMetropolis(ctx);

    // 7. Layer 3 Parallax: Near Cyber District & Holograms (speed * 0.38)
    this.drawNearDistrict(ctx, elapsed);

    // 8. Layer 4 Parallax: Elevated Maglev Transit Skyway (speed * 0.65)
    this.drawTransitSkyway(ctx);

    // 9. Ambient Cyber Motes
    this.drawAmbientMotes(ctx);

    // 10. Running Track & Ground Infrastructure (speed * 1.0)
    this.drawGround(ctx);
  }

  public endFrame(ctx: CanvasRenderingContext2D, speed: number) {
    // Render dynamic weather particles over the environment
    if (this.weatherAlpha > 0.01) {
      this.drawWeather(ctx, speed);
    }

    // Speed lines if traveling fast
    if (speed > 520) {
      this.drawSpeedLines(ctx, speed);
    }

    ctx.restore();
  }

  private drawFuturisticSky(ctx: CanvasRenderingContext2D, distance: number) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);

    // Distance-based gradual atmospheric transition:
    // Zone 1 (0 - 350m): Cyber Twilight
    // Zone 2 (350 - 750m): Neo-Metropolis Midnight
    // Zone 3 (750m+): Hyper-Grid Overdrive
    const progress = Math.min(1, distance / 1000);

    if (this.currentWeather === 'CYBER_RAIN' && this.weatherAlpha > 0.3) {
      skyGrad.addColorStop(0, '#030612');
      skyGrad.addColorStop(0.5, '#07122A');
      skyGrad.addColorStop(1, '#0F1A3A');
    } else if (this.currentWeather === 'NEON_SNOW' && this.weatherAlpha > 0.3) {
      skyGrad.addColorStop(0, '#050414');
      skyGrad.addColorStop(0.5, '#120A2B');
      skyGrad.addColorStop(1, '#200F3E');
    } else {
      if (progress < 0.4) {
        // Deep midnight blue to dark cyber navy
        skyGrad.addColorStop(0, '#040713');
        skyGrad.addColorStop(0.5, '#080E24');
        skyGrad.addColorStop(1, '#131233');
      } else if (progress < 0.75) {
        // Deep indigo to electric violet
        skyGrad.addColorStop(0, '#030511');
        skyGrad.addColorStop(0.5, '#0B0D2C');
        skyGrad.addColorStop(1, '#1A0E38');
      } else {
        // Hyper-grid dark obsidian to deep magenta-violet
        skyGrad.addColorStop(0, '#02030A');
        skyGrad.addColorStop(0.5, '#0E0926');
        skyGrad.addColorStop(1, '#240C3B');
      }
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  }

  private drawNebulaHaze(ctx: CanvasRenderingContext2D, elapsed: number, distance: number) {
    ctx.save();
    const hazeGrad = ctx.createRadialGradient(
      VIRTUAL_WIDTH * 0.45,
      140,
      40,
      VIRTUAL_WIDTH * 0.45,
      140,
      VIRTUAL_WIDTH * 0.55
    );

    const pulse = Math.sin(elapsed * 0.4) * 0.03;
    const isLate = distance > 600;

    if (isLate) {
      hazeGrad.addColorStop(0, `rgba(236, 72, 153, ${0.12 + pulse})`);
      hazeGrad.addColorStop(0.5, `rgba(139, 92, 246, ${0.08 + pulse})`);
      hazeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      hazeGrad.addColorStop(0, `rgba(6, 182, 212, ${0.12 + pulse})`);
      hazeGrad.addColorStop(0.5, `rgba(99, 102, 241, ${0.07 + pulse})`);
      hazeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, GROUND_Y);
    ctx.restore();
  }

  private drawStars(ctx: CanvasRenderingContext2D, elapsed: number) {
    for (const star of this.stars) {
      const alpha = (star.baseAlpha + Math.sin(elapsed * star.twinkleSpeed) * 0.25) * (1 - this.weatherAlpha * 0.45);
      if (alpha > 0.05) {
        ctx.fillStyle = `rgba(224, 231, 255, ${Math.max(0.05, Math.min(1, alpha))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawMoon(ctx: CanvasRenderingContext2D) {
    const moonX = VIRTUAL_WIDTH - 170;
    const moonY = 115;
    const radius = 46;

    ctx.save();
    // Atmospheric radial aura
    const moonGlow = ctx.createRadialGradient(moonX, moonY, radius * 0.4, moonX, moonY, radius * 2.3);
    moonGlow.addColorStop(0, 'rgba(139, 92, 246, 0.24)');
    moonGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.12)');
    moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, radius * 2.3, 0, Math.PI * 2);
    ctx.fill();

    // High-tech celestial body with geometric shadow
    const moonBody = ctx.createLinearGradient(moonX - radius, moonY - radius, moonX + radius, moonY + radius);
    moonBody.addColorStop(0, '#E0E7FF');
    moonBody.addColorStop(0.7, '#A78BFA');
    moonBody.addColorStop(1, '#6D28D9');
    ctx.fillStyle = moonBody;
    ctx.shadowColor = 'rgba(167, 139, 250, 0.7)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(moonX, moonY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Geometric neon planetary orbital ring
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(moonX, moonY, radius * 1.55, radius * 0.42, -0.3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawFarSpires(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = '#080E21';
    ctx.globalAlpha = 0.65;

    for (const spire of this.farSpires) {
      let drawX = spire.x - this.farSpireOffset;
      while (drawX < -spire.width) {
        drawX += VIRTUAL_WIDTH * 2.8;
      }
      if (drawX > VIRTUAL_WIDTH + 80) continue;

      const drawY = GROUND_Y - spire.height;

      // Mega-arcology tower body
      ctx.beginPath();
      ctx.moveTo(drawX, GROUND_Y);
      ctx.lineTo(drawX + spire.width * 0.2, drawY);
      ctx.lineTo(drawX + spire.width * 0.8, drawY);
      ctx.lineTo(drawX + spire.width, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Sharp central spire needle
      const needleX = drawX + spire.width / 2;
      ctx.strokeStyle = '#080E21';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(needleX, drawY);
      ctx.lineTo(needleX, drawY - spire.spireHeight);
      ctx.stroke();

      // Pulsing red/cyan aircraft warning beacon on peak
      ctx.fillStyle = spire.beaconColor;
      ctx.beginPath();
      ctx.arc(needleX, drawY - spire.spireHeight, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawMidMetropolis(ctx: CanvasRenderingContext2D) {
    ctx.save();

    for (const b of this.midTowers) {
      let drawX = b.x - this.midMetropolisOffset;
      while (drawX < -b.width) {
        drawX += VIRTUAL_WIDTH * 2.6;
      }
      if (drawX > VIRTUAL_WIDTH + 60) continue;

      const drawY = GROUND_Y - b.height;

      // Tower body silhouette
      ctx.fillStyle = '#0E162D';
      ctx.fillRect(drawX, drawY, b.width, b.height);

      // Fine architectural outline
      ctx.strokeStyle = '#1E294B';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(drawX, drawY, b.width, b.height);

      // Illuminated window matrices (subtle cyan & amber)
      for (let r = 1; r < b.windowRows - 1; r++) {
        for (let c = 1; c < b.windowCols; c++) {
          const winX = drawX + c * 16;
          const winY = drawY + r * 18;
          const isLit = ((r * 11 + c * 7) % 4) === 0;

          if (isLit) {
            ctx.fillStyle = (r + c) % 3 === 0 ? 'rgba(34, 211, 238, 0.45)' : 'rgba(251, 191, 36, 0.35)';
            ctx.fillRect(winX, winY, 5, 7);
          }
        }
      }

      // Antenna beacon
      const antennaX = drawX + b.width / 2;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(antennaX, drawY);
      ctx.lineTo(antennaX, drawY - b.antennaHeight);
      ctx.stroke();

      ctx.fillStyle = b.accentColor;
      ctx.beginPath();
      ctx.arc(antennaX, drawY - b.antennaHeight, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Holographic floating communications ring on select towers
      if (b.hasHoloRing) {
        ctx.strokeStyle = b.accentColor;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(antennaX, drawY - b.antennaHeight * 0.6, 12, 3.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }

    ctx.restore();
  }

  private drawNearDistrict(ctx: CanvasRenderingContext2D, elapsed: number) {
    ctx.save();

    for (const b of this.nearBuildings) {
      let drawX = b.x - this.nearDistrictOffset;
      while (drawX < -b.width) {
        drawX += VIRTUAL_WIDTH * 2.4;
      }
      if (drawX > VIRTUAL_WIDTH + 50) continue;

      const drawY = GROUND_Y - b.height;

      // Dark cyber building block
      ctx.fillStyle = '#11182E';
      ctx.fillRect(drawX, drawY, b.width, b.height);

      // Glowing roof edge trim
      ctx.strokeStyle = b.roofTrimColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX + b.width, drawY);
      ctx.stroke();

      // Neon Billboard Marquee
      if (b.billboardText) {
        const boardW = b.width - 16;
        const boardH = 22;
        const boardX = drawX + 8;
        const boardY = drawY + 14;

        ctx.fillStyle = '#090D1A';
        ctx.strokeStyle = b.billboardColor;
        ctx.lineWidth = 1.5;
        ctx.fillRect(boardX, boardY, boardW, boardH);
        ctx.strokeRect(boardX, boardY, boardW, boardH);

        // Neon typography
        ctx.save();
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = b.billboardColor;
        ctx.shadowColor = b.billboardColor;
        ctx.shadowBlur = 6;
        ctx.fillText(b.billboardText, boardX + boardW / 2, boardY + 14);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  private drawTransitSkyway(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const trackY = GROUND_Y - 55;

    // Maglev structural rail line
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, trackY);
    ctx.lineTo(VIRTUAL_WIDTH, trackY);
    ctx.stroke();

    // Glowing core power line
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, trackY);
    ctx.lineTo(VIRTUAL_WIDTH, trackY);
    ctx.stroke();

    // Vertical suspension pylons
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.lineWidth = 3;
    for (let x = -60; x <= VIRTUAL_WIDTH + 60; x += 90) {
      const pylonX = x - (this.nearDistrictOffset * 0.8) % 90;
      ctx.beginPath();
      ctx.moveTo(pylonX, trackY);
      ctx.lineTo(pylonX, GROUND_Y);
      ctx.stroke();
    }

    // High-speed illuminated transit capsule shooting past
    if (this.transitPulseX > -150 && this.transitPulseX < VIRTUAL_WIDTH + 150) {
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#22D3EE';
      ctx.fillRect(this.transitPulseX, trackY - 4, 38, 4);

      // Light trail behind train
      const trailGrad = ctx.createLinearGradient(this.transitPulseX - 60, trackY, this.transitPulseX, trackY);
      trailGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
      trailGrad.addColorStop(1, 'rgba(34, 211, 238, 0.6)');
      ctx.fillStyle = trailGrad;
      ctx.fillRect(this.transitPulseX - 60, trackY - 3, 60, 3);
    }

    ctx.restore();
  }

  private drawAmbientMotes(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const mote of this.ambientMotes) {
      ctx.globalAlpha = mote.alpha;
      ctx.fillStyle = mote.color;
      ctx.shadowColor = mote.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. Underground sub-surface gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, VIRTUAL_HEIGHT);
    groundGrad.addColorStop(0, '#0C1226');
    groundGrad.addColorStop(0.3, '#080C1A');
    groundGrad.addColorStop(1, '#02040A');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - GROUND_Y);

    // 2. Primary Upper Laser Rail (ground snap alignment at GROUND_Y)
    ctx.shadowColor = '#06B6D4';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y);
    ctx.stroke();

    // 3. Secondary Neon Violet Under-Rail
    ctx.shadowColor = '#8B5CF6';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#A78BFA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 5);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y + 5);
    ctx.stroke();

    // 4. Scrolling Tech Chevrons & Energy Markers on track
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    const spacing = 48;
    for (let x = -spacing; x <= VIRTUAL_WIDTH + spacing; x += spacing) {
      const markX = x - this.trackOffset;
      // Chevron arrow (>>>) pointing right
      ctx.beginPath();
      ctx.moveTo(markX, GROUND_Y + 13);
      ctx.lineTo(markX + 7, GROUND_Y + 16);
      ctx.lineTo(markX, GROUND_Y + 19);
      ctx.lineTo(markX + 3, GROUND_Y + 16);
      ctx.closePath();
      ctx.fill();
    }

    // 5. Lower Circuit Conduits & Foundation Pillars
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.lineWidth = 1.5;
    for (let x = -80; x <= VIRTUAL_WIDTH + 80; x += 80) {
      const girderX = x - (this.trackOffset * 1.5) % 80;
      ctx.beginPath();
      ctx.moveTo(girderX, GROUND_Y + 22);
      ctx.lineTo(girderX, VIRTUAL_HEIGHT);
      ctx.stroke();
    }

    // Glowing energy conduit line running horizontally underground
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 36);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y + 36);
    ctx.stroke();

    ctx.restore();
  }

  private drawWeather(ctx: CanvasRenderingContext2D, speed: number) {
    ctx.save();
    const isRain = this.currentWeather === 'CYBER_RAIN' || (this.currentWeather === 'CLEAR' && this.weatherAlpha > 0);

    if (isRain) {
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

      // Splashes on track
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

  private drawSpeedLines(ctx: CanvasRenderingContext2D, speed: number) {
    ctx.save();
    const count = Math.min(8, Math.floor((speed - 500) / 30));
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.28)';
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
