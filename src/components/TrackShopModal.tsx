/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Coins,
  Check,
  Compass,
  Lock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Flame,
  Snowflake,
  Trees,
  Cpu,
  Navigation,
} from 'lucide-react';
import { TrackId, TrackInfo, TRACKS_CATALOG } from '../types/track.ts';
import { WorldRenderer } from '../game/renderer.ts';
import { ObstacleManager } from '../game/obstacleManager.ts';
import { soundManager } from '../audio/soundManager.ts';
import { SoundToggle } from './SoundToggle.tsx';

interface TrackShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCoins: number;
  equippedTrackId: TrackId;
  unlockedTracks: TrackId[];
  onEquipTrack: (trackId: TrackId) => void;
  onPurchaseTrack: (trackId: TrackId) => void;
}

export const TrackShopModal: React.FC<TrackShopModalProps> = ({
  isOpen,
  onClose,
  totalCoins,
  equippedTrackId,
  unlockedTracks,
  onEquipTrack,
  onPurchaseTrack,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<TrackId>(equippedTrackId || 'default');
  const [confirmTrack, setConfirmTrack] = useState<TrackInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);
  const obstacleMgrRef = useRef<ObstacleManager | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync selected track with equipped track on open
  useEffect(() => {
    if (isOpen) {
      setSelectedTrackId(equippedTrackId || 'default');
      setErrorMessage(null);
      setSuccessMessage(null);
      setConfirmTrack(null);
    }
  }, [isOpen, equippedTrackId]);

  // Live animated canvas preview for the selected track
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 720;
    canvas.height = 240;

    const renderer = new WorldRenderer(selectedTrackId);
    rendererRef.current = renderer;

    const obsMgr = new ObstacleManager();
    obstacleMgrRef.current = obsMgr;

    let elapsed = 0;
    let lastT = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      elapsed += dt;

      // Update renderer & obstacles at steady showcase speed
      renderer.update(dt, 260);
      obsMgr.update(dt, 260);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render environment scaled to preview canvas
      ctx.save();
      const scaleX = canvas.width / 960;
      const scaleY = canvas.height / 540;
      ctx.scale(scaleX, scaleY);

      renderer.beginFrame(ctx, elapsed, elapsed * 10);
      obsMgr.draw(ctx, selectedTrackId);
      renderer.endFrame(ctx, 260);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, selectedTrackId]);

  if (!isOpen) return null;

  const selectedTrack = TRACKS_CATALOG.find((t) => t.id === selectedTrackId) || TRACKS_CATALOG[0];
  const isSelectedUnlocked = unlockedTracks.includes(selectedTrackId) || selectedTrackId === 'default';
  const isSelectedEquipped = equippedTrackId === selectedTrackId;

  const handleSelectTrack = (trackId: TrackId) => {
    soundManager.playClick();
    setSelectedTrackId(trackId);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleEquip = (trackId: TrackId) => {
    soundManager.playEquipSkin();
    onEquipTrack(trackId);
    setSuccessMessage(`Equipped ${selectedTrack.name}!`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleBuyClick = (track: TrackInfo) => {
    soundManager.playClick();
    if (totalCoins < track.price) {
      soundManager.playError();
      const needed = track.price - totalCoins;
      setErrorMessage(`Insufficient coins. You need ${needed.toLocaleString()} more coins!`);
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    setConfirmTrack(track);
  };

  const handleConfirmPurchase = () => {
    if (!confirmTrack) return;
    if (totalCoins < confirmTrack.price) {
      soundManager.playError();
      setConfirmTrack(null);
      return;
    }
    soundManager.playBuySkin();
    onPurchaseTrack(confirmTrack.id);
    onEquipTrack(confirmTrack.id);
    setSelectedTrackId(confirmTrack.id);
    setSuccessMessage(`Unlocked & equipped ${confirmTrack.name}!`);
    setConfirmTrack(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const getTrackIcon = (id: TrackId) => {
    switch (id) {
      case 'cyber_city':
        return <Cpu className="w-5 h-5 text-sky-400" />;
      case 'jungle_adventure':
        return <Trees className="w-5 h-5 text-emerald-400" />;
      case 'lava_world':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'frozen_kingdom':
        return <Snowflake className="w-5 h-5 text-cyan-300" />;
      case 'default':
      default:
        return <Navigation className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl my-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden max-h-[92vh]">

        {/* 1. MODAL HEADER */}
        <header className="px-4 sm:px-6 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-display tracking-wider text-white uppercase leading-tight">
                Track Workshop · Realms
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Unlock distinct running tracks with unique environments, parallax and obstacles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Player's Coin Balance */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs sm:text-sm shadow-inner">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{totalCoins.toLocaleString()}</span>
            </div>

            {/* Sound Toggle */}
            <SoundToggle variant="compact" />

            {/* Close Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Track Shop"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* FEEDBACK BANNERS */}
        {errorMessage && (
          <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-500/50 text-rose-200 text-xs sm:text-sm font-semibold flex items-center gap-2 justify-center animate-in slide-in-from-top-1">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/50 text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2 justify-center animate-in slide-in-from-top-1">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 2. BODY CONTENT: SPLIT OR STACKED LAYOUT */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex flex-col gap-4">

          {/* TOP SECTION: LIVE ANIMATED PREVIEW STAGE FOR SELECTED TRACK */}
          <section className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-inner flex flex-col">
            <div className="relative w-full h-36 sm:h-52 bg-slate-950 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full block object-cover"
              />

              {/* Theme & Track Name Overlay in Stage */}
              <div className="absolute top-2.5 left-3 sm:top-3 sm:left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 backdrop-blur-md">
                {getTrackIcon(selectedTrack.id)}
                <span className="text-xs sm:text-sm font-bold font-display text-white tracking-wide">
                  {selectedTrack.name}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  · {selectedTrack.theme}
                </span>
              </div>

              {/* Status Badge in Stage */}
              <div className="absolute top-2.5 right-3 sm:top-3 sm:right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border shadow-md">
                {isSelectedEquipped ? (
                  <span className="text-cyan-300 border-cyan-400/50 bg-cyan-950/80 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> EQUIPPED
                  </span>
                ) : isSelectedUnlocked ? (
                  <span className="text-emerald-300 border-emerald-400/50 bg-emerald-950/80">
                    UNLOCKED
                  </span>
                ) : (
                  <span className="text-amber-300 border-amber-400/50 bg-amber-950/80 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> {selectedTrack.price.toLocaleString()} COINS
                  </span>
                )}
              </div>

              {/* Action Button Over Stage */}
              <div className="absolute bottom-2.5 right-3 sm:bottom-3 sm:right-4 flex items-center gap-2">
                {isSelectedEquipped ? (
                  <div className="px-4 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>ACTIVE TRACK</span>
                  </div>
                ) : isSelectedUnlocked ? (
                  <button
                    onClick={() => handleEquip(selectedTrack.id)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-black font-display tracking-wider uppercase transition-all shadow-lg shadow-emerald-950/60 cursor-pointer"
                  >
                    SELECT & EQUIP
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuyClick(selectedTrack)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-95 text-slate-950 text-xs sm:text-sm font-black font-display tracking-wider uppercase transition-all shadow-lg shadow-amber-950/60 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Coins className="w-4 h-4 fill-slate-950" />
                    <span>UNLOCK FOR {selectedTrack.price.toLocaleString()}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Selected Track Details Footer */}
            <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-200">
                  {selectedTrack.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-400">
                  {selectedTrack.features.map((feat, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedTrack.accentColor }} />
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* BOTTOM SECTION: 5 TRACK CARDS GRID */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TRACKS_CATALOG.map((track) => {
              const isUnlocked = unlockedTracks.includes(track.id) || track.id === 'default';
              const isEquipped = equippedTrackId === track.id;
              const isSelected = selectedTrackId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track.id)}
                  className={`relative p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-slate-850 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                      : 'bg-slate-900/80 hover:bg-slate-850/90 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  {/* Top Row: Track Icon, Name, Price */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `${track.accentColor}15`,
                            borderColor: `${track.accentColor}40`,
                          }}
                        >
                          {getTrackIcon(track.id)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold font-display text-white truncate leading-tight">
                            {track.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {track.subtitle}
                          </span>
                        </div>
                      </div>

                      {/* Price / Status pill */}
                      {isEquipped ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 border border-cyan-400 text-cyan-300 shrink-0">
                          EQUIPPED
                        </span>
                      ) : isUnlocked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 shrink-0">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-400/50 text-amber-300 flex items-center gap-1 shrink-0">
                          <Coins className="w-3 h-3 text-amber-400" />
                          {track.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 mb-3">
                      {track.description}
                    </p>
                  </div>

                  {/* Card Actions: Buy / Equip / Equipped */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                    <span className="text-[10px] text-slate-400 truncate">
                      {track.theme}
                    </span>

                    {isEquipped ? (
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Equipped
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTrack(track.id);
                          handleEquip(track.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        Equip
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTrack(track.id);
                          handleBuyClick(track);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <Coins className="w-3 h-3" />
                        Buy
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

        </div>

        {/* 3. CONFIRMATION MODAL OVERLAY */}
        {confirmTrack && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-slate-900 border border-amber-400/60 rounded-2xl p-5 shadow-2xl text-center flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center mx-auto text-amber-400">
                <Coins className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Confirm Track Purchase
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Unlock and permanently equip <strong className="text-amber-300">{confirmTrack.name}</strong>?
                </p>
              </div>

              {/* Price Calculation Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5 font-mono">
                <div className="flex justify-between">
                  <span>Track Price:</span>
                  <span className="text-amber-300 font-bold">-{confirmTrack.price.toLocaleString()} coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span>{totalCoins.toLocaleString()} coins</span>
                </div>
                <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-white">
                  <span>Remaining Balance:</span>
                  <span className="text-emerald-400">{(totalCoins - confirmTrack.price).toLocaleString()} coins</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setConfirmTrack(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-95 text-slate-950 text-xs sm:text-sm font-black font-display tracking-wider uppercase shadow-lg shadow-amber-950/60 cursor-pointer"
                >
                  Confirm & Unlock
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
