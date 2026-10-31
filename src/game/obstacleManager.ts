/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  VIRTUAL_WIDTH,
  GROUND_Y,
  OVERHEAD_CLEARANCE,
} from './constants.ts';
import { Obstacle, ObstacleType, BoundingBox } from '../types/game.ts';
import { TrackId } from '../types/track.ts';

export class ObstacleManager {
  private obstacles: Obstacle[] = [];
  private nextId: number = 1;
  private distanceSinceLastSpawn: number = 0;
  private lastObstacleType: ObstacleType | null = null;
  private currentGapRequired: number = 660; // Initial gap for first obstacle

  public reset() {
    this.obstacles = [];
    this.nextId = 1;
    this.distanceSinceLastSpawn = 0;
    this.lastObstacleType = null;
    this.currentGapRequired = 660;
  }

  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  public update(dt: number, speed: number): { passedObstacle: boolean; passedCount: number } {
    let passedObstacle = false;
    let passedCount = 0;
    const distanceMoved = speed * dt;
    this.distanceSinceLastSpawn += distanceMoved;

    // Move existing obstacles to the left
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= distanceMoved;
      obs.hitbox.x = obs.x + 4;

      // Check if player safely passed this obstacle
      if (!obs.passed && obs.x + obs.width < 140) {
        obs.passed = true;
        passedObstacle = true;
        passedCount++;
      }

      // Remove obstacles that scrolled offscreen
      if (obs.x + obs.width < -120) {
        this.obstacles.splice(i, 1);
      }
    }

    // Spawn next obstacle once fair gap distance has elapsed
    if (this.distanceSinceLastSpawn >= this.currentGapRequired) {
      this.spawnObstacle(speed);
      this.distanceSinceLastSpawn = 0;
      this.currentGapRequired = this.calculateNextFairGap(speed);
    }

    return { passedObstacle, passedCount };
  }

  private calculateNextFairGap(speed: number): number {
    // Fair reaction time calculation:
    // Minimum 1.50 seconds of travel time at the current speed
    const baseGap = Math.max(520, speed * 1.50);

    let transitionBuffer = 0;
    const isNextOverhead = this.peekNextType();

    const wasLastOverhead =
      this.lastObstacleType === 'OVERHEAD_BEAM' || this.lastObstacleType === 'OVERHEAD_LASER';

    if (wasLastOverhead && !isNextOverhead) {
      // Overhead -> Ground: player must complete slide and jump over ground hazard
      transitionBuffer = 110;
    } else if (!wasLastOverhead && isNextOverhead) {
      // Ground -> Overhead: player must land from jump and initiate slide
      transitionBuffer = 90;
    }

    // Procedural variation for natural rhythm without unfair spikes
    const variation = (Math.sin(this.nextId * 3.7) + 1) * 35;

    return baseGap + transitionBuffer + variation;
  }

  private peekNextType(): boolean {
    if (this.nextId === 1 || this.nextId === 2) return false;
    if (this.nextId === 3 || this.nextId === 4) return true;

    if (
      this.lastObstacleType === 'OVERHEAD_BEAM' ||
      this.lastObstacleType === 'OVERHEAD_LASER'
    ) {
      return Math.random() < 0.35;
    }
    return Math.random() < 0.45;
  }

  private spawnObstacle(currentSpeed: number) {
    const isOverhead = this.peekNextType();
    const spawnX = VIRTUAL_WIDTH + 80;

    let obstacle: Obstacle;

    if (isOverhead) {
      // Overhead obstacle:
      // Clearance: OVERHEAD_CLEARANCE (48px) above GROUND_Y (440) -> 392px
      // Upright runner (68px, y in [372, 440]) collides with [0, 390] by 18px!
      // Sliding runner (22px, y in [418, 440]) has 28px of safe clearance below 390px!
      const bottomY = GROUND_Y - OVERHEAD_CLEARANCE;
      const width = 48;
      const y = 0;
      const height = bottomY;

      const type: ObstacleType = Math.random() > 0.5 ? 'OVERHEAD_BEAM' : 'OVERHEAD_LASER';

      obstacle = {
        id: this.nextId++,
        type,
        x: spawnX,
        y: y,
        width,
        height,
        hitbox: {
          x: spawnX + 4,
          y: 0,
          width: width - 8,
          height: bottomY - 4,
        },
        passed: false,
        glowColor: type === 'OVERHEAD_LASER' ? '#EF4444' : '#F59E0B',
      };
    } else {
      // Ground obstacle:
      // Player must jump to clear
      const rand = Math.random();
      let type: ObstacleType;
      let width: number;
      let height: number;

      if (rand < 0.4) {
        type = 'GROUND_CRATE';
        width = 44;
        height = 42;
      } else if (rand < 0.75) {
        type = 'GROUND_SPIKES';
        width = 54;
        height = 36;
      } else {
        type = 'GROUND_BARRIER';
        width = 40;
        height = 46;
      }

      const y = GROUND_Y - height;

      obstacle = {
        id: this.nextId++,
        type,
        x: spawnX,
        y,
        width,
        height,
        hitbox: {
          x: spawnX + 4,
          y: y + 4,
          width: width - 8,
          height: height - 4,
        },
        passed: false,
        glowColor: type === 'GROUND_SPIKES' ? '#EF4444' : '#06B6D4',
      };
    }

    this.lastObstacleType = obstacle.type;
    this.obstacles.push(obstacle);
  }

  public checkCollision(playerBox: BoundingBox): boolean {
    for (const obs of this.obstacles) {
      if (this.intersects(obs.hitbox, playerBox)) {
        return true;
      }
    }
    return false;
  }

  private intersects(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  public draw(ctx: CanvasRenderingContext2D, trackId: TrackId = 'default') {
    for (const obs of this.obstacles) {
      ctx.save();
      if (obs.type === 'GROUND_CRATE') {
        this.drawCrate(ctx, obs, trackId);
      } else if (obs.type === 'GROUND_SPIKES') {
        this.drawSpikes(ctx, obs, trackId);
      } else if (obs.type === 'GROUND_BARRIER') {
        this.drawBarrier(ctx, obs, trackId);
      } else if (obs.type === 'OVERHEAD_BEAM') {
        this.drawOverheadBeam(ctx, obs, trackId);
      } else if (obs.type === 'OVERHEAD_LASER') {
        this.drawOverheadLaser(ctx, obs, trackId);
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // CRATE OBSTACLES (GROUND)
  // =========================================================================
  private drawCrate(ctx: CanvasRenderingContext2D, obs: Obstacle, trackId: TrackId) {
    const { x, y, width, height } = obs;

    if (trackId === 'cyber_city') {
      // Holographic digital data cube
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#2A0845';
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.stroke();

      // Glowing inner matrix grid
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 6, y + 6, width - 12, height - 12);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(x + width / 2 - 3, y + height / 2 - 3, 6, 6);
    } else if (trackId === 'jungle_adventure') {
      // Ancient carved mossy stone Mayan idol
      ctx.fillStyle = '#1C2E20';
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.stroke();

      // Ancient engraved tribal face / runes
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 8, y + 8, width - 16, height - 16);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(x + 12, y + 14, 5, 5);
      ctx.fillRect(x + width - 17, y + 14, 5, 5);
      ctx.fillRect(x + 14, y + height - 14, width - 28, 3);
    } else if (trackId === 'lava_world') {
      // Volcanic obsidian magma block
      ctx.shadowColor = '#EA580C';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#1C0A0A';
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.stroke();

      // Glowing magma fissure crack
      ctx.strokeStyle = '#FED7AA';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 8);
      ctx.lineTo(x + width / 2, y + height / 2);
      ctx.lineTo(x + width - 8, y + height - 8);
      ctx.stroke();
    } else if (trackId === 'frozen_kingdom') {
      // Glacial translucent ice block
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0F375E';
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.stroke();

      // Trapped frozen air crystal
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Default: Cyber steel cargo crate
      ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.stroke();

      // Hazard stripes
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#F59E0B';
      for (let i = -width; i < width * 2; i += 16) {
        ctx.beginPath();
        ctx.moveTo(x + i, y + height);
        ctx.lineTo(x + i + 8, y + height);
        ctx.lineTo(x + i + 20, y);
        ctx.lineTo(x + i + 12, y);
        ctx.closePath();
        ctx.globalAlpha = 0.35;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // SPIKES OBSTACLES (GROUND)
  // =========================================================================
  private drawSpikes(ctx: CanvasRenderingContext2D, obs: Obstacle, trackId: TrackId) {
    const { x, y, width, height } = obs;
    const numSpikes = 3;
    const spikeW = width / numSpikes;

    let strokeCol = '#EF4444';
    let fillCol = '#334155';
    let tipCol = '#F87171';

    if (trackId === 'cyber_city') {
      strokeCol = '#C084FC';
      fillCol = '#1E0B36';
      tipCol = '#38BDF8';
    } else if (trackId === 'jungle_adventure') {
      // Sharpened bamboo stakes
      strokeCol = '#059669';
      fillCol = '#271B0F';
      tipCol = '#34D399';
    } else if (trackId === 'lava_world') {
      // Volcanic obsidian spikes with molten tips
      strokeCol = '#EA580C';
      fillCol = '#1A0808';
      tipCol = '#FEF08A';
    } else if (trackId === 'frozen_kingdom') {
      // Crystalline razor-sharp icicles
      strokeCol = '#7DD3FC';
      fillCol = '#0C2D54';
      tipCol = '#FFFFFF';
    }

    ctx.shadowColor = strokeCol;
    ctx.shadowBlur = 10;
    ctx.fillStyle = fillCol;
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(x, y + height);
    for (let i = 0; i < numSpikes; i++) {
      const tipX = x + i * spikeW + spikeW / 2;
      const baseRightX = x + (i + 1) * spikeW;
      ctx.lineTo(tipX, y);
      ctx.lineTo(baseRightX, y + height);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing tips
    ctx.fillStyle = tipCol;
    for (let i = 0; i < numSpikes; i++) {
      const tipX = x + i * spikeW + spikeW / 2;
      ctx.beginPath();
      ctx.arc(tipX, y + 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =========================================================================
  // BARRIER OBSTACLES (GROUND)
  // =========================================================================
  private drawBarrier(ctx: CanvasRenderingContext2D, obs: Obstacle, trackId: TrackId) {
    const { x, y, width, height } = obs;

    if (trackId === 'cyber_city') {
      // Holographic forcefield barrier
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#2A0845';
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 2;
      ctx.fillRect(x + 2, y + height - 10, width - 4, 10);
      ctx.strokeRect(x + 2, y + height - 10, width - 4, 10);

      // Vertical pylons
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(x + 4, y, 5, height - 10);
      ctx.fillRect(x + width - 9, y, 5, height - 10);

      // Forcefield grid
      ctx.strokeStyle = '#F472B6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 10);
      ctx.lineTo(x + width - 4, y + 10);
      ctx.moveTo(x + 4, y + 24);
      ctx.lineTo(x + width - 4, y + 24);
      ctx.stroke();
    } else if (trackId === 'jungle_adventure') {
      // Heavy timber roadblock draped in creepers
      ctx.fillStyle = '#2D1B0E';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.fillRect(x + 2, y + height - 12, width - 4, 12);
      ctx.strokeRect(x + 2, y + height - 12, width - 4, 12);

      // Timber cross posts
      ctx.fillStyle = '#3D2614';
      ctx.fillRect(x + 4, y, 6, height - 12);
      ctx.fillRect(x + width - 10, y, 6, height - 12);

      // Horizontal heavy log
      ctx.fillStyle = '#4D311A';
      ctx.fillRect(x + 2, y + 10, width - 4, 14);
      ctx.strokeStyle = '#34D399';
      ctx.strokeRect(x + 2, y + 10, width - 4, 14);
    } else if (trackId === 'lava_world') {
      // Magma fissure vent spitting thermal fire
      ctx.shadowColor = '#F97316';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#260B0B';
      ctx.strokeStyle = '#EA580C';
      ctx.lineWidth = 2;
      ctx.fillRect(x + 2, y + height - 12, width - 4, 12);

      // Basalt vent columns
      ctx.fillStyle = '#1A0808';
      ctx.fillRect(x + 4, y + 10, 6, height - 22);
      ctx.fillRect(x + width - 10, y + 10, 6, height - 22);

      // Flame jet between posts
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.moveTo(x + 6, y + height - 12);
      ctx.lineTo(x + width / 2, y);
      ctx.lineTo(x + width - 6, y + height - 12);
      ctx.closePath();
      ctx.fill();
    } else if (trackId === 'frozen_kingdom') {
      // Frost crystal monolith barrier
      ctx.shadowColor = '#7DD3FC';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#0D274A';
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 2;
      ctx.fillRect(x + 2, y + height - 10, width - 4, 10);
      ctx.strokeRect(x + 2, y + height - 10, width - 4, 10);

      // Crystal columns
      ctx.fillStyle = '#1B477D';
      ctx.fillRect(x + 4, y, 6, height - 10);
      ctx.fillRect(x + width - 10, y, 6, height - 10);

      // Frozen horizontal crystal bar
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(x + 2, y + 12, width - 4, 12);
      ctx.strokeStyle = '#FFFFFF';
      ctx.strokeRect(x + 2, y + 12, width - 4, 12);
    } else {
      // Default: Traffic warning road barrier
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.fillRect(x + 2, y + height - 10, width - 4, 10);
      ctx.strokeRect(x + 2, y + height - 10, width - 4, 10);

      ctx.fillStyle = '#1E293B';
      ctx.fillRect(x + 5, y, 6, height - 10);
      ctx.fillRect(x + width - 11, y, 6, height - 10);

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 14);
      ctx.lineTo(x + width - 3, y + 14);
      ctx.stroke();
    }
  }

  // =========================================================================
  // OVERHEAD BEAM OBSTACLES
  // =========================================================================
  private drawOverheadBeam(ctx: CanvasRenderingContext2D, obs: Obstacle, trackId: TrackId) {
    const { x, y, width, height } = obs;

    let beamCol = '#1E293B';
    let outlineCol = '#64748B';
    let lightCol = '#F59E0B';

    if (trackId === 'cyber_city') {
      beamCol = '#250B3E';
      outlineCol = '#C084FC';
      lightCol = '#38BDF8';
    } else if (trackId === 'jungle_adventure') {
      beamCol = '#2A180B';
      outlineCol = '#10B981';
      lightCol = '#34D399';
    } else if (trackId === 'lava_world') {
      beamCol = '#1A0707';
      outlineCol = '#EA580C';
      lightCol = '#F97316';
    } else if (trackId === 'frozen_kingdom') {
      beamCol = '#0F3057';
      outlineCol = '#BAE6FD';
      lightCol = '#7DD3FC';
    }

    ctx.fillStyle = beamCol;
    ctx.strokeStyle = outlineCol;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    // Warning beacon at the bottom lip
    ctx.fillStyle = lightCol;
    ctx.shadowColor = lightCol;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height - 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Jungle vine or icicle decoration
    if (trackId === 'jungle_adventure') {
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + height);
      ctx.lineTo(x + 12, y + height + 18);
      ctx.moveTo(x + width - 10, y + height);
      ctx.lineTo(x + width - 12, y + height + 24);
      ctx.stroke();
    } else if (trackId === 'frozen_kingdom') {
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.moveTo(x + 8, y + height);
      ctx.lineTo(x + 12, y + height + 16);
      ctx.lineTo(x + 16, y + height);
      ctx.fill();
    }
  }

  // =========================================================================
  // OVERHEAD LASER OBSTACLES
  // =========================================================================
  private drawOverheadLaser(ctx: CanvasRenderingContext2D, obs: Obstacle, trackId: TrackId) {
    const { x, y, width, height } = obs;

    let laserCol = '#EF4444';
    let coreCol = '#FEE2E2';

    if (trackId === 'cyber_city') {
      laserCol = '#F43F5E';
      coreCol = '#38BDF8';
    } else if (trackId === 'jungle_adventure') {
      laserCol = '#10B981';
      coreCol = '#FBBF24';
    } else if (trackId === 'lava_world') {
      laserCol = '#EA580C';
      coreCol = '#FEF08A';
    } else if (trackId === 'frozen_kingdom') {
      laserCol = '#38BDF8';
      coreCol = '#FFFFFF';
    }

    // Top emitter housing
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = laserCol;
    ctx.lineWidth = 2;
    ctx.fillRect(x, 0, width, 18);
    ctx.strokeRect(x, 0, width, 18);

    // Laser beam vertical corridor
    ctx.shadowColor = laserCol;
    ctx.shadowBlur = 14;
    ctx.fillStyle = laserCol;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(x + width / 2 - 4, 18, 8, height - 18);

    // Inner bright laser core
    ctx.fillStyle = coreCol;
    ctx.globalAlpha = 0.95;
    ctx.fillRect(x + width / 2 - 1.5, 18, 3, height - 18);
    ctx.globalAlpha = 1.0;

    // Laser node at bottom
    ctx.fillStyle = laserCol;
    ctx.beginPath();
    ctx.arc(x + width / 2, height, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
