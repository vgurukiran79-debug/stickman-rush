/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Trophy,
  Coins,
  Sparkles,
  ShoppingBag,
  Award,
  Shield,
  Magnet,
  Zap,
  Volume2,
  VolumeX,
  Keyboard,
  Smartphone,
  ChevronRight,
  Gift,
} from 'lucide-react';
import { GameStats } from '../types/game.ts';
import { SKINS_CATALOG, SkinId } from '../types/skin.ts';
import { soundManager } from '../audio/soundManager.ts';
import { drawStickman } from '../game/stickmanRenderer.ts';

interface MainMenuProps {
  stats: GameStats;
  soundEnabled: boolean;
  onStart: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenDailyRewards: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  soundEnabled,
  onStart,
  onOpenShop,
  onOpenMissions,
  onOpenDailyRewards,
  onToggleSound,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const equippedSkin = SKINS_CATALOG.find((s) => s.id === stats.equippedSkinId) || SKINS_CATALOG[0];
  const unclaimedMissionsCount = (stats.missions || []).filter((m) => m.completed && !m.claimed).length;

  // Single-click guarded play launcher
  const handlePlayClick = () => {
    if (isStarting) return;
    setIsStarting(true);
    soundManager.playClick();
    onStart();
    setTimeout(() => setIsStarting(false), 800);
  };

  // Mini preview canvas animation loop for hero stickman
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let cycle = 0;
    let gridOffset = 0;

    // Set preview resolution
    const width = 240;
    const height = 110;
    canvas.width = width;
    canvas.height = height;

    const renderPreview = () => {
      cycle += 0.14;
      gridOffset = (gridOffset + 3.5) % 30;

      // Clear preview background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Distant horizontal horizon gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#040711');
      gradient.addColorStop(0.65, '#0b1329');
      gradient.addColorStop(1, '#02040a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Perspective ground grid lines
      const groundY = 82;
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;

      // Ground baseline
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Moving vertical grid stripes
      for (let x = -gridOffset; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 15, height);
        ctx.stroke();
      }

      // Neon grid glow line beneath runner
      ctx.strokeStyle = equippedSkin.accentColor;
      ctx.shadowColor = equippedSkin.accentColor;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 1);
      ctx.lineTo(width, groundY + 1);
      ctx.stroke();
      ctx.restore();

      // Floating collectible gold coins preview
      const coinTime = Date.now() * 0.004;
      const coinY = groundY - 26 + Math.sin(coinTime) * 3;
      const coinX = width - 45;

      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(coinX, coinY, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF59D';
      ctx.beginPath();
      ctx.arc(coinX - 1.5, coinY - 1.5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw running stickman with currently equipped skin
      drawStickman(ctx, 85, groundY, 'RUNNING', cycle, (stats.equippedSkinId || 'classic') as SkinId);

      animId = requestAnimationFrame(renderPreview);
    };

    renderPreview();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [stats.equippedSkinId, equippedSkin.accentColor]);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-cyan-950/40 text-center animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Subtle background glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header & Branding */}
        <div className="relative mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-[11px] sm:text-xs font-semibold uppercase tracking-widest mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            CYBERPUNK RUNNER
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 drop-shadow-[0_4px_12px_rgba(0,240,255,0.25)] uppercase leading-none">
            Stickman Rush
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
            DODGE <span className="text-cyan-400">·</span> COLLECT <span className="text-amber-400">·</span> CONQUER
          </p>
        </div>

        {/* 2. Hero Animated Stickman Preview */}
        <div className="relative w-full h-[90px] sm:h-[105px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mb-3 sm:mb-4 flex items-center justify-center shadow-inner">
          <canvas ref={canvasRef} className="w-[240px] h-[110px] block" />
          <div className="absolute bottom-1.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 text-[10px] text-slate-300">
            <span
              className="w-2 h-2 rounded-full inline-block shadow-sm"
              style={{ backgroundColor: equippedSkin.accentColor }}
            />
            <span className="font-medium">{equippedSkin.name}</span>
          </div>
        </div>

        {/* 3. Player Stats Cards (Best Score & Coin Bank) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 bg-slate-950/70 rounded-xl border border-slate-800/90 shadow-inner">
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Best Score
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white mt-0.5 tracking-tight">
              {stats.bestDistance}{' '}
              <span className="text-xs text-slate-400 font-normal">m</span>
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 bg-slate-950/70 rounded-xl border border-slate-800/90 shadow-inner">
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Coin Bank
            </span>
            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-300 mt-0.5 tracking-tight">
              {stats.totalCoins}
            </span>
          </div>
        </div>

        {/* 4. Primary Action Button (PLAY NOW with Single-Click Guard & Glow) */}
        <button
          onClick={handlePlayClick}
          disabled={isStarting}
          className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-display font-black text-base sm:text-lg text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-sky-300 hover:from-cyan-300 hover:to-sky-200 active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:shadow-[0_0_32px_rgba(0,240,255,0.55)] flex items-center justify-center gap-2.5 cursor-pointer mb-3 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950" />
          <span>PLAY NOW</span>
          <ChevronRight className="w-5 h-5 opacity-80 stroke-[2.5]" />
        </button>

        {/* 5. Secondary Navigation Buttons (Armory, Missions, Daily Rewards) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenShop();
            }}
            className="py-2 px-2.5 sm:px-3 rounded-xl font-semibold text-xs text-amber-300 bg-amber-950/30 hover:bg-amber-950/60 border border-amber-800/60 hover:border-amber-400/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Armory</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenMissions();
            }}
            className="py-2 px-2.5 sm:px-3 rounded-xl font-semibold text-xs text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-800/60 hover:border-cyan-400/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm relative group"
          >
            <Award className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Missions</span>
            {unclaimedMissionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-bounce shadow-sm">
                {unclaimedMissionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenDailyRewards();
            }}
            className={`py-2 px-2.5 sm:px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm relative group ${
              stats.canClaimDailyReward
                ? 'text-amber-200 bg-gradient-to-r from-amber-950/70 to-yellow-950/70 border border-amber-400/80 shadow-[0_0_12px_rgba(255,215,0,0.3)] animate-pulse'
                : 'text-amber-300/80 bg-slate-950/50 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40'
            }`}
          >
            <Gift className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${stats.canClaimDailyReward ? 'text-amber-300' : 'text-amber-400/70'}`} />
            <span className="truncate">Daily</span>
            {stats.canClaimDailyReward && (
              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black animate-bounce">
                CLAIM!
              </span>
            )}
          </button>
        </div>

        {/* 6. Power-Ups Guide Cards */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 text-left">
          <div className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex flex-col items-center text-center hover:border-cyan-500/40 transition-colors">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 mb-1 border border-cyan-400/30">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-cyan-200">Shield</span>
            <span className="text-[9px] text-slate-400 leading-tight">Absorbs 1 hit</span>
          </div>

          <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-800/40 flex flex-col items-center text-center hover:border-purple-500/40 transition-colors">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 mb-1 border border-purple-400/30">
              <Magnet className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-purple-200">Magnet</span>
            <span className="text-[9px] text-slate-400 leading-tight">Attracts coins</span>
          </div>

          <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-800/40 flex flex-col items-center text-center hover:border-amber-500/40 transition-colors">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 mb-1 border border-amber-400/30">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold text-amber-200">Speed</span>
            <span className="text-[9px] text-slate-400 leading-tight">Hyper surge</span>
          </div>
        </div>

        {/* 7. Controls Guide (Responsive for Mobile & Desktop) */}
        <div className="text-left bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              Phone & Desktop Controls
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Keyboard className="w-3 h-3" />
              Responsive
            </span>
          </div>

          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Leap over crates & spikes:</span>
              <span className="font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 text-[11px]">
                JUMP (Space / W / Right Thumb)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Glide under beams:</span>
              <span className="font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50 text-[11px]">
                SLIDE (S / Down / Left Thumb)
              </span>
            </div>
          </div>
        </div>

        {/* 8. Sound Toggle Footer */}
        <div className="flex items-center justify-center pt-1 border-t border-slate-800/50">
          <button
            onClick={onToggleSound}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-slate-800/60"
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-red-400" />
            )}
            <span>Audio: {soundEnabled ? 'Sound Enabled' : 'Muted'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
