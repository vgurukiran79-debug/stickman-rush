/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MissionCategory = 'DISTANCE' | 'COLLECTION' | 'SURVIVAL';
export type MissionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Mission {
  id: string;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  title: string;
  description: string;
  target: number;
  unit: string;
  rewardCoins: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export type AchievementIconType = 'run' | 'coin' | 'distance' | 'dodge' | 'powerup';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  target: number;
  unit: string;
  currentProgress: number;
  completed: boolean;
  unlockedAt?: number;
  iconType: AchievementIconType;
}

export interface LifetimeStats {
  totalRuns: number;
  totalDistance: number;
  totalCoinsCollected: number;
  totalObstaclesDodged: number;
  totalPowerUpsUsed: number;
  totalActiveTimeSeconds: number;
}

export interface MissionNotification {
  id: string;
  type: 'MISSION' | 'ACHIEVEMENT';
  title: string;
  subtitle: string;
  rewardCoins?: number;
  timestamp: number;
}
