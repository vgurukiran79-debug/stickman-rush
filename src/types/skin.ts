/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SkinId = 'classic' | 'crimson' | 'neon' | 'ninja' | 'cyber';

export interface Skin {
  id: SkinId;
  name: string;
  tagline: string;
  price: number; // 0 for default
  description: string;
  accentColor: string;
  glowColor: string;
  bodyColor: string;
  outlineColor: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  features: string[];
}

export const SKINS_CATALOG: Skin[] = [
  {
    id: 'classic',
    name: 'Classic Stickman',
    tagline: 'Standard Prototype',
    price: 0,
    description: 'The iconic agile runner. Minimalist silhouette with high-contrast white armature and cyan ocular optics.',
    accentColor: '#06B6D4',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    bodyColor: '#FFFFFF',
    outlineColor: '#020617',
    rarity: 'Common',
    features: ['Crisp white armature', 'Cyan ocular visor', 'Standard motion trail'],
  },
  {
    id: 'crimson',
    name: 'Crimson Runner',
    tagline: 'Thermal Overdrive',
    price: 100,
    description: 'Infused with volatile thermal plasma. Blazing ruby chassis accompanied by a dynamic fluttering plasma scarf.',
    accentColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.75)',
    bodyColor: '#FF6B8B',
    outlineColor: '#450A0A',
    rarity: 'Rare',
    features: ['Thermal ruby armature', 'Fluttering energy scarf', 'Blazing scarlet motion trail'],
  },
  {
    id: 'neon',
    name: 'Neon Runner',
    tagline: 'Hyper-Charged Grid',
    price: 200,
    description: 'Electrified with supercharged grid capacitors. Features an ultra-luminous cyan visor and pulsating limb conduits.',
    accentColor: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.85)',
    bodyColor: '#A5F3FC',
    outlineColor: '#082F49',
    rarity: 'Epic',
    features: ['Electric blue capacitors', 'Dual beam visor lens', 'High-voltage pulse trail'],
  },
  {
    id: 'ninja',
    name: 'Shadow Ninja',
    tagline: 'Stealth Shinobi',
    price: 350,
    description: 'High-contrast stealth operative. Obsidian carbon fiber frame bounded by luminous gold edges, twin shadow ribbons, and an amber gaze.',
    accentColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.8)',
    bodyColor: '#3F3F46',
    outlineColor: '#FDE047',
    rarity: 'Epic',
    features: ['High-contrast gold luminous contours', 'Twin fluttering headband ribbons', 'Back-slung tactical blade', 'Glowing shinobi amber slit'],
  },
  {
    id: 'cyber',
    name: 'Cyber Armor',
    tagline: 'Titanium Exosuit',
    price: 500,
    description: 'Heavy vanguard mechanized armor. Reinforced gold pauldrons, glowing quantum chest reactor, and reinforced knee plates.',
    accentColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.85)',
    bodyColor: '#E2E8F0',
    outlineColor: '#0F172A',
    rarity: 'Legendary',
    features: ['Angular armored pauldrons', 'Pulsing quantum chest reactor', 'Reinforced shin plates', 'Emerald holographic trail'],
  },
];
