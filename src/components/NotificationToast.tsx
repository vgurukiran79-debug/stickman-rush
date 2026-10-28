/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Target, Award, Coins, X } from 'lucide-react';
import { MissionNotification } from '../types/missions.ts';

interface NotificationToastProps {
  notifications: MissionNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <aside aria-label="Game notifications" className="fixed top-14 sm:top-16 left-0 right-0 z-50 flex flex-col items-center pointer-events-none px-3 space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto max-w-sm w-full bg-slate-900/95 border border-cyan-400/60 rounded-xl p-3 shadow-2xl shadow-cyan-950/60 flex items-center justify-between gap-3 backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              {n.type === 'MISSION' ? (
                <Target className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Award className="w-4 h-4 stroke-[2.5]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-[10px] font-bold font-display uppercase tracking-wider text-cyan-400 leading-tight">
                {n.title}
              </div>
              <div className="text-xs font-semibold text-white truncate leading-snug">
                {n.subtitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {n.rewardCoins && (
              <span className="flex items-center gap-0.5 text-xs font-bold font-mono text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                <Coins className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                +{n.rewardCoins}
              </span>
            )}

            <button
              onClick={() => onDismiss(n.id)}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
};
