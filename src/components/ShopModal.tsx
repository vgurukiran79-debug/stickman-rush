/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Coins,
  Check,
  ShoppingBag,
  Sparkles,
  Shield,
  Zap,
  Lock,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Play,
} from 'lucide-react';
import { Skin, SkinId, SKINS_CATALOG } from '../types/skin.ts';
import { PlayerPose } from '../types/game.ts';
import { drawStickman } from '../game/stickmanRenderer.ts';
import { soundManager } from '../audio/soundManager.ts';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCoins: number;
  equippedSkinId: SkinId;
  unlockedSkins: SkinId[];
  onEquipSkin: (skinId: SkinId) => void;
  onPurchaseSkin: (skinId: SkinId) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  totalCoins,
  equippedSkinId,
  unlockedSkins,
  onEquipSkin,
  onPurchaseSkin,
}) => {
  const [selectedSkinId, setSelectedSkinId] = useState<SkinId>(equippedSkinId || 'classic');
  const [previewPose, setPreviewPose] = useState<PlayerPose>('RUNNING');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const cycleRef = useRef<number>(0);

  // Keep selected skin synchronized if equipped changes
  useEffect(() => {
    if (equippedSkinId) {
      setSelectedSkinId(equippedSkinId);
    }
  }, [equippedSkinId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live animation loop for the Preview Stage
  useEffect(() => {
    if (!isOpen) return;

    let lastT = performance.now();
    const renderPreview = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;

      cycleRef.current += dt * 10;

      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw futuristic stage backdrop
          const width = canvas.width;
          const height = canvas.height;
          const groundY = height - 32;

          // Ambient grid & glow
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, '#020617');
          grad.addColorStop(1, '#090d16');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Neon ground platform
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let x = -((cycleRef.current * 18) % 30); x < width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(x - 20, height);
            ctx.stroke();
          }

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, groundY);
          ctx.lineTo(width, groundY);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Holographic pedestal under stickman
          const selectedSkin = SKINS_CATALOG.find((s) => s.id === selectedSkinId) || SKINS_CATALOG[0];
          ctx.fillStyle = selectedSkin.accentColor;
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.ellipse(width / 2, groundY, 40, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;

          // Render Stickman at center of preview stage
          const isJumping = previewPose === 'JUMPING';
          const drawY = isJumping ? groundY - 28 : groundY;

          drawStickman(
            ctx,
            width / 2,
            drawY,
            previewPose,
            cycleRef.current,
            selectedSkinId,
            { isAscending: true }
          );
        }
      }

      animFrameRef.current = requestAnimationFrame(renderPreview);
    };

    animFrameRef.current = requestAnimationFrame(renderPreview);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, selectedSkinId, previewPose]);

  if (!isOpen) return null;

  const selectedSkin = SKINS_CATALOG.find((s) => s.id === selectedSkinId) || SKINS_CATALOG[0];
  const isSelectedUnlocked = unlockedSkins.includes(selectedSkinId) || selectedSkin.price === 0;
  const isSelectedEquipped = equippedSkinId === selectedSkinId;
  const canAffordSelected = totalCoins >= selectedSkin.price;

  const handleBuy = (skin: Skin) => {
    if (totalCoins < skin.price) {
      soundManager.playError();
      setFeedbackMessage(`Need ${skin.price - totalCoins} more coins!`);
      setTimeout(() => setFeedbackMessage(null), 2500);
      return;
    }

    onPurchaseSkin(skin.id);
    setFeedbackMessage(`Unlocked ${skin.name}!`);
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  const handleEquip = (skinId: SkinId) => {
    onEquipSkin(skinId);
    setFeedbackMessage(`Equipped ${SKINS_CATALOG.find((s) => s.id === skinId)?.name}!`);
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/40 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display tracking-wide text-white uppercase leading-tight">
                Cyber Runner Armory
              </h2>
              <p className="text-[11px] text-slate-400 leading-none">
                Cosmetic skins · 100% cosmetic fair play
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Coin Balance */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs sm:text-sm shadow-inner">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalCoins}</span>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Shop"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback notification banner */}
        {feedbackMessage && (
          <div className="bg-cyan-950/90 border-y border-cyan-500/40 text-cyan-200 text-xs py-1.5 px-4 text-center font-medium animate-in fade-in duration-150 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {feedbackMessage}
          </div>
        )}

        {/* Body Content: Stage & Catalog */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {/* 1. INTERACTIVE PREVIEW STAGE */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-950/80 p-3 overflow-hidden shadow-inner flex flex-col sm:flex-row items-center gap-3">
            {/* Live Canvas Stage */}
            <div className="relative w-full sm:w-64 h-36 rounded-lg overflow-hidden border border-slate-800/80 bg-slate-950 shrink-0 flex items-center justify-center">
              <canvas
                ref={previewCanvasRef}
                width={256}
                height={144}
                className="w-full h-full object-contain block"
              />

              {/* Pose Controls Floating in Stage */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700/60 backdrop-blur-sm">
                <button
                  onClick={() => setPreviewPose('RUNNING')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    previewPose === 'RUNNING'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Run
                </button>
                <button
                  onClick={() => setPreviewPose('JUMPING')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    previewPose === 'JUMPING'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Jump
                </button>
                <button
                  onClick={() => setPreviewPose('SLIDING')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    previewPose === 'SLIDING'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Slide
                </button>
              </div>

              {/* Rarity & ID badge */}
              <div
                className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                style={{
                  backgroundColor: `${selectedSkin.accentColor}25`,
                  color: selectedSkin.accentColor,
                  borderColor: `${selectedSkin.accentColor}50`,
                  borderWidth: 1,
                }}
              >
                {selectedSkin.rarity}
              </div>
            </div>

            {/* Selected Skin Description & Action */}
            <div className="flex-1 flex flex-col justify-between w-full h-full text-left">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold font-display text-white">
                    {selectedSkin.name}
                  </h3>
                  {isSelectedEquipped ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                      <Check className="w-3 h-3 stroke-[3]" />
                      EQUIPPED
                    </span>
                  ) : isSelectedUnlocked ? (
                    <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      {selectedSkin.price} Coins
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {selectedSkin.description}
                </p>

                {/* Features Pill List */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedSkin.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Primary Stage Action Button */}
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                {isSelectedEquipped ? (
                  <button
                    disabled
                    className="py-1.5 px-4 rounded-xl text-xs font-bold bg-slate-800/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 opacity-90 cursor-default"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ACTIVE SKIN
                  </button>
                ) : isSelectedUnlocked ? (
                  <button
                    onClick={() => handleEquip(selectedSkin.id)}
                    className="py-2 px-5 rounded-xl text-xs font-bold font-display uppercase tracking-wide bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    EQUIP NOW
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(selectedSkin)}
                    disabled={!canAffordSelected}
                    className={`py-2 px-5 rounded-xl text-xs font-bold font-display uppercase tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                      canAffordSelected
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-98'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
                    }`}
                  >
                    {canAffordSelected ? (
                      <>
                        <Coins className="w-3.5 h-3.5" />
                        UNLOCK FOR {selectedSkin.price} COINS
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        NEED {selectedSkin.price - totalCoins} MORE COINS
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. SKIN CATALOG LIST */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-display mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Available Skins ({unlockedSkins.length}/{SKINS_CATALOG.length} Unlocked)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SKINS_CATALOG.map((skin) => {
                const isUnlocked = unlockedSkins.includes(skin.id) || skin.price === 0;
                const isEquipped = equippedSkinId === skin.id;
                const isSelected = selectedSkinId === skin.id;
                const canAfford = totalCoins >= skin.price;

                return (
                  <div
                    key={skin.id}
                    onClick={() => {
                      setSelectedSkinId(skin.id);
                      soundManager.playClick();
                    }}
                    className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 shadow-md shadow-cyan-950/50'
                        : isEquipped
                        ? 'border-emerald-500/50 bg-emerald-950/20'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                    }`}
                  >
                    {/* Top Row: Name, Rarity & Price */}
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                            style={{
                              backgroundColor: skin.accentColor,
                              boxShadow: `0 0 8px ${skin.accentColor}`,
                            }}
                          />
                          <h4 className="text-sm font-bold text-white font-display">
                            {skin.name}
                          </h4>
                        </div>

                        {/* Status Label */}
                        {isEquipped ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            EQUIPPED
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            OWNED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300">
                            <Coins className="w-3 h-3 text-amber-400" />
                            {skin.price}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {skin.description}
                      </p>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {skin.tagline}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isEquipped ? (
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            Active
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquip(skin.id);
                            }}
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-cyan-900/60 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/50 text-cyan-200 transition-colors cursor-pointer"
                          >
                            Equip
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuy(skin);
                            }}
                            disabled={!canAfford}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                              canAfford
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-sm shadow-amber-500/30'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3 h-3" />
                            Buy ({skin.price})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/80 text-center text-[11px] text-slate-400 shrink-0">
          Earn gold coins during runs and by completing missions to unlock all cybernetic skins!
        </div>
      </div>
    </div>
  );
};
