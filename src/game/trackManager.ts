/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  STORAGE_KEY_UNLOCKED_TRACKS,
  STORAGE_KEY_EQUIPPED_TRACK,
  STORAGE_KEY_TOTAL_COINS,
} from './constants.ts';
import { TRACKS_CATALOG, TrackInfo, TrackId } from '../types/track.ts';

export class TrackManager {
  private unlockedTrackIds: Set<TrackId> = new Set(['default']);
  private equippedTrackId: TrackId = 'default';
  public onTrackChanged?: (newTrackId: TrackId) => void;

  constructor() {
    this.load();
  }

  public load() {
    try {
      // 1. Load unlocked tracks
      const savedUnlocked = localStorage.getItem(STORAGE_KEY_UNLOCKED_TRACKS);
      if (savedUnlocked) {
        const parsed = JSON.parse(savedUnlocked);
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => {
            if (TRACKS_CATALOG.some((t) => t.id === id)) {
              this.unlockedTrackIds.add(id as TrackId);
            }
          });
        }
      }
    } catch {
      this.unlockedTrackIds = new Set(['default']);
    }

    // Default track is always unlocked
    this.unlockedTrackIds.add('default');

    // 2. Load equipped track
    try {
      const savedEquipped = localStorage.getItem(STORAGE_KEY_EQUIPPED_TRACK);
      if (savedEquipped && this.unlockedTrackIds.has(savedEquipped as TrackId)) {
        this.equippedTrackId = savedEquipped as TrackId;
      } else {
        this.equippedTrackId = 'default';
      }
    } catch {
      this.equippedTrackId = 'default';
    }
  }

  public getCatalog(): TrackInfo[] {
    return TRACKS_CATALOG;
  }

  public getTrack(id: TrackId): TrackInfo {
    const track = TRACKS_CATALOG.find((t) => t.id === id);
    return track || TRACKS_CATALOG[0];
  }

  public getUnlockedTrackIds(): TrackId[] {
    return Array.from(this.unlockedTrackIds);
  }

  public isUnlocked(id: TrackId): boolean {
    if (id === 'default') return true;
    return this.unlockedTrackIds.has(id);
  }

  public getEquippedTrackId(): TrackId {
    return this.equippedTrackId;
  }

  public getEquippedTrack(): TrackInfo {
    return this.getTrack(this.equippedTrackId);
  }

  public equip(id: TrackId): boolean {
    if (!this.isUnlocked(id)) {
      return false;
    }
    this.equippedTrackId = id;
    try {
      localStorage.setItem(STORAGE_KEY_EQUIPPED_TRACK, id);
    } catch {
      // Storage fallback
    }

    if (this.onTrackChanged) {
      this.onTrackChanged(id);
    }
    return true;
  }

  /**
   * Purchases and unlocks a track with full validation:
   * - Verifies track exists in catalog
   * - Prevents duplicate purchases
   * - Verifies sufficient coin balance
   * - Deducts coins exactly once
   * - Persists both unlocked tracks and coin balance in localStorage
   * - Automatically equips the newly purchased track
   */
  public purchase(
    trackId: TrackId,
    currentCoins: number
  ): { success: boolean; newTotalCoins: number; error?: string } {
    const track = TRACKS_CATALOG.find((t) => t.id === trackId);
    if (!track) {
      return { success: false, newTotalCoins: currentCoins, error: 'Track not found.' };
    }

    if (this.isUnlocked(trackId)) {
      return { success: false, newTotalCoins: currentCoins, error: 'Track already unlocked.' };
    }

    if (currentCoins < track.price) {
      return {
        success: false,
        newTotalCoins: currentCoins,
        error: `Insufficient coins. Requires ${track.price.toLocaleString()} coins (you have ${currentCoins.toLocaleString()}).`,
      };
    }

    const newCoins = currentCoins - track.price;

    // 1. Add to unlocked set
    this.unlockedTrackIds.add(trackId);

    // 2. Persist to localStorage safely
    try {
      localStorage.setItem(STORAGE_KEY_TOTAL_COINS, newCoins.toString());
      localStorage.setItem(
        STORAGE_KEY_UNLOCKED_TRACKS,
        JSON.stringify(Array.from(this.unlockedTrackIds))
      );
      localStorage.setItem(STORAGE_KEY_EQUIPPED_TRACK, trackId);
    } catch {
      // Fallback
    }

    // 3. Equip the newly purchased track
    this.equippedTrackId = trackId;

    // 4. Notify listeners
    if (this.onTrackChanged) {
      this.onTrackChanged(trackId);
    }

    return { success: true, newTotalCoins: newCoins };
  }
}

export const trackManager = new TrackManager();
