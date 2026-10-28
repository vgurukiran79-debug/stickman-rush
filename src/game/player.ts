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
import { soundManager } from '../audio/soundManager.ts';

export class Player {
  public x: number = PLAYER_X;
  public y: number = GROUND_Y;
  public vy: number = 0;
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

    if (this.isCrashed) {
      this.drawCrashed(ctx);
      ctx.restore();
      return;
    }

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

    if (this.isSliding) {
      this.drawSliding(ctx);
    } else if (!this.isGrounded) {
      this.drawJumping(ctx);
    } else {
      this.drawRunning(ctx);
    }

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

  private drawTrailGhost(ctx: CanvasRenderingContext2D, ghost: { x: number; y: number; pose: PlayerPose; runCycle: number; alpha: number }) {
    ctx.save();
    ctx.globalAlpha = ghost.alpha;
    ctx.strokeStyle = '#06B6D4';
    ctx.fillStyle = '#22D3EE';
    ctx.shadowColor = '#06B6D4';
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

  private drawRunning(ctx: CanvasRenderingContext2D) {
    const cycle = this.runCycle;
    const bob = Math.abs(Math.sin(cycle)) * 3;
    const baseY = this.y - bob;

    const headY = baseY - 62;
    const neckY = baseY - 52;
    const hipX = this.x - 2;
    const hipY = baseY - 28;

    const legSwing = Math.sin(cycle);
    const armSwing = -legSwing;

    const drawLimb = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, alpha: number = 1) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = alpha;

      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();

      ctx.restore();
    };

    // 1. Back Arm (left)
    const backShoulderX = this.x - 1;
    const backShoulderY = neckY + 4;
    const backElbowAngle = armSwing * 0.85 - 0.4;
    const backElbowX = backShoulderX + Math.sin(backElbowAngle) * 11;
    const backElbowY = backShoulderY + Math.cos(backElbowAngle) * 11;
    const backHandAngle = backElbowAngle - 0.9;
    const backHandX = backElbowX + Math.sin(backHandAngle) * 10;
    const backHandY = backElbowY + Math.cos(backHandAngle) * 10;
    drawLimb(backShoulderX, backShoulderY, backElbowX, backElbowY, backHandX, backHandY, 0.7);

    // 2. Back Leg (left)
    const backHipAngle = -legSwing * 0.95 + 0.1;
    const backKneeX = hipX + Math.sin(backHipAngle) * 14;
    const backKneeY = hipY + Math.cos(backHipAngle) * 14;
    const backFootAngle = backHipAngle < 0 ? backHipAngle - 0.8 : backHipAngle + 0.3;
    const backFootX = backKneeX + Math.sin(backFootAngle) * 14;
    const backFootY = Math.min(this.y, backKneeY + Math.cos(backFootAngle) * 14);
    drawLimb(hipX, hipY, backKneeX, backKneeY, backFootX, backFootY, 0.7);

    // 3. Torso
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(this.x + 1, neckY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + 1, neckY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();
    ctx.restore();

    // 4. Head
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x + 3, headY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#06B6D4';
    ctx.shadowColor = '#06B6D4';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(this.x + 7, headY - 1, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Front Leg (right)
    const frontHipAngle = legSwing * 0.95 + 0.1;
    const frontKneeX = hipX + Math.sin(frontHipAngle) * 14;
    const frontKneeY = hipY + Math.cos(frontHipAngle) * 14;
    const frontFootAngle = frontHipAngle < 0 ? frontHipAngle - 0.8 : frontHipAngle + 0.3;
    const frontFootX = frontKneeX + Math.sin(frontFootAngle) * 14;
    const frontFootY = Math.min(this.y, frontKneeY + Math.cos(frontFootAngle) * 14);
    drawLimb(hipX, hipY, frontKneeX, frontKneeY, frontFootX, frontFootY, 1.0);

    // 6. Front Arm (right)
    const frontShoulderX = this.x + 1;
    const frontShoulderY = neckY + 4;
    const frontElbowAngle = -armSwing * 0.85 - 0.4;
    const frontElbowX = frontShoulderX + Math.sin(frontElbowAngle) * 11;
    const frontElbowY = frontShoulderY + Math.cos(frontElbowAngle) * 11;
    const frontHandAngle = frontElbowAngle - 0.9;
    const frontHandX = frontElbowX + Math.sin(frontHandAngle) * 10;
    const frontHandY = frontElbowY + Math.cos(frontHandAngle) * 10;
    drawLimb(frontShoulderX, frontShoulderY, frontElbowX, frontElbowY, frontHandX, frontHandY, 1.0);
  }

  private drawJumping(ctx: CanvasRenderingContext2D) {
    const isAscending = this.vy < 0;
    const headY = this.y - 58;
    const neckY = this.y - 48;
    const hipX = this.x;
    const hipY = this.y - 26;

    const drawLimb = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.stroke();
      ctx.restore();
    };

    // Torso
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(this.x + (isAscending ? 3 : 1), neckY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + (isAscending ? 3 : 1), neckY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();
    ctx.restore();

    // Head
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x + 3, headY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye visor
    ctx.fillStyle = '#06B6D4';
    ctx.beginPath();
    ctx.arc(this.x + 7, headY - 1, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (isAscending) {
      drawLimb(this.x - 2, neckY + 4, this.x - 12, neckY - 12, this.x - 18, neckY - 24);
      drawLimb(this.x + 2, neckY + 4, this.x + 10, neckY - 10, this.x + 18, neckY - 22);

      drawLimb(hipX, hipY, hipX - 12, hipY + 10, hipX - 6, hipY + 22);
      drawLimb(hipX, hipY, hipX + 12, hipY + 8, hipX + 18, hipY + 20);
    } else {
      drawLimb(this.x - 2, neckY + 4, this.x - 16, neckY + 2, this.x - 24, neckY - 8);
      drawLimb(this.x + 2, neckY + 4, this.x + 12, neckY + 8, this.x + 18, neckY + 16);

      drawLimb(hipX, hipY, hipX - 8, hipY + 14, hipX - 6, hipY + 26);
      drawLimb(hipX, hipY, hipX + 6, hipY + 14, hipX + 10, hipY + 26);
    }
  }

  private drawSliding(ctx: CanvasRenderingContext2D) {
    // Sliding pose: character is streamlined horizontally along the ground
    const ground = this.y;
    const headX = this.x - 18;
    const headY = ground - 14;
    const neckX = this.x - 10;
    const neckY = ground - 11;
    const hipX = this.x + 8;
    const hipY = ground - 8;

    const drawLine = (x1: number, y1: number, x2: number, y2: number, width: number = 3.5) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = width + 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    // 1. Back Arm (bracing behind)
    drawLine(neckX, neckY, neckX - 12, ground - 5, 3);

    // 2. Torso (low horizontal angle)
    drawLine(neckX, neckY, hipX, hipY, 4);

    // 3. Head (tucked low, peak height at ground - 20)
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(headX, headY, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye visor
    ctx.fillStyle = '#A78BFA';
    ctx.beginPath();
    ctx.arc(headX + 4, headY - 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Legs (extended forward along the ground)
    drawLine(hipX, hipY, hipX + 16, ground - 6, 3.5);
    drawLine(hipX + 16, ground - 6, hipX + 32, ground - 3, 3.5);

    drawLine(hipX, hipY, hipX + 12, ground - 4, 3.5);
    drawLine(hipX + 12, ground - 4, hipX + 26, ground - 2, 3.5);

    // 5. Front Arm (extended forward for balance)
    drawLine(neckX, neckY, neckX + 14, ground - 6, 3.5);
  }

  private drawCrashed(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y - 30);
    ctx.rotate(this.crashRotation);

    ctx.strokeStyle = '#EF4444';
    ctx.fillStyle = '#F87171';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(0, -25, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Flailing arms
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-18, -25);
    ctx.moveTo(0, -12);
    ctx.lineTo(20, -5);
    ctx.stroke();

    // Flailing legs
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-20, 26);
    ctx.moveTo(0, 10);
    ctx.lineTo(16, 28);
    ctx.stroke();

    ctx.restore();
  }
}
