# 07 UI and UX

# UI / UX Design Guide

## Overview

The user interface of **Ash & Purr** should feel almost invisible.

The UI exists to support gameplay, never to distract from it.

Every element should communicate only the information the player needs, exactly when they need it.

The interface follows the same philosophy as the rest of the game:

> **Simple, elegant, readable and unobtrusive.**

Players should spend their attention on combat—not on the HUD.

---

# UI Philosophy

Every interface decision should answer one question:

> **"Does this help the player make better decisions without breaking immersion?"**

If the answer is no, remove it.

Minimalism is preferred over excess.

---

# Core UI Pillars

## Readability

Information must be readable in less than a second.

Health.

Cooldowns.

Boss health.

Equipped tool.

Everything should be instantly understandable.

---

## Simplicity

No unnecessary decorations.

No giant fantasy borders.

No excessive icons.

Every element has a purpose.

---

## Consistency

Every menu follows the same visual language.

- Rounded panels
- Soft colors
- Clean spacing
- Minimal animations

Nothing should surprise the player.

---

## Responsiveness

Every interaction should feel immediate.

Menus should open instantly.

Buttons should provide immediate visual feedback.

Cursor movement should feel smooth.

Navigation should never become frustrating.

---

# Visual Style

The interface should match the game's art style.

Characteristics:

- Flat colors
- Soft shadows
- Rounded corners
- Thin outlines
- Simple medieval fantasy aesthetic
- Warm color palette

The UI should feel handcrafted rather than technological.

---

# HUD

The HUD should occupy as little screen space as possible.

During exploration, the player should primarily see the world.

During combat, only essential information remains visible.

---

# Health Bar

Position:

Top-left corner.

Displays:

- Current Health
- Maximum Health

Appearance:

- Rounded container
- Red fill
- Smooth decrease animation
- Small metallic frame

No numbers are displayed.

The player judges health visually.

---

# Equipped Tool

Located beneath the health bar.

Displays:

- Current tool icon
- Cooldown progress

Cooldown should be represented by a circular radial indicator.

When available, the icon appears fully illuminated.

When unavailable, it becomes slightly desaturated.

---

# Equipped Amulet

Displayed beside the tool icon.

Shows:

- Amulet icon
- Small decorative frame

The UI does not constantly display its effects.

Players are expected to remember their build.

---

# Boss Health Bar

Appears only during boss battles.

Position:

Top-center.

Contents:

- Boss name
- Health bar

Characteristics:

- Large
- Elegant
- Minimal decoration

Health decreases smoothly.

Boss phase transitions should visually affect the health bar.

Example:

The bar briefly cracks or changes color when entering Phase Two.

---

# Interaction Prompts

Interaction prompts should be extremely simple.

Example:

```
[E] Interact
```

Only appears when necessary.

Never remains permanently visible.

---

# Damage Numbers

No floating damage numbers.

The player should feel impact through:

- Animation
- Sound
- Hit stop
- Screen shake

Not mathematics.

---

# Status Indicators

If Bob is affected by a temporary condition, display:

- Small icon
- Short duration indicator

Icons should remain subtle.

Never dominate the screen.

---

# Pause Menu

Opening the pause menu should immediately freeze gameplay.

The transition should be smooth and quick.

Options:

- Resume
- Amulets
- Controls
- Settings
- Main Menu

Background should blur slightly.

No lengthy animations.

---

# Amulet Menu

Accessible only outside combat.

Displays:

- Equipped amulet
- Available amulets
- Description
- Advantages
- Drawbacks

The selected amulet should be highlighted clearly.

The player may equip only one.

---

# Tool Selection

Before entering a boss arena, the player chooses one tool.

Display:

- Large illustrated icon
- Name
- Description
- Cooldown
- Intended use

Selection should encourage preparation rather than experimentation during combat.

---

# Settings Menu

Categories:

## Gameplay

- Controller vibration
- Camera shake
- Hit stop intensity
- Difficulty modifiers (if accessibility options exist)

---

## Audio

- Master Volume
- Music
- Sound Effects
- Interface Sounds

---

## Graphics

- Resolution
- Fullscreen
- VSync
- Brightness
- Particle Density

---

## Controls

Keyboard and controller remapping.

Every action should be rebindable.

---

# Death Screen

The death screen should be calm.

No loud sounds.

No exaggerated effects.

The music fades.

A quiet message appears.

Example:

> **"Stand once more."**

Options:

- Retry
- Main Menu

The player should immediately want another attempt.

---

# Victory Screen

Boss victories receive only a brief presentation.

Show:

- Boss defeated
- Reward obtained
- Continue

No score.

No ranking.

The emotional reward is defeating the boss itself.

---

# Dialogue UI

Dialogue boxes appear only when necessary.

Characteristics:

- Rounded window
- Character portrait (optional)
- Minimal text
- Slow but readable typing animation

Dialogue should remain concise.

The environment tells most of the story.

---

# Collectible UI

When a collectible is found:

Small notification.

Example:

```
Memory Fragment Found
```

Appears briefly.

Automatically fades away.

---

# Save Notification

When reaching a checkpoint:

```
Progress Saved
```

Appears in the lower corner.

Fades after two seconds.

No interruption to gameplay.

---

# Main Menu

The title screen should immediately communicate the game's tone.

Elements:

- Game Logo
- Animated background
- Bob standing quietly
- Slow environmental movement
- Calm music

Menu options:

- Continue
- New Game
- Settings
- Credits
- Exit

The menu should feel peaceful.

---

# Loading Screens

Loading screens should remain minimal.

Possible content:

- Small lore entries
- Gameplay tips
- Character illustrations

Never overload the player with information.

---

# Accessibility

The game should include accessibility options without compromising its identity.

Possible options:

- Controller remapping
- Camera shake toggle
- Hit flash intensity
- Larger UI scale
- Subtitle size
- Subtitle background
- Colorblind-friendly palette adjustments

Accessibility should improve readability rather than reduce challenge.

---

# UX Principles

Players should always know:

- Where they are.
- What they have equipped.
- What they are interacting with.
- What killed them.
- What they could have done differently.

The interface should never create confusion.

---

# Animation

UI animations should be subtle.

Examples:

- Fade
- Small scale increase
- Gentle slide
- Soft highlight

Avoid:

- Bouncing
- Flashing
- Long transitions

Menus should always feel responsive.

---

# Sound Design

Every UI action has a satisfying but quiet sound.

Examples:

- Hover
- Select
- Confirm
- Cancel
- Equip
- Pause

Interface sounds should never compete with gameplay audio.

---

# Final UI/UX Rule

Whenever a new interface element is added, ask:

> **"Does this help the player focus on mastering the combat while preserving immersion?"**

If the answer is yes, it belongs in **Ash & Purr**.

If it distracts from gameplay or communicates unnecessary information, it should be simplified or removed.