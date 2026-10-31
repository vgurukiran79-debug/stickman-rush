/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../audio/soundManager.ts';

interface SoundToggleProps {
  className?: string;
  variant?: 'corner' | 'compact' | 'pill';
  showLabel?: boolean;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({
  className = '',
  variant = 'corner',
  showLabel = true,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.getSoundEnabled());
  const [justToggled, setJustToggled] = useState<boolean>(false);

  // Subscribe to live audio state changes across the application and tabs
  useEffect(() => {
    const unsubscribe = soundManager.subscribe((enabled) => {
      setSoundEnabled(enabled);
    });
    return unsubscribe;
  }, []);

  const handleToggle = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newEnabled = soundManager.toggleMute();
    setSoundEnabled(newEnabled);
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 300);
  }, []);

  // Global keyboard shortcut: Press 'M' to toggle sound anywhere in the game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  if (variant === 'compact') {
    return (
      <button
        onClick={handleToggle}
        type="button"
        className={`p-1.5 sm:p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border transition-all cursor-pointer select-none ${
          soundEnabled
            ? 'border-cyan-500/50 hover:border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
            : 'border-rose-500/50 hover:border-rose-400 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
        } ${justToggled ? 'scale-110' : 'hover:scale-105 active:scale-95'} ${className}`}
        aria-label={soundEnabled ? 'Mute game sound (Press M)' : 'Unmute game sound (Press M)'}
        title={soundEnabled ? 'Sound is ON (Click or Press M to mute)' : 'Sound is MUTED (Click or Press M to unmute)'}
      >
        {soundEnabled ? (
          <Volume2 className="w-4 h-4 text-cyan-400" />
        ) : (
          <VolumeX className="w-4 h-4 text-rose-400" />
        )}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={handleToggle}
        type="button"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none text-xs font-semibold ${
          soundEnabled
            ? 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/50 text-cyan-300 shadow-[0_0_14px_rgba(0,240,255,0.2)]'
            : 'bg-slate-900/90 hover:bg-slate-800 border-rose-500/50 text-rose-300 shadow-[0_0_14px_rgba(244,63,94,0.2)]'
        } ${justToggled ? 'scale-105' : 'hover:scale-[1.02] active:scale-98'} ${className}`}
        aria-label={soundEnabled ? 'Mute game sound (Press M)' : 'Unmute game sound (Press M)'}
        title={soundEnabled ? 'Sound is ON (Click or Press M to mute)' : 'Sound is MUTED (Click or Press M to unmute)'}
      >
        {soundEnabled ? (
          <Volume2 className="w-4 h-4 text-cyan-400" />
        ) : (
          <VolumeX className="w-4 h-4 text-rose-400" />
        )}
        <span className="tracking-wider">{soundEnabled ? 'SOUND ON' : 'MUTED'}</span>
      </button>
    );
  }

  // Default 'corner' variant: positioned in the corner of the UI
  return (
    <button
      onClick={handleToggle}
      type="button"
      className={`fixed top-2.5 right-2.5 sm:top-3.5 sm:right-4 z-40 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl backdrop-blur-md transition-all duration-150 cursor-pointer select-none shadow-lg ${
        soundEnabled
          ? 'bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 shadow-[0_0_16px_rgba(0,240,255,0.25)] hover:shadow-[0_0_24px_rgba(0,240,255,0.4)]'
          : 'bg-slate-900/90 hover:bg-slate-800 border border-rose-500/50 hover:border-rose-400 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.25)]'
      } ${justToggled ? 'scale-105' : 'hover:scale-[1.02] active:scale-95'} ${className}`}
      aria-label={soundEnabled ? 'Mute game sound (Press M)' : 'Unmute game sound (Press M)'}
      title={soundEnabled ? 'Sound is ON (Click or Press M to mute)' : 'Sound is MUTED (Click or Press M to unmute)'}
    >
      <div className="relative flex items-center justify-center">
        {soundEnabled ? (
          <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
        ) : (
          <VolumeX className="w-4 h-4 text-rose-400" />
        )}
      </div>

      {showLabel && (
        <div className="flex flex-col text-left leading-none">
          <span className="text-[11px] sm:text-xs font-bold font-display uppercase tracking-wider">
            {soundEnabled ? 'SOUND ON' : 'MUTED'}
          </span>
          <span className="text-[9px] text-slate-400 hidden sm:inline">
            {soundEnabled ? 'Press M to mute' : 'Press M to unmute'}
          </span>
        </div>
      )}
    </button>
  );
};
