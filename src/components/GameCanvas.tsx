/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '../game/constants.ts';
import { GameEngine } from '../game/gameEngine.ts';
import { GameState, GameStats } from '../types/game.ts';
import { UIOverlay } from './UIOverlay.tsx';
import { soundManager } from '../audio/soundManager.ts';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('START');
  const [stats, setStats] = useState<GameStats>({
    distance: 0,
    coinsCollected: 0,
    bestDistance: 0,
    totalCoins: 0,
    speed: 340,
    isNewBest: false,
    activePowerUp: null,
    missions: [],
    achievements: [],
    activeNotifications: [],
    runObstaclesDodged: 0,
    runActiveTime: 0,
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.getSoundEnabled());

  // Initialize engine on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set internal resolution
    canvas.width = VIRTUAL_WIDTH;
    canvas.height = VIRTUAL_HEIGHT;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.onStateChange = (newState) => {
      setGameState(newState);
    };

    engine.onStatsUpdate = (newStats) => {
      setStats(newStats);
    };

    // Populate initial stats
    setStats(engine.getStats());

    // Start rendering loop (draws background even on start screen)
    engine.runLoop();

    return () => {
      engine.stopLoop();
    };
  }, []);

  // Desktop keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      const code = e.code;
      const key = e.key;

      // Jump: Space, KeyW, ArrowUp
      if (code === 'Space' || code === 'KeyW' || key === 'ArrowUp') {
        e.preventDefault();
        if (e.repeat) return; // Prevent repeated keydowns while holding jump
        if (engine.getState() === 'PLAYING') {
          engine.jump();
        } else if (engine.getState() === 'START') {
          engine.start();
        }
      }

      // Slide: KeyS, ArrowDown
      if (code === 'KeyS' || key === 'ArrowDown') {
        e.preventDefault();
        if (engine.getState() === 'PLAYING') {
          engine.slide();
        }
      }

      // Pause/Resume: Escape
      if (code === 'Escape' || key === 'Escape') {
        e.preventDefault();
        if (e.repeat) return;
        engine.togglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      const code = e.code;
      const key = e.key;

      if (code === 'KeyS' || key === 'ArrowDown') {
        engine.stopSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch swipe fallback on canvas area
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartY = 0;
    let touchStartX = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const engine = engineRef.current;
      if (!engine || engine.getState() !== 'PLAYING') return;

      if (e.changedTouches.length > 0) {
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const deltaX = e.changedTouches[0].clientX - touchStartX;

        // Vertical swipe detection
        if (Math.abs(deltaY) > 30 && Math.abs(deltaY) > Math.abs(deltaX)) {
          if (deltaY < 0) {
            engine.jump();
          } else {
            engine.slide();
            setTimeout(() => engine.stopSlide(), 500);
          }
        }
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Button handlers
  const handleStart = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.restart();
  }, []);

  const handleMainMenu = useCallback(() => {
    engineRef.current?.returnToMainMenu();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const handleJump = useCallback(() => {
    engineRef.current?.jump();
  }, []);

  const handleSlide = useCallback(() => {
    engineRef.current?.slide();
  }, []);

  const handleStopSlide = useCallback(() => {
    engineRef.current?.stopSlide();
  }, []);

  const handleToggleSound = useCallback(() => {
    const enabled = soundManager.toggleMute();
    setSoundEnabled(enabled);
  }, []);

  const handleClaimReward = useCallback((missionId: string) => {
    engineRef.current?.claimMissionReward(missionId);
  }, []);

  const handleDismissNotification = useCallback((id: string) => {
    engineRef.current?.dismissNotification(id);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] flex flex-col justify-between items-center bg-slate-950 select-none overflow-hidden touch-none p-0 sm:p-2">
      {/* Centered Game Viewport Container */}
      <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden">
        {/* 16:9 Aspect Ratio Arcade Display Frame */}
        <div className="relative w-full max-w-[1280px] aspect-[16/9] max-h-full sm:rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950/20 border-0 sm:border border-slate-800/80 bg-slate-950 flex items-center justify-center">
          {/* HTML5 Game Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block object-contain select-none touch-none"
          />

          {/* In-Game HUD, Modals, and Notifications Overlay */}
          <UIOverlay
            state={gameState}
            stats={stats}
            soundEnabled={soundEnabled}
            onStart={handleStart}
            onResume={handleResume}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
            onPause={handlePause}
            onJump={handleJump}
            onSlide={handleSlide}
            onStopSlide={handleStopSlide}
            onToggleSound={handleToggleSound}
            onClaimReward={handleClaimReward}
            onDismissNotification={handleDismissNotification}
          />
        </div>
      </div>

      {/* Dedicated Mobile Bottom Arcade Touch Controls (active during run) */}
      {gameState === 'PLAYING' && (
        <div className="w-full max-w-lg px-3 py-2 sm:py-3 pb-3 sm:pb-5 flex items-center justify-between gap-3 sm:gap-6 z-20 shrink-0 touch-none">
          {/* SLIDE Touch Button (Left Thumb) */}
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              handleSlide();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleStopSlide();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSlide();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              handleStopSlide();
            }}
            className="flex-1 h-14 sm:h-20 bg-gradient-to-b from-purple-900/90 to-purple-950/95 active:from-purple-600 active:to-purple-700 border-2 border-purple-500/70 active:border-purple-300 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition-transform active:scale-95 touch-none select-none cursor-pointer"
            aria-label="Slide button"
          >
            <ArrowDown className="w-6 h-6 sm:w-7 sm:h-7 text-purple-200 stroke-[2.5]" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs sm:text-sm font-bold font-display tracking-wider text-purple-100 uppercase">
                SLIDE
              </span>
              <span className="text-[10px] text-purple-300/70 font-medium hidden sm:inline">
                Hold to glide
              </span>
            </div>
          </button>

          {/* JUMP Touch Button (Right Thumb) */}
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              handleJump();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleJump();
            }}
            className="flex-1 h-14 sm:h-20 bg-gradient-to-b from-cyan-900/90 to-cyan-950/95 active:from-cyan-500 active:to-cyan-600 border-2 border-cyan-500/70 active:border-cyan-300 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-transform active:scale-95 touch-none select-none cursor-pointer"
            aria-label="Jump button"
          >
            <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-200 stroke-[2.5]" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-xs sm:text-sm font-bold font-display tracking-wider text-cyan-100 uppercase">
                JUMP
              </span>
              <span className="text-[10px] text-cyan-300/70 font-medium hidden sm:inline">
                Tap to leap
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
