# The Garden Golem — Boss Design Document

## Overview

The Garden Golem is the FIRST boss encounter in Ash & Purr. A gentle stone guardian manipulated into believing Bob threatens its sacred garden. Fights through battlefield control and environmental hazards.

---

## Combat Stats

| Property | Value |
|----------|-------|
| HP | 280 |
| Phase 2 Threshold | 50% HP (140) |
| Attack Interval | 1.8s (P1), 1.2s (P2) |
| Telegraph Duration | 0.7s (P1), 0.5s (P2) |
| Recovery After Attack | 1.2s (P1), 0.8s (P2) |
| Movement Speed | 60 px/s |

---

## Attacks

### Stone Fist (Basic)
- Raises arm, slams ground
- Shockwave around impact point
- Damage: 12 (P1), 15 (P2)
- Vulnerable after slam for 1.2s

### Rising Stone Platform
- Stone rises under Bob's position
- Must escape before collapse (1.5s warning)
- Fall damage: 18

### Toxic Garden Mist
- 2-3 poison clouds appear in arena
- Standing inside drains 3 HP/sec
- Clouds last 4 seconds

### Root Awakening
- Roots emerge and move toward Bob
- Creates danger zones limiting movement
- Golem is vulnerable during channeling
- Duration: 3s

---

## Phase 2 (50% HP)

- Stone Platform more frequent
- More poison clouds (4-5)
- Root Awakening faster and wider
- Stone Fist stronger shockwaves
- Slightly faster movement
- Golem becomes desperate, not evil

---

## Colors

- Body: `#8A8070` (warm grey stone)
- Moss: `#5A8A4A` (natural green)
- Eyes: `#66DD66` (bright green glow)
- Flowers: `#FFAA66`, `#FF88AA`, `#AADDFF`
- Earth: `#6B5A42`

---

## Arena

- Sacred garden: green grass, colorful flowers, broken stone paths
- Warm, peaceful, beautiful
- Trees in background, old fountains
- Earliest area — most intact, least corrupted
