/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TrackId = 'default' | 'cyber_city' | 'jungle_adventure' | 'lava_world' | 'frozen_kingdom';

export interface TrackInfo {
  id: TrackId;
  name: string;
  subtitle: string;
  price: number; // 0 for default
  description: string;
  theme: string;
  accentColor: string;
  secondaryColor: string;
  glowColor: string;
  cardGradient: string;
  badgeText: string;
  features: string[];
  environmentDetails: {
    skyTop: string;
    skyBottom: string;
    groundSurface: string;
    groundBase: string;
    railColor: string;
    particleStyle: 'cyber' | 'holo' | 'leaves' | 'embers' | 'snow';
    lightingGlow: string;
  };
}

export const TRACKS_CATALOG: TrackInfo[] = [
  {
    id: 'default',
    name: 'Neon Highway',
    subtitle: 'Prototype Sector',
    price: 0,
    description: 'The iconic high-speed neon cyberway. Gliding through towering arcology spires and elevated maglev transit rails under midnight skies.',
    theme: 'Cyberpunk Neon',
    accentColor: '#06B6D4',
    secondaryColor: '#8B5CF6',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    cardGradient: 'from-cyan-950/60 via-slate-900 to-indigo-950/60',
    badgeText: 'DEFAULT · FREE',
    features: [
      'Multi-layer metropolis spires & transit skyway',
      'Illuminated holographic billboards & motes',
      'High-contrast cyan laser rails',
      'High-tech security crates & overhead beams',
    ],
    environmentDetails: {
      skyTop: '#040713',
      skyBottom: '#131233',
      groundSurface: '#22D3EE',
      groundBase: '#0C1226',
      railColor: '#06B6D4',
      particleStyle: 'cyber',
      lightingGlow: 'rgba(6, 182, 212, 0.4)',
    },
  },
  {
    id: 'cyber_city',
    name: 'Cyber City',
    subtitle: 'Mega-Metropolis 2099',
    price: 2000,
    description: 'A sprawling futuristic metropolis pulsing with ultraviolet neon signage, holographic advertisements, high-energy laser barriers, and speeding hovercraft lanes.',
    theme: 'Futuristic Neo-Tokyo',
    accentColor: '#38BDF8',
    secondaryColor: '#C084FC',
    glowColor: 'rgba(192, 132, 252, 0.75)',
    cardGradient: 'from-sky-950/70 via-slate-900 to-fuchsia-950/70',
    badgeText: '2,000 COINS',
    features: [
      'Glowing blue & violet skyscrapers with animated digital ads',
      'Dual cyber moon & flying aerodyne traffic',
      'Electric laser barriers & plasma security gates',
      'Cybernetic gold coins with azure pulse rings',
    ],
    environmentDetails: {
      skyTop: '#020617',
      skyBottom: '#27083D',
      groundSurface: '#38BDF8',
      groundBase: '#100C29',
      railColor: '#C084FC',
      particleStyle: 'holo',
      lightingGlow: 'rgba(192, 132, 252, 0.45)',
    },
  },
  {
    id: 'jungle_adventure',
    name: 'Jungle Adventure',
    subtitle: 'Emerald Canopy',
    price: 5000,
    description: 'A deep prehistoric rainforest alive with cascading waterfalls, ancient carved Mayan ruins, suspended rope bridges, swinging vines, and ancient timber hazards.',
    theme: 'Ancient Rainforest',
    accentColor: '#10B981',
    secondaryColor: '#F59E0B',
    glowColor: 'rgba(16, 185, 129, 0.65)',
    cardGradient: 'from-emerald-950/70 via-slate-900 to-amber-950/60',
    badgeText: '5,000 COINS',
    features: [
      'Lush green canopy, distant waterfalls & mountain ridges',
      'Ancient carved stone blocks, bamboo spikes & timber roadblocks',
      'Overhead mossy branches with dangling jungle vines',
      'Swirling emerald leaf motes & ancient sunlit mist',
    ],
    environmentDetails: {
      skyTop: '#03170E',
      skyBottom: '#0D3823',
      groundSurface: '#34D399',
      groundBase: '#062414',
      railColor: '#10B981',
      particleStyle: 'leaves',
      lightingGlow: 'rgba(16, 185, 129, 0.4)',
    },
  },
  {
    id: 'lava_world',
    name: 'Lava World',
    subtitle: 'Inferno Fissures',
    price: 8000,
    description: 'A treacherous volcanic wasteland under an ash-choked blood-red sky. Erupting volcanic peaks, rivers of bubbling molten magma, fiery steam vents, and jagged obsidian spikes.',
    theme: 'Volcanic Hellscape',
    accentColor: '#F97316',
    secondaryColor: '#EF4444',
    glowColor: 'rgba(249, 115, 22, 0.75)',
    cardGradient: 'from-orange-950/70 via-slate-900 to-red-950/70',
    badgeText: '8,000 COINS',
    features: [
      'Flowing animated molten magma river under ground crust',
      'Smoking volcanic craters with rising thermal plumes',
      'Fiery basalt crates, lava jet vents & obsidian spike beds',
      'Floating smoldering ash embers & dynamic heat shimmer',
    ],
    environmentDetails: {
      skyTop: '#150505',
      skyBottom: '#420B0B',
      groundSurface: '#FB923C',
      groundBase: '#260606',
      railColor: '#EA580C',
      particleStyle: 'embers',
      lightingGlow: 'rgba(249, 115, 22, 0.5)',
    },
  },
  {
    id: 'frozen_kingdom',
    name: 'Frozen Kingdom',
    subtitle: 'Glacial Aurora',
    price: 10000,
    description: 'A majestic polar realm illuminated by sweeping ribbons of emerald and violet aurora borealis. Towering ice spires, frost bridges, crystal icicle stalactites, and drifting blizzard flurries.',
    theme: 'Polar Glacial',
    accentColor: '#38BDF8',
    secondaryColor: '#E0E7FF',
    glowColor: 'rgba(56, 189, 248, 0.75)',
    cardGradient: 'from-sky-950/70 via-slate-900 to-indigo-950/70',
    badgeText: '10,000 COINS',
    features: [
      'Shimmering Aurora Borealis dancing across starry polar sky',
      'Translucent glacial ice monoliths & razor-sharp icicle clusters',
      'Frosted ice platforms with crystalline reflective sheen',
      'Continuous soft snowfall & drifting polar blizzard particles',
    ],
    environmentDetails: {
      skyTop: '#020C1B',
      skyBottom: '#0D274A',
      groundSurface: '#7DD3FC',
      groundBase: '#071A33',
      railColor: '#38BDF8',
      particleStyle: 'snow',
      lightingGlow: 'rgba(56, 189, 248, 0.5)',
    },
  },
];
