# Lady Death — Boss Design Document

## Overview

Lady Death is the second boss. An elite assassin who overwhelms through speed, precision and relentless pressure. Fights entirely by choice — believes destroying Bob is justified.

## Combat Stats

| Property | Value |
|----------|-------|
| HP | 320 |
| Phase 2 Threshold | 50% HP (160) |
| Attack Interval | 0.6s (P1), 0.35s (P2) |
| Movement Speed | 220 px/s |
| Shadow Step Speed | 700 px/s |

## Attacks

### Quick Slash (Basic)
- 2-3 rapid horizontal slashes
- Very fast startup
- Damage: 8 per slash

### Twin Slash
- Dashes toward Bob, alternating slashes
- Final slash has longer recovery (punish window)
- Damage: 10 per hit
- P2: Finishes with spinning slash (wider range)

### Shadow Step
- Disappears, reappears behind Bob, immediate slash
- Dark feathers visual + audio cue
- P2: Can chain twice

### Throwing Daggers
- 3 daggers in quick succession (straight line)
- P2: 5 daggers in fan pattern
- Damage: 6 per dagger

## Phase 2 (50% HP)
- Twin Slash gains spinning finisher
- 5 fan daggers instead of 3 straight
- Shadow Step chains twice
- Shorter recovery between combos
- More chaining between different attacks

## Colors
- Hood/armor: `#2A2A2A` (matte black)
- Cloak: `#3A3A44` (dark grey)
- Crimson accents: `#882233`
- Daggers: `#CCCCDD` (silver)
- Eyes: `#DDDDDD` (pale)

## Arena
- Abandoned royal courtyard, pale moonlight
- Broken statues, dead leaves, lanterns with shadows
- Elegant, lonely, silent
