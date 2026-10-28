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
    // Minimum 1.55 seconds of travel time at the current speed
    const baseGap = Math.max(520, speed * 1.50);

    // Sequence safety buffers:
    // If the last obstacle was overhead (player slid) and next is ground (player must jump),
    // provide an extra buffer so the player can finish slide, stand up, and time the jump.
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

    // Small procedural variation for natural rhythm without unfair spikes
    const variation = (Math.sin(this.nextId * 3.7) + 1) * 35;

    return baseGap + transitionBuffer + variation;
  }

  private peekNextType(): boolean {
    // Early tutorial curve: first 2 are ground, next 2 are overhead
    if (this.nextId === 1 || this.nextId === 2) return false;
    if (this.nextId === 3 || this.nextId === 4) return true;

    // After tutorial, balanced random distribution with alternation bias
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
          height: bottomY - 4, // 28px clearance above 22px sliding player
        },
        passed: false,
        glowColor: type === 'OVERHEAD_LASER' ? '#EC4899' : '#F59E0B',
      };
      this.lastObstacleType = type;
    } else {
      // Ground obstacle: sits on GROUND_Y
      const rand = Math.random();
      let type: ObstacleType;
      let width = 46;
      let height = 44;

      if (this.nextId <= 2) {
        // Early obstacles use simple crates and spikes
        type = this.nextId === 1 ? 'GROUND_CRATE' : 'GROUND_SPIKES';
        width = type === 'GROUND_CRATE' ? 44 : 50;
        height = type === 'GROUND_CRATE' ? 44 : 34;
      } else {
        if (rand < 0.38) {
          type = 'GROUND_SPIKES';
          width = 50;
          height = 34;
        } else if (rand < 0.72) {
          type = 'GROUND_CRATE';
          width = 44;
          height = 44;
        } else {
          type = 'GROUND_BARRIER';
          width = 42;
          height = 48;
        }
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
          y: y + 2,
          width: width - 8,
          height: height - 2,
        },
        passed: false,
        glowColor: type === 'GROUND_SPIKES' ? '#EF4444' : '#06B6D4',
      };
      this.lastObstacleType = type;
    }

    this.obstacles.push(obstacle);
  }

  public checkCollision(playerBox: BoundingBox): boolean {
    for (const obs of this.obstacles) {
      if (this.intersects(playerBox, obs.hitbox)) {
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

  public draw(ctx: CanvasRenderingContext2D) {
    for (const obs of this.obstacles) {
      ctx.save();
      if (obs.type === 'GROUND_CRATE') {
        this.drawCrate(ctx, obs);
      } else if (obs.type === 'GROUND_SPIKES') {
        this.drawSpikes(ctx, obs);
      } else if (obs.type === 'GROUND_BARRIER') {
        this.drawBarrier(ctx, obs);
      } else if (obs.type === 'OVERHEAD_BEAM') {
        this.drawOverheadBeam(ctx, obs);
      } else if (obs.type === 'OVERHEAD_LASER') {
        this.drawOverheadLaser(ctx, obs);
      }
      ctx.restore();
    }
  }

  private drawCrate(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const { x, y, width, height } = obs;

    ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
    ctx.shadowBlur = 8;

    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 4);
    ctx.fill();
    ctx.stroke();

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

    ctx.fillStyle = '#E2E8F0';
    const r = 2;
    ctx.beginPath();
    ctx.arc(x + 5, y + 5, r, 0, Math.PI * 2);
    ctx.arc(x + width - 5, y + 5, r, 0, Math.PI * 2);
    ctx.arc(x + 5, y + height - 5, r, 0, Math.PI * 2);
    ctx.arc(x + width - 5, y + height - 5, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawSpikes(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const { x, y, width, height } = obs;
    const numSpikes = 3;
    const spikeW = width / numSpikes;

    ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    ctx.shadowBlur = 10;

    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'miter';

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

    ctx.fillStyle = '#F87171';
    for (let i = 0; i < numSpikes; i++) {
      const tipX = x + i * spikeW + spikeW / 2;
      ctx.beginPath();
      ctx.arc(tipX, y + 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawBarrier(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const { x, y, width, height } = obs;

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
    ctx.moveTo(x + 8, y + 8);
    ctx.lineTo(x + width - 8, y + height - 14);
    ctx.moveTo(x + 8, y + height - 14);
    ctx.lineTo(x + width - 8, y + 8);
    ctx.stroke();

    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawOverheadBeam(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const { x, y, width, height } = obs;

    ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
    ctx.shadowBlur = 8;

    const beamHeight = 28;
    const beamY = y + height - beamHeight;

    // Support hanger cables from top of screen to top of beam
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, 0);
    ctx.lineTo(x + 8, beamY);
    ctx.moveTo(x + width - 8, 0);
    ctx.lineTo(x + width - 8, beamY);
    ctx.stroke();

    // Heavy steel girder beam at bottom (bottom edge at y + height)
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, beamY, width, beamHeight, [4, 4, 6, 6]);
    ctx.fill();
    ctx.stroke();

    // Hazard stripes on girder
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#FBBF24';
    ctx.globalAlpha = 0.45;
    for (let i = -width; i < width * 2; i += 12) {
      ctx.beginPath();
      ctx.moveTo(x + i, beamY + beamHeight);
      ctx.lineTo(x + i + 6, beamY + beamHeight);
      ctx.lineTo(x + i + 14, beamY);
      ctx.lineTo(x + i + 8, beamY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Downward warning hazard arrow
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(x + width / 2 - 5, beamY + 8);
    ctx.lineTo(x + width / 2 + 5, beamY + 8);
    ctx.lineTo(x + width / 2, beamY + 18);
    ctx.closePath();
    ctx.fill();
  }

  private drawOverheadLaser(ctx: CanvasRenderingContext2D, obs: Obstacle) {
    const { x, y, width, height } = obs;

    const emitterHeight = 26;
    const emitterY = y + height - emitterHeight;

    // Laser support beam from ceiling
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 4, 0, width - 8, emitterY, 0);
    ctx.fill();
    ctx.stroke();

    // Laser projector pod
    ctx.fillStyle = '#581C87';
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, emitterY, width, emitterHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Pulsing energy beam beneath projector (at y + height)
    const beamBottomY = y + height;
    ctx.save();
    ctx.shadowColor = '#EC4899';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#F472B6';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x + 6, beamBottomY);
    ctx.lineTo(x + width - 6, beamBottomY);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 8, beamBottomY);
    ctx.lineTo(x + width - 8, beamBottomY);
    ctx.stroke();
    ctx.restore();
  }
}
