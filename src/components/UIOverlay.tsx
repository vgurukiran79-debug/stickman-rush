/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Play,
  RotateCcw,
  Pause,
  Home,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  Trophy,
  Coins,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { GameState, GameStats } from '../types/game.ts';
import { soundManager } from '../audio/soundManager.ts';

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
  onJump,
  onSlide,
  onStopSlide,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between overflow-hidden">
      {/* Top HUD (during active play or paused) */}
      {(state === 'PLAYING' || state === 'PAUSED') && (
        <header className="pointer-events-auto flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent">
          {/* Distance and Coins */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold font-display">
                Distance
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white tracking-tight">
                {stats.distance}
                <span className="text-xs text-slate-400 font-normal ml-0.5">m</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 border border-amber-400/40">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-amber-300">
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

          {/* Action buttons (Pause, Sound) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>

            {state === 'PLAYING' && (
              <button
                onClick={onPause}
                aria-label="Pause game"
                className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>
      )}

      {/* Center Modals based on GameState */}
      {state === 'START' && (
        <div className="pointer-events-auto my-auto flex flex-col items-center justify-center px-4 text-center z-20">
          <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-700/60 shadow-2xl shadow-cyan-950/40">
            {/* Title & Tagline */}
            <div className="mb-6">
              <h1 className="text-4xl sm:text-5xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 drop-shadow-sm uppercase">
                Stickman Rush
              </h1>
              <p className="mt-2 text-sm text-slate-300 font-medium">
                Jump over ground hazards · Slide under hanging beams · Grab gold coins
              </p>
            </div>

            {/* High Score & Coins Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="flex flex-col items-center justify-center p-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Best Distance
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                  {stats.bestDistance} <span className="text-xs text-slate-400 font-normal">m</span>
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 border-l border-slate-800">
                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Total Coins
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-amber-300 mt-0.5">
                  {stats.totalCoins}
                </span>
              </div>
            </div>

            {/* Big Play Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                onStart();
              }}
              className="w-full py-3.5 px-6 rounded-xl font-display font-bold text-lg text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-sky-200 active:scale-98 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer mb-5"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              PLAY NOW
            </button>

            {/* Controls Guide */}
            <div className="text-left bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Controls Guide
              </h2>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Jump over crates & spikes</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono">SPACE</kbd>
                    <span className="text-slate-500">or</span>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono">W</kbd>
                    <span className="text-slate-500">or</span>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono">↑</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Slide under overhead beams</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono">S</kbd>
                    <span className="text-slate-500">or</span>
                    <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono">↓</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pause / Resume</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono">ESC</kbd>
                </div>
                <div className="pt-1 text-[11px] text-cyan-400/90 font-medium">
                  Touch screen users: On-screen Jump & Slide buttons available during run.
                </div>
              </div>
            </div>

            {/* Audio Toggle in Start Screen */}
            <div className="mt-4 flex items-center justify-center">
              <button
                onClick={onToggleSound}
                className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-slate-800/60"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
                <span>Sound: {soundEnabled ? 'Enabled' : 'Muted'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Screen Modal */}
      {state === 'PAUSED' && (
        <div className="pointer-events-auto my-auto flex flex-col items-center justify-center px-4 text-center z-20">
          <div className="max-w-xs w-full bg-slate-900/95 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-2xl">
            <h2 className="text-2xl font-bold font-display tracking-wide text-white uppercase mb-6">
              Game Paused
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onResume();
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Resume
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onRestart();
                }}
                className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Restart
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onMainMenu();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen Modal */}
      {state === 'GAMEOVER' && (
        <div className="pointer-events-auto my-auto flex flex-col items-center justify-center px-4 text-center z-20">
          <div className="max-w-sm w-full bg-slate-900/95 backdrop-blur-md p-6 sm:p-7 rounded-2xl border border-red-900/50 shadow-2xl shadow-red-950/40 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="mb-5">
              <span className="text-xs uppercase tracking-widest font-bold text-red-400 font-display">
                Run Terminated
              </span>
              <h2 className="text-3xl font-black font-display tracking-tight text-white uppercase mt-0.5">
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
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Distance Survived</span>
                <span className="text-xl font-bold font-mono tabular-nums text-white">
                  {stats.distance}
                  <span className="text-xs text-slate-400 font-normal ml-0.5">m</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Coins Collected</span>
                <span className="text-lg font-bold font-mono tabular-nums text-amber-300 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  +{stats.coinsCollected}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Balance</span>
                <span className="text-base font-bold font-mono tabular-nums text-amber-200 flex items-center gap-1">
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

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onRestart();
                }}
                className="w-full py-3.5 px-4 rounded-xl font-display font-bold text-base text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-sky-200 active:scale-98 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                PLAY AGAIN
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onMainMenu();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Touch Controls at Bottom during Gameplay */}
      {state === 'PLAYING' && (
        <footer className="pointer-events-auto px-4 pb-4 pt-2 flex items-center justify-between gap-4 z-20">
          {/* Slide Touch Button (Left Thumb) */}
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              onSlide();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onStopSlide();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              onSlide();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              onStopSlide();
            }}
            className="flex-1 max-w-[170px] h-16 sm:h-20 bg-gradient-to-b from-purple-900/80 to-purple-950/90 active:from-purple-600 active:to-purple-700 border-2 border-purple-500/60 active:border-purple-300 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-950/50 transition-transform active:scale-95 touch-none cursor-pointer"
            aria-label="Slide button"
          >
            <ArrowDown className="w-6 h-6 text-purple-200" />
            <span className="text-xs font-bold font-display tracking-wider text-purple-100 uppercase">
              SLIDE
            </span>
          </button>

          {/* Jump Touch Button (Right Thumb) */}
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              onJump();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              onJump();
            }}
            className="flex-1 max-w-[170px] h-16 sm:h-20 bg-gradient-to-b from-cyan-900/80 to-cyan-950/90 active:from-cyan-500 active:to-cyan-600 border-2 border-cyan-500/60 active:border-cyan-300 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-cyan-950/50 transition-transform active:scale-95 touch-none cursor-pointer"
            aria-label="Jump button"
          >
            <ArrowUp className="w-6 h-6 text-cyan-200" />
            <span className="text-xs font-bold font-display tracking-wider text-cyan-100 uppercase">
              JUMP
            </span>
          </button>
        </footer>
      )}

      {/* Empty space when not playing to maintain flex spacing */}
      {state !== 'PLAYING' && <div className="h-4" />}
    </div>
  );
};
