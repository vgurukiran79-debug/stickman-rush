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
import { GameState, GameStats, PowerUpType, ActivePowerUp } from '../types/game.ts';
import { SkinId } from '../types/skin.ts';
import { skinManager } from './skinManager.ts';
import { Player } from './player.ts';
import { ObstacleManager } from './obstacleManager.ts';
import { CoinManager } from './coinManager.ts';
import { PowerUpManager } from './powerUpManager.ts';
import { ParticleManager } from './particleManager.ts';
import { WorldRenderer } from './renderer.ts';
import { MissionManager } from './missionManager.ts';
import { soundManager } from '../audio/soundManager.ts';
import { dailyRewardManager } from './dailyRewardManager.ts';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private state: GameState = 'START';
  private player: Player;
  private obstacleManager: ObstacleManager;
  private coinManager: CoinManager;
  private powerUpManager: PowerUpManager;
  private particleManager: ParticleManager;
  private worldRenderer: WorldRenderer;
  private missionManager: MissionManager;

  private activePowerUp: ActivePowerUp | null = null;

  private currentSpeed: number = BASE_SPEED;
  private distance: number = 0;
  private coinsInRun: number = 0;
  private bestDistance: number = 0;
  private totalCoins: number = 0;
  private isNewBest: boolean = false;

  // Per-run skill & survival metrics
  private runActiveTime: number = 0;
  private runObstaclesDodged: number = 0;
  private runPowerUpsUsed: number = 0;

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
    this.powerUpManager = new PowerUpManager();
    this.particleManager = new ParticleManager();
    this.worldRenderer = new WorldRenderer();
    this.missionManager = new MissionManager();
    this.missionManager.onNotification = () => {
      this.notifyStats();
    };

    this.player.skinId = skinManager.getEquippedSkinId();
    skinManager.onSkinChanged = (newSkinId) => {
      this.player.skinId = newSkinId;
      this.notifyStats();
    };

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
      if (!this.hasCommittedRunCoins) {
        this.missionManager.recordRunEnded(
          Math.floor(this.distance),
          this.coinsInRun,
          Math.floor(this.runActiveTime)
        );
        if (this.coinsInRun > 0) {
          this.totalCoins += this.coinsInRun;
          localStorage.setItem(STORAGE_KEY_TOTAL_COINS, this.totalCoins.toString());
        }
        this.hasCommittedRunCoins = true;
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
    const isSpeed = this.activePowerUp?.type === 'SPEED';
    return {
      distance: Math.floor(this.distance),
      coinsCollected: this.coinsInRun,
      bestDistance: this.bestDistance,
      totalCoins: this.totalCoins,
      speed: Math.round(isSpeed ? this.currentSpeed + 140 : this.currentSpeed),
      isNewBest: this.isNewBest,
      activePowerUp: this.activePowerUp
        ? {
            type: this.activePowerUp.type,
            remainingTime: Math.max(0, this.activePowerUp.remainingTime),
            maxDuration: this.activePowerUp.maxDuration,
          }
        : null,
      missions: this.missionManager.getMissions(),
      achievements: this.missionManager.getAchievements(),
      activeNotifications: this.missionManager.getActiveNotifications(),
      runObstaclesDodged: this.runObstaclesDodged,
      runActiveTime: Math.floor(this.runActiveTime),
      equippedSkinId: skinManager.getEquippedSkinId(),
      unlockedSkins: skinManager.getUnlockedSkinIds(),
      canClaimDailyReward: dailyRewardManager.getStatus().canClaim,
    };
  }

  public updateCoins(newTotalCoins: number) {
    this.totalCoins = newTotalCoins;
    try {
      localStorage.setItem(STORAGE_KEY_TOTAL_COINS, this.totalCoins.toString());
    } catch {
      // Graceful fallback
    }
    this.notifyStats();
  }

  public equipSkin(skinId: SkinId): boolean {
    const success = skinManager.equip(skinId);
    if (success) {
      this.player.skinId = skinId;
      soundManager.playEquipSkin();
      this.notifyStats();
    }
    return success;
  }

  public purchaseSkin(skinId: SkinId): { success: boolean; newCoins: number; error?: string } {
    const result = skinManager.purchase(skinId, this.totalCoins);
    if (result.success) {
      this.totalCoins = result.newCoins;
      this.player.skinId = skinId;
      soundManager.playBuySkin();
      this.notifyStats();
    } else {
      soundManager.playError();
    }
    return result;
  }

  public claimMissionReward(missionId: string): { success: boolean; coinsAwarded: number } {
    const result = this.missionManager.claimMissionReward(missionId);
    if (result.success && result.coinsAwarded > 0) {
      this.totalCoins += result.coinsAwarded;
      try {
        localStorage.setItem(STORAGE_KEY_TOTAL_COINS, this.totalCoins.toString());
      } catch {
        // Fallback
      }
      this.notifyStats();
    }
    return result;
  }

  public dismissNotification(id: string) {
    this.missionManager.dismissNotification(id);
    this.notifyStats();
  }

  public activatePowerUp(type: PowerUpType) {
    let duration = 8.0;
    if (type === 'SHIELD') duration = 10.0;
    if (type === 'MAGNET') duration = 8.0;
    if (type === 'SPEED') duration = 7.0;

    this.activePowerUp = {
      type,
      remainingTime: duration,
      maxDuration: duration,
    };

    this.runPowerUpsUsed++;
    this.missionManager.recordPowerUpActivated();

    this.player.hasShield = (type === 'SHIELD');
    this.player.isSpeedBoosted = (type === 'SPEED');
    this.notifyStats();
  }

  public expireActivePowerUp() {
    if (this.activePowerUp) {
      if (this.activePowerUp.type === 'SHIELD') {
        this.player.hasShield = false;
      }
      if (this.activePowerUp.type === 'SPEED') {
        this.player.isSpeedBoosted = false;
      }
      this.activePowerUp = null;
      this.notifyStats();
    }
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
    this.powerUpManager.reset();
    this.particleManager.reset();
    this.expireActivePowerUp();
    this.player.invulnerableGraceTimer = 0;
    this.currentSpeed = BASE_SPEED;
    this.distance = 0;
    this.coinsInRun = 0;
    this.runActiveTime = 0;
    this.runObstaclesDodged = 0;
    this.runPowerUpsUsed = 0;
    this.missionManager.resetRunProgress();
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
    // Handle Active Power-Up countdown
    if (this.activePowerUp) {
      this.activePowerUp.remainingTime -= dt;
      if (this.activePowerUp.remainingTime <= 0) {
        this.expireActivePowerUp();
      }
    }

    const effectiveSpeed = this.activePowerUp?.type === 'SPEED' ? this.currentSpeed + 140 : this.currentSpeed;
    this.player.hasShield = this.activePowerUp?.type === 'SHIELD';
    this.player.isSpeedBoosted = this.activePowerUp?.type === 'SPEED';

    // Gradually ramp base speed
    if (this.currentSpeed < MAX_SPEED) {
      this.currentSpeed = Math.min(MAX_SPEED, this.currentSpeed + SPEED_ACCELERATION * dt);
    }

    // Accumulate active gameplay run time (strictly when state === 'PLAYING')
    this.runActiveTime += dt;

    // Accumulate distance score (distance in meters)
    this.distance += effectiveSpeed * dt * 0.08;
    if (this.distance > this.bestDistance && !this.isNewBest) {
      this.isNewBest = true;
    }

    // Update parallax world
    this.worldRenderer.update(dt, effectiveSpeed);

    // Update player
    this.player.update(dt, effectiveSpeed);

    // Landing shockwave & ground dust
    if (this.player.justLanded) {
      this.particleManager.addLandingShockwave(this.player.x, this.player.y);
      this.player.justLanded = false;
    }

    // Slide particle trail
    if (this.player.isSliding) {
      this.particleManager.addSlideSparks(this.player.x, this.player.y);
    }

    // Update obstacles and track obstacles safely dodged
    const { passedCount } = this.obstacleManager.update(dt, effectiveSpeed);
    if (passedCount > 0) {
      this.runObstaclesDodged += passedCount;
      this.missionManager.recordObstaclesDodged(passedCount);
    }

    const playerBox = this.player.getHitbox();

    // Update power-up collectibles
    const powerUpResult = this.powerUpManager.update(
      dt,
      effectiveSpeed,
      this.obstacleManager.getObstacles(),
      playerBox,
      this.particleManager
    );
    if (powerUpResult.collectedType) {
      this.activatePowerUp(powerUpResult.collectedType);
    }

    // Update coins (with magnetic attraction when Magnet active)
    const isMagnetActive = this.activePowerUp?.type === 'MAGNET';
    const playerCenterY = this.player.isSliding ? this.player.y - 14 : this.player.y - 36;
    const coinResult = this.coinManager.update(
      dt,
      effectiveSpeed,
      this.obstacleManager.getObstacles(),
      playerBox,
      this.particleManager,
      isMagnetActive,
      this.player.x,
      playerCenterY
    );
    if (coinResult.collectedCount > 0) {
      this.coinsInRun += coinResult.collectedCount;
    }

    // Update missions with per-run metrics
    this.missionManager.updateRunMetrics(
      this.distance,
      this.coinsInRun,
      this.runActiveTime,
      this.runObstaclesDodged
    );

    // Update particles
    this.particleManager.update(dt);

    // Collision check
    const collided = this.obstacleManager.checkCollision(playerBox);
    if (collided) {
      // If grace period active, player safely passes through
      if (this.player.invulnerableGraceTimer > 0) {
        // Harmless pass-through
      } else if (this.activePowerUp?.type === 'SHIELD') {
        // Energy Shield absorbs one obstacle collision!
        this.particleManager.addShieldShatter(this.player.x, this.player.y - 30);
        soundManager.playShieldBreak();
        this.worldRenderer.triggerScreenShake(8, 0.25);
        this.expireActivePowerUp();
        // 0.55s grace period prevents multi-frame collision with the same obstacle
        this.player.invulnerableGraceTimer = 0.55;
      } else {
        this.handleCrash();
        return;
      }
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

    // Draw parallax background, stars, moon, skyline and ground with distance progression
    this.worldRenderer.beginFrame(ctx, this.totalElapsed, this.distance);

    // Draw obstacles
    this.obstacleManager.draw(ctx);

    // Draw power-up collectibles
    this.powerUpManager.draw(ctx);

    // Draw coins
    this.coinManager.draw(ctx);

    // Draw player stickman
    this.player.draw(ctx);

    // Draw particle effects
    this.particleManager.draw(ctx);

    // End frame with speed lines
    this.worldRenderer.endFrame(ctx, this.state === 'PLAYING' ? (this.activePowerUp?.type === 'SPEED' ? this.currentSpeed + 140 : this.currentSpeed) : 0);
  }
}
