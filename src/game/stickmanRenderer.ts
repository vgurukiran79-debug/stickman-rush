/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerPose } from '../types/game.ts';
import { SkinId, SKINS_CATALOG } from '../types/skin.ts';

export interface SkinStyle {
  bodyStroke: string;
  outerStroke: string;
  headFill: string;
  eyeColor: string;
  glowColor: string;
  trailColor: string;
  lineWidthInner: number;
  lineWidthOuter: number;
}

export function getSkinStyle(skinId: SkinId): SkinStyle {
  switch (skinId) {
    case 'crimson':
      return {
        bodyStroke: '#FF6B8B',
        outerStroke: '#450A0A',
        headFill: '#FF4D6D',
        eyeColor: '#EF4444',
        glowColor: 'rgba(239, 68, 68, 0.75)',
        trailColor: '#EF4444',
        lineWidthInner: 3.5,
        lineWidthOuter: 5.5,
      };
    case 'neon':
      return {
        bodyStroke: '#A5F3FC',
        outerStroke: '#082F49',
        headFill: '#BAE6FD',
        eyeColor: '#00F0FF',
        glowColor: 'rgba(0, 240, 255, 0.85)',
        trailColor: '#00F0FF',
        lineWidthInner: 3.8,
        lineWidthOuter: 5.5,
      };
    case 'ninja':
      return {
        // High-contrast stealth: obsidian body bounded by crisp luminous gold edge outline
        bodyStroke: '#3F3F46',
        outerStroke: '#FDE047',
        headFill: '#18181B',
        eyeColor: '#F59E0B',
        glowColor: 'rgba(245, 158, 11, 0.8)',
        trailColor: '#F59E0B',
        lineWidthInner: 3.5,
        lineWidthOuter: 6.0,
      };
    case 'cyber':
      return {
        bodyStroke: '#F8FAFC',
        outerStroke: '#0F172A',
        headFill: '#E2E8F0',
        eyeColor: '#10B981',
        glowColor: 'rgba(16, 185, 129, 0.85)',
        trailColor: '#10B981',
        lineWidthInner: 4.2,
        lineWidthOuter: 6.5,
      };
    case 'classic':
    default:
      return {
        bodyStroke: '#FFFFFF',
        outerStroke: '#020617',
        headFill: '#FFFFFF',
        eyeColor: '#06B6D4',
        glowColor: 'rgba(6, 182, 212, 0.6)',
        trailColor: '#06B6D4',
        lineWidthInner: 3.5,
        lineWidthOuter: 5.5,
      };
  }
}

/**
 * Draws the stickman character with skin-specific cosmetic variations.
 * Physics and hitboxes remain completely untouched.
 */
export function drawStickman(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pose: PlayerPose,
  runCycle: number,
  skinId: SkinId = 'classic',
  options: { isAscending?: boolean; crashRotation?: number } = {}
) {
  ctx.save();
  const style = getSkinStyle(skinId);

  if (pose === 'CRASHED') {
    drawCrashed(ctx, x, y, options.crashRotation || 0, style);
  } else if (pose === 'SLIDING') {
    drawSliding(ctx, x, y, skinId, style, runCycle);
  } else if (pose === 'JUMPING' || pose === 'FALLING') {
    drawJumping(ctx, x, y, options.isAscending ?? (pose === 'JUMPING'), skinId, style, runCycle);
  } else {
    drawRunning(ctx, x, y, runCycle, skinId, style);
  }

  ctx.restore();
}

/**
 * Procedural helper to draw a two-segment limb (e.g. arm or leg)
 */
function drawLimb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  style: SkinStyle,
  alpha: number = 1.0,
  skinId: SkinId = 'classic'
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = alpha;

  // Outer outline
  ctx.strokeStyle = style.outerStroke;
  ctx.lineWidth = style.lineWidthOuter;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.stroke();

  // Ninja highlight border for maximum contrast against dark road
  if (skinId === 'ninja') {
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 4.8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  }

  // Inner body armature
  ctx.strokeStyle = style.bodyStroke;
  ctx.lineWidth = style.lineWidthInner;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.stroke();

  // Skin-specific joint highlights (Neon / Cyber)
  if (skinId === 'neon') {
    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x2, y2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (skinId === 'cyber') {
    // Armored knee/elbow plate
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(x2 - 2, y2 - 2, 4, 4);
  }

  ctx.restore();
}

function drawRunning(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cycle: number,
  skinId: SkinId,
  style: SkinStyle
) {
  const bob = Math.abs(Math.sin(cycle)) * 3;
  const baseY = y - bob;

  const headY = baseY - 62;
  const neckY = baseY - 52;
  const hipX = x - 2;
  const hipY = baseY - 28;

  const legSwing = Math.sin(cycle);
  const armSwing = -legSwing;

  // 1. Back Arm (left)
  const backShoulderX = x - 1;
  const backShoulderY = neckY + 4;
  const backElbowAngle = armSwing * 0.85 - 0.4;
  const backElbowX = backShoulderX + Math.sin(backElbowAngle) * 11;
  const backElbowY = backShoulderY + Math.cos(backElbowAngle) * 11;
  const backHandAngle = backElbowAngle - 0.9;
  const backHandX = backElbowX + Math.sin(backHandAngle) * 10;
  const backHandY = backElbowY + Math.cos(backHandAngle) * 10;
  drawLimb(ctx, backShoulderX, backShoulderY, backElbowX, backElbowY, backHandX, backHandY, style, 0.7, skinId);

  // 2. Back Leg (left)
  const backHipAngle = -legSwing * 0.95 + 0.1;
  const backKneeX = hipX + Math.sin(backHipAngle) * 14;
  const backKneeY = hipY + Math.cos(backHipAngle) * 14;
  const backFootAngle = backHipAngle < 0 ? backHipAngle - 0.8 : backHipAngle + 0.3;
  const backFootX = backKneeX + Math.sin(backFootAngle) * 14;
  const backFootY = Math.min(y, backKneeY + Math.cos(backFootAngle) * 14);
  drawLimb(ctx, hipX, hipY, backKneeX, backKneeY, backFootX, backFootY, style, 0.7, skinId);

  // 3. Ninja Katana on Back
  if (skinId === 'ninja') {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(x - 8, neckY - 4);
    ctx.lineTo(hipX - 10, hipY + 12);
    ctx.stroke();

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x - 8, neckY - 4);
    ctx.lineTo(hipX - 10, hipY + 12);
    ctx.stroke();

    // Hilt wrap
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 8, neckY - 4);
    ctx.lineTo(x - 12, neckY - 12);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Torso
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = style.outerStroke;
  ctx.lineWidth = style.lineWidthOuter + 0.5;
  ctx.beginPath();
  ctx.moveTo(x + 1, neckY);
  ctx.lineTo(hipX, hipY);
  ctx.stroke();

  if (skinId === 'ninja') {
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(x + 1, neckY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();
  }

  ctx.strokeStyle = style.bodyStroke;
  ctx.lineWidth = style.lineWidthInner + 0.5;
  ctx.beginPath();
  ctx.moveTo(x + 1, neckY);
  ctx.lineTo(hipX, hipY);
  ctx.stroke();

  // Cyber Chest Arc Reactor
  if (skinId === 'cyber') {
    const midX = (x + 1 + hipX) / 2;
    const midY = (neckY + hipY) / 2;
    ctx.fillStyle = '#10B981';
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(midX + 1, midY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  // 5. Head
  ctx.save();
  ctx.fillStyle = style.headFill;
  ctx.strokeStyle = style.outerStroke;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = style.glowColor;
  ctx.shadowBlur = 8;

  if (skinId === 'ninja') {
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.5;
  }

  ctx.beginPath();
  ctx.arc(x + 3, headY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eye / Visor
  if (skinId === 'neon') {
    // Dual Horizontal Neon Visor
    ctx.fillStyle = style.eyeColor;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 7;
    ctx.fillRect(x + 4, headY - 2, 7, 3);
  } else if (skinId === 'ninja') {
    // Glowing amber shinobi eye slit
    ctx.fillStyle = '#F59E0B';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x + 6.5, headY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(x + 7, headY - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (skinId === 'cyber') {
    // Angular cyber visor
    ctx.fillStyle = style.eyeColor;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(x + 4, headY - 2);
    ctx.lineTo(x + 9, headY - 2);
    ctx.lineTo(x + 7, headY + 1);
    ctx.closePath();
    ctx.fill();
  } else {
    // Classic & Crimson ocular sensor
    ctx.fillStyle = style.eyeColor;
    ctx.shadowColor = style.eyeColor;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(x + 7, headY - 1, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 6. Dynamic Scarf (Crimson) or Headband Ribbons (Ninja)
  if (skinId === 'crimson') {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3.5;

    const wave1 = Math.sin(cycle * 2.5) * 5;
    const wave2 = Math.cos(cycle * 2.5) * 7;
    ctx.beginPath();
    ctx.moveTo(x - 1, neckY + 2);
    ctx.quadraticCurveTo(x - 14, neckY - 2 + wave1, x - 26, neckY + 4 + wave2);
    ctx.stroke();

    ctx.strokeStyle = '#FFA8BA';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  } else if (skinId === 'ninja') {
    // Twin ninja headband ribbons fluttering behind
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#F59E0B';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.2;

    const ribbonWave1 = Math.sin(cycle * 3) * 6;
    const ribbonWave2 = Math.cos(cycle * 3 + 1) * 7;

    // Top ribbon
    ctx.beginPath();
    ctx.moveTo(x - 5, headY + 2);
    ctx.quadraticCurveTo(x - 16, headY - 2 + ribbonWave1, x - 28, headY + 2 + ribbonWave1);
    ctx.stroke();

    // Bottom ribbon
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - 5, headY + 4);
    ctx.quadraticCurveTo(x - 14, headY + 6 + ribbonWave2, x - 24, headY + 12 + ribbonWave2);
    ctx.stroke();
    ctx.restore();
  }

  // 7. Cyber Armor Shoulder Pauldrons
  if (skinId === 'cyber') {
    ctx.save();
    ctx.fillStyle = '#CBD5E1';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    // Front shoulder pad
    ctx.beginPath();
    ctx.ellipse(x + 1, neckY + 4, 5, 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 8. Front Leg (right)
  const frontHipAngle = legSwing * 0.95 + 0.1;
  const frontKneeX = hipX + Math.sin(frontHipAngle) * 14;
  const frontKneeY = hipY + Math.cos(frontHipAngle) * 14;
  const frontFootAngle = frontHipAngle < 0 ? frontHipAngle - 0.8 : frontHipAngle + 0.3;
  const frontFootX = frontKneeX + Math.sin(frontFootAngle) * 14;
  const frontFootY = Math.min(y, frontKneeY + Math.cos(frontFootAngle) * 14);
  drawLimb(ctx, hipX, hipY, frontKneeX, frontKneeY, frontFootX, frontFootY, style, 1.0, skinId);

  // 9. Front Arm (right)
  const frontShoulderX = x + 1;
  const frontShoulderY = neckY + 4;
  const frontElbowAngle = -armSwing * 0.85 - 0.4;
  const frontElbowX = frontShoulderX + Math.sin(frontElbowAngle) * 11;
  const frontElbowY = frontShoulderY + Math.cos(frontElbowAngle) * 11;
  const frontHandAngle = frontElbowAngle - 0.9;
  const frontHandX = frontElbowX + Math.sin(frontHandAngle) * 10;
  const frontHandY = frontElbowY + Math.cos(frontHandAngle) * 10;
  drawLimb(ctx, frontShoulderX, frontShoulderY, frontElbowX, frontElbowY, frontHandX, frontHandY, style, 1.0, skinId);
}

function drawJumping(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isAscending: boolean,
  skinId: SkinId,
  style: SkinStyle,
  runCycle: number
) {
  const headY = y - 58;
  const neckY = y - 48;
  const hipX = x;
  const hipY = y - 26;

  // 1. Ninja Katana on Back
  if (skinId === 'ninja') {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(x - 8, neckY - 6);
    ctx.lineTo(hipX - 12, hipY + 14);
    ctx.stroke();

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(x - 8, neckY - 6);
    ctx.lineTo(hipX - 12, hipY + 14);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Torso
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = style.outerStroke;
  ctx.lineWidth = style.lineWidthOuter + 0.5;
  ctx.beginPath();
  ctx.moveTo(x + (isAscending ? 3 : 1), neckY);
  ctx.lineTo(hipX, hipY);
  ctx.stroke();

  if (skinId === 'ninja') {
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(x + (isAscending ? 3 : 1), neckY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();
  }

  ctx.strokeStyle = style.bodyStroke;
  ctx.lineWidth = style.lineWidthInner + 0.5;
  ctx.beginPath();
  ctx.moveTo(x + (isAscending ? 3 : 1), neckY);
  ctx.lineTo(hipX, hipY);
  ctx.stroke();

  // Cyber Chest Arc Reactor
  if (skinId === 'cyber') {
    ctx.fillStyle = '#10B981';
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(hipX + 1, (neckY + hipY) / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Head
  ctx.save();
  ctx.fillStyle = style.headFill;
  ctx.strokeStyle = style.outerStroke;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = style.glowColor;
  ctx.shadowBlur = 8;

  if (skinId === 'ninja') {
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.5;
  }

  ctx.beginPath();
  ctx.arc(x + 3, headY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eye visor
  if (skinId === 'neon') {
    ctx.fillStyle = style.eyeColor;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 7;
    ctx.fillRect(x + 4, headY - 2, 7, 3);
  } else if (skinId === 'ninja') {
    ctx.fillStyle = '#F59E0B';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x + 6.5, headY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(x + 7, headY - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (skinId === 'cyber') {
    ctx.fillStyle = style.eyeColor;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(x + 4, headY - 2);
    ctx.lineTo(x + 9, headY - 2);
    ctx.lineTo(x + 7, headY + 1);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = style.eyeColor;
    ctx.beginPath();
    ctx.arc(x + 7, headY - 1, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. Dynamic accessories in air
  if (skinId === 'crimson') {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x - 1, neckY + 2);
    ctx.quadraticCurveTo(x - 16, neckY + 10, x - 28, neckY + 18);
    ctx.stroke();
    ctx.restore();
  } else if (skinId === 'ninja') {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#F59E0B';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x - 5, headY + 2);
    ctx.quadraticCurveTo(x - 18, headY + 8, x - 26, headY + 16);
    ctx.stroke();
    ctx.restore();
  }

  // 5. Limbs in jumping pose
  if (isAscending) {
    drawLimb(ctx, x - 2, neckY + 4, x - 12, neckY - 12, x - 18, neckY - 24, style, 1.0, skinId);
    drawLimb(ctx, x + 2, neckY + 4, x + 10, neckY - 10, x + 18, neckY - 22, style, 1.0, skinId);

    drawLimb(ctx, hipX, hipY, hipX - 12, hipY + 10, hipX - 6, hipY + 22, style, 1.0, skinId);
    drawLimb(ctx, hipX, hipY, hipX + 12, hipY + 8, hipX + 18, hipY + 20, style, 1.0, skinId);
  } else {
    drawLimb(ctx, x - 2, neckY + 4, x - 16, neckY + 2, x - 24, neckY - 8, style, 1.0, skinId);
    drawLimb(ctx, x + 2, neckY + 4, x + 12, neckY + 8, x + 18, neckY + 16, style, 1.0, skinId);

    drawLimb(ctx, hipX, hipY, hipX - 8, hipY + 14, hipX - 6, hipY + 26, style, 1.0, skinId);
    drawLimb(ctx, hipX, hipY, hipX + 6, hipY + 14, hipX + 10, hipY + 26, style, 1.0, skinId);
  }
}

function drawSliding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  skinId: SkinId,
  style: SkinStyle,
  runCycle: number
) {
  const ground = y;
  const headX = x - 18;
  const headY = ground - 14;
  const neckX = x - 10;
  const neckY = ground - 11;
  const hipX = x + 8;
  const hipY = ground - 8;

  const drawSlideLine = (x1: number, y1: number, x2: number, y2: number, width: number = 3.5) => {
    ctx.save();
    ctx.lineCap = 'round';

    ctx.strokeStyle = style.outerStroke;
    ctx.lineWidth = width + 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (skinId === 'ninja') {
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = width + 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.strokeStyle = style.bodyStroke;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  // 1. Back Arm (bracing behind)
  drawSlideLine(neckX, neckY, neckX - 12, ground - 5, 3);

  // 2. Torso (low horizontal angle)
  drawSlideLine(neckX, neckY, hipX, hipY, 4);

  // Cyber Core during slide
  if (skinId === 'cyber') {
    ctx.save();
    ctx.fillStyle = '#10B981';
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc((neckX + hipX) / 2, (neckY + hipY) / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Head
  ctx.save();
  ctx.fillStyle = style.headFill;
  ctx.strokeStyle = style.outerStroke;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = style.glowColor;
  ctx.shadowBlur = 8;

  if (skinId === 'ninja') {
    ctx.strokeStyle = '#FDE047';
  }

  ctx.beginPath();
  ctx.arc(headX, headY, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eye visor
  if (skinId === 'neon') {
    ctx.fillStyle = style.eyeColor;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 6;
    ctx.fillRect(headX + 2, headY - 1.5, 5, 2.5);
  } else if (skinId === 'ninja') {
    ctx.fillStyle = '#F59E0B';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(headX + 4, headY - 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = style.eyeColor;
    ctx.beginPath();
    ctx.arc(headX + 4, headY - 1, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. Fluttering Scarf / Ribbons streaming above sliding player
  if (skinId === 'crimson') {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(neckX, neckY);
    ctx.quadraticCurveTo(neckX - 14, neckY - 8, neckX - 26, neckY - 6);
    ctx.stroke();
    ctx.restore();
  } else if (skinId === 'ninja') {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#F59E0B';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX, headY - 2);
    ctx.quadraticCurveTo(headX - 12, headY - 8, headX - 24, headY - 6);
    ctx.stroke();
    ctx.restore();
  }

  // 5. Legs (extended forward along the ground)
  drawSlideLine(hipX, hipY, hipX + 16, ground - 6, 3.5);
  drawSlideLine(hipX + 16, ground - 6, hipX + 32, ground - 3, 3.5);

  drawSlideLine(hipX, hipY, hipX + 12, ground - 4, 3.5);
  drawSlideLine(hipX + 12, ground - 4, hipX + 26, ground - 2, 3.5);

  // 6. Front Arm
  drawSlideLine(neckX, neckY, neckX + 14, ground - 6, 3.5);
}

function drawCrashed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  style: SkinStyle
) {
  ctx.save();
  ctx.translate(x, y - 30);
  ctx.rotate(rotation);

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
