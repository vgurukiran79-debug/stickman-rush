/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { STORAGE_KEY_UNLOCKED_SKINS, STORAGE_KEY_EQUIPPED_SKIN, STORAGE_KEY_TOTAL_COINS } from './constants.ts';
import { SKINS_CATALOG, Skin, SkinId } from '../types/skin.ts';

export class SkinManager {
  private unlockedSkinIds: Set<SkinId> = new Set(['classic']);
  private equippedSkinId: SkinId = 'classic';
  public onSkinChanged?: (newSkinId: SkinId) => void;

  constructor() {
    this.load();
  }

  public load() {
    try {
      // 1. Load unlocked skins
      const savedUnlocked = localStorage.getItem(STORAGE_KEY_UNLOCKED_SKINS);
      if (savedUnlocked) {
        const parsed = JSON.parse(savedUnlocked);
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => {
            if (SKINS_CATALOG.some((s) => s.id === id)) {
              this.unlockedSkinIds.add(id as SkinId);
            }
          });
        }
      }
    } catch {
      this.unlockedSkinIds = new Set(['classic']);
    }

    // Classic is always unlocked
    this.unlockedSkinIds.add('classic');

    // 2. Load equipped skin
    try {
      const savedEquipped = localStorage.getItem(STORAGE_KEY_EQUIPPED_SKIN);
      if (savedEquipped && this.unlockedSkinIds.has(savedEquipped as SkinId)) {
        this.equippedSkinId = savedEquipped as SkinId;
      } else {
        this.equippedSkinId = 'classic';
      }
    } catch {
      this.equippedSkinId = 'classic';
    }
  }

  public getCatalog(): Skin[] {
    return SKINS_CATALOG;
  }

  public getUnlockedSkinIds(): SkinId[] {
    return Array.from(this.unlockedSkinIds);
  }

  public isUnlocked(id: SkinId): boolean {
    if (id === 'classic') return true;
    return this.unlockedSkinIds.has(id);
  }

  public getEquippedSkinId(): SkinId {
    return this.equippedSkinId;
  }

  public getEquippedSkin(): Skin {
    const skin = SKINS_CATALOG.find((s) => s.id === this.equippedSkinId);
    return skin || SKINS_CATALOG[0];
  }

  public equip(id: SkinId): boolean {
    if (!this.isUnlocked(id)) {
      return false;
    }
    this.equippedSkinId = id;
    try {
      localStorage.setItem(STORAGE_KEY_EQUIPPED_SKIN, id);
    } catch {
      // Fallback
    }

    if (this.onSkinChanged) {
      this.onSkinChanged(id);
    }
    return true;
  }

  /**
   * Purchases and unlocks a skin with validation:
   * - Checks that skin exists
   * - Prevents duplicate purchases
   * - Verifies sufficient coin balance
   * - Subtracts coins exactly once
   * - Updates both unlocked skins and coin balance in localStorage
   * - Automatically equips the newly bought skin
   */
  public purchase(
    id: SkinId,
    currentCoins: number
  ): { success: boolean; newCoins: number; error?: string } {
    const skin = SKINS_CATALOG.find((s) => s.id === id);
    if (!skin) {
      return { success: false, newCoins: currentCoins, error: 'Skin does not exist' };
    }

    if (this.isUnlocked(id)) {
      return { success: false, newCoins: currentCoins, error: 'Skin already unlocked' };
    }

    if (currentCoins < skin.price) {
      return {
        success: false,
        newCoins: currentCoins,
        error: `Insufficient coins: requires ${skin.price} coins (have ${currentCoins})`,
      };
    }

    const newCoins = currentCoins - skin.price;
    this.unlockedSkinIds.add(id);

    try {
      localStorage.setItem(
        STORAGE_KEY_UNLOCKED_SKINS,
        JSON.stringify(Array.from(this.unlockedSkinIds))
      );
      localStorage.setItem(STORAGE_KEY_TOTAL_COINS, newCoins.toString());
    } catch {
      // Graceful fallback
    }

    // Auto-equip on purchase
    this.equip(id);

    return { success: true, newCoins };
  }
}

export const skinManager = new SkinManager();
