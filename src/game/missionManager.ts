/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  STORAGE_KEY_MISSIONS,
  STORAGE_KEY_ACHIEVEMENTS,
  STORAGE_KEY_LIFETIME,
} from './constants.ts';
import {
  Mission,
  Achievement,
  LifetimeStats,
  MissionNotification,
} from '../types/missions.ts';
import { soundManager } from '../audio/soundManager.ts';

const DEFAULT_MISSIONS: Omit<Mission, 'progress' | 'completed' | 'claimed'>[] = [
  // 1. Distance Missions
  {
    id: 'dist_easy',
    category: 'DISTANCE',
    difficulty: 'EASY',
    title: 'City Scout',
    description: 'Reach 250m in a single run',
    target: 250,
    unit: 'm',
    rewardCoins: 25,
  },
  {
    id: 'dist_med',
    category: 'DISTANCE',
    difficulty: 'MEDIUM',
    title: 'Neon Voyager',
    description: 'Reach 600m in a single run',
    target: 600,
    unit: 'm',
    rewardCoins: 60,
  },
  {
    id: 'dist_hard',
    category: 'DISTANCE',
    difficulty: 'HARD',
    title: 'Hyper Marathon',
    description: 'Reach 1,200m in a single run',
    target: 1200,
    unit: 'm',
    rewardCoins: 150,
  },

  // 2. Collection Missions
  {
    id: 'coin_easy',
    category: 'COLLECTION',
    difficulty: 'EASY',
    title: 'Pocket Change',
    description: 'Collect 15 coins in a single run',
    target: 15,
    unit: 'coins',
    rewardCoins: 20,
  },
  {
    id: 'coin_med',
    category: 'COLLECTION',
    difficulty: 'MEDIUM',
    title: 'Cyber Magnet',
    description: 'Collect 40 coins in a single run',
    target: 40,
    unit: 'coins',
    rewardCoins: 50,
  },
  {
    id: 'coin_hard',
    category: 'COLLECTION',
    difficulty: 'HARD',
    title: 'Vault Heist',
    description: 'Collect 80 coins in a single run',
    target: 80,
    unit: 'coins',
    rewardCoins: 120,
  },

  // 3. Survival and Skill Missions
  {
    id: 'surv_easy',
    category: 'SURVIVAL',
    difficulty: 'EASY',
    title: 'Reflex Initiate',
    description: 'Dodge 10 obstacles in a single run',
    target: 10,
    unit: 'dodges',
    rewardCoins: 25,
  },
  {
    id: 'surv_med',
    category: 'SURVIVAL',
    difficulty: 'MEDIUM',
    title: 'Endurance Pulse',
    description: 'Survive 45 seconds of active run time',
    target: 45,
    unit: 's',
    rewardCoins: 60,
  },
  {
    id: 'surv_hard',
    category: 'SURVIVAL',
    difficulty: 'HARD',
    title: 'Apex Acrobat',
    description: 'Dodge 35 obstacles in a single run',
    target: 35,
    unit: 'dodges',
    rewardCoins: 140,
  },
];

const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'currentProgress' | 'completed' | 'unlockedAt'>[] = [
  {
    id: 'ach_first_run',
    title: 'First Run',
    description: 'Complete your first run in the cyber city',
    target: 1,
    unit: 'runs',
    iconType: 'run',
  },
  {
    id: 'ach_first_coin',
    title: 'First Coin',
    description: 'Collect your very first gold coin',
    target: 1,
    unit: 'coins',
    iconType: 'coin',
  },
  {
    id: 'ach_dist_milestone',
    title: 'Distance Milestone',
    description: 'Sprint 2,500m total across all runs',
    target: 2500,
    unit: 'm',
    iconType: 'distance',
  },
  {
    id: 'ach_marathon_legend',
    title: 'Marathon Legend',
    description: 'Sprint 10,000m total across all runs',
    target: 10000,
    unit: 'm',
    iconType: 'distance',
  },
  {
    id: 'ach_coin_collector',
    title: 'Coin Collector',
    description: 'Collect 150 total coins lifetime',
    target: 150,
    unit: 'coins',
    iconType: 'coin',
  },
  {
    id: 'ach_treasure_baron',
    title: 'Treasure Baron',
    description: 'Collect 500 total coins lifetime',
    target: 500,
    unit: 'coins',
    iconType: 'coin',
  },
  {
    id: 'ach_obstacle_dodger',
    title: 'Obstacle Dodger',
    description: 'Safely leap & slide past 50 obstacles',
    target: 50,
    unit: 'dodges',
    iconType: 'dodge',
  },
  {
    id: 'ach_shadow_phantom',
    title: 'Shadow Phantom',
    description: 'Safely pass 200 obstacles lifetime',
    target: 200,
    unit: 'dodges',
    iconType: 'dodge',
  },
  {
    id: 'ach_powerup_user',
    title: 'Power-up User',
    description: 'Activate 5 power-up collectibles',
    target: 5,
    unit: 'uses',
    iconType: 'powerup',
  },
  {
    id: 'ach_overcharged',
    title: 'Overcharged',
    description: 'Activate 25 power-up collectibles',
    target: 25,
    unit: 'uses',
    iconType: 'powerup',
  },
];

export class MissionManager {
  private missions: Mission[] = [];
  private achievements: Achievement[] = [];
  private lifetimeStats: LifetimeStats = {
    totalRuns: 0,
    totalDistance: 0,
    totalCoinsCollected: 0,
    totalObstaclesDodged: 0,
    totalPowerUpsUsed: 0,
    totalActiveTimeSeconds: 0,
  };

  private activeNotifications: MissionNotification[] = [];
  public onNotification?: (notification: MissionNotification) => void;

  constructor() {
    this.loadData();
  }

  private loadData() {
    // 1. Load Lifetime Stats
    try {
      const rawLifetime = localStorage.getItem(STORAGE_KEY_LIFETIME);
      if (rawLifetime) {
        const parsed = JSON.parse(rawLifetime);
        this.lifetimeStats = {
          totalRuns: Math.max(0, Number(parsed.totalRuns) || 0),
          totalDistance: Math.max(0, Number(parsed.totalDistance) || 0),
          totalCoinsCollected: Math.max(0, Number(parsed.totalCoinsCollected) || 0),
          totalObstaclesDodged: Math.max(0, Number(parsed.totalObstaclesDodged) || 0),
          totalPowerUpsUsed: Math.max(0, Number(parsed.totalPowerUpsUsed) || 0),
          totalActiveTimeSeconds: Math.max(0, Number(parsed.totalActiveTimeSeconds) || 0),
        };
      }
    } catch {
      // Fallback
    }

    // 2. Load Missions (persist completed and claimed flags)
    try {
      const rawMissions = localStorage.getItem(STORAGE_KEY_MISSIONS);
      const savedMap = new Map<string, { completed: boolean; claimed: boolean }>();
      if (rawMissions) {
        const parsed = JSON.parse(rawMissions);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id) {
              savedMap.set(item.id, {
                completed: Boolean(item.completed),
                claimed: Boolean(item.claimed),
              });
            }
          }
        }
      }

      this.missions = DEFAULT_MISSIONS.map((def) => {
        const saved = savedMap.get(def.id);
        const completed = saved ? saved.completed : false;
        const claimed = saved ? saved.claimed : false;
        return {
          ...def,
          progress: 0,
          completed,
          claimed,
        };
      });
    } catch {
      this.missions = DEFAULT_MISSIONS.map((def) => ({
        ...def,
        progress: 0,
        completed: false,
        claimed: false,
      }));
    }

    // 3. Load Achievements
    try {
      const rawAchievements = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
      const savedMap = new Map<string, { completed: boolean; unlockedAt?: number }>();
      if (rawAchievements) {
        const parsed = JSON.parse(rawAchievements);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id) {
              savedMap.set(item.id, {
                completed: Boolean(item.completed),
                unlockedAt: item.unlockedAt ? Number(item.unlockedAt) : undefined,
              });
            }
          }
        }
      }

      this.achievements = DEFAULT_ACHIEVEMENTS.map((def) => {
        const saved = savedMap.get(def.id);
        const completed = saved ? saved.completed : false;
        const currentProgress = this.calculateAchievementProgress(def.id);
        return {
          ...def,
          currentProgress: Math.min(def.target, currentProgress),
          completed: completed || currentProgress >= def.target,
          unlockedAt: saved?.unlockedAt,
        };
      });
    } catch {
      this.achievements = DEFAULT_ACHIEVEMENTS.map((def) => ({
        ...def,
        currentProgress: this.calculateAchievementProgress(def.id),
        completed: false,
      }));
    }
  }

  private calculateAchievementProgress(id: string): number {
    switch (id) {
      case 'ach_first_run':
        return this.lifetimeStats.totalRuns;
      case 'ach_first_coin':
      case 'ach_coin_collector':
      case 'ach_treasure_baron':
        return this.lifetimeStats.totalCoinsCollected;
      case 'ach_dist_milestone':
      case 'ach_marathon_legend':
        return Math.floor(this.lifetimeStats.totalDistance);
      case 'ach_obstacle_dodger':
      case 'ach_shadow_phantom':
        return this.lifetimeStats.totalObstaclesDodged;
      case 'ach_powerup_user':
      case 'ach_overcharged':
        return this.lifetimeStats.totalPowerUpsUsed;
      default:
        return 0;
    }
  }

  private saveMissions() {
    try {
      const toSave = this.missions.map((m) => ({
        id: m.id,
        completed: m.completed,
        claimed: m.claimed,
      }));
      localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify(toSave));
    } catch {
      // Ignore
    }
  }

  private saveAchievements() {
    try {
      const toSave = this.achievements.map((a) => ({
        id: a.id,
        completed: a.completed,
        unlockedAt: a.unlockedAt,
      }));
      localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(toSave));
    } catch {
      // Ignore
    }
  }

  private saveLifetimeStats() {
    try {
      localStorage.setItem(STORAGE_KEY_LIFETIME, JSON.stringify(this.lifetimeStats));
    } catch {
      // Ignore
    }
  }

  public getMissions(): Mission[] {
    return this.missions;
  }

  public getAchievements(): Achievement[] {
    return this.achievements;
  }

  public getLifetimeStats(): LifetimeStats {
    return { ...this.lifetimeStats };
  }

  public getActiveNotifications(): MissionNotification[] {
    const now = Date.now();
    this.activeNotifications = this.activeNotifications.filter(
      (n) => now - n.timestamp < 4000
    );
    return [...this.activeNotifications];
  }

  public dismissNotification(id: string) {
    this.activeNotifications = this.activeNotifications.filter((n) => n.id !== id);
  }

  public resetRunProgress() {
    for (const mission of this.missions) {
      mission.progress = 0;
    }
  }

  public recordPowerUpActivated() {
    this.lifetimeStats.totalPowerUpsUsed += 1;
    this.saveLifetimeStats();
    this.evaluateAchievements();
  }

  public recordObstaclesDodged(count: number) {
    if (count <= 0) return;
    this.lifetimeStats.totalObstaclesDodged += count;
    this.saveLifetimeStats();
    this.evaluateAchievements();
  }

  public recordRunEnded(distance: number, coins: number, activeSeconds: number) {
    this.lifetimeStats.totalRuns += 1;
    this.lifetimeStats.totalDistance += distance;
    this.lifetimeStats.totalCoinsCollected += coins;
    this.lifetimeStats.totalActiveTimeSeconds += activeSeconds;

    this.saveLifetimeStats();
    this.evaluateAchievements();
  }

  public updateRunMetrics(
    runDistance: number,
    runCoins: number,
    runActiveSeconds: number,
    runDodges: number
  ) {
    for (const mission of this.missions) {
      let currentVal = 0;
      if (mission.category === 'DISTANCE') {
        currentVal = Math.floor(runDistance);
      } else if (mission.category === 'COLLECTION') {
        currentVal = runCoins;
      } else if (mission.category === 'SURVIVAL') {
        if (mission.unit === 's') {
          currentVal = Math.floor(runActiveSeconds);
        } else {
          currentVal = runDodges;
        }
      }

      mission.progress = currentVal;

      if (!mission.completed && currentVal >= mission.target) {
        mission.completed = true;
        this.saveMissions();

        const notification: MissionNotification = {
          id: `mission_${mission.id}_${Date.now()}`,
          type: 'MISSION',
          title: `Mission Completed!`,
          subtitle: `${mission.title} (+${mission.rewardCoins} Coins)`,
          rewardCoins: mission.rewardCoins,
          timestamp: Date.now(),
        };

        this.activeNotifications.push(notification);
        soundManager.playMissionComplete();
        if (this.onNotification) {
          this.onNotification(notification);
        }
      }
    }

    this.evaluateAchievements();
  }

  private evaluateAchievements() {
    let hasChanges = false;

    for (const ach of this.achievements) {
      const current = this.calculateAchievementProgress(ach.id);
      ach.currentProgress = Math.min(ach.target, current);

      if (!ach.completed && current >= ach.target) {
        ach.completed = true;
        ach.unlockedAt = Date.now();
        hasChanges = true;

        const notification: MissionNotification = {
          id: `ach_${ach.id}_${Date.now()}`,
          type: 'ACHIEVEMENT',
          title: `Achievement Unlocked!`,
          subtitle: ach.title,
          timestamp: Date.now(),
        };

        this.activeNotifications.push(notification);
        soundManager.playMissionComplete();
        if (this.onNotification) {
          this.onNotification(notification);
        }
      }
    }

    if (hasChanges) {
      this.saveAchievements();
    }
  }

  public claimMissionReward(missionId: string): { success: boolean; coinsAwarded: number } {
    const mission = this.missions.find((m) => m.id === missionId);
    if (!mission) {
      return { success: false, coinsAwarded: 0 };
    }

    if (!mission.completed) {
      return { success: false, coinsAwarded: 0 };
    }

    if (mission.claimed) {
      return { success: false, coinsAwarded: 0 };
    }

    mission.claimed = true;
    this.saveMissions();
    soundManager.playClaimReward();

    return {
      success: true,
      coinsAwarded: mission.rewardCoins,
    };
  }
}
