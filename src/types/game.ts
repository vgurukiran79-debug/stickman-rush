/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type PlayerPose = 'RUNNING' | 'JUMPING' | 'FALLING' | 'SLIDING' | 'CRASHED';

export type ObstacleType = 
  | 'GROUND_CRATE' 
  | 'GROUND_SPIKES' 
  | 'GROUND_BARRIER' 
  | 'OVERHEAD_BEAM' 
  | 'OVERHEAD_LASER';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Obstacle {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  // Bounding box for exact collision detection
  hitbox: BoundingBox;
  passed: boolean;
  glowColor: string;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  angle: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'bone' | 'ring';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface GameStats {
  distance: number;
  coinsCollected: number;
  bestDistance: number;
  totalCoins: number;
  speed: number;
  isNewBest: boolean;
}
