/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
    speed: 380,
    isNewBest: false,
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

        // If strong vertical swipe
        if (Math.abs(deltaY) > 30 && Math.abs(deltaY) > Math.abs(deltaX)) {
          if (deltaY < 0) {
            engine.jump();
          } else {
            engine.slide();
            setTimeout(() => engine.stopSlide(), 400);
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

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 select-none overflow-hidden p-0 sm:p-2">
      {/* 16:9 Aspect Ratio Game Container */}
      <div className="relative w-full max-w-[1280px] aspect-[16/9] max-h-[100vh] sm:rounded-2xl overflow-hidden shadow-2xl shadow-cyan-950/20 border border-slate-800/80 bg-slate-950">
        {/* HTML5 Game Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block object-contain select-none"
        />

        {/* UI Overlay */}
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
        />
      </div>
    </div>
  );
};
