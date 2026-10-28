/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  VIRTUAL_WIDTH,
  GROUND_Y,
} from './constants.ts';
import { PowerUp, PowerUpType, BoundingBox, Obstacle } from '../types/game.ts';
import { soundManager } from '../audio/soundManager.ts';
import { ParticleManager } from './particleManager.ts';

export class PowerUpManager {
  private powerUps: PowerUp[] = [];
  private nextId: number = 1;
  private distanceSinceLastSpawn: number = 0;

  public reset() {
    this.powerUps = [];
    this.nextId = 1;
    this.distanceSinceLastSpawn = 0;
  }

  public getPowerUps(): PowerUp[] {
    return this.powerUps;
  }

  public update(
    dt: number,
    speed: number,
    obstacles: Obstacle[],
    playerBox: BoundingBox,
    particleManager: ParticleManager
  ): { collectedType: PowerUpType | null } {
    const distanceMoved = speed * dt;
    this.distanceSinceLastSpawn += distanceMoved;
    let collectedType: PowerUpType | null = null;

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.x -= distanceMoved;
      p.angle += 3.0 * dt;

      // Check collision with player
      if (!p.collected && this.checkCollision(p, playerBox)) {
        p.collected = true;
        collectedType = p.type;
        soundManager.playPowerUpCollect();

        const color =
          p.type === 'SHIELD' ? '#38BDF8' : p.type === 'MAGNET' ? '#C084FC' : '#FBBF24';
        const label =
          p.type === 'SHIELD' ? 'ENERGY SHIELD!' : p.type === 'MAGNET' ? 'COIN MAGNET!' : 'SPEED BURST!';

        particleManager.addPowerUpBurst(p.x, p.y, color, label);
      }

      // Remove offscreen or collected
      if (p.x < -60 || p.collected) {
        this.powerUps.splice(i, 1);
      }
    }

    // Spawn power-up periodically in fair intervals (every ~850 - 1300m)
    const spawnThreshold = 850 + Math.random() * 450;
    if (this.distanceSinceLastSpawn > spawnThreshold) {
      this.spawnPowerUp(obstacles);
      this.distanceSinceLastSpawn = 0;
    }

    return { collectedType };
  }

  private checkCollision(powerUp: PowerUp, box: BoundingBox): boolean {
    const closestX = Math.max(box.x, Math.min(powerUp.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(powerUp.y, box.y + box.height));

    const dx = powerUp.x - closestX;
    const dy = powerUp.y - closestY;

    return dx * dx + dy * dy < powerUp.radius * powerUp.radius;
  }

  private spawnPowerUp(obstacles: Obstacle[]) {
    const spawnX = VIRTUAL_WIDTH + 100;

    // Check if an obstacle is immediately at spawnX
    const nearObs = obstacles.find((obs) => Math.abs(obs.x - spawnX) < 140);
    if (nearObs) {
      // Defer spawn until open space
      this.distanceSinceLastSpawn = 600;
      return;
    }

    // Random power-up type with balanced weights
    const roll = Math.random();
    let type: PowerUpType = 'SHIELD';
    if (roll < 0.35) {
      type = 'SHIELD';
    } else if (roll < 0.70) {
      type = 'MAGNET';
    } else {
      type = 'SPEED';
    }

    // Accessible floating height (easily grabbed while running or low jump)
    const spawnY = GROUND_Y - 48;

    this.powerUps.push({
      id: this.nextId++,
      type,
      x: spawnX,
      y: spawnY,
      radius: 14,
      collected: false,
      angle: 0,
    });
  }

  public draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.powerUps) {
      if (p.collected) continue;

      ctx.save();
      ctx.translate(p.x, p.y + Math.sin(p.angle) * 3);

      const color =
        p.type === 'SHIELD' ? '#06B6D4' : p.type === 'MAGNET' ? '#A855F7' : '#F59E0B';
      const lightColor =
        p.type === 'SHIELD' ? '#38BDF8' : p.type === 'MAGNET' ? '#C084FC' : '#FBBF24';

      // Outer glow aura
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      // Rotating energy ring
      ctx.strokeStyle = lightColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 3 + Math.sin(p.angle * 2) * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Core sphere
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner color sphere
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius - 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Center glyph/symbol
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 6;

      if (p.type === 'SHIELD') {
        // Shield crest
        ctx.beginPath();
        ctx.moveTo(-5, -6);
        ctx.lineTo(5, -6);
        ctx.lineTo(5, 0);
        ctx.lineTo(0, 6);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'MAGNET') {
        // Horseshoe magnet
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, -1, 4.5, 0, Math.PI, false);
        ctx.stroke();
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-6, -6, 3, 4);
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(3, -6, 3, 4);
      } else {
        // Lightning bolt
        ctx.beginPath();
        ctx.moveTo(1, -7);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-1, 0);
        ctx.lineTo(-2, 7);
        ctx.lineTo(5, -1);
        ctx.lineTo(1, -1);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
