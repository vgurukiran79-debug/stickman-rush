/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  VIRTUAL_WIDTH,
  VIRTUAL_HEIGHT,
  BASE_SPEED,
  MAX_SPEED,
  SPEED_ACCELERATION,
  STORAGE_KEY_BEST,
  STORAGE_KEY_TOTAL_COINS,
} from './constants.ts';
import { GameState, GameStats } from '../types/game.ts';
import { Player } from './player.ts';
import { ObstacleManager } from './obstacleManager.ts';
import { CoinManager } from './coinManager.ts';
import { ParticleManager } from './particleManager.ts';
import { WorldRenderer } from './renderer.ts';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private state: GameState = 'START';
  private player: Player;
  private obstacleManager: ObstacleManager;
  private coinManager: CoinManager;
  private particleManager: ParticleManager;
  private worldRenderer: WorldRenderer;

  private currentSpeed: number = BASE_SPEED;
  private distance: number = 0;
  private coinsInRun: number = 0;
  private bestDistance: number = 0;
  private totalCoins: number = 0;
  private isNewBest: boolean = false;

  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private totalElapsed: number = 0;
  private crashDelayTimer: number = 0;

  // React listener callbacks
  public onStateChange?: (state: GameState) => void;
  public onStatsUpdate?: (stats: GameStats) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context could not be created');
    }
    this.ctx = context;

    this.player = new Player();
    this.obstacleManager = new ObstacleManager();
    this.coinManager = new CoinManager();
    this.particleManager = new ParticleManager();
    this.worldRenderer = new WorldRenderer();

    this.loadHighScores();
    this.setupVisibilityListener();
  }

  private loadHighScores() {
    try {
      const best = localStorage.getItem(STORAGE_KEY_BEST);
      if (best !== null) {
        this.bestDistance = Math.max(0, parseInt(best, 10) || 0);
      }
      const coins = localStorage.getItem(STORAGE_KEY_TOTAL_COINS);
      if (coins !== null) {
        this.totalCoins = Math.max(0, parseInt(coins, 10) || 0);
      }
    } catch {
      this.bestDistance = 0;
      this.totalCoins = 0;
    }
  }

  private hasCommittedRunCoins: boolean = false;

  private commitRunData() {
    try {
      if (this.distance > this.bestDistance) {
        this.bestDistance = Math.floor(this.distance);
        this.isNewBest = true;
        localStorage.setItem(STORAGE_KEY_BEST, this.bestDistance.toString());
      }
      if (!this.hasCommittedRunCoins && this.coinsInRun > 0) {
        this.totalCoins += this.coinsInRun;
        this.hasCommittedRunCoins = true;
        localStorage.setItem(STORAGE_KEY_TOTAL_COINS, this.totalCoins.toString());
      }
    } catch {
      // Graceful fallback for restricted environments
    }
  }

  private setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'PLAYING') {
        this.pause();
      }
    });
  }

  public getState(): GameState {
    return this.state;
  }

  public getStats(): GameStats {
    return {
      distance: Math.floor(this.distance),
      coinsCollected: this.coinsInRun,
      bestDistance: this.bestDistance,
      totalCoins: this.totalCoins,
      speed: Math.round(this.currentSpeed),
      isNewBest: this.isNewBest,
    };
  }

  public start() {
    this.resetRun();
    this.state = 'PLAYING';
    if (this.onStateChange) this.onStateChange(this.state);
    this.notifyStats();
  }

  public restart() {
    this.resetRun();
    this.state = 'PLAYING';
    if (this.onStateChange) this.onStateChange(this.state);
    this.notifyStats();
  }

  public pause() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    if (this.onStateChange) this.onStateChange(this.state);
  }

  public resume() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    if (this.onStateChange) this.onStateChange(this.state);
  }

  public togglePause() {
    if (this.state === 'PLAYING') {
      this.pause();
    } else if (this.state === 'PAUSED') {
      this.resume();
    }
  }

  public returnToMainMenu() {
    this.state = 'START';
    this.resetRun();
    if (this.onStateChange) this.onStateChange(this.state);
    this.notifyStats();
  }

  public jump() {
    if (this.state !== 'PLAYING') return;
    this.player.jump();
  }

  public slide() {
    if (this.state !== 'PLAYING') return;
    const didSlide = this.player.slide();
    if (didSlide) {
      this.particleManager.addSlideSparks(this.player.x, this.player.y);
    }
  }

  public stopSlide() {
    if (this.state !== 'PLAYING') return;
    this.player.stopSlide();
  }

  private resetRun() {
    this.commitRunData();
    this.player.reset();
    this.obstacleManager.reset();
    this.coinManager.reset();
    this.particleManager.reset();
    this.currentSpeed = BASE_SPEED;
    this.distance = 0;
    this.coinsInRun = 0;
    this.hasCommittedRunCoins = false;
    this.isNewBest = false;
    this.crashDelayTimer = 0;
  }

  public runLoop() {
    this.lastTime = performance.now();
    const frame = (now: number) => {
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;

      // Clamp dt to avoid physics stepping glitches during tab switches
      const dt = Math.min(rawDt, 0.08);

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(frame);
    };

    this.animationFrameId = requestAnimationFrame(frame);
  }

  public stopLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private update(dt: number) {
    this.totalElapsed += dt;

    if (this.state === 'START') {
      // Gentle background scroll on start menu
      this.worldRenderer.update(dt, 80);
      return;
    }

    if (this.state === 'PAUSED') {
      // Zero updates while paused
      return;
    }

    if (this.state === 'GAMEOVER') {
      // Continue updating crashing player and burst particles
      this.player.update(dt, this.currentSpeed);
      this.particleManager.update(dt);
      this.worldRenderer.update(dt, 0);

      if (this.crashDelayTimer > 0) {
        this.crashDelayTimer -= dt;
      }
      return;
    }

    // --- Active Playing State ---
    // Gradually ramp speed
    if (this.currentSpeed < MAX_SPEED) {
      this.currentSpeed = Math.min(MAX_SPEED, this.currentSpeed + SPEED_ACCELERATION * dt);
    }

    // Accumulate distance score (distance in meters)
    this.distance += this.currentSpeed * dt * 0.08;
    if (this.distance > this.bestDistance && !this.isNewBest) {
      this.isNewBest = true;
    }

    // Update parallax world
    this.worldRenderer.update(dt, this.currentSpeed);

    // Update player
    this.player.update(dt, this.currentSpeed);

    // Slide particle trail
    if (this.player.isSliding) {
      this.particleManager.addSlideSparks(this.player.x, this.player.y);
    }

    // Update obstacles
    this.obstacleManager.update(dt, this.currentSpeed);

    // Update coins
    const playerBox = this.player.getHitbox();
    const coinResult = this.coinManager.update(
      dt,
      this.currentSpeed,
      this.obstacleManager.getObstacles(),
      playerBox,
      this.particleManager
    );
    if (coinResult.collectedCount > 0) {
      this.coinsInRun += coinResult.collectedCount;
    }

    // Update particles
    this.particleManager.update(dt);

    // Collision check
    const collided = this.obstacleManager.checkCollision(playerBox);
    if (collided) {
      this.handleCrash();
      return;
    }

    this.notifyStats();
  }

  private handleCrash() {
    this.player.crash();
    this.worldRenderer.triggerScreenShake(12, 0.4);
    this.particleManager.addCrashBurst(this.player.x, this.player.y - 30);
    this.commitRunData();

    this.state = 'GAMEOVER';
    this.crashDelayTimer = 0.5;

    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
    this.notifyStats();
  }

  private notifyStats() {
    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.getStats());
    }
  }

  private render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Draw parallax background, stars, moon, skyline and ground
    this.worldRenderer.beginFrame(ctx, this.totalElapsed);

    // Draw obstacles
    this.obstacleManager.draw(ctx);

    // Draw coins
    this.coinManager.draw(ctx);

    // Draw player stickman
    this.player.draw(ctx);

    // Draw particle effects
    this.particleManager.draw(ctx);

    // End frame with speed lines
    this.worldRenderer.endFrame(ctx, this.state === 'PLAYING' ? this.currentSpeed : 0);
  }
}
