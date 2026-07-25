# 09 Audio

# Audio Design Document

## Overview

Audio in **Ash & Purr** is not simply decoration.

It is a gameplay mechanic.

Players should be able to recognize attacks, danger and opportunities through sound alone.

Every sound should communicate useful information while simultaneously reinforcing the emotional tone of the adventure.

Silence is just as important as music.

The world should never feel constantly loud.

Every sound must have purpose.

---

# Audio Philosophy

Every audio decision should answer one question:

> **"Does this sound improve gameplay readability while strengthening the player's emotional connection to the world?"**

If the answer is no, it should be redesigned or removed.

---

# Core Audio Pillars

## Readability

Gameplay sounds always have the highest priority.

The player should clearly hear:

- Boss attacks
- Bob's attacks
- Dodges
- Damage
- Tool activation
- Boss phase transitions

Music should never mask gameplay information.

---

## Emotional Storytelling

Music should communicate the emotional progression of the journey.

Beginning:

Wonder.

Hope.

Warmth.

Middle:

Concern.

Loneliness.

Determination.

Late Game:

Despair.

Uncertainty.

Acceptance.

Final Boss:

Defiance.

Ending:

Relief.

Melancholy.

Hope.

---

## Dynamic Silence

Silence is intentionally used throughout the game.

Before important attacks:

Music briefly lowers.

Environmental ambience remains.

The player subconsciously focuses on the incoming danger.

This makes powerful attacks feel even more impactful.

---

# Musical Direction

The soundtrack should combine:

- Orchestral instruments
- Piano
- Soft strings
- Choir (very sparingly)
- Light percussion
- Ambient textures

Avoid:

- Electronic music
- Heavy metal
- Dubstep
- Synthwave
- Fast EDM

The soundtrack should feel timeless.

---

# Musical Identity

Music should never dominate gameplay.

It should support emotion.

Players should remember:

The duel.

Not the soundtrack.

---

# Main Theme

The main menu theme introduces the emotional core of the game.

Mood:

Warm.

Peaceful.

Hopeful.

Slightly melancholic.

Instrumentation:

- Piano
- Soft strings
- Light woodwinds

The melody should immediately remind players of Bob and Almohadita.

---

# Exploration Music

Exploration music remains calm.

Characteristics:

Slow tempo.

Minimal percussion.

Large spaces.

Gentle melodies.

Ambient layers.

Players should feel safe while exploring.

---

# Boss Music

Every boss receives a unique composition.

Each track should reflect:

- Personality
- Fighting style
- Narrative role

Music should evolve alongside the fight.

---

## Early Bosses

Music should inspire excitement.

Fast but elegant.

Encourages learning.

---

## Mid Game Bosses

Music becomes more dramatic.

Greater orchestration.

Stronger percussion.

More emotional weight.

---

## Late Bosses

Music becomes darker.

Less melodic.

More atmospheric.

Greater tension.

---

## Final Boss

The soundtrack should feel tragic rather than triumphant.

Players are not fighting against someone ordinary.

They are fighting against someone who is completely evil.

---

# The Cat Keeper Theme

The Cat Keeper's theme represents honor and tragedy.

## Phase One

Mood:

Disciplined.

Noble.

Confident.

Instrumentation:

- Strings
- Brass
- Timpani

The music should feel like a duel between two knights.

---

## Phase Two

When the armor breaks:

Music changes immediately.

The melody remains recognizable.

Harmony becomes unstable.

Percussion intensifies.

Choir appears briefly.

Strings become chaotic.

The player should feel that both the battle and reality itself are collapsing.

---

# Ambient Audio

Every area should have its own ambient identity.

Examples:

Forest

- Birds
- Wind
- Leaves

Castle

- Echoes
- Distant armor
- Torches

Ruins

- Wind
- Falling debris
- Stone movement

Late Game

- Reality fractures
- Low-frequency rumbles
- Whisper-like ambience
- Distant impossible sounds

Ambience should tell the story before dialogue does.

---

# Bob Audio

Bob sounds small.

Every sound should reinforce his size.

---

## Footsteps

Light.

Quiet.

Metallic.

Never heavy.

---

## Running

Small armor movement.

Soft cloth movement.

Gentle breathing.

---

## Attack

The branch creates:

Light wooden swing.

Sharp impact.

Small hit stop sound.

The weapon should never sound powerful.

Victory comes from precision.

Not brute force.

---

## Dodge

Fast cloth movement.

Short armor slide.

Very clean sound.

Successful dodges should feel satisfying.

---

## Taking Damage

Short.

Painful.

Never exaggerated.

Bob should never scream dramatically.

---

## Death

Armor slowly falls.

Branch hits the ground.

Music fades.

Silence follows.

---

# Enemy Audio

Each enemy type should have:

Unique footsteps.

Unique attack sounds.

Unique idle sounds.

Unique death sounds.

Players should recognize enemies without seeing them.

---

# Boss Audio

Bosses should sound enormous.

Heavy footsteps.

Large weapons.

Powerful impacts.

Deep resonance.

The player should feel the boss through sound before seeing the attack.

---

# Weapons

Every weapon requires a distinct sound identity.

Branch

Light wood.

Short swing.

Gentle impact.

Throwing Knife

Quick whistle.

Sharp metallic hit.

Short Sword

Fast steel.

Clean slice.

Small Mace

Heavy impact.

Metal crush.

Low-frequency hit.

Dreamcatcher

Soft magical chime.

Warm healing sound.

---

# Hit Confirmation

Every successful hit should produce:

- Impact sound
- Brief hit stop
- Small particle effect
- Tiny camera shake

Players should never wonder whether an attack connected.

---

# User Interface Audio

Menus should feel satisfying.

Hover

Soft click.

Confirm

Warm wooden click.

Back

Gentle muted sound.

Pause

Soft transition.

Equip

Metal buckle sound.

Every interaction should feel tactile.

---

# Checkpoints

When activating a checkpoint:

Ambient music softens.

A warm musical chord plays.

A gentle wind effect surrounds Bob.

The player should immediately feel safe.

---

# Collectibles

Collectibles produce:

Gentle sparkle.

Short melodic phrase.

Never loud.

Collecting lore should feel rewarding without interrupting gameplay.

---

# Dynamic Music System

Music should react to gameplay.

Possible transitions:

Boss Intro

↓

Combat

↓

Phase Transition

↓

Victory

Transitions should be smooth.

Avoid abrupt cuts.

---

# Audio Mixing

Priority order:

1. Gameplay
2. Boss attacks
3. Player actions
4. Important environmental sounds
5. Music
6. Ambient effects

Critical gameplay sounds should never be masked.

---

# Audio Buses

Use dedicated audio buses.

```
Master

Music

SFX

Ambience

UI

```

Each bus should have independent volume controls.

---
# Character Voices

Characters do not use real voice acting.

Instead, dialogue is represented through expressive vocalizations similar to classic indie games.

When text appears, characters emit short, stylized gibberish sounds that imitate speech without forming actual words.

These vocalizations should:

- Reflect each character's personality.
- Vary slightly in pitch and rhythm.
- Stop immediately when dialogue ends.
- Never contain intelligible language.
- Never distract from reading the dialogue.

Examples include soft murmurs, short syllables, or playful "mumble speech" similar to games like *Animal Crossing*, *Undertale*, or *Hollow Knight*.

This approach reinforces the game's charming atmosphere while keeping the focus on the written dialogue and allowing every player to imagine each character's voice.

---

# Accessibility

Players should be able to adjust:

- Master Volume
- Music
- Sound Effects
- UI Sounds
- Ambience

Subtitles should exist for every spoken dialogue.

---

# Technical Requirements

- Use OGG for music.
- Use WAV for sound effects.
- Audio should be streamed when appropriate.
- Use positional audio (AudioStreamPlayer2D) where beneficial.
- Avoid clipping and distortion.
- Normalize overall volume across all assets.

---

# Final Audio Rule

Every sound in **Ash & Purr** should accomplish at least one of these goals:

- Improve gameplay readability.
- Reinforce emotional storytelling.
- Communicate world-building.
- Increase the feeling of impact.

If a sound does none of these, it should not be included.

The player should finish the game remembering not only the music, but the quiet footsteps of a tiny knight, the deafening steps of colossal champions, and the silence that always came just before the most dangerous attack.
