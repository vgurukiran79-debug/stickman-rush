/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { STORAGE_KEY_DAILY_REWARDS, STORAGE_KEY_TOTAL_COINS } from './constants.ts';
import {
  DailyRewardData,
  DailyRewardDay,
  DAILY_REWARDS_SCHEDULE,
  ClaimRewardResult,
} from '../types/dailyReward.ts';

const MS_PER_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STREAK_RESET_MS = 48 * 60 * 60 * 1000; // 48 hours to preserve streak

class DailyRewardManager {
  private data: DailyRewardData = {
    lastClaimTime: 0,
    currentStreak: 1,
    totalClaimsCount: 0,
  };

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DAILY_REWARDS);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = {
          lastClaimTime: typeof parsed.lastClaimTime === 'number' ? parsed.lastClaimTime : 0,
          currentStreak: typeof parsed.currentStreak === 'number' ? Math.max(1, Math.min(7, parsed.currentStreak)) : 1,
          totalClaimsCount: typeof parsed.totalClaimsCount === 'number' ? parsed.totalClaimsCount : 0,
        };
      }
    } catch {
      this.data = {
        lastClaimTime: 0,
        currentStreak: 1,
        totalClaimsCount: 0,
      };
    }
  }

  private saveData() {
    try {
      localStorage.setItem(STORAGE_KEY_DAILY_REWARDS, JSON.stringify(this.data));
    } catch {
      // Graceful fallback
    }
  }

  public getStatus(): {
    canClaim: boolean;
    currentStreak: number;
    timeUntilNextMs: number;
    formattedCountdown: string;
    nextRewardDay: DailyRewardDay;
    totalClaimsCount: number;
    lastClaimTime: number;
  } {
    const now = Date.now();
    const elapsed = now - this.data.lastClaimTime;

    let canClaim = false;
    let currentStreak = this.data.currentStreak;

    if (this.data.lastClaimTime === 0) {
      // First time player
      canClaim = true;
      currentStreak = 1;
    } else if (elapsed >= MS_PER_DAY) {
      canClaim = true;
      // If player missed more than 48 hours, streak resets back to Day 1
      if (elapsed > STREAK_RESET_MS) {
        currentStreak = 1;
        this.data.currentStreak = 1;
        this.saveData();
      }
    } else {
      canClaim = false;
    }

    const nextRewardDay = DAILY_REWARDS_SCHEDULE[(currentStreak - 1) % DAILY_REWARDS_SCHEDULE.length];
    const timeUntilNextMs = canClaim ? 0 : Math.max(0, MS_PER_DAY - elapsed);

    // Format remaining time as HH:MM:SS
    const totalSec = Math.floor(timeUntilNextMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const formattedCountdown = `${hours.toString().padStart(2, '0')}h ${mins
      .toString()
      .padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;

    return {
      canClaim,
      currentStreak,
      timeUntilNextMs,
      formattedCountdown,
      nextRewardDay,
      totalClaimsCount: this.data.totalClaimsCount,
      lastClaimTime: this.data.lastClaimTime,
    };
  }

  public claimReward(currentTotalCoins: number): ClaimRewardResult {
    const status = this.getStatus();
    if (!status.canClaim) {
      return {
        success: false,
        error: `Daily reward cooldow active. Next claim in ${status.formattedCountdown}`,
      };
    }

    const reward = status.nextRewardDay;
    const newCoinsTotal = currentTotalCoins + reward.coins;

    // Update persistent total coins in localStorage
    try {
      localStorage.setItem(STORAGE_KEY_TOTAL_COINS, newCoinsTotal.toString());
    } catch {
      // Graceful fallback
    }

    // Advance streak and update claim timestamp
    const now = Date.now();
    const nextStreak = (status.currentStreak % 7) === 0 ? 1 : status.currentStreak + 1;

    this.data.lastClaimTime = now;
    this.data.currentStreak = nextStreak;
    this.data.totalClaimsCount += 1;
    this.saveData();

    return {
      success: true,
      reward,
      newCoinsTotal,
    };
  }
}

export const dailyRewardManager = new DailyRewardManager();
