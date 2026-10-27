/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Particle, FloatingText } from '../types/game.ts';

export class ParticleManager {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private nextTextId: number = 1;

  public reset() {
    this.particles = [];
    this.floatingTexts = [];
  }

  public addCoinBurst(x: number, y: number) {
    // Sparkling gold particles
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.4;
      const speed = 70 + Math.random() * 110;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#FBBF24' : '#FDE047',
        alpha: 1,
        shape: 'spark',
      });
    }

    // Floating text indicator
    this.floatingTexts.push({
      id: this.nextTextId++,
      x,
      y: y - 10,
      text: '+1 COIN',
      color: '#FBBF24',
      life: 0.8,
      maxLife: 0.8,
    });
  }

  public addSlideSparks(x: number, y: number) {
    // Sparks and cyan/violet smoke behind feet
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x - 12 + Math.random() * 8,
        y: y - 2 + Math.random() * 4,
        vx: -150 - Math.random() * 90,
        vy: -25 - Math.random() * 45,
        life: 0.22 + Math.random() * 0.15,
        maxLife: 0.37,
        size: 2 + Math.random() * 2.5,
        color: Math.random() > 0.5 ? '#A78BFA' : '#06B6D4',
        alpha: 1,
        shape: 'spark',
      });
    }
  }

  public addLandingShockwave(x: number, y: number) {
    // Expanding neon cyan shockwave rings on ground
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.26,
      maxLife: 0.26,
      size: 4,
      color: '#06B6D4',
      alpha: 1,
      shape: 'ring',
    });

    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.22,
      maxLife: 0.22,
      size: 2,
      color: '#A78BFA',
      alpha: 0.9,
      shape: 'ring',
    });

    // Lateral ground puffs
    for (let i = 0; i < 4; i++) {
      const dir = i % 2 === 0 ? -1 : 1;
      this.particles.push({
        x: x + dir * 6,
        y: y - 2,
        vx: dir * (50 + Math.random() * 50),
        vy: -15 - Math.random() * 20,
        life: 0.2,
        maxLife: 0.2,
        size: 2.5 + Math.random() * 2,
        color: '#38BDF8',
        alpha: 0.7,
        shape: 'smoke',
      });
    }
  }

  public addRunPuff(x: number, y: number) {
    this.particles.push({
      x: x - 6,
      y: y - 2,
      vx: -60 - Math.random() * 40,
      vy: -10 - Math.random() * 15,
      life: 0.22,
      maxLife: 0.22,
      size: 3 + Math.random() * 2,
      color: '#94A3B8',
      alpha: 0.4,
      shape: 'smoke',
    });
  }

  public addCrashBurst(x: number, y: number) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        size: 3 + Math.random() * 4,
        color: i % 3 === 0 ? '#EF4444' : i % 3 === 1 ? '#F97316' : '#FFFFFF',
        alpha: 1,
        shape: 'spark',
      });
    }

    this.floatingTexts.push({
      id: this.nextTextId++,
      x,
      y: y - 30,
      text: 'CRASH!',
      color: '#EF4444',
      life: 1.0,
      maxLife: 1.0,
    });
  }

  public update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.shape === 'spark') {
        p.vy += 320 * dt; // gravity on sparks
      } else if (p.shape === 'smoke') {
        p.size += 6 * dt; // smoke expands
      } else if (p.shape === 'ring') {
        p.size += 90 * dt; // shockwave expands outward
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y -= 38 * dt; // float upwards
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.shape === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    // Draw floating texts
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'center';
    for (const t of this.floatingTexts) {
      ctx.save();
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 8;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
