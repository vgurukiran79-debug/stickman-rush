/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const VIRTUAL_WIDTH = 960;
export const VIRTUAL_HEIGHT = 540;

// Ground position in virtual coordinates
export const GROUND_Y = 440;

// Player starting horizontal position
export const PLAYER_X = 160;

// Physics parameters
export const GRAVITY = 1750; // px / s^2
export const JUMP_VELOCITY = -680; // px / s
export const JUMP_BUFFER_DURATION = 0.14; // seconds (140ms input buffer)
export const COYOTE_DURATION = 0.10; // seconds (100ms coyote time)

// Slide duration parameters
export const SLIDE_MIN_DURATION = 0.55; // minimum slide duration in seconds (550ms)
export const SLIDE_MAX_DURATION = 1.15; // maximum slide duration when holding key (1150ms)

// Speed progression
export const BASE_SPEED = 340; // px / s (comfortable starting speed)
export const MAX_SPEED = 700; // px / s (balanced top speed)
export const SPEED_ACCELERATION = 3.5; // speed increase per second survived

// Player dimensions
export const PLAYER_HEIGHT_RUN = 68;
export const PLAYER_WIDTH_RUN = 34;

export const PLAYER_HEIGHT_SLIDE = 22; // tightly aligned with sliding body
export const PLAYER_WIDTH_SLIDE = 56;

// Overhead obstacle clearance above ground (px)
export const OVERHEAD_CLEARANCE = 48; // 48px clearance: easily clears 22px slide, hits 68px run

// LocalStorage Keys
export const STORAGE_KEY_BEST = 'stickman_rush_best_score';
export const STORAGE_KEY_TOTAL_COINS = 'stickman_rush_total_coins';
export const STORAGE_KEY_SOUND = 'stickman_rush_sound_enabled';
export const STORAGE_KEY_MISSIONS = 'stickman_rush_missions_v1';
export const STORAGE_KEY_ACHIEVEMENTS = 'stickman_rush_achievements_v1';
export const STORAGE_KEY_LIFETIME = 'stickman_rush_lifetime_stats_v1';
