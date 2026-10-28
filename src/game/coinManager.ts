/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  VIRTUAL_WIDTH,
  GROUND_Y,
} from './constants.ts';
import { Coin, BoundingBox, Obstacle } from '../types/game.ts';
import { soundManager } from '../audio/soundManager.ts';
import { ParticleManager } from './particleManager.ts';

export class CoinManager {
  private coins: Coin[] = [];
  private nextId: number = 1;
  private distanceSinceLastCoinSpawn: number = 0;

  public reset() {
    this.coins = [];
    this.nextId = 1;
    this.distanceSinceLastCoinSpawn = 0;
  }

  public getCoins(): Coin[] {
    return this.coins;
  }

  public update(
    dt: number,
    speed: number,
    obstacles: Obstacle[],
    playerBox: BoundingBox,
    particleManager: ParticleManager,
    isMagnetActive?: boolean,
    playerX?: number,
    playerY?: number
  ): { collectedCount: number } {
    const distanceMoved = speed * dt;
    this.distanceSinceLastCoinSpawn += distanceMoved;
    let collectedCount = 0;

    // Update and check collection for existing coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= distanceMoved;
      coin.angle += 4.5 * dt;

      // Magnetic attraction towards player
      if (isMagnetActive && playerX !== undefined && playerY !== undefined && !coin.collected) {
        const dx = playerX - coin.x;
        const dy = playerY - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 280 && dist > 4) {
          const magnetSpeed = 500;
          coin.x += (dx / dist) * magnetSpeed * dt;
          coin.y += (dy / dist) * magnetSpeed * dt;
        }
      }

      // Collision check with player bounding box
      // Collects strictly once per coin!
      if (!coin.collected && this.checkCoinPlayerCollision(coin, playerBox)) {
        coin.collected = true;
        collectedCount++;
        soundManager.playCoin();
        particleManager.addCoinBurst(coin.x, coin.y);
      }

      // Remove offscreen or collected coins
      if (coin.x < -60 || coin.collected) {
        this.coins.splice(i, 1);
      }
    }

    // Spawn new coin patterns in open gaps
    const spawnThreshold = 360 + Math.random() * 180;
    if (this.distanceSinceLastCoinSpawn > spawnThreshold) {
      this.spawnPattern(obstacles);
      this.distanceSinceLastCoinSpawn = 0;
    }

    return { collectedCount };
  }

  private isCoinInsideObstacle(coinX: number, coinY: number, radius: number, obstacles: Obstacle[]): boolean {
    for (const obs of obstacles) {
      const hb = obs.hitbox;
      // Check if coin intersects obstacle bounding box with 10px margin
      if (
        coinX + radius > hb.x - 10 &&
        coinX - radius < hb.x + hb.width + 10 &&
        coinY + radius > hb.y - 10 &&
        coinY - radius < hb.y + hb.height + 10
      ) {
        return true;
      }
    }
    return false;
  }

  private spawnPattern(obstacles: Obstacle[]) {
    const spawnX = VIRTUAL_WIDTH + 80;

    // Check if an obstacle is nearby at spawnX
    const nearbyObstacle = obstacles.find(
      (obs) => Math.abs(obs.x - spawnX) < 180
    );

    if (nearbyObstacle) {
      if (
        nearbyObstacle.type === 'OVERHEAD_BEAM' ||
        nearbyObstacle.type === 'OVERHEAD_LASER'
      ) {
        // Spawn low trail underneath overhead obstacle (encourages and rewards sliding)
        // Overhead beam is at y in [0, 392], clearance is 48px.
        // Sliding player is at y in [418, 440].
        // Placing coins at y = 426 (radius 9) ensures safe collection only while sliding.
        for (let i = 0; i < 3; i++) {
          const coinX = nearbyObstacle.x - 16 + i * 36;
          const coinY = GROUND_Y - 14;
          this.coins.push({
            id: this.nextId++,
            x: coinX,
            y: coinY,
            radius: 9.5,
            collected: false,
            angle: i * 0.4,
          });
        }
      } else {
        // Spawn arc over ground obstacle (encourages and rewards jumping)
        const count = 4;
        const startX = nearbyObstacle.x - 42;
        for (let i = 0; i < count; i++) {
          const progress = i / (count - 1);
          // Parabolic arc: peak height in the center at GROUND_Y - 105
          const arcY = GROUND_Y - 45 - Math.sin(progress * Math.PI) * 65;
          const coinX = startX + i * 34;

          this.coins.push({
            id: this.nextId++,
            x: coinX,
            y: arcY,
            radius: 9.5,
            collected: false,
            angle: i * 0.5,
          });
        }
      }
    } else {
      // Open stretch: horizontal line of 3 to 4 coins
      const patternType = Math.random();
      const numCoins = 3 + Math.floor(Math.random() * 2);
      const baseY = patternType < 0.5 ? GROUND_Y - 38 : GROUND_Y - 90;

      for (let i = 0; i < numCoins; i++) {
        const coinX = spawnX + i * 36;
        // Verify this coin doesn't collide with any incoming obstacle
        if (!this.isCoinInsideObstacle(coinX, baseY, 10, obstacles)) {
          this.coins.push({
            id: this.nextId++,
            x: coinX,
            y: baseY,
            radius: 9.5,
            collected: false,
            angle: i * 0.4,
          });
        }
      }
    }
  }

  private checkCoinPlayerCollision(coin: Coin, box: BoundingBox): boolean {
    // Circle to AABB collision test
    const closestX = Math.max(box.x, Math.min(coin.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(coin.y, box.y + box.height));

    const dx = coin.x - closestX;
    const dy = coin.y - closestY;

    return dx * dx + dy * dy < coin.radius * coin.radius;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    for (const coin of this.coins) {
      if (coin.collected) continue;

      ctx.save();
      ctx.translate(coin.x, coin.y);

      // Shimmer effect via horizontal scale
      const scaleX = Math.cos(coin.angle);
      ctx.scale(scaleX, 1);

      // Outer golden glow
      ctx.shadowColor = 'rgba(251, 191, 36, 0.75)';
      ctx.shadowBlur = 10;

      // Outer gold rim
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright gold face
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius - 2, 0, Math.PI * 2);
      ctx.fill();

      // Shiny core star or ring
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius - 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Star sparkle highlight
      if (Math.abs(scaleX) > 0.35) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-2, -2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
