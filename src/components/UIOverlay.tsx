/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Pause,
  Home,
  Volume2,
  VolumeX,
  Trophy,
  Coins,
  Sparkles,
  Smartphone,
  Keyboard,
  Shield,
  Zap,
  Magnet,
  Target,
  Award,
} from 'lucide-react';
import { GameState, GameStats } from '../types/game.ts';
import { soundManager } from '../audio/soundManager.ts';
import { MissionsModal } from './MissionsModal.tsx';
import { NotificationToast } from './NotificationToast.tsx';

interface UIOverlayProps {
  state: GameState;
  stats: GameStats;
  soundEnabled: boolean;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onPause: () => void;
  onJump: () => void;
  onSlide: () => void;
  onStopSlide: () => void;
  onToggleSound: () => void;
  onClaimReward: (missionId: string) => void;
  onDismissNotification: (id: string) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  state,
  stats,
  soundEnabled,
  onStart,
  onResume,
  onRestart,
  onMainMenu,
  onPause,
  onToggleSound,
  onClaimReward,
  onDismissNotification,
}) => {
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const activePowerUp = stats.activePowerUp;

  const unclaimedMissionsCount = (stats.missions || []).filter((m) => m.completed && !m.claimed).length;

  return (
    <>
      {/* 0. IN-GAME TOAST NOTIFICATIONS (When mission or achievement unlocks) */}
      <NotificationToast
        notifications={stats.activeNotifications || []}
        onDismiss={onDismissNotification}
      />

      {/* 1. TOP IN-GAME HUD (Visible during active play or pause) */}
      {(state === 'PLAYING' || state === 'PAUSED') && (
        <header className="absolute top-0 left-0 right-0 pointer-events-auto flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent z-20">
          {/* Distance and Coins */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-cyan-400 font-semibold font-display">
                Distance
              </span>
              <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-white tracking-tight">
                {stats.distance}
                <span className="text-[10px] sm:text-xs text-slate-400 font-normal ml-0.5">m</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 border border-amber-400/40">
                <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="text-base sm:text-xl font-bold font-mono tabular-nums text-amber-300">
                {stats.coinsCollected}
              </span>
            </div>

            {stats.bestDistance > 0 && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
                <Trophy className="w-3.5 h-3.5 text-amber-400/80" />
                <span>Best {stats.bestDistance}m</span>
              </div>
            )}
          </div>

          {/* ACTIVE POWER-UP BADGE (Animated with timer & duration progress) */}
          {activePowerUp && (
            <div
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full border shadow-lg backdrop-blur-md animate-pulse ${
                activePowerUp.type === 'SHIELD'
                  ? 'bg-cyan-950/80 border-cyan-400/60 text-cyan-300 shadow-cyan-950/50'
                  : activePowerUp.type === 'MAGNET'
                  ? 'bg-purple-950/80 border-purple-400/60 text-purple-300 shadow-purple-950/50'
                  : 'bg-amber-950/80 border-amber-400/60 text-amber-300 shadow-amber-950/50'
              }`}
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
                {activePowerUp.type === 'SHIELD' && <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 fill-cyan-400/30" />}
                {activePowerUp.type === 'MAGNET' && <Magnet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />}
                {activePowerUp.type === 'SPEED' && <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-400/40" />}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[10px] sm:text-xs font-bold font-display uppercase tracking-wider">
                    {activePowerUp.type === 'SHIELD' ? 'Shield' : activePowerUp.type === 'MAGNET' ? 'Magnet' : 'Speed'}
                  </span>
                  <span className="text-[11px] sm:text-xs font-mono font-bold tabular-nums">
                    {activePowerUp.remainingTime.toFixed(1)}s
                  </span>
                </div>
                {/* Micro duration progress bar */}
                <div className="w-16 sm:w-20 h-1 bg-slate-900/80 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-75 ${
                      activePowerUp.type === 'SHIELD'
                        ? 'bg-cyan-400'
                        : activePowerUp.type === 'MAGNET'
                        ? 'bg-purple-400'
                        : 'bg-amber-400'
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, (activePowerUp.remainingTime / activePowerUp.maxDuration) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action buttons (Missions, Sound, Pause) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setIsMissionsOpen(true);
              }}
              aria-label="Open Missions & Milestones"
              className="relative p-1.5 sm:p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Target className="w-4 h-4 text-cyan-300" />
              {unclaimedMissionsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center animate-bounce">
                  {unclaimedMissionsCount}
                </span>
              )}
            </button>

            <button
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>

            {state === 'PLAYING' && (
              <button
                onClick={onPause}
                aria-label="Pause game"
                className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>
      )}

      {/* 2. RESPONSIVE FULL-SCREEN MODALS (Start Screen, Pause Screen, Game Over Screen) */}
      {/* START SCREEN / LANDING PAGE */}
      {state === 'START' && (
        <div className="fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-md my-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-cyan-950/30 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Title & Tagline */}
            <div className="mb-4 sm:mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-[11px] font-semibold mb-2">
                <Sparkles className="w-3 h-3" />
                CYBERPUNK RUNNER
              </div>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 drop-shadow uppercase leading-tight">
                Stickman Rush
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-300 font-medium">
                Dodge hazards · Grab gold coins · Complete missions
              </p>
            </div>

            {/* High Score & Total Coins Strip */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5 p-2.5 sm:p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="flex flex-col items-center justify-center p-1.5">
                <span className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 font-medium">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Best Score
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                  {stats.bestDistance} <span className="text-xs text-slate-400 font-normal">m</span>
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-1.5 border-l border-slate-800">
                <span className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 font-medium">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Coin Bank
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-amber-300 mt-0.5">
                  {stats.totalCoins}
                </span>
              </div>
            </div>

            {/* Primary Action Button (PLAY NOW) */}
            <button
              onClick={() => {
                soundManager.playClick();
                onStart();
              }}
              className="w-full py-3 sm:py-3.5 px-6 rounded-xl font-display font-bold text-base sm:text-lg text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-sky-200 active:scale-98 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer mb-3"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              PLAY NOW
            </button>

            {/* Missions & Milestones Modal Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setIsMissionsOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm text-cyan-300 bg-slate-950/60 hover:bg-slate-800/80 border border-cyan-800/50 hover:border-cyan-500/60 transition-all flex items-center justify-center gap-2 cursor-pointer mb-4"
            >
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Missions & Milestones</span>
              {unclaimedMissionsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {unclaimedMissionsCount} Claimable
                </span>
              )}
            </button>

            {/* Power-Ups Guide */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 text-left">
              <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex flex-col items-center text-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 mb-0.5 sm:mb-1 border border-cyan-400/30">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-cyan-200">Shield</span>
                <span className="text-[9px] text-slate-400 leading-tight">Absorbs 1 hit</span>
              </div>

              <div className="p-1.5 sm:p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 flex flex-col items-center text-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 mb-0.5 sm:mb-1 border border-purple-400/30">
                  <Magnet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-purple-200">Magnet</span>
                <span className="text-[9px] text-slate-400 leading-tight">Attracts coins</span>
              </div>

              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-950/40 border border-amber-800/40 flex flex-col items-center text-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 mb-0.5 sm:mb-1 border border-amber-400/30">
                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-200">Speed</span>
                <span className="text-[9px] text-slate-400 leading-tight">Hyper surge</span>
              </div>
            </div>

            {/* Controls Guide (Responsive for Mobile & Desktop) */}
            <div className="text-left bg-slate-950/50 p-3 sm:p-4 rounded-xl border border-slate-800/80 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  Phone Controls
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Keyboard className="w-3 h-3" />
                  Desktop Ready
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Leap over crates & spikes:</span>
                  <span className="font-semibold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 text-[11px]">
                    JUMP (Right Thumb)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Glide under hanging beams:</span>
                  <span className="font-semibold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40 text-[11px]">
                    SLIDE (Left Thumb)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  Swipe up/down anywhere on screen also jumps and slides!
                </div>
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-center">
              <button
                onClick={onToggleSound}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-slate-800/60"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
                <span>Sound: {soundEnabled ? 'Enabled' : 'Muted'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE SCREEN MODAL */}
      {state === 'PAUSED' && (
        <div className="fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-slate-900/95 border border-slate-700/80 p-6 rounded-2xl shadow-2xl text-center">
            <h2 className="text-2xl font-bold font-display tracking-wide text-white uppercase mb-5">
              Game Paused
            </h2>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onResume();
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Resume
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsMissionsOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-cyan-300 bg-slate-950/60 hover:bg-slate-800 border border-cyan-800/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Target className="w-4 h-4" />
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
                  onRestart();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Restart
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onMainMenu();
                }}
                className="w-full py-2 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN MODAL */}
      {state === 'GAMEOVER' && (
        <div className="fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm my-auto bg-slate-900/95 border border-red-900/50 p-5 sm:p-7 rounded-2xl shadow-2xl shadow-red-950/40 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="mb-4 sm:mb-5">
              <span className="text-xs uppercase tracking-widest font-bold text-red-400 font-display">
                Run Terminated
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white uppercase mt-0.5">
                Crashed!
              </h2>
              {stats.isNewBest && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/40 text-amber-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  NEW PERSONAL BEST!
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-800 space-y-2.5 sm:space-y-3 mb-4 sm:mb-5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400">Distance Survived</span>
                <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white">
                  {stats.distance}
                  <span className="text-xs text-slate-400 font-normal ml-0.5">m</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400">Coins Collected</span>
                <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-amber-300 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  +{stats.coinsCollected}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400">Total Balance</span>
                <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-amber-200 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400/80" />
                  {stats.totalCoins}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Best Score
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {stats.bestDistance}m
                </span>
              </div>
            </div>

            {/* Missions & Rewards Button on Game Over */}
            <button
              onClick={() => {
                soundManager.playClick();
                setIsMissionsOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/60 hover:border-cyan-400/60 transition-all flex items-center justify-center gap-2 cursor-pointer mb-3"
            >
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Missions & Rewards</span>
              {unclaimedMissionsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  +{unclaimedMissionsCount} Claimable!
                </span>
              )}
            </button>

            {/* Action Buttons */}
            <div className="space-y-2.5 sm:space-y-3">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onRestart();
                }}
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-display font-bold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-sky-200 active:scale-98 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                PLAY AGAIN
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onMainMenu();
                }}
                className="w-full py-2 sm:py-2.5 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MISSIONS & MILESTONES MODAL */}
      <MissionsModal
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
        missions={stats.missions || []}
        achievements={stats.achievements || []}
        totalCoins={stats.totalCoins}
        onClaimReward={onClaimReward}
      />
    </>
  );
};
