/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Gift,
  CheckCircle2,
  Lock,
  Coins,
  Shield,
  Magnet,
  Zap,
  Sparkles,
  X,
  Clock,
} from 'lucide-react';
import { DAILY_REWARDS_SCHEDULE, DailyRewardDay } from '../types/dailyReward.ts';
import { dailyRewardManager } from '../game/dailyRewardManager.ts';
import { soundManager } from '../audio/soundManager.ts';

interface DailyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCoins: number;
  onClaimSuccess: (newTotalCoins: number, reward: DailyRewardDay) => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  isOpen,
  onClose,
  totalCoins,
  onClaimSuccess,
}) => {
  const [status, setStatus] = useState(() => dailyRewardManager.getStatus());
  const [justClaimedReward, setJustClaimedReward] = useState<DailyRewardDay | null>(null);

  // Update status and countdown live while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const refresh = () => {
      setStatus(dailyRewardManager.getStatus());
    };

    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    if (!status.canClaim) return;

    soundManager.playClaimReward();
    const result = dailyRewardManager.claimReward(totalCoins);

    if (result.success && result.reward && typeof result.newCoinsTotal === 'number') {
      setJustClaimedReward(result.reward);
      onClaimSuccess(result.newCoinsTotal, result.reward);
      setStatus(dailyRewardManager.getStatus());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg my-auto bg-slate-900/95 border border-slate-700/90 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-cyan-950/50 text-center overflow-hidden">
        
        {/* Background visual accents */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-semibold uppercase tracking-widest mb-1.5 shadow-sm">
            <Gift className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            24H LOG-IN REWARDS
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 uppercase">
            Daily Cyber Cache
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Log in once every 24 hours to claim escalating coin rewards & power-ups!
          </p>
        </div>

        {/* Claimed Reward Overlay Banner */}
        {justClaimedReward && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-purple-500/20 border border-amber-400/50 text-center animate-in zoom-in-95 duration-200 shadow-lg">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm sm:text-base font-display">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              <span>REWARD CLAIMED! +{justClaimedReward.coins} COINS</span>
            </div>
            {justClaimedReward.powerUpBonus && (
              <p className="text-xs text-cyan-200 mt-0.5 font-medium">
                Bonus unlocked: {justClaimedReward.powerUpBonus} Power-Up Fragment!
              </p>
            )}
          </div>
        )}

        {/* 7-Day Rewards Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-4">
          {DAILY_REWARDS_SCHEDULE.map((item) => {
            const dayNum = item.day;
            const isCurrentActiveDay = status.canClaim && dayNum === status.currentStreak;
            const isAlreadyClaimed = dayNum < status.currentStreak || (!status.canClaim && dayNum === status.currentStreak && status.lastClaimTime > 0);
            const isLocked = dayNum > status.currentStreak || (!status.canClaim && dayNum === status.currentStreak && status.lastClaimTime === 0);

            return (
              <div
                key={item.day}
                className={`relative flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl border transition-all ${
                  isCurrentActiveDay
                    ? 'bg-gradient-to-b from-cyan-950/90 to-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.35)] scale-[1.03] ring-1 ring-cyan-400'
                    : isAlreadyClaimed
                    ? 'bg-slate-950/70 border-slate-800 text-slate-500 opacity-80'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                }`}
              >
                {/* Day Header Badge */}
                <span className={`text-[10px] font-bold uppercase tracking-tight ${isCurrentActiveDay ? 'text-cyan-300' : 'text-slate-400'}`}>
                  Day {item.day}
                </span>

                {/* Reward Visual Icon */}
                <div className="my-1 flex items-center justify-center">
                  {isAlreadyClaimed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : item.powerUpBonus === 'SHIELD' ? (
                    <div className="p-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                  ) : item.powerUpBonus === 'MAGNET' ? (
                    <div className="p-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40">
                      <Magnet className="w-3.5 h-3.5" />
                    </div>
                  ) : item.powerUpBonus === 'SPEED' ? (
                    <div className="p-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <Coins className={`w-4 h-4 ${isCurrentActiveDay ? 'text-amber-300' : 'text-amber-400/70'}`} />
                  )}
                </div>

                {/* Coin Reward Amount */}
                <span className={`text-[11px] font-mono font-bold tabular-nums ${isCurrentActiveDay ? 'text-amber-300' : 'text-slate-300'}`}>
                  +{item.coins}
                </span>

                {/* Status indicator badge */}
                {isAlreadyClaimed && (
                  <span className="text-[8px] font-bold uppercase text-emerald-400 leading-none">Done</span>
                )}
                {isCurrentActiveDay && (
                  <span className="text-[8px] font-bold uppercase text-cyan-300 animate-pulse leading-none">Ready</span>
                )}
                {isLocked && (
                  <Lock className="w-2.5 h-2.5 text-slate-600 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Claim CTA or Countdown Timer Display */}
        <div className="mt-3">
          {status.canClaim ? (
            <button
              onClick={handleClaim}
              className="w-full py-3.5 px-6 rounded-xl font-display font-black text-base sm:text-lg text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-300 hover:from-amber-300 hover:to-cyan-200 active:scale-98 transition-all shadow-[0_0_24px_rgba(255,215,0,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gift className="w-5 h-5 fill-slate-950" />
              <span>CLAIM DAY {status.currentStreak} REWARD (+{status.nextRewardDay.coins} COINS)</span>
            </button>
          ) : (
            <div className="w-full py-3 px-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Next Daily Cache Unlocks In
              </span>
              <span className="text-lg sm:text-xl font-mono font-bold text-cyan-300 tabular-nums mt-0.5 tracking-tight">
                {status.formattedCountdown}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
