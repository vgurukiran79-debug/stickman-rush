/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Trophy,
  Target,
  Coins,
  CheckCircle2,
  Clock,
  Zap,
  Footprints,
  Shield,
  Sparkles,
  Award,
} from 'lucide-react';
import { Mission, Achievement, MissionDifficulty } from '../types/missions.ts';
import { soundManager } from '../audio/soundManager.ts';
import { SoundToggle } from './SoundToggle.tsx';

interface MissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  achievements: Achievement[];
  totalCoins: number;
  onClaimReward: (missionId: string) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  isOpen,
  onClose,
  missions,
  achievements,
  totalCoins,
  onClaimReward,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'achievements'>('missions');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | MissionDifficulty>('ALL');

  if (!isOpen) return null;

  const filteredMissions = missions.filter((m) => {
    if (difficultyFilter === 'ALL') return true;
    return m.difficulty === difficultyFilter;
  });

  const unclaimedMissionsCount = missions.filter((m) => m.completed && !m.claimed).length;
  const completedAchievementsCount = achievements.filter((a) => a.completed).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display tracking-wide uppercase text-white leading-tight">
                Missions & Milestones
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Bank: <strong className="text-amber-300 font-mono tabular-nums">{totalCoins}</strong> coins</span>
                <span aria-hidden="true">·</span>
                <span>{unclaimedMissionsCount > 0 ? `${unclaimedMissionsCount} claimable` : 'All claimed'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SoundToggle variant="compact" />

            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('missions');
              }}
              className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'missions'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Missions</span>
              {unclaimedMissionsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {unclaimedMissionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('achievements');
              }}
              className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'achievements'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Achievements</span>
              <span className="text-[10px] font-mono text-slate-400">
                ({completedAchievementsCount}/{achievements.length})
              </span>
            </button>
          </div>

          {/* Difficulty Filter for Missions Tab */}
          {activeTab === 'missions' && (
            <div className="hidden sm:flex items-center gap-1 text-xs">
              {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    soundManager.playClick();
                    setDifficultyFilter(diff);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    difficultyFilter === diff
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3">
          {activeTab === 'missions' && (
            <>
              {/* Category Legend & Info */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Single-run objectives across Distance, Coins & Skill</span>
                <span className="text-[11px] text-cyan-400">Claims add directly to balance</span>
              </div>

              {/* Missions Cards List */}
              <div className="space-y-2.5">
                {filteredMissions.map((mission) => {
                  const percent = Math.min(100, Math.floor((mission.progress / mission.target) * 100));
                  const isClaimable = mission.completed && !mission.claimed;

                  return (
                    <div
                      key={mission.id}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                        isClaimable
                          ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900 border-cyan-400/50 shadow-lg shadow-cyan-950/30'
                          : mission.claimed
                          ? 'bg-slate-950/40 border-slate-800/80 opacity-80'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          {/* Title & Category Line */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm sm:text-base text-white tracking-tight">
                              {mission.title}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                              · {mission.category} · {mission.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {mission.description}
                          </p>
                        </div>

                        {/* Claim / Reward Button */}
                        <div className="shrink-0 flex items-center">
                          {isClaimable ? (
                            <button
                              onClick={() => onClaimReward(mission.id)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap animate-pulse"
                            >
                              <Coins className="w-3.5 h-3.5 fill-slate-950" />
                              Claim +{mission.rewardCoins}
                            </button>
                          ) : mission.claimed ? (
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold px-2 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Claimed
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-300 text-xs font-mono font-medium px-2 py-1 bg-amber-950/30 border border-amber-900/40 rounded-lg">
                              <Coins className="w-3 h-3 text-amber-400" />
                              +{mission.rewardCoins}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar & Numeric Indicator */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            {mission.claimed ? 'Completed' : mission.completed ? 'Goal Reached!' : 'Run Progress'}
                          </span>
                          <span className="font-mono tabular-nums">
                            {mission.completed
                              ? `${mission.target}/${mission.target} ${mission.unit}`
                              : `${mission.progress}/${mission.target} ${mission.unit}`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              mission.completed ? 'bg-cyan-400' : 'bg-slate-600'
                            }`}
                            style={{ width: `${mission.completed ? 100 : percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'achievements' && (
            <>
              {/* Achievements Overview */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Permanent career milestones across all runs</span>
                <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
                  {completedAchievementsCount} of {achievements.length} Unlocked
                </span>
              </div>

              {/* Achievements Cards List */}
              <div className="space-y-2.5">
                {achievements.map((ach) => {
                  const percent = Math.min(100, Math.floor((ach.currentProgress / ach.target) * 100));

                  return (
                    <div
                      key={ach.id}
                      className={`p-3 sm:p-3.5 rounded-xl border flex items-center gap-3.5 transition-all ${
                        ach.completed
                          ? 'bg-slate-950/70 border-cyan-800/50 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/80'
                      }`}
                    >
                      {/* Milestone Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          ach.completed
                            ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {ach.iconType === 'run' && <Footprints className="w-5 h-5" />}
                        {ach.iconType === 'coin' && <Coins className="w-5 h-5" />}
                        {ach.iconType === 'distance' && <Sparkles className="w-5 h-5" />}
                        {ach.iconType === 'dodge' && <Shield className="w-5 h-5" />}
                        {ach.iconType === 'powerup' && <Zap className="w-5 h-5" />}
                      </div>

                      {/* Details & Progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm text-white tracking-tight truncate">
                            {ach.title}
                          </h3>
                          {ach.completed && (
                            <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                              Unlocked
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-0.5">{ach.description}</p>

                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Career Progress</span>
                            <span className="font-mono tabular-nums text-slate-300">
                              {ach.currentProgress} / {ach.target} {ach.unit}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all duration-300 ${
                                ach.completed ? 'bg-cyan-400' : 'bg-slate-700'
                              }`}
                              style={{ width: `${ach.completed ? 100 : percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Progress auto-saves to your device</span>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
