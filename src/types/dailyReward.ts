/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DailyRewardDay {
  day: number;
  coins: number;
  title: string;
  description: string;
  powerUpBonus?: 'SHIELD' | 'MAGNET' | 'SPEED';
  isGrandPrize?: boolean;
}

export interface DailyRewardData {
  lastClaimTime: number; // timestamp in ms
  currentStreak: number; // 1 to 7
  totalClaimsCount: number; // lifetime total claims
}

export interface ClaimRewardResult {
  success: boolean;
  reward?: DailyRewardDay;
  newCoinsTotal?: number;
  error?: string;
}

export const DAILY_REWARDS_SCHEDULE: DailyRewardDay[] = [
  {
    day: 1,
    coins: 50,
    title: '50 Coins',
    description: 'Day 1 starter bonus',
  },
  {
    day: 2,
    coins: 100,
    title: '100 Coins',
    description: 'Day 2 runner bonus',
  },
  {
    day: 3,
    coins: 150,
    title: '150 Coins + Shield',
    description: 'Day 3 shield fragment',
    powerUpBonus: 'SHIELD',
  },
  {
    day: 4,
    coins: 200,
    title: '200 Coins',
    description: 'Day 4 agility reward',
  },
  {
    day: 5,
    coins: 250,
    title: '250 Coins + Magnet',
    description: 'Day 5 coin magnet boost',
    powerUpBonus: 'MAGNET',
  },
  {
    day: 6,
    coins: 350,
    title: '350 Coins',
    description: 'Day 6 champion cache',
  },
  {
    day: 7,
    coins: 500,
    title: '500 Coins + Cyber Surge',
    description: 'Day 7 grand mystery prize!',
    powerUpBonus: 'SPEED',
    isGrandPrize: true,
  },
];
