# 12_Technical.md

# Technical Design Document

## Project Overview

**Project Name:** Ash & Purr

**Engine:** Godot Engine 4.x (Latest Stable)

**Language:** GDScript

**Target Platform:** Windows Desktop

**Primary Resolution:** 1920x1080 (16:9)

**Rendering:** 2D

**Genre:** Arcade Action • Soulslike Combat • Boss Rush

---

# Primary Goal

The objective of this project is to produce a **fully playable and complete desktop game**.

This is **not** a prototype.

This is **not** a vertical slice.

Every system should be implemented as production-ready code.

By the end of development the project should:

- Compile without errors.
- Contain no placeholder gameplay.
- Contain no temporary assets references.
- Contain no TODO systems.
- Be fully playable from beginning to end.
- Be exportable directly from Godot to Windows.
- Require no manual programming after Kiro finishes generating the project.

The only remaining tasks should be:

- Replace placeholder art with final assets (if necessary).
- Replace temporary audio.
- Export the executable.
- Share the game.

---

# Engine

Use:

Godot Engine 4.x

Never use deprecated APIs.

Always use modern Godot 4 architecture.

Avoid compatibility code for Godot 3.

---

# Programming Language

Use only:

GDScript

Do not mix:

- C#
- C++
- GDNative
- Visual Scripts

Every gameplay system should be written in clean, modular GDScript.

---

# Code Philosophy

The codebase should prioritize:

- Readability
- Maintainability
- Reusability
- Performance
- Scalability

Avoid unnecessary complexity.

Prefer small reusable scripts over large monolithic files.

---

# Architecture

The project should follow a component-based architecture whenever possible.

Example:

```
Player
├── PlayerController
├── HealthComponent
├── Hurtbox
├── Hitbox
├── AnimationController
├── AudioController
├── ToolController
├── AmuletController
├── SaveComponent
```

Bosses should use similar modular components.

---

# Folder Structure

```
res://

Scenes/
    Player/
    Bosses/
    Enemies/
    Levels/
    UI/
    Effects/
    Objects/
    Checkpoints/

Scripts/
    Player/
    Bosses/
    Enemies/
    Managers/
    Components/
    UI/
    Save/
    Audio/
    Tools/

Resources/
    Data/
    Config/

Sprites/
Animations/
Audio/
Fonts/
Shaders/

Save/

Autoload/
```

The project structure should remain organized throughout development.

---

# Scene Philosophy

Each scene should have a single responsibility.

Examples:

Player.tscn

Contains only the player.

Boss scenes contain only the boss.

UI scenes contain only interface elements.

Avoid creating massive scenes containing unrelated objects.

---

# Autoload Singletons

Use Autoloads only for global systems.

Examples:

```
GameManager

AudioManager

SaveManager

SceneManager

SettingsManager

InputManager

LocalizationManager
```

Avoid storing gameplay logic inside autoloads.

---

# Player

The player should use a finite state machine.

Suggested states:

```
Idle

Run

Attack

Recovery

Dodge

Hit

Death
```

State transitions should remain explicit.

Avoid boolean spaghetti.

---

# Boss AI

Bosses should also use state machines.

Example:

```
Idle

Walk

Attack

Combo

Recover

SpecialAttack

PhaseTransition

Death
```

Each attack should be its own reusable state whenever possible.

---

# Combat System

Combat should be frame-accurate.

Requirements:

Hitboxes.

Hurtboxes.

I-frames.

Hit stop.

Knockback.

Recovery windows.

Attack cancel restrictions.

Damage calculation.

Every attack should be deterministic.

Never rely on random outcomes during combat.

---

# Animation

Use:

AnimationPlayer

AnimationTree (when beneficial)

Never hardcode animation timings.

Gameplay events should be synchronized through animation signals.

Examples:

Attack begins.

Hitbox enabled.

Hitbox disabled.

Recovery begins.

Footstep sound.

Landing.

---

# Input System

Support:

Keyboard

Xbox Controller

PlayStation Controller

Every action must be remappable.

Use Godot's Input Map.

Never poll raw keyboard keys directly.

---

# Save System

The save system should be fully implemented.

Must save:

Current level.

Boss progression.

Unlocked amulets.

Unlocked tools.

Collectibles.

Settings.

Player statistics.

Game completion.

Use:

JSON or Resource serialization.

The save system should automatically create save files.

---

# Settings

Implement:

Fullscreen.

Resolution.

Master volume.

Music volume.

SFX volume.

Brightness.

Key rebinding.

Controller support.

Accessibility options.

Settings should persist between sessions.

---

# Audio

Use Audio Buses.

Suggested buses:

Master

Music

SFX

UI

Ambience

Voice

Never play sounds directly without routing them through the AudioManager.

---

# Camera

Use Camera2D.

Implement:

Smooth follow.

Camera shake.

Zoom.

Boss introduction camera.

Arena framing.

Never allow the camera to reveal outside playable areas.

---

# UI

The UI should be fully data-driven.

Health bars should automatically update.

Cooldown icons should automatically update.

Boss health should automatically update.

Avoid manually refreshing UI elements.

---

# Data

Boss statistics.

Player statistics.

Amulet effects.

Tool data.

Dialogue.

Collectibles.

Should be stored as Resources or JSON rather than hardcoded.

---

# Signals

Favor Godot Signals over direct references.

Example:

PlayerDamaged

BossDefeated

HealthChanged

CheckpointActivated

ToolUsed

AmuletEquipped

This reduces coupling.

---

# Performance

The game should comfortably maintain:

60 FPS

on average gaming hardware.

Avoid:

Expensive _process loops.

Unnecessary allocations.

Duplicate calculations.

---

# Physics

Use:

CharacterBody2D

CollisionShape2D

Area2D

RayCast2D

Use physics processing whenever movement depends on collisions.

---

# Particle Effects

Use GPUParticles2D whenever appropriate.

Effects should remain lightweight.

Never reduce gameplay readability.

---

# Resource Management

Scenes should be instantiated only when needed.

Free unused objects.

Avoid memory leaks.

Use object pooling for frequently spawned effects if necessary.

---

# Error Handling

The project should avoid runtime crashes.

Always validate:

Node references.

Resources.

Scene loading.

Save data.

Handle missing files gracefully.

---

# Coding Standards

Use:

snake_case

Meaningful variable names.

Small functions.

Clear comments where necessary.

Avoid deeply nested code.

Every script should have a single responsibility.

---

# Documentation

Every important system should include concise comments explaining:

Purpose.

Inputs.

Outputs.

Dependencies.

Do not over-comment obvious code.

---

# Dependencies

The project should depend only on:

Godot Engine.

No external plugins.

No third-party frameworks.

No paid assets.

The game should open correctly in a clean installation of Godot.

---

# Export

The final project must support direct export to:

Windows (.exe)

without requiring any code modifications.

Export should work using Godot's official export templates.

---

# Definition of Done

The project is considered complete only when all of the following are true:

- The player can complete the game from start to finish.
- Every boss is fully implemented.
- Every enemy behaves correctly.
- Every level is playable.
- All menus function correctly.
- Saving and loading work.
- Keyboard and controller are supported.
- Audio is fully integrated.
- Animations are synchronized.
- There are no placeholder systems.
- There are no compile errors.
- There are no runtime crashes.
- The game can be exported as a Windows executable.

---

# Instructions for Kiro

When generating code, always prioritize:

1. Functional gameplay over visual polish.
2. Clean and modular architecture.
3. Production-ready systems.
4. Reusable components.
5. Readable GDScript.
6. Godot 4 best practices.

Never generate placeholder implementations when a complete implementation is possible.

The expected final result is a **fully functional, production-ready Godot 4 project** that can be exported into a standalone Windows executable and played without requiring additional programming.