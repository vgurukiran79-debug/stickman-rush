/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GROUND_Y,
  PLAYER_X,
  GRAVITY,
  JUMP_VELOCITY,
  JUMP_BUFFER_DURATION,
  COYOTE_DURATION,
  SLIDE_MIN_DURATION,
  SLIDE_MAX_DURATION,
  PLAYER_HEIGHT_RUN,
  PLAYER_WIDTH_RUN,
  PLAYER_HEIGHT_SLIDE,
  PLAYER_WIDTH_SLIDE,
} from './constants.ts';
import { BoundingBox, PlayerPose } from '../types/game.ts';
import { SkinId } from '../types/skin.ts';
import { drawStickman, getSkinStyle } from './stickmanRenderer.ts';
import { soundManager } from '../audio/soundManager.ts';

export class Player {
  public x: number = PLAYER_X;
  public y: number = GROUND_Y;
  public vy: number = 0;
  public skinId: SkinId = 'classic';
  public isGrounded: boolean = true;
  public isSliding: boolean = false;
  public slideKeyHeld: boolean = false;
  public slideElapsedTime: number = 0;
  public isCrashed: boolean = false;
  public justLanded: boolean = false;

  public hasShield: boolean = false;
  public isSpeedBoosted: boolean = false;
  public invulnerableGraceTimer: number = 0;

  private jumpBufferTimer: number = 0;
  private coyoteTimer: number = 0;
  private hasJumpedInAir: boolean = false;

  private runCycle: number = 0;
  private crashRotation: number = 0;
  private crashVx: number = 0;
  private crashVy: number = 0;

  // Futuristic motion trail ghosts
  private trailGhosts: { x: number; y: number; pose: PlayerPose; runCycle: number; alpha: number }[] = [];
  private trailTimer: number = 0;

  constructor() {
    this.reset();
  }

  public reset() {
    this.x = PLAYER_X;
    this.y = GROUND_Y;
    this.vy = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideKeyHeld = false;
    this.slideElapsedTime = 0;
    this.isCrashed = false;
    this.justLanded = false;
    this.hasShield = false;
    this.isSpeedBoosted = false;
    this.invulnerableGraceTimer = 0;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.hasJumpedInAir = false;
    this.runCycle = 0;
    this.crashRotation = 0;
    this.crashVx = 0;
    this.crashVy = 0;
    this.trailGhosts = [];
    this.trailTimer = 0;
  }

  public jump(): boolean {
    if (this.isCrashed) return false;

    // Coyote time or grounded check
    const canJumpNow = this.isGrounded || (this.coyoteTimer > 0 && !this.hasJumpedInAir);

    if (canJumpNow) {
      // If sliding, immediately cancel slide to jump
      this.isSliding = false;
      this.slideKeyHeld = false;
      this.slideElapsedTime = 0;

      this.vy = JUMP_VELOCITY;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.hasJumpedInAir = true;
      this.jumpBufferTimer = 0;

      soundManager.playJump();
      return true;
    } else {
      // In air: store input in jump buffer
      this.jumpBufferTimer = JUMP_BUFFER_DURATION;
      return false;
    }
  }

  public slide(): boolean {
    if (this.isCrashed) return false;
    // Cannot initiate slide in mid-air
    if (!this.isGrounded) return false;

    this.slideKeyHeld = true;

    // If already sliding, holding key keeps it active without restarting timer
    if (this.isSliding) {
      return true;
    }

    this.isSliding = true;
    this.slideElapsedTime = 0;
    soundManager.playSlide();
    return true;
  }

  public stopSlide() {
    this.slideKeyHeld = false;
    // If the slide has already run for at least the minimum duration, end it now.
    // Otherwise, it will naturally continue until SLIDE_MIN_DURATION in update().
    if (this.slideElapsedTime >= SLIDE_MIN_DURATION) {
      this.isSliding = false;
      this.slideElapsedTime = 0;
    }
  }

  public crash() {
    if (this.isCrashed) return;
    this.isCrashed = true;
    this.isSliding = false;
    this.slideKeyHeld = false;
    this.crashVx = -120;
    this.crashVy = -320;
    soundManager.playCrash();
  }

  public update(dt: number, speed: number) {
    if (this.isCrashed) {
      // Tumble backwards on crash
      this.crashVy += GRAVITY * dt;
      this.x += this.crashVx * dt;
      this.y += this.crashVy * dt;
      this.crashRotation += 8 * dt;
      if (this.y > GROUND_Y) {
        this.y = GROUND_Y;
        this.crashVx *= 0.8;
      }
      return;
    }

    // Update Jump Buffer timer
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
      if (this.jumpBufferTimer < 0) {
        this.jumpBufferTimer = 0;
      }
    }

    // Update Coyote timer
    if (this.isGrounded) {
      this.coyoteTimer = COYOTE_DURATION;
      this.hasJumpedInAir = false;
    } else {
      if (this.coyoteTimer > 0) {
        this.coyoteTimer -= dt;
      }
    }

    // Handle sliding duration & state
    if (this.isSliding) {
      this.slideElapsedTime += dt;

      // Check max duration (capped even if holding key)
      if (this.slideElapsedTime >= SLIDE_MAX_DURATION) {
        this.isSliding = false;
        this.slideKeyHeld = false;
        this.slideElapsedTime = 0;
      }
      // Check min duration if key is no longer held
      else if (!this.slideKeyHeld && this.slideElapsedTime >= SLIDE_MIN_DURATION) {
        this.isSliding = false;
        this.slideElapsedTime = 0;
      }
    }

    // Handle jumping & gravity
    if (!this.isGrounded) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;

      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
        if (!this.isGrounded) {
          this.justLanded = true;
        }
        this.isGrounded = true;
        this.hasJumpedInAir = false;

        // Check buffered jump upon landing
        if (this.jumpBufferTimer > 0) {
          this.jumpBufferTimer = 0;
          this.jump();
        }
      }
    }

    // Update running animation cycle
    if (this.isGrounded && !this.isSliding) {
      this.runCycle += dt * (speed / 32);
    }

    // Update motion trail ghosts
    for (let i = this.trailGhosts.length - 1; i >= 0; i--) {
      const g = this.trailGhosts[i];
      g.alpha -= dt * 2.8;
      g.x -= speed * dt * 0.22;
      if (g.alpha <= 0) {
        this.trailGhosts.splice(i, 1);
      }
    }

    // Invulnerability grace countdown
    if (this.invulnerableGraceTimer > 0) {
      this.invulnerableGraceTimer -= dt;
    }

    if (!this.isCrashed && (speed > 420 || !this.isGrounded || this.isSliding || this.isSpeedBoosted)) {
      this.trailTimer += dt;
      if (this.trailTimer >= (this.isSpeedBoosted ? 0.035 : 0.055)) {
        this.trailTimer = 0;
        this.trailGhosts.push({
          x: this.x - 10,
          y: this.y,
          pose: this.getPose(),
          runCycle: this.runCycle,
          alpha: this.isSpeedBoosted ? 0.45 : 0.26,
        });
        if (this.trailGhosts.length > (this.isSpeedBoosted ? 5 : 3)) {
          this.trailGhosts.shift();
        }
      }
    }
  }

  public getPose(): PlayerPose {
    if (this.isCrashed) return 'CRASHED';
    if (this.isSliding) return 'SLIDING';
    if (!this.isGrounded) {
      return this.vy < 0 ? 'JUMPING' : 'FALLING';
    }
    return 'RUNNING';
  }

  public getHitbox(): BoundingBox {
    if (this.isSliding) {
      // Low bounding box hugging the ground exactly aligned with feet at GROUND_Y
      return {
        x: this.x - PLAYER_WIDTH_SLIDE / 2,
        y: this.y - PLAYER_HEIGHT_SLIDE,
        width: PLAYER_WIDTH_SLIDE,
        height: PLAYER_HEIGHT_SLIDE,
      };
    }

    // Upright running/jumping hitbox with fair margin
    return {
      x: this.x - PLAYER_WIDTH_RUN / 2,
      y: this.y - PLAYER_HEIGHT_RUN,
      width: PLAYER_WIDTH_RUN,
      height: PLAYER_HEIGHT_RUN,
    };
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Flicker when in invulnerable grace period
    if (this.invulnerableGraceTimer > 0) {
      const flicker = Math.floor(Date.now() / 70) % 2 === 0;
      if (flicker) {
        ctx.globalAlpha = 0.4;
      }
    }

    // Draw futuristic motion trail ghosts
    for (const ghost of this.trailGhosts) {
      this.drawTrailGhost(ctx, ghost);
    }

    // Draw stickman with active cosmetic skin
    drawStickman(
      ctx,
      this.x,
      this.y,
      this.getPose(),
      this.runCycle,
      this.skinId,
      {
        isAscending: this.vy < 0,
        crashRotation: this.crashRotation,
      }
    );

    // Draw energy shield barrier if active
    if (this.hasShield) {
      this.drawShieldBarrier(ctx);
    }

    ctx.restore();
  }

  private drawShieldBarrier(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const centerY = this.isSliding ? this.y - 14 : this.y - 34;
    const radiusX = this.isSliding ? 34 : 26;
    const radiusY = this.isSliding ? 20 : 38;

    ctx.shadowColor = '#06B6D4';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.ellipse(this.x + (this.isSliding ? 6 : 0), centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fill();

    // Pulse ring
    const pulse = (Math.sin(Date.now() * 0.006) + 1) * 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(this.x + (this.isSliding ? 6 : 0), centerY, radiusX + pulse, radiusY + pulse, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private drawTrailGhost(
    ctx: CanvasRenderingContext2D,
    ghost: { x: number; y: number; pose: PlayerPose; runCycle: number; alpha: number }
  ) {
    ctx.save();
    ctx.globalAlpha = ghost.alpha;
    const skinStyle = getSkinStyle(this.skinId);

    ctx.strokeStyle = skinStyle.trailColor;
    ctx.fillStyle = skinStyle.bodyStroke;
    ctx.shadowColor = skinStyle.trailColor;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.5;

    if (ghost.pose === 'SLIDING') {
      const ground = ghost.y;
      ctx.beginPath();
      ctx.arc(ghost.x - 18, ground - 14, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ghost.x - 10, ground - 11);
      ctx.lineTo(ghost.x + 8, ground - 8);
      ctx.lineTo(ghost.x + 28, ground - 3);
      ctx.stroke();
    } else if (ghost.pose === 'JUMPING' || ghost.pose === 'FALLING') {
      ctx.beginPath();
      ctx.arc(ghost.x + 3, ghost.y - 58, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ghost.x + 1, ghost.y - 48);
      ctx.lineTo(ghost.x, ghost.y - 26);
      ctx.lineTo(ghost.x + 10, ghost.y - 12);
      ctx.stroke();
    } else {
      const bob = Math.abs(Math.sin(ghost.runCycle)) * 3;
      const baseY = ghost.y - bob;
      ctx.beginPath();
      ctx.arc(ghost.x + 3, baseY - 62, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ghost.x + 1, baseY - 52);
      ctx.lineTo(ghost.x - 2, baseY - 28);
      ctx.lineTo(ghost.x + 8, baseY - 8);
      ctx.stroke();
    }

    ctx.restore();
  }
}

