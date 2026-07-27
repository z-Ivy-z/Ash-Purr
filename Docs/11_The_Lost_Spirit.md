# The Lost Spirit — Boss Design Document

## Overview

The Lost Spirit is the first boss encounter in Ash & Purr. He is a ghostly spellcaster who fills the arena with magical projectiles, teaching players that patience, positioning and finding attack windows are just as important as dodging.

He must be defeated before the player faces The Cat Keeper.

---

## Visual Identity

- Semi-transparent ghostly figure in tattered robes
- Carries a cracked staff with a glowing cyan crystal
- Flat colors, cel-shaded shadows, clean linework
- Transparency suggested through reduced opacity and sparse particles (no gradients)
- Magical glow uses solid cyan and pale blue shapes
- Robes have large simple folds (no excessive wrinkles)
- Must match Bob's art style exactly

### Color Palette
- Robes: `#2A3A5C` (dark blue-grey) with `#1A2440` shadow
- Transparency overlay: `#88CCEE` at 30% opacity
- Staff: `#4A3A2A` (wood) with `#66EEFF` crystal
- Magic effects: `#66EEFF` (cyan), `#AADDFF` (pale blue)
- Eyes: `#66EEFF` (glowing cyan)
- Particles: `#88CCEE`, `#FFFFFF`

---

## Combat Stats

| Property | Value |
|----------|-------|
| HP | 350 |
| Phase 2 Threshold | 50% HP (175) |
| Base Spell Interval | 1.2s (P1), 0.7s (P2) |
| Telegraph Duration | 0.5s (P1), 0.35s (P2) |
| Recovery After Cast | 0.8s (P1), 0.4s (P2) |
| Float Frequency | Every 8-12s (P1), Every 5-8s (P2) |
| Float Duration | 3s (P1), 4s (P2) |
| Movement Speed | 80 px/s (teleport-based, rarely walks) |

---

## Attack Philosophy

The Lost Spirit is a relentless spellcaster who chains spells with little downtime. Every attack has a clear visual telegraph. Openings are short — the player must approach and strike quickly between casts.

---

## Special Mechanic: Floating State

Every 8-12 seconds (P1) or 5-8 seconds (P2), The Lost Spirit rises higher into the air.

While floating:
- Bob can ONLY damage him by jumping and attacking in the air
- Ground attacks deal zero damage
- He continues casting spells while floating
- Duration: 3s (P1), 4s (P2)

---

## Attacks

### Lightning Spear
- Telegraph: Crystal crackles, magic circle appears under Bob's position
- Delay: 0.6s (P1), 0.4s (P2)
- Effect: Lightning bolt from sky + small shockwave at impact
- Damage: 12 (P1), 15 (P2)
- P2: Up to 3 consecutive casts

### Fire Ball
- Telegraph: Staff swings in arc, 3 fire orbs appear around spirit
- Delay: 0.4s
- Effect: 3 projectiles launch in fan pattern
- Damage per orb: 10 (P1), 12 (P2)
- P2: Projectiles travel 20% faster

### Blackout
- Telegraph: Staff lowers, arena begins darkening
- Effect: Arena goes almost completely black for 3 seconds
- Only visible: Bob, Spirit's glowing eyes, incoming attacks
- No damage increase — tests player confidence
- Spirit continues casting during blackout

### Teleport
- Telegraph: Dissolves into particles
- Effect: Reappears at new position with burst of energy
- Both departure and arrival are clearly marked
- Brief recovery animation (0.3s) before next spell
- P2: Much more frequent

---

## Phase 2 (50% HP)

Transition: Stops attacking, body emits bright magic, staff crystal fractures further, stones/particles rise in arena.

Changes:
- Lightning Spear: 3 consecutive casts
- Fire Ball: 20% faster projectiles
- Teleport: Much more frequent
- Floating State: More often (every 5-8s), lasts 4s
- Recovery between spells: 0.4s (from 0.8s)
- Spell interval: 0.7s (from 1.2s)

---

## Gameplay Purpose

- Teaches ranged boss encounter mechanics
- Reinforces: stay mobile, recognize patterns, don't panic
- Forces jumping offense during float state
- Prepares player for The Cat Keeper's aggression

---

## Arena

- Ruined sanctuary setting
- Floating debris in background
- Darker color palette than Cat Keeper arena
- Cyan magical particles in the air
- P2: Stones rise, more particles, darker edges
