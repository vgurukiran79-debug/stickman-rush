/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mission, Achievement, MissionNotification } from './missions.ts';
import { SkinId } from './skin.ts';
import { TrackId } from './track.ts';

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

export type PowerUpType = 'SHIELD' | 'MAGNET' | 'SPEED';

export interface PowerUp {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  angle: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
  maxDuration: number;
}

export interface GameStats {
  distance: number;
  coinsCollected: number;
  bestDistance: number;
  totalCoins: number;
  speed: number;
  isNewBest: boolean;
  activePowerUp: ActivePowerUp | null;
  missions: Mission[];
  achievements: Achievement[];
  activeNotifications: MissionNotification[];
  runObstaclesDodged: number;
  runActiveTime: number;
  equippedSkinId: SkinId;
  unlockedSkins: SkinId[];
  equippedTrackId: TrackId;
  unlockedTracks: TrackId[];
  canClaimDailyReward: boolean;
}
