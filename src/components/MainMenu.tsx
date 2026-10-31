/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Trophy,
  Coins,
  ShoppingBag,
  Award,
  Shield,
  Magnet,
  Zap,
  Volume2,
  VolumeX,
  Gift,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { GameStats } from '../types/game.ts';
import { SKINS_CATALOG, SkinId } from '../types/skin.ts';
import { TRACKS_CATALOG } from '../types/track.ts';
import { soundManager } from '../audio/soundManager.ts';
import { drawStickman } from '../game/stickmanRenderer.ts';

interface MainMenuProps {
  stats: GameStats;
  soundEnabled: boolean;
  onStart: () => void;
  onOpenShop: () => void;
  onOpenTrackShop: () => void;
  onOpenMissions: () => void;
  onOpenDailyRewards: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  stats,
  soundEnabled,
  onStart,
  onOpenShop,
  onOpenTrackShop,
  onOpenMissions,
  onOpenDailyRewards,
  onToggleSound,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const equippedSkin = SKINS_CATALOG.find((s) => s.id === stats.equippedSkinId) || SKINS_CATALOG[0];
  const equippedTrack = TRACKS_CATALOG.find((t) => t.id === stats.equippedTrackId) || TRACKS_CATALOG[0];
  const unclaimedMissionsCount = (stats.missions || []).filter((m) => m.completed && !m.claimed).length;

  // Single-click guarded play launcher
  const handlePlayClick = useCallback(() => {
    if (isStarting) return;
    setIsStarting(true);
    soundManager.playClick();
    onStart();
    setTimeout(() => setIsStarting(false), 800);
  }, [isStarting, onStart]);

  // Support Enter key on main menu to start game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        e.preventDefault();
        handlePlayClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayClick]);

  // Lightweight 60 FPS animated stickman character showcase
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let cycle = 0;
    let gridOffset = 0;

    const width = 420;
    const height = 180;
    canvas.width = width;
    canvas.height = height;

    const groundY = 140;

    const renderPreview = () => {
      cycle += 0.15;
      gridOffset = (gridOffset + 5) % 32;

      // 1. Midnight Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#040817');
      skyGrad.addColorStop(0.65, '#0b132e');
      skyGrad.addColorStop(1, '#030612');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Distant Horizon Glow
      const glowGrad = ctx.createRadialGradient(width / 2, groundY - 10, 10, width / 2, groundY - 10, 180);
      glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.14)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Perspective Road Track
      ctx.save();
      const roadGrad = ctx.createLinearGradient(0, groundY, 0, height);
      roadGrad.addColorStop(0, '#040713');
      roadGrad.addColorStop(1, '#020308');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      // Perspective Grid Lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let x = -gridOffset; x < width + 30; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 22, height);
        ctx.stroke();
      }

      // Neon Baseline glowing with equipped skin accent
      ctx.strokeStyle = equippedSkin.accentColor;
      ctx.shadowColor = equippedSkin.accentColor;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();
      ctx.restore();

      // 4. Floating Gold Coins ahead of Runner
      const coinTime = Date.now() * 0.005;
      [
        { x: width - 110, y: groundY - 26, offset: 0 },
        { x: width - 45, y: groundY - 44, offset: 1.5 },
      ].forEach((c) => {
        const coinY = c.y + Math.sin(coinTime + c.offset) * 3;
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(c.x, coinY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(c.x - 1.5, coinY - 1.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 5. Draw Running Stickman
      drawStickman(ctx, 100, groundY, 'RUNNING', cycle, (stats.equippedSkinId || 'classic') as SkinId);

      animId = requestAnimationFrame(renderPreview);
    };

    renderPreview();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [stats.equippedSkinId, equippedSkin]);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 overflow-hidden flex flex-col justify-center items-center p-3 sm:p-5 select-none">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[260px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Single-Screen Dashboard Container */}
      <div className="relative w-full max-w-[1100px] h-full max-h-[720px] flex flex-col justify-between py-1 sm:py-2">
        
        {/* 1. COMPACT HEADER */}
        <header className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-sky-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/25">
              <Zap className="w-4 h-4 fill-slate-950" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-fuchsia-400 uppercase leading-none">
              STICKMAN RUSH
            </h1>
          </div>

          {/* Equipped Track & Skin in header with spacing for corner SoundToggle */}
          <div className="flex items-center gap-2 pr-28 sm:pr-36">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-slate-200 font-semibold hidden sm:inline">
                {equippedTrack.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                style={{ backgroundColor: equippedSkin.accentColor }}
              />
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                {equippedSkin.name}
              </span>
            </div>
          </div>
        </header>

        {/* 2. PLAYER STATISTICS CARDS */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
          {/* Card: Personal Best */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 shadow-md flex items-center gap-3 sm:gap-4 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block truncate">
                PERSONAL BEST
              </span>
              <div className="text-lg sm:text-2xl font-black font-mono tabular-nums text-white leading-tight">
                {stats.bestDistance}
                <span className="text-xs font-normal text-slate-400 ml-1">m</span>
              </div>
            </div>
          </div>

          {/* Card: Coin Balance */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 shadow-md flex items-center gap-3 sm:gap-4 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block truncate">
                COIN BALANCE
              </span>
              <div className="text-lg sm:text-2xl font-black font-mono tabular-nums text-amber-300 leading-tight">
                {stats.totalCoins}
              </div>
            </div>
          </div>
        </section>

        {/* 3. MAIN PLAY NOW BUTTON & CHARACTER SHOWCASE */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch shrink-0">
          {/* Prominent Center PLAY NOW Button */}
          <div className="md:col-span-7 flex">
            <button
              onClick={handlePlayClick}
              disabled={isStarting}
              className="group relative w-full min-h-[76px] sm:min-h-[96px] py-4 px-6 rounded-2xl font-display font-black text-2xl sm:text-3xl text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-sky-200 hover:from-cyan-300 hover:to-sky-100 active:scale-[0.99] transition-all shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:shadow-[0_0_45px_rgba(0,240,255,0.65)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-slate-950 group-hover:scale-110 transition-transform" />
              <span>PLAY NOW</span>
              <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3] group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          {/* Compact Animated Runner Preview Box */}
          <div className="md:col-span-5 relative min-h-[76px] sm:min-h-[96px] rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 shadow-inner flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full block object-cover" />

            {/* Equipped Skin Pill in Preview */}
            <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-700/80 backdrop-blur-sm">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: equippedSkin.accentColor }}
              />
              <span className="text-[11px] font-bold text-white leading-none">
                {equippedSkin.name}
              </span>
            </div>
          </div>
        </section>

        {/* 4. MAIN NAVIGATION (FOUR CARDS IN BALANCED LAYOUT) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
          {/* Card 1: Track Realms / Workshop */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenTrackShop();
            }}
            className="p-3 sm:p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/70 shadow-md transition-all text-left flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold font-display text-white group-hover:text-cyan-300 transition-colors truncate">
                  TRACK REALMS
                </h3>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
                  {equippedTrack.name}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
          </button>

          {/* Card 2: Armory / Skins */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenShop();
            }}
            className="p-3 sm:p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/70 shadow-md transition-all text-left flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold font-display text-white group-hover:text-amber-300 transition-colors truncate">
                  ARMORY / SKINS
                </h3>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
                  {equippedSkin.name}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
          </button>

          {/* Card 3: Missions & Goals */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenMissions();
            }}
            className="p-3 sm:p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/70 shadow-md transition-all text-left flex items-center justify-between cursor-pointer group relative"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold font-display text-white group-hover:text-sky-300 transition-colors truncate">
                  MISSIONS
                </h3>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
                  {unclaimedMissionsCount > 0 ? (
                    <span className="text-amber-300 font-bold">{unclaimedMissionsCount} Pending</span>
                  ) : (
                    'Bounties & Goals'
                  )}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
          </button>

          {/* Card 4: Daily Rewards */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenDailyRewards();
            }}
            className={`p-3 sm:p-3.5 rounded-xl transition-all text-left flex items-center justify-between cursor-pointer group ${
              stats.canClaimDailyReward
                ? 'bg-amber-950/40 hover:bg-amber-950/60 border border-amber-400/80 shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                : 'bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-400/60 shadow-md'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                  stats.canClaimDailyReward
                    ? 'bg-amber-500/25 border border-amber-400 text-amber-300'
                    : 'bg-purple-500/15 border border-purple-400/30 text-purple-400'
                }`}
              >
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold font-display text-white group-hover:text-amber-300 transition-colors truncate">
                  DAILY CACHE
                </h3>
                <span className="text-[10px] sm:text-[11px] block truncate">
                  {stats.canClaimDailyReward ? (
                    <span className="text-amber-300 font-bold animate-pulse">CLAIM READY!</span>
                  ) : (
                    <span className="text-slate-400">24h Rewards</span>
                  )}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 ml-1" />
          </button>
        </section>

        {/* 5. POWER-UP INFORMATION SECTION (THREE COMPACT CARDS) */}
        <section className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
          {/* Power-up: Shield */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold font-display text-cyan-200 block truncate">
                SHIELD
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
                Absorbs 1 hit
              </span>
            </div>
          </div>

          {/* Power-up: Magnet */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
              <Magnet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold font-display text-purple-200 block truncate">
                MAGNET
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
                Attracts coins
              </span>
            </div>
          </div>

          {/* Power-up: Speed */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold font-display text-amber-200 block truncate">
                SPEED
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">
                Hyper surge
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
