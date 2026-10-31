/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, GROUND_Y } from './constants.ts';
import { TrackId, TRACKS_CATALOG } from '../types/track.ts';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
}

interface DistantMountain {
  x: number;
  width: number;
  height: number;
  color: string;
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
  signText?: string;
}

interface JungleTree {
  x: number;
  width: number;
  height: number;
  canopyRadius: number;
  color: string;
  vineCount: number;
}

interface VolcanoPeak {
  x: number;
  width: number;
  height: number;
  craterWidth: number;
  smokeTimer: number;
}

interface IceSpire {
  x: number;
  width: number;
  height: number;
  color: string;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  vRot: number;
  type: 'cyber' | 'holo' | 'leaves' | 'embers' | 'snow';
}

export class WorldRenderer {
  private currentTrack: TrackId = 'default';

  // Common atmospheric elements
  private stars: Star[] = [];
  private ambientParticles: AmbientParticle[] = [];

  // Track 1 (Default: Neon Highway) & Track 2 (Cyber City)
  private farSpires: DistantMountain[] = [];
  private midTowers: MetropolisTower[] = [];
  private nearBuildings: { x: number; width: number; height: number; sign: string; color: string }[] = [];

  // Track 3 (Jungle Adventure)
  private jungleMountains: DistantMountain[] = [];
  private jungleTreesFar: JungleTree[] = [];
  private jungleTreesNear: JungleTree[] = [];
  private waterfalls: { x: number; width: number; height: number; sprayOffset: number }[] = [];

  // Track 4 (Lava World)
  private volcanoes: VolcanoPeak[] = [];
  private lavaCrags: { x: number; width: number; height: number }[] = [];
  private lavaBubbles: { x: number; y: number; radius: number; maxRadius: number; speed: number }[] = [];

  // Track 5 (Frozen Kingdom)
  private iceMountains: DistantMountain[] = [];
  private iceSpires: IceSpire[] = [];
  private auroraOffsets: number[] = [0, 0.4, 0.8, 1.2];

  // Parallax tracking offsets
  private farOffset: number = 0;
  private midOffset: number = 0;
  private nearOffset: number = 0;
  private skywayOffset: number = 0;
  private trackOffset: number = 0;

  // Transit pulse (Cyber & Default)
  private transitPulseX: number = -200;

  // Screen shake
  private screenShakeTime: number = 0;
  private screenShakeIntensity: number = 0;

  constructor(initialTrack: TrackId = 'default') {
    this.currentTrack = initialTrack;
    this.initStars();
    this.initCyberMetropolis();
    this.initJungle();
    this.initVolcanoes();
    this.initFrozenKingdom();
    this.initParticles();
  }

  public setTrack(trackId: TrackId) {
    this.currentTrack = trackId;
    this.initParticles();
  }

  public getTrack(): TrackId {
    return this.currentTrack;
  }

  public triggerScreenShake(intensity: number = 8, duration: number = 0.3) {
    this.screenShakeIntensity = intensity;
    this.screenShakeTime = duration;
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * VIRTUAL_WIDTH,
        y: Math.random() * (GROUND_Y - 140),
        size: 0.8 + Math.random() * 2.0,
        baseAlpha: 0.25 + Math.random() * 0.7,
        twinkleSpeed: 1 + Math.random() * 3.5,
      });
    }
  }

  private initCyberMetropolis() {
    // Far Spires
    this.farSpires = [];
    let curX = 0;
    while (curX < VIRTUAL_WIDTH * 3) {
      const width = 60 + Math.random() * 80;
      this.farSpires.push({
        x: curX,
        width,
        height: 140 + Math.random() * 150,
        color: '#080E24',
      });
      curX += width + 20 + Math.random() * 40;
    }

    // Mid Towers
    this.midTowers = [];
    curX = 0;
    const neonColors = ['#06B6D4', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];
    const signs = ['NEXUS', 'CYBER', 'HYPER', '2099', 'DATA', 'NEO', 'RUSH', 'CORE'];
    while (curX < VIRTUAL_WIDTH * 3) {
      const width = 70 + Math.random() * 65;
      const height = 180 + Math.random() * 150;
      this.midTowers.push({
        x: curX,
        width,
        height,
        antennaHeight: 20 + Math.random() * 35,
        windowRows: Math.floor(height / 20),
        windowCols: Math.floor(width / 16),
        accentColor: neonColors[Math.floor(Math.random() * neonColors.length)],
        hasHoloRing: Math.random() > 0.45,
        signText: Math.random() > 0.5 ? signs[Math.floor(Math.random() * signs.length)] : undefined,
      });
      curX += width + 25 + Math.random() * 35;
    }

    // Near Buildings
    this.nearBuildings = [];
    curX = 0;
    while (curX < VIRTUAL_WIDTH * 3) {
      const width = 90 + Math.random() * 80;
      const height = 110 + Math.random() * 90;
      this.nearBuildings.push({
        x: curX,
        width,
        height,
        sign: signs[Math.floor(Math.random() * signs.length)],
        color: neonColors[Math.floor(Math.random() * neonColors.length)],
      });
      curX += width + 30 + Math.random() * 40;
    }
  }

  private initJungle() {
    this.jungleMountains = [];
    let curX = 0;
    while (curX < VIRTUAL_WIDTH * 3) {
      const width = 140 + Math.random() * 120;
      this.jungleMountains.push({
        x: curX,
        width,
        height: 180 + Math.random() * 140,
        color: '#062013',
      });
      curX += width * 0.75;
    }

    this.waterfalls = [];
    for (let i = 0; i < 4; i++) {
      this.waterfalls.push({
        x: 180 + i * 450 + Math.random() * 100,
        width: 16 + Math.random() * 14,
        height: 120 + Math.random() * 60,
        sprayOffset: 0,
      });
    }

    this.jungleTreesFar = [];
    curX = 0;
    while (curX < VIRTUAL_WIDTH * 3) {
      const width = 30 + Math.random() * 20;
      this.jungleTreesFar.push({
        x: curX,
        width,
        height: 190 + Math.random() * 80,
        canopyRadius: 55 + Math.random() * 35,
        color: '#0A331E',
        vineCount: Math.floor(2 + Math.random() * 3),
      });
      curX += 80 + Math.random() * 60;
    }

    this.jungleTreesNear = [];
    curX = 0;
    while (curX < VIRTUAL_WIDTH * 3) {
      const width = 45 + Math.random() * 30;
      this.jungleTreesNear.push({
        x: curX,
        width,
        height: 230 + Math.random() * 90,
        canopyRadius: 80 + Math.random() * 40,
        color: '#084024',
        vineCount: Math.floor(3 + Math.random() * 4),
      });
      curX += 130 + Math.random() * 90;
    }
  }

  private initVolcanoes() {
    this.volcanoes = [];
    let curX = 0;
    while (curX < VIRTUAL_WIDTH * 3) {
      const width = 160 + Math.random() * 140;
      this.volcanoes.push({
        x: curX,
        width,
        height: 160 + Math.random() * 140,
        craterWidth: 35 + Math.random() * 25,
        smokeTimer: Math.random() * 5,
      });
      curX += width * 0.85;
    }

    this.lavaCrags = [];
    curX = 0;
    while (curX < VIRTUAL_WIDTH * 3) {
      const width = 90 + Math.random() * 80;
      this.lavaCrags.push({
        x: curX,
        width,
        height: 70 + Math.random() * 60,
      });
      curX += width + 20;
    }

    this.lavaBubbles = [];
    for (let i = 0; i < 18; i++) {
      this.lavaBubbles.push({
        x: Math.random() * VIRTUAL_WIDTH,
        y: GROUND_Y + 12 + Math.random() * (VIRTUAL_HEIGHT - GROUND_Y - 20),
        radius: 1 + Math.random() * 3,
        maxRadius: 4 + Math.random() * 5,
        speed: 10 + Math.random() * 20,
      });
    }
  }

  private initFrozenKingdom() {
    this.iceMountains = [];
    let curX = 0;
    while (curX < VIRTUAL_WIDTH * 3) {
      const width = 150 + Math.random() * 130;
      this.iceMountains.push({
        x: curX,
        width,
        height: 180 + Math.random() * 130,
        color: '#0B2244',
      });
      curX += width * 0.75;
    }

    this.iceSpires = [];
    curX = 0;
    while (curX < VIRTUAL_WIDTH * 3) {
      const width = 50 + Math.random() * 40;
      this.iceSpires.push({
        x: curX,
        width,
        height: 140 + Math.random() * 120,
        color: '#153A6E',
      });
      curX += width + 40 + Math.random() * 50;
    }
  }

  private initParticles() {
    this.ambientParticles = [];
    const count = this.currentTrack === 'frozen_kingdom' ? 85 : 45;

    for (let i = 0; i < count; i++) {
      this.ambientParticles.push(this.createParticle(true));
    }
  }

  private createParticle(randomY: boolean = false): AmbientParticle {
    const track = this.currentTrack;
    let type: 'cyber' | 'holo' | 'leaves' | 'embers' | 'snow' = 'cyber';
    let color = '#22D3EE';
    let size = 2 + Math.random() * 3;
    let vy = (Math.random() - 0.5) * 15;
    let vx = -20 - Math.random() * 40;

    if (track === 'default') {
      type = 'cyber';
      color = Math.random() > 0.5 ? '#06B6D4' : '#A78BFA';
      size = 1.5 + Math.random() * 2.5;
    } else if (track === 'cyber_city') {
      type = 'holo';
      color = Math.random() > 0.4 ? '#38BDF8' : '#F472B6';
      size = 2 + Math.random() * 3.5;
      vx = -30 - Math.random() * 50;
    } else if (track === 'jungle_adventure') {
      type = 'leaves';
      color = Math.random() > 0.4 ? '#34D399' : '#FBBF24';
      size = 3 + Math.random() * 4;
      vy = 25 + Math.random() * 35;
      vx = -40 - Math.random() * 35;
    } else if (track === 'lava_world') {
      type = 'embers';
      color = Math.random() > 0.4 ? '#F97316' : '#EF4444';
      size = 1.8 + Math.random() * 3;
      vy = -35 - Math.random() * 45;
      vx = -20 - Math.random() * 30;
    } else if (track === 'frozen_kingdom') {
      type = 'snow';
      color = '#E0F2FE';
      size = 1.5 + Math.random() * 3.5;
      vy = 30 + Math.random() * 40;
      vx = -45 - Math.random() * 55;
    }

    return {
      x: Math.random() * (VIRTUAL_WIDTH + 100),
      y: randomY ? Math.random() * (GROUND_Y + 40) : (type === 'embers' ? GROUND_Y - 5 : -10),
      vx,
      vy,
      size,
      alpha: 0.35 + Math.random() * 0.55,
      color,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3,
      type,
    };
  }

  public update(dt: number, speed: number) {
    // Parallax movement
    this.farOffset += speed * 0.08 * dt;
    this.midOffset += speed * 0.22 * dt;
    this.nearOffset += speed * 0.48 * dt;
    this.skywayOffset += speed * 0.75 * dt;
    this.trackOffset = (this.trackOffset + speed * dt) % 64;

    // Maglev transit pulse
    this.transitPulseX += (speed * 1.6) * dt;
    if (this.transitPulseX > VIRTUAL_WIDTH + 300) {
      this.transitPulseX = -350 - Math.random() * 400;
    }

    // Screen shake decay
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
      if (this.screenShakeTime <= 0) {
        this.screenShakeIntensity = 0;
      }
    }

    // Update ambient particles
    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      p.x += (p.vx - speed * 0.15) * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;

      // Wrap around bounds
      if (p.x < -30 || p.y > GROUND_Y + 30 || (p.vy < 0 && p.y < -30)) {
        this.ambientParticles[i] = this.createParticle(false);
        this.ambientParticles[i].x = VIRTUAL_WIDTH + 20 + Math.random() * 50;
      }
    }

    // Update lava bubbles (Lava World)
    if (this.currentTrack === 'lava_world') {
      for (const b of this.lavaBubbles) {
        b.radius += dt * (b.speed * 0.2);
        b.x -= speed * dt;
        if (b.x < -20) {
          b.x = VIRTUAL_WIDTH + Math.random() * 50;
          b.radius = 1;
        }
        if (b.radius > b.maxRadius) {
          b.radius = 1;
          b.x = Math.random() * VIRTUAL_WIDTH;
        }
      }
    }
  }

  public beginFrame(ctx: CanvasRenderingContext2D, elapsed: number, distance: number = 0) {
    ctx.save();

    // Screen shake
    if (this.screenShakeIntensity > 0) {
      const decay = Math.max(0, this.screenShakeTime / 0.35);
      const shakeX = (Math.random() * 2 - 1) * this.screenShakeIntensity * decay;
      const shakeY = (Math.random() * 2 - 1) * this.screenShakeIntensity * decay;
      ctx.translate(shakeX, shakeY);
    }

    // Dispatch rendering to specific track environment
    switch (this.currentTrack) {
      case 'cyber_city':
        this.drawCyberCityEnvironment(ctx, elapsed, distance);
        break;
      case 'jungle_adventure':
        this.drawJungleEnvironment(ctx, elapsed, distance);
        break;
      case 'lava_world':
        this.drawLavaWorldEnvironment(ctx, elapsed, distance);
        break;
      case 'frozen_kingdom':
        this.drawFrozenKingdomEnvironment(ctx, elapsed, distance);
        break;
      case 'default':
      default:
        this.drawNeonHighwayEnvironment(ctx, elapsed, distance);
        break;
    }
  }

  public endFrame(ctx: CanvasRenderingContext2D, speed: number) {
    // Render dynamic track particles over game world
    this.drawAmbientParticles(ctx);

    // Speed lines if moving at high velocity
    if (speed > 520) {
      this.drawSpeedLines(ctx, speed);
    }

    ctx.restore();
  }

  // =========================================================================
  // ENVIRONMENT 1: NEON HIGHWAY (DEFAULT)
  // =========================================================================
  private drawNeonHighwayEnvironment(ctx: CanvasRenderingContext2D, elapsed: number, distance: number) {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#040713');
    sky.addColorStop(0.5, '#080E24');
    sky.addColorStop(1, '#131233');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Stars & Celestial Moon
    this.drawStars(ctx, elapsed);
    this.drawCyberMoon(ctx, VIRTUAL_WIDTH - 160, 110, 42, '#06B6D4', '#8B5CF6');

    // Layer 1: Far Mega-Arcologies
    this.drawFarSpiresLayer(ctx, this.farOffset, '#080E24', '#06B6D4');

    // Layer 2: Mid-Distant Metropolis Towers
    this.drawMidTowersLayer(ctx, this.midOffset);

    // Layer 3: Near District Buildings with Neon Billboards
    this.drawNearBuildingsLayer(ctx, this.nearOffset);

    // Layer 4: Elevated Maglev Transit Skyway
    this.drawMaglevSkyway(ctx, '#06B6D4');

    // Ground: Cyan Laser Highway
    this.drawNeonGridGround(ctx, '#22D3EE', '#8B5CF6', '#0C1226');
  }

  // =========================================================================
  // ENVIRONMENT 2: CYBER CITY (TRACK 1 - 2,000 COINS)
  // =========================================================================
  private drawCyberCityEnvironment(ctx: CanvasRenderingContext2D, elapsed: number, distance: number) {
    // Vibrant ultraviolet neo-tokyo sky
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#020617');
    sky.addColorStop(0.4, '#130A2A');
    sky.addColorStop(0.85, '#2D0B4E');
    sky.addColorStop(1, '#3B0764');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    this.drawStars(ctx, elapsed);

    // Dual holographic cyber moons
    this.drawCyberMoon(ctx, VIRTUAL_WIDTH - 180, 95, 46, '#C084FC', '#38BDF8');
    this.drawCyberMoon(ctx, VIRTUAL_WIDTH - 260, 130, 22, '#F472B6', '#818CF8');

    // Holographic grid horizon line
    ctx.save();
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.2)';
    ctx.lineWidth = 1;
    for (let y = GROUND_Y - 90; y < GROUND_Y; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIRTUAL_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();

    // Far dense cyberpunk spires
    this.drawFarSpiresLayer(ctx, this.farOffset * 1.2, '#120A2E', '#F43F5E');

    // Mid illuminated skyscrapers with glowing holographic ads
    this.drawMidTowersLayer(ctx, this.midOffset * 1.15);

    // Near commercial cyber district with animated banners
    this.drawNearBuildingsLayer(ctx, this.nearOffset * 1.1);

    // Maglev tube with pulsing purple light bursts
    this.drawMaglevSkyway(ctx, '#C084FC');

    // Ground: High-tech violet & cyan matrix floor
    this.drawCyberCityGround(ctx);
  }

  // =========================================================================
  // ENVIRONMENT 3: JUNGLE ADVENTURE (TRACK 2 - 5,000 COINS)
  // =========================================================================
  private drawJungleEnvironment(ctx: CanvasRenderingContext2D, elapsed: number, distance: number) {
    // Lush tropical dawn sky
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#03170E');
    sky.addColorStop(0.4, '#082E1B');
    sky.addColorStop(0.8, '#104B2C');
    sky.addColorStop(1, '#1A5D36');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Golden sunbeams breaking through canopy
    ctx.save();
    const sunGrad = ctx.createRadialGradient(160, 70, 20, 160, 70, 260);
    sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
    sunGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.15)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(160, 70, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Layer 1: Distant jungle karst mountain ridges
    ctx.save();
    for (const m of this.jungleMountains) {
      let drawX = m.x - (this.farOffset * 0.7);
      while (drawX < -m.width) drawX += VIRTUAL_WIDTH * 2.5;
      if (drawX > VIRTUAL_WIDTH + 60) continue;

      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.moveTo(drawX, GROUND_Y);
      ctx.lineTo(drawX + m.width * 0.3, GROUND_Y - m.height * 0.75);
      ctx.lineTo(drawX + m.width * 0.5, GROUND_Y - m.height);
      ctx.lineTo(drawX + m.width * 0.7, GROUND_Y - m.height * 0.6);
      ctx.lineTo(drawX + m.width, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Cascading misty waterfalls in distance
    ctx.save();
    for (const wf of this.waterfalls) {
      let drawX = wf.x - (this.midOffset * 0.5);
      while (drawX < -wf.width) drawX += VIRTUAL_WIDTH * 2.2;
      if (drawX > VIRTUAL_WIDTH + 40) continue;

      const drawY = GROUND_Y - wf.height;
      const wfGrad = ctx.createLinearGradient(drawX, drawY, drawX, GROUND_Y);
      wfGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      wfGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.65)');
      wfGrad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
      ctx.fillStyle = wfGrad;
      ctx.fillRect(drawX, drawY, wf.width, wf.height);

      // Water spray mist
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(drawX + wf.width / 2, GROUND_Y - 5, wf.width * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Layer 2: Far prehistoric rainforest trees
    this.drawJungleTrees(ctx, this.jungleTreesFar, this.midOffset, false);

    // Layer 3: Near canopy trees with hanging vines
    this.drawJungleTrees(ctx, this.jungleTreesNear, this.nearOffset, true);

    // Ground: Ancient mossy stone bridge & timber pathway
    this.drawJungleGround(ctx);
  }

  // =========================================================================
  // ENVIRONMENT 4: LAVA WORLD (TRACK 3 - 8,000 COINS)
  // =========================================================================
  private drawLavaWorldEnvironment(ctx: CanvasRenderingContext2D, elapsed: number, distance: number) {
    // Apocalyptic volcanic sky with fiery horizon
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#120404');
    sky.addColorStop(0.4, '#2A0808');
    sky.addColorStop(0.75, '#5C0E0E');
    sky.addColorStop(1, '#831818');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Volcanic ash storm clouds & thermal glow
    ctx.save();
    const magmaGlow = ctx.createRadialGradient(
      VIRTUAL_WIDTH * 0.5,
      GROUND_Y,
      60,
      VIRTUAL_WIDTH * 0.5,
      GROUND_Y,
      VIRTUAL_WIDTH * 0.6
    );
    magmaGlow.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
    magmaGlow.addColorStop(0.6, 'rgba(239, 68, 68, 0.2)');
    magmaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = magmaGlow;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, GROUND_Y);
    ctx.restore();

    // Layer 1: Erupting volcanic peaks with fire plumes
    ctx.save();
    for (const v of this.volcanoes) {
      let drawX = v.x - (this.farOffset * 0.6);
      while (drawX < -v.width) drawX += VIRTUAL_WIDTH * 2.6;
      if (drawX > VIRTUAL_WIDTH + 80) continue;

      const drawY = GROUND_Y - v.height;

      // Volcano cone
      ctx.fillStyle = '#1C0B0B';
      ctx.beginPath();
      ctx.moveTo(drawX, GROUND_Y);
      ctx.lineTo(drawX + (v.width - v.craterWidth) / 2, drawY);
      ctx.lineTo(drawX + (v.width + v.craterWidth) / 2, drawY);
      ctx.lineTo(drawX + v.width, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Glowing lava crater
      ctx.fillStyle = '#F97316';
      ctx.shadowColor = '#EA580C';
      ctx.shadowBlur = 12;
      ctx.fillRect(
        drawX + (v.width - v.craterWidth) / 2,
        drawY - 2,
        v.craterWidth,
        6
      );
      ctx.shadowBlur = 0;

      // Rising thermal smoke plume
      ctx.fillStyle = 'rgba(40, 15, 15, 0.6)';
      ctx.beginPath();
      const smokeX = drawX + v.width / 2;
      ctx.arc(smokeX, drawY - 20, 16, 0, Math.PI * 2);
      ctx.arc(smokeX + 6, drawY - 45, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Layer 2: Basalt volcanic crags
    ctx.save();
    ctx.fillStyle = '#230E0E';
    for (const c of this.lavaCrags) {
      let drawX = c.x - (this.midOffset * 0.8);
      while (drawX < -c.width) drawX += VIRTUAL_WIDTH * 2.3;
      if (drawX > VIRTUAL_WIDTH + 50) continue;

      const drawY = GROUND_Y - c.height;
      ctx.beginPath();
      ctx.moveTo(drawX, GROUND_Y);
      ctx.lineTo(drawX + c.width * 0.2, drawY);
      ctx.lineTo(drawX + c.width * 0.8, drawY + 10);
      ctx.lineTo(drawX + c.width, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Glowing orange magma fissure on crag
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(drawX + c.width * 0.4, drawY + 12);
      ctx.lineTo(drawX + c.width * 0.6, drawY + 35);
      ctx.stroke();
    }
    ctx.restore();

    // Ground: Basalt crust with boiling animated molten magma river underneath
    this.drawLavaGround(ctx, elapsed);
  }

  // =========================================================================
  // ENVIRONMENT 5: FROZEN KINGDOM (TRACK 4 - 10,000 COINS)
  // =========================================================================
  private drawFrozenKingdomEnvironment(ctx: CanvasRenderingContext2D, elapsed: number, distance: number) {
    // Starry polar sky
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#020C1B');
    sky.addColorStop(0.5, '#051E38');
    sky.addColorStop(1, '#0D365F');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Stars
    this.drawStars(ctx, elapsed);

    // Crystalline Frost Moon
    this.drawCyberMoon(ctx, VIRTUAL_WIDTH - 150, 100, 48, '#7DD3FC', '#E0F2FE');

    // Dancing Northern Lights (Aurora Borealis)
    ctx.save();
    for (let i = 0; i < this.auroraOffsets.length; i++) {
      const offset = this.auroraOffsets[i];
      const yBase = 70 + i * 22;
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= VIRTUAL_WIDTH; x += 40) {
        const wave = Math.sin((x * 0.005) + elapsed * 0.8 + offset) * 24;
        ctx.lineTo(x, yBase + wave);
      }
      ctx.lineTo(VIRTUAL_WIDTH, yBase + 45);
      ctx.lineTo(0, yBase + 45);
      ctx.closePath();

      const auroraGrad = ctx.createLinearGradient(0, yBase - 20, 0, yBase + 45);
      if (i % 2 === 0) {
        auroraGrad.addColorStop(0, 'rgba(52, 211, 153, 0)');
        auroraGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.28)');
        auroraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      } else {
        auroraGrad.addColorStop(0, 'rgba(192, 132, 252, 0)');
        auroraGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.22)');
        auroraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }
      ctx.fillStyle = auroraGrad;
      ctx.fill();
    }
    ctx.restore();

    // Layer 1: Glacial ice mountain ridges
    ctx.save();
    for (const m of this.iceMountains) {
      let drawX = m.x - (this.farOffset * 0.65);
      while (drawX < -m.width) drawX += VIRTUAL_WIDTH * 2.5;
      if (drawX > VIRTUAL_WIDTH + 80) continue;

      const drawY = GROUND_Y - m.height;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.moveTo(drawX, GROUND_Y);
      ctx.lineTo(drawX + m.width * 0.45, drawY);
      ctx.lineTo(drawX + m.width * 0.6, drawY + 15);
      ctx.lineTo(drawX + m.width, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Frost-covered peak highlight
      ctx.fillStyle = '#BAE6FD';
      ctx.beginPath();
      ctx.moveTo(drawX + m.width * 0.45, drawY);
      ctx.lineTo(drawX + m.width * 0.35, drawY + 35);
      ctx.lineTo(drawX + m.width * 0.55, drawY + 35);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Layer 2: Crystalline ice spires & ice bridges
    ctx.save();
    for (const s of this.iceSpires) {
      let drawX = s.x - (this.midOffset * 0.85);
      while (drawX < -s.width) drawX += VIRTUAL_WIDTH * 2.3;
      if (drawX > VIRTUAL_WIDTH + 60) continue;

      const drawY = GROUND_Y - s.height;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.moveTo(drawX, GROUND_Y);
      ctx.lineTo(drawX + s.width / 2, drawY);
      ctx.lineTo(drawX + s.width, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Translucent ice shimmer edge
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(drawX + s.width / 2, drawY);
      ctx.lineTo(drawX, GROUND_Y);
      ctx.stroke();
    }
    ctx.restore();

    // Ground: Crystalline frozen ice sheet with deep glacier blue glow
    this.drawFrozenKingdomGround(ctx);
  }

  // =========================================================================
  // SHARED RENDERING HELPERS
  // =========================================================================
  private drawStars(ctx: CanvasRenderingContext2D, elapsed: number) {
    for (const star of this.stars) {
      const alpha = star.baseAlpha + Math.sin(elapsed * star.twinkleSpeed) * 0.25;
      if (alpha > 0.05) {
        ctx.fillStyle = `rgba(224, 231, 255, ${Math.max(0.05, Math.min(1, alpha))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawCyberMoon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    glowCol: string,
    bodyCol: string
  ) {
    ctx.save();
    // Atmospheric radial aura
    const moonGlow = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * 2.2);
    moonGlow.addColorStop(0, glowCol);
    moonGlow.addColorStop(0.6, 'rgba(0, 0, 0, 0.05)');
    moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    const bodyGrad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    bodyGrad.addColorStop(0, '#FFFFFF');
    bodyGrad.addColorStop(0.5, bodyCol);
    bodyGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Orbital ring
    ctx.strokeStyle = glowCol;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.55, radius * 0.42, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawFarSpiresLayer(ctx: CanvasRenderingContext2D, offset: number, col: string, beaconCol: string) {
    ctx.save();
    ctx.fillStyle = col;
    for (const spire of this.farSpires) {
      let drawX = spire.x - offset;
      while (drawX < -spire.width) drawX += VIRTUAL_WIDTH * 2.8;
      if (drawX > VIRTUAL_WIDTH + 80) continue;

      const drawY = GROUND_Y - spire.height;
      ctx.beginPath();
      ctx.moveTo(drawX, GROUND_Y);
      ctx.lineTo(drawX + spire.width * 0.25, drawY);
      ctx.lineTo(drawX + spire.width * 0.75, drawY);
      ctx.lineTo(drawX + spire.width, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Sharp central spire needle with glowing beacon
      const needleX = drawX + spire.width / 2;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(needleX, drawY);
      ctx.lineTo(needleX, drawY - 30);
      ctx.stroke();

      ctx.fillStyle = beaconCol;
      ctx.beginPath();
      ctx.arc(needleX, drawY - 30, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawMidTowersLayer(ctx: CanvasRenderingContext2D, offset: number) {
    ctx.save();
    for (const b of this.midTowers) {
      let drawX = b.x - offset;
      while (drawX < -b.width) drawX += VIRTUAL_WIDTH * 2.6;
      if (drawX > VIRTUAL_WIDTH + 60) continue;

      const drawY = GROUND_Y - b.height;
      ctx.fillStyle = '#0E162D';
      ctx.fillRect(drawX, drawY, b.width, b.height);

      ctx.strokeStyle = '#1E294B';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(drawX, drawY, b.width, b.height);

      // Window matrices
      for (let r = 1; r < b.windowRows - 1; r++) {
        for (let c = 1; c < b.windowCols; c++) {
          const winX = drawX + c * 16;
          const winY = drawY + r * 18;
          if (((r * 11 + c * 7) % 4) === 0) {
            ctx.fillStyle = b.accentColor;
            ctx.globalAlpha = 0.45;
            ctx.fillRect(winX, winY, 5, 7);
            ctx.globalAlpha = 1.0;
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
    }
    ctx.restore();
  }

  private drawNearBuildingsLayer(ctx: CanvasRenderingContext2D, offset: number) {
    ctx.save();
    for (const b of this.nearBuildings) {
      let drawX = b.x - offset;
      while (drawX < -b.width) drawX += VIRTUAL_WIDTH * 2.4;
      if (drawX > VIRTUAL_WIDTH + 50) continue;

      const drawY = GROUND_Y - b.height;
      ctx.fillStyle = '#11182E';
      ctx.fillRect(drawX, drawY, b.width, b.height);

      // Glowing roof edge trim
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX + b.width, drawY);
      ctx.stroke();

      // Neon billboard
      const boardW = b.width - 16;
      const boardH = 22;
      const boardX = drawX + 8;
      const boardY = drawY + 14;

      ctx.fillStyle = '#090D1A';
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.fillRect(boardX, boardY, boardW, boardH);
      ctx.strokeRect(boardX, boardY, boardW, boardH);

      ctx.save();
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6;
      ctx.fillText(b.sign, boardX + boardW / 2, boardY + 14);
      ctx.restore();
    }
    ctx.restore();
  }

  private drawMaglevSkyway(ctx: CanvasRenderingContext2D, railColor: string) {
    ctx.save();
    const trackY = GROUND_Y - 55;

    ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, trackY);
    ctx.lineTo(VIRTUAL_WIDTH, trackY);
    ctx.stroke();

    ctx.strokeStyle = railColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, trackY);
    ctx.lineTo(VIRTUAL_WIDTH, trackY);
    ctx.stroke();

    // High speed transit capsule
    if (this.transitPulseX > -150 && this.transitPulseX < VIRTUAL_WIDTH + 150) {
      ctx.shadowColor = railColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = railColor;
      ctx.fillRect(this.transitPulseX, trackY - 4, 38, 4);

      const trailGrad = ctx.createLinearGradient(this.transitPulseX - 60, trackY, this.transitPulseX, trackY);
      trailGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      trailGrad.addColorStop(1, railColor);
      ctx.fillStyle = trailGrad;
      ctx.fillRect(this.transitPulseX - 60, trackY - 3, 60, 3);
    }
    ctx.restore();
  }

  private drawJungleTrees(
    ctx: CanvasRenderingContext2D,
    trees: JungleTree[],
    offset: number,
    withVines: boolean
  ) {
    ctx.save();
    for (const t of trees) {
      let drawX = t.x - offset;
      while (drawX < -t.width - t.canopyRadius) drawX += VIRTUAL_WIDTH * 2.6;
      if (drawX > VIRTUAL_WIDTH + t.canopyRadius + 30) continue;

      const drawY = GROUND_Y - t.height;

      // Tree trunk
      ctx.fillStyle = '#1A1208';
      ctx.fillRect(drawX - t.width / 2, drawY + t.canopyRadius * 0.4, t.width, t.height);

      // Lush leafy canopy dome
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(drawX, drawY + t.canopyRadius * 0.5, t.canopyRadius, 0, Math.PI * 2);
      ctx.arc(drawX - t.canopyRadius * 0.5, drawY + t.canopyRadius * 0.7, t.canopyRadius * 0.7, 0, Math.PI * 2);
      ctx.arc(drawX + t.canopyRadius * 0.5, drawY + t.canopyRadius * 0.7, t.canopyRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Hanging jungle vines
      if (withVines) {
        ctx.strokeStyle = '#105C33';
        ctx.lineWidth = 1.8;
        for (let v = 0; v < t.vineCount; v++) {
          const vx = drawX - t.canopyRadius * 0.6 + (v * (t.canopyRadius * 1.2) / t.vineCount);
          ctx.beginPath();
          ctx.moveTo(vx, drawY + t.canopyRadius);
          ctx.bezierCurveTo(
            vx - 6,
            drawY + t.canopyRadius + 25,
            vx + 6,
            drawY + t.canopyRadius + 50,
            vx,
            drawY + t.canopyRadius + 75
          );
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // GROUND TEXTURES PER TRACK
  // =========================================================================
  private drawNeonGridGround(
    ctx: CanvasRenderingContext2D,
    laserColor: string,
    subRailColor: string,
    baseColor: string
  ) {
    ctx.save();

    // Underground gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, VIRTUAL_HEIGHT);
    groundGrad.addColorStop(0, baseColor);
    groundGrad.addColorStop(0.4, '#080C1A');
    groundGrad.addColorStop(1, '#02040A');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - GROUND_Y);

    // Primary laser rail
    ctx.shadowColor = laserColor;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = laserColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y);
    ctx.stroke();

    // Secondary sub-rail
    ctx.shadowBlur = 6;
    ctx.strokeStyle = subRailColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 5);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y + 5);
    ctx.stroke();

    // Chevrons (>>>)
    ctx.shadowBlur = 0;
    ctx.fillStyle = laserColor;
    ctx.globalAlpha = 0.35;
    const spacing = 48;
    for (let x = -spacing; x <= VIRTUAL_WIDTH + spacing; x += spacing) {
      const markX = x - this.trackOffset;
      ctx.beginPath();
      ctx.moveTo(markX, GROUND_Y + 13);
      ctx.lineTo(markX + 7, GROUND_Y + 16);
      ctx.lineTo(markX, GROUND_Y + 19);
      ctx.lineTo(markX + 3, GROUND_Y + 16);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private drawCyberCityGround(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Dark violet underbase
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, VIRTUAL_HEIGHT);
    groundGrad.addColorStop(0, '#1E0B36');
    groundGrad.addColorStop(0.35, '#120524');
    groundGrad.addColorStop(1, '#080214');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - GROUND_Y);

    // Ultra-bright violet and sky-blue glowing rails
    ctx.shadowColor = '#C084FC';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 5);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y + 5);
    ctx.stroke();

    // Hexagonal matrix pattern
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.25)';
    ctx.lineWidth = 1.2;
    const hexSpacing = 42;
    for (let x = -hexSpacing; x <= VIRTUAL_WIDTH + hexSpacing; x += hexSpacing) {
      const hx = x - this.trackOffset;
      ctx.strokeRect(hx, GROUND_Y + 12, 24, 18);
    }
    ctx.restore();
  }

  private drawJungleGround(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Rich mossy earth gradient
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, VIRTUAL_HEIGHT);
    groundGrad.addColorStop(0, '#0D3823');
    groundGrad.addColorStop(0.3, '#062414');
    groundGrad.addColorStop(1, '#021208');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - GROUND_Y);

    // Mossy stone upper border & wooden planks
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y);
    ctx.stroke();

    // Wooden bridge plank slats
    const plankSpacing = 32;
    for (let x = -plankSpacing; x <= VIRTUAL_WIDTH + plankSpacing; x += plankSpacing) {
      const px = x - this.trackOffset;
      ctx.fillStyle = '#271B0F';
      ctx.fillRect(px, GROUND_Y + 4, 26, 12);
      ctx.strokeStyle = '#45311C';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, GROUND_Y + 4, 26, 12);

      // Gold nail heads
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(px + 3, GROUND_Y + 7, 2, 2);
      ctx.fillRect(px + 21, GROUND_Y + 7, 2, 2);
    }

    // Ancient carved stone wall underneath
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
    ctx.lineWidth = 1;
    for (let y = GROUND_Y + 22; y < VIRTUAL_HEIGHT; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIRTUAL_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawLavaGround(ctx: CanvasRenderingContext2D, elapsed: number) {
    ctx.save();
    // Boiling molten magma river under ground crust
    const lavaGrad = ctx.createLinearGradient(0, GROUND_Y, 0, VIRTUAL_HEIGHT);
    lavaGrad.addColorStop(0, '#7C1515');
    lavaGrad.addColorStop(0.2, '#EA580C');
    lavaGrad.addColorStop(0.5, '#F97316');
    lavaGrad.addColorStop(0.8, '#C2410C');
    lavaGrad.addColorStop(1, '#431407');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, GROUND_Y, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - GROUND_Y);

    // Animated boiling lava bubbles
    ctx.fillStyle = '#FED7AA';
    ctx.shadowColor = '#F97316';
    ctx.shadowBlur = 8;
    for (const b of this.lavaBubbles) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Basalt obsidian crust stepping platforms along the top
    const crustSpacing = 40;
    for (let x = -crustSpacing; x <= VIRTUAL_WIDTH + crustSpacing; x += crustSpacing) {
      const cx = x - this.trackOffset;
      ctx.fillStyle = '#170B0B';
      ctx.fillRect(cx, GROUND_Y, 34, 8);
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx, GROUND_Y, 34, 8);
    }

    // Glowing magma upper rail
    ctx.shadowColor = '#EA580C';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#FB923C';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.restore();
  }

  private drawFrozenKingdomGround(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Deep glacier blue translucent ice
    const iceGrad = ctx.createLinearGradient(0, GROUND_Y, 0, VIRTUAL_HEIGHT);
    iceGrad.addColorStop(0, '#0D3868');
    iceGrad.addColorStop(0.3, '#072448');
    iceGrad.addColorStop(1, '#031429');
    ctx.fillStyle = iceGrad;
    ctx.fillRect(0, GROUND_Y, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - GROUND_Y);

    // Crisp white frost snowdrift rim
    ctx.shadowColor = '#7DD3FC';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(VIRTUAL_WIDTH, GROUND_Y);
    ctx.stroke();

    // Ice crystal reflections & cracks
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.lineWidth = 1.2;
    const crackSpacing = 50;
    for (let x = -crackSpacing; x <= VIRTUAL_WIDTH + crackSpacing; x += crackSpacing) {
      const cx = x - this.trackOffset;
      ctx.beginPath();
      ctx.moveTo(cx, GROUND_Y + 5);
      ctx.lineTo(cx + 8, GROUND_Y + 16);
      ctx.lineTo(cx + 4, GROUND_Y + 24);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // AMBIENT PARTICLES & SPEED EFFECTS
  // =========================================================================
  private drawAmbientParticles(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.ambientParticles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'snow') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'leaves') {
        // Leaf shape
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'embers') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        // Cyber or holo square mote
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  private drawSpeedLines(ctx: CanvasRenderingContext2D, speed: number) {
    ctx.save();
    const count = Math.min(8, Math.floor((speed - 500) / 30));
    ctx.strokeStyle = this.currentTrack === 'lava_world' ? 'rgba(249, 115, 22, 0.35)' : 'rgba(56, 189, 248, 0.35)';
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
