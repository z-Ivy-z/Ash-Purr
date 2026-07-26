# Implementation Plan: Ash & Purr

## Overview

This plan implements a 2D arcade action game with soulslike combat in Godot Engine 4.x using GDScript. The implementation proceeds bottom-up: project structure and data resources first, then core components, player systems, boss AI, combat feedback, UI/menus, audio, save/checkpoint, and finally integration wiring. Each task builds incrementally on previous work.

## Tasks

- [ ] 1. Project structure, autoload singletons, and data resources
  - [ ] 1.1 Create folder structure and register autoload singletons
    - Create the full `res://` directory structure as defined in the design (Scenes/, Scripts/, Resources/, Audio/, etc.)
    - Create placeholder autoload scene files (game_manager.tscn, audio_manager.tscn, save_manager.tscn, scene_manager.tscn, settings_manager.tscn, input_manager.tscn) under Autoload/
    - Implement Scripts/Managers/game_manager.gd with state properties (current_scene_id, current_boss_phase, is_player_alive, is_paused) and signals
    - Register all 6 autoloads in project.godot
    - _Requirements: 23.3, 23.5_

  - [ ] 1.2 Create data resource scripts (AttackResource, AmuletResource, ToolResource, BossPhaseConfig)
    - Implement Scripts/Save/attack_resource.gd with all exported fields (damage, hitbox frames, hit stop, screen shake, knockback, animation name, recovery frames)
    - Implement Scripts/Save/amulet_resource.gd with modifier fields (damage_modifier, defense_modifier, health_modifier, cooldown_modifier)
    - Implement Scripts/Save/tool_resource.gd with fields (damage_multiplier, cooldown_seconds, startup_frames, tool_type enum, projectile_scene)
    - Implement Scripts/Save/boss_phase_config.gd with phase multiplier fields
    - _Requirements: 3.5, 3.6, 8.3, 8.4, 8.7, 8.8, 10.2, 10.3, 10.4, 11.2, 11.3, 11.4, 11.5_

  - [ ] 1.3 Create .tres resource instances for attacks, amulets, tools, and boss phase configs
    - Create Resources/Attacks/ with player_attack_1.tres, player_attack_2.tres, player_attack_3.tres, boss_basic_combo.tres, boss_advanced_combo.tres, boss_swift_slash.tres, boss_assault.tres, boss_seismic_strike.tres
    - Create Resources/Amulets/ with photograph.tres (1.25 dmg, 1.25 def), collar.tres (0.8 def, 1.3 cooldown), fish_plush.tres (1.3 hp, 0.8 dmg)
    - Create Resources/Tools/ with throwing_knife.tres (1.5× dmg, 4s cd), short_sword.tres (1.2× dmg, 3s cd), small_mace.tres (2.5× dmg, 8s cd, 12f startup), dreamcatcher.tres (heal 10%, 12s cd)
    - Create Resources/Config/ with boss_phase_1.tres (all 1.0×) and boss_phase_2.tres (1.3× atk speed, 0.5× recover, 1.3× move, 1.5× shockwave)
    - _Requirements: 10.2, 10.3, 10.4, 11.2, 11.3, 11.4, 11.5, 8.3, 8.4, 8.7, 8.8_

  - [ ] 1.4 Implement SaveManager and SettingsManager singletons
    - Implement Scripts/Managers/save_manager.gd with save_game(), load_game(), has_save_data(), delete_save() using JSON serialization to user://
    - Implement SaveData structure matching the design JSON schema (version, current_level, boss_progression, unlocked items, equipped loadout, statistics)
    - Implement Scripts/Managers/settings_manager.gd with all settings properties (fullscreen, resolution, volumes, accessibility options) and save_settings()/load_settings()
    - Handle error cases: write failure retains previous save, corrupted file creates defaults with notification, version mismatch attempts migration
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 16.2, 16.3_

  - [ ] 1.5 Implement InputManager singleton
    - Implement Scripts/Managers/input_manager.gd with device detection (keyboard/controller), rebind_action(), has_conflict(), save/load_bindings()
    - Support all gameplay actions: movement, attack, dodge, tool use, interact, pause
    - Implement conflict detection: warn on duplicate bindings, require confirmation before overwriting
    - Persist bindings via JSON in user:// and restore on launch
    - Detect controller connect/disconnect and emit device_changed signal
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

  - [ ] 1.6 Implement SceneManager singleton
    - Implement Scripts/Managers/scene_manager.gd with transition_to(), reload_current_scene()
    - Implement fade transition effect (ColorRect overlay) with configurable duration (200-500ms)
    - Emit transition_started/transition_completed signals
    - Free unused scene instances on transition to prevent memory leaks
    - _Requirements: 23.1, 23.2, 21.4_

  - [ ]* 1.7 Write property test for Save/Load round-trip (Property 18)
    - **Property 18: Save/Load Round-Trip Preservation**
    - Test that serializing any valid SaveData to JSON and deserializing produces identical state
    - Test that settings round-trip preserves all fields
    - Use randomized SaveData instances (varied equipped items, statistics, boss progression)
    - **Validates: Requirements 10.6, 11.8, 16.2, 18.4, 19.1, 19.3**

  - [ ]* 1.8 Write property test for Settings range validation (Property 23)
    - **Property 23: Volume Settings Bounded Range**
    - Test that any volume or slider value is clamped to 0.0-1.0 range
    - Test that values outside range are clamped to nearest valid value
    - Test increments no larger than 0.1
    - **Validates: Requirements 15.7, 20.1, 20.2**

  - [ ]* 1.9 Write property test for Input rebinding conflict detection (Property 21)
    - **Property 21: Input Rebinding Conflict Detection**
    - Test that binding a key already assigned to another action on the same device is detected
    - Test that no silent duplicate bindings are ever allowed
    - **Validates: Requirements 18.3, 18.7**

- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Core reusable components
  - [ ] 3.1 Implement HealthComponent
    - Create Scripts/Components/health_component.gd extending Node
    - Properties: current_health, max_health, is_invulnerable
    - Methods: take_damage(amount, source), heal(amount), set_invulnerable(active)
    - Signals: health_changed(current, max), died(), damage_taken(amount, source)
    - Damage is ignored when is_invulnerable is true
    - _Requirements: 1.6, 1.7, 4.3, 8.1_

  - [ ] 3.2 Implement HitboxComponent and HurtboxComponent
    - Create Scripts/Components/hitbox_component.gd extending Area2D
    - Properties: damage, knockback_force, knockback_direction, hit_stop_frames, screen_shake_intensity
    - Methods: enable(), disable() — controls monitoring and collision shape
    - Signal: hit_landed(target)
    - Create Scripts/Components/hurtbox_component.gd extending Area2D
    - Property: is_invulnerable (delegates to HealthComponent)
    - Signal: hurt(hitbox)
    - Set up collision layers: Player Hitbox (Layer 4) → Boss Hurtbox (Layer 7), Boss Hitbox (Layer 6) → Player Hurtbox (Layer 5)
    - _Requirements: 3.4, 9.5, 17.1_

  - [ ] 3.3 Implement CombatManager
    - Create Scripts/Combat/combat_manager.gd extending Node (scene-level, not autoload)
    - Method: process_hit(hitbox, hurtbox) — coordinates damage, hit stop, screen shake, knockback
    - Implement apply_hit_stop(duration_frames) — pauses both attacker and defender using process mode
    - Implement apply_screen_shake(intensity, duration) — displaces camera with decay, max 0.3s
    - Implement apply_knockback(target, direction, force) — displaces CharacterBody2D
    - Signals: hit_confirmed, hit_stop_started, screen_shake_requested, knockback_applied
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 3.4 Implement ComboController
    - Create Scripts/Components/combo_controller.gd extending Node
    - Properties: current_combo_step (0-3), is_in_combo_window
    - Method: advance_combo() → returns true if chain succeeds (within 10-15 frame window, step < 3)
    - Method: reset_combo() — resets step to 0
    - Signals: combo_completed(), combo_broken()
    - Combo window tracked via frame counter set by AnimationPlayer callbacks
    - _Requirements: 3.1, 3.2, 3.3, 3.7_

  - [ ] 3.5 Implement AmuletController
    - Create Scripts/Components/amulet_controller.gd extending Node
    - Property: equipped_amulet (AmuletResource or null)
    - Methods: get_damage_modifier(), get_defense_modifier(), get_health_modifier(), get_cooldown_modifier() — return 1.0 if no amulet
    - Method: equip(amulet) — sets the equipped amulet, emits amulet_changed signal
    - Lock equip changes during active combat (check GameManager state)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ] 3.6 Implement ToolController
    - Create Scripts/Components/tool_controller.gd extending Node
    - Properties: equipped_tool (ToolResource), cooldown_remaining, is_on_cooldown
    - Method: activate_tool() — executes tool effect if not on cooldown, starts cooldown timer
    - Handle each tool type: MELEE (instantiate attack), RANGED (instantiate projectile scene), HEALING (restore HP via HealthComponent)
    - Apply cooldown_modifier from AmuletController
    - Signal: tool_activated(tool), cooldown_updated(remaining, total)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [ ]* 3.7 Write property test for Combo Chaining (Property 4)
    - **Property 4: Combo Chaining Within Window**
    - Test that attack input within combo window (10-15 frames) advances combo step
    - Test that attack input outside window or after step 3 does not advance
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 3.8 Write property test for Deterministic Damage (Property 5)
    - **Property 5: Deterministic Damage and Combat Feedback**
    - Test that same AttackResource always produces identical damage values
    - Test that hit stop, screen shake, and knockback values match AttackResource definition
    - **Validates: Requirements 3.5, 3.6, 9.1, 9.2, 9.3**

  - [ ]* 3.9 Write property test for Amulet Modifier Application (Property 15)
    - **Property 15: Amulet Modifier Application**
    - Test each amulet applies correct multiplicative modifiers
    - Test that no amulet equipped returns all modifiers as 1.0
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.7**

  - [ ]* 3.10 Write property test for Equipment Slot Invariant (Property 16)
    - **Property 16: Equipment Slot Invariant**
    - Test that at most one amulet/tool is equipped at any time
    - Test that equipping a new item replaces the previous one
    - Test that equip attempts during active combat are rejected
    - **Validates: Requirements 10.1, 10.5, 11.1**

  - [ ]* 3.11 Write property test for Tool Cooldown Enforcement (Property 17)
    - **Property 17: Tool Cooldown Enforcement**
    - Test that activation starts cooldown timer of specified duration
    - Test that activation input during cooldown is ignored
    - **Validates: Requirements 11.6, 11.7**

- [ ] 4. Player character and state machine
  - [ ] 4.1 Implement PlayerStateMachine and base State class
    - Create Scripts/Player/player_state_machine.gd with current_state, transition_to(new_state)
    - Create a base State class (Scripts/Player/States/state.gd) with enter(), exit(), process(), physics_process(), handle_input() virtual methods
    - Signal: state_changed(old_state, new_state)
    - Validate transitions per-state (e.g., Attack blocks transition to Run)
    - _Requirements: 1.1_

  - [ ] 4.2 Implement Idle, Run, and movement logic
    - Create Scripts/Player/States/idle_state.gd — transitions to Run on horizontal input, to Attack on attack input, to Dodge on dodge input
    - Create Scripts/Player/States/run_state.gd — transitions to Idle on input release, to Attack on attack input, to Dodge on dodge input
    - Implement movement in player.gd: instant acceleration to 300 px/s, instant deceleration, sprite flip on direction change
    - Use CharacterBody2D.move_and_slide() for all movement
    - _Requirements: 1.2, 1.3, 1.9, 1.10, 2.1, 2.2, 2.3, 2.4_

  - [ ] 4.3 Implement Attack and Recovery states
    - Create Scripts/Player/States/attack_state.gd — blocks transition to Run/Idle until animation completes, uses ComboController to chain attacks
    - Enable/disable HitboxComponent per animation frame via AnimationPlayer keyframes
    - Create Scripts/Player/States/recovery_state.gd — allows transition to Dodge or Run but blocks Attack until recovery animation completes
    - Zero horizontal velocity during Attack and Recovery
    - _Requirements: 1.4, 1.8, 2.6, 3.1, 3.2, 3.3, 3.4_

  - [ ] 4.4 Implement Dodge state with I-Frames
    - Create Scripts/Player/States/dodge_state.gd — moves defined distance in input/facing direction
    - Grant I-Frames (3-6 physics frames at 60 FPS) by setting HurtboxComponent.is_invulnerable = true
    - Block all other state transitions until dodge animation completes, then transition to Idle
    - Cannot enter Dodge from Attack (active frames) or Hit/Death states
    - _Requirements: 1.5, 1.10, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 4.5 Implement Hit and Death states
    - Create Scripts/Player/States/hit_state.gd — entered on damage received, plays hit-reaction animation, transitions to Idle on completion
    - Cancel active combo on entering Hit state (call ComboController.reset_combo())
    - Ignore movement input, apply zero horizontal velocity
    - Create Scripts/Player/States/death_state.gd — entered when health reaches 0, disable all input processing, emit signal for death screen
    - _Requirements: 1.6, 1.7, 2.5, 3.7_

  - [ ] 4.6 Create Player.tscn scene and wire all components
    - Create Scenes/Player/Player.tscn with CharacterBody2D root
    - Attach child nodes: PlayerStateMachine, HealthComponent, HitboxComponent (Area2D), HurtboxComponent (Area2D), AnimationPlayer, ComboController, ToolController, AmuletController
    - Set up collision layers: Body on Layer 2, Hitbox on Layer 4 masking Layer 7, Hurtbox on Layer 5
    - Wire signals between components (HealthComponent.died → DeathState, HurtboxComponent.hurt → CombatManager)
    - _Requirements: 1.1, 2.4, 9.5_

  - [ ]* 4.7 Write property test for Player FSM Valid Transitions (Property 1)
    - **Property 1: Player FSM Valid Transitions**
    - Test that for any state and input, only permitted transitions occur
    - Test that state-locking animations prevent transitions
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.8, 1.9, 1.10**

  - [ ]* 4.8 Write property test for Damage Causes Hit State (Property 2)
    - **Property 2: Damage Causes Hit State When Vulnerable**
    - Test that damage while not dodging/invulnerable causes Hit state
    - Test that zero health causes Death state with input disabled
    - **Validates: Requirements 1.6, 1.7, 4.3**

  - [ ]* 4.9 Write property test for Instant Movement Response (Property 3)
    - **Property 3: Instant Movement Response**
    - Test that velocity reaches target within one physics frame on input change
    - Test that restricted states produce zero velocity change from input
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6**

  - [ ]* 4.10 Write property test for I-Frames Prevent Damage (Property 7)
    - **Property 7: I-Frames Prevent All Damage**
    - Test that overlapping hitbox during i-frames deals zero damage
    - Test that no Hit state transition occurs during invulnerability
    - **Validates: Requirements 4.2, 4.3, 8.1**

  - [ ]* 4.11 Write property test for Combo Cancellation on Damage (Property 6)
    - **Property 6: Combo Cancellation on Damage**
    - Test that damage during active combo resets combo to step 0
    - Test that Player transitions to Hit state
    - **Validates: Requirements 3.7**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Boss AI - Cat Keeper
  - [ ] 6.1 Implement BossStateMachine and boss state classes
    - Create Scripts/Bosses/boss_state_machine.gd (same pattern as PlayerStateMachine)
    - Create base boss state and all state scripts: boss_idle_state.gd, boss_walk_state.gd, boss_attack_state.gd, boss_combo_state.gd, boss_recover_state.gd, boss_special_attack_state.gd, boss_phase_transition_state.gd, boss_death_state.gd
    - Each state handles enter/exit/process logic specific to Cat Keeper
    - Recover state has 3s maximum timeout to prevent permanent locks
    - _Requirements: 5.1_

  - [ ] 6.2 Implement AttackSelector with distance-based selection
    - Create Scripts/Bosses/attack_selector.gd
    - Method: select_next_attack(player_distance) → returns AttackResource
    - Close range (<3 character-widths): selects Basic Combo or Advanced Combo
    - Far range (>5 character-widths): selects Assault or Swift Slash
    - Never repeat same combo type consecutively (track last_attack_type)
    - Randomize startup delay within 0.8-1.5 seconds range
    - Phase 2: allow chaining Swift Slash and double Assault
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 8.5, 8.6_

  - [ ] 6.3 Implement PhaseController
    - Create Scripts/Bosses/phase_controller.gd
    - Properties: current_phase, attack_speed_multiplier, recover_duration_multiplier, movement_speed_multiplier, shockwave_area_multiplier
    - Method: trigger_phase_transition() — loads boss_phase_2.tres config, emits phase_changed signal
    - Triggered when HealthComponent reports health ≤ 40%
    - Phase 2 enables can_chain_swift_slash and can_double_assault
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ] 6.4 Implement StaggerController
    - Create Scripts/Components/stagger_controller.gd
    - Track hits_during_recover (reset on Recover exit), stagger_used_this_phase
    - When hits_during_recover >= 3: emit stagger_triggered, pause boss for 2 seconds
    - Limit to once per phase, reset on phase_changed signal
    - Provide distinct visual/audio feedback on stagger activation
    - _Requirements: 22.1, 22.2, 22.3, 22.4_

  - [ ] 6.5 Implement Basic Combo and Advanced Combo behavior
    - In boss_combo_state.gd: handle 3-strike Basic Combo with randomized inter-strike delays (8-20 frames each)
    - Basic Combo follow-up: if player in melee range after 3rd strike, chain next attack; otherwise enter Recover
    - Handle 5-strike Advanced Combo: alternate slow (18-24 frames) and fast (8-12 frames) strikes
    - Advanced Combo: adjust each strike direction toward player position (max rotation angle per strike)
    - Advanced Combo Recover window ≥ 1.5× Basic Combo Recover
    - Counterattack: if player hits boss during active combo, cancel remaining strikes and counter within 6 frames
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 6.6 Implement Special Attacks (Swift Slash, Assault, Seismic Strike)
    - Swift Slash: rising slash + ground pound with shockwave, landing timing randomized (6-18 frames after peak)
    - Assault: lower stance, charge at 3× walk speed, distance = player distance clamped to min/max range
    - Assault miss: enter short Recover (shorter than player 3-hit combo duration)
    - Seismic Strike: sword into ground, linear shockwave travels full arena width
    - Seismic Strike follow-up: if player stays within dodge-distance for 0.5s, chain next attack without Recover
    - All specials have unique telegraph animations starting ≥ 12 frames (P1) or ≥ 8 frames (P2) before hitbox
    - Create shockwave scene (Scenes/Effects/Shockwave.tscn) with Area2D hitbox on Layer 9
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.9_

  - [ ] 6.7 Implement Phase Transition state and Phase 2 behavior
    - boss_phase_transition_state.gd: play transition animation, grant player invulnerability for full duration
    - Boss ignores all damage during transition animation
    - On transition complete: load Phase 2 config, apply multipliers to all systems
    - Walk state in Phase 2: speed × movement_speed_multiplier
    - All attack animations in Phase 2: speed × attack_speed_multiplier
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.8, 8.9_

  - [ ] 6.8 Create CatKeeper.tscn scene and wire all boss components
    - Create Scenes/Bosses/CatKeeper.tscn with CharacterBody2D root
    - Attach: BossStateMachine, HealthComponent, HitboxComponent, HurtboxComponent, AnimationPlayer, PhaseController, AttackSelector, StaggerController
    - Set collision layers: Body Layer 3, Hitbox Layer 6 masking Layer 5, Hurtbox Layer 7
    - Wire signals: HealthComponent to PhaseController (for 40% threshold), StaggerController to state machine
    - Walk behavior: seek preferred distance of 3-5 character-widths, speed 30-50% of player speed
    - _Requirements: 5.1, 5.2_

  - [ ]* 6.9 Write property test for Boss Attack Selection (Property 8)
    - **Property 8: Boss Attack Selection Distance Rules**
    - Test close range selects close-range attacks, far range selects gap-closers
    - Test same combo type never repeats consecutively
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 6.10 Write property test for Boss Attack Timing Variation (Property 9)
    - **Property 9: Boss Attack Timing Variation**
    - Test that two consecutive uses of same attack have different startup delays
    - Test Basic Combo inter-strike delays within 8-20 frames range
    - Test Advanced Combo alternates slow/fast timing
    - **Validates: Requirements 5.5, 6.1, 6.4**

  - [ ]* 6.11 Write property test for Boss Recover Punish Window (Property 10)
    - **Property 10: Boss Recover Provides Punish Window**
    - Test Recover duration is between 1.0-1.8 seconds after combo
    - Test Advanced Combo Recover ≥ 1.5× Basic Combo Recover
    - **Validates: Requirements 5.7, 6.6**

  - [ ]* 6.12 Write property test for Boss Counterattack (Property 11)
    - **Property 11: Boss Counterattack on Interrupted Combo**
    - Test that player hit during active combo triggers counterattack within 6 frames
    - Test remaining combo strikes are cancelled
    - **Validates: Requirements 6.7**

  - [ ]* 6.13 Write property test for Special Attack Telegraphs (Property 12)
    - **Property 12: Special Attack Telegraphs**
    - Test each special attack has ≥ 12 frames (P1) or ≥ 8 frames (P2) telegraph before hitbox
    - Test audio telegraph ≥ 300ms before hitbox activation
    - **Validates: Requirements 7.6, 8.9, 15.2**

  - [ ]* 6.14 Write property test for Phase 2 Multipliers (Property 13)
    - **Property 13: Phase 2 Multipliers Applied Correctly**
    - Test attack speed ≥ 1.3×, recover ≤ 0.5×, movement ≥ 1.3×, shockwave ≥ 1.5×
    - Test all multipliers are configurable via BossPhaseConfig resource
    - **Validates: Requirements 8.3, 8.4, 8.7, 8.8**

  - [ ]* 6.15 Write property test for Phase 2 Attack Chaining (Property 14)
    - **Property 14: Phase 2 Attack Chaining Rules**
    - Test Swift Slash can chain without Recover in Phase 2 but not Phase 1
    - Test double Assault allowed in Phase 2 but not Phase 1
    - **Validates: Requirements 8.5, 8.6**

  - [ ]* 6.16 Write property test for Stagger Mechanic (Property 19)
    - **Property 19: Stagger Mechanic Constraints**
    - Test 3+ hits during Recover triggers stagger (2s pause)
    - Test stagger limited to once per phase, resets on phase transition
    - **Validates: Requirements 22.1, 22.2, 22.3**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. UI, HUD, and menu system
  - [ ] 8.1 Implement HUD
    - Create Scenes/UI/HUD.tscn and Scripts/UI/hud.gd
    - Player health bar: top-left, rounded container, red fill, no numeric values
    - Tool icon with radial cooldown indicator below health bar (illuminated when available, desaturated on cooldown)
    - Amulet icon beside tool icon
    - Boss health bar: top-center, shown after intro sequence ends, with boss name label
    - Animate health reduction smoothly over ≤ 0.3 seconds
    - Phase 2 transition: crack/color-shift effect on boss health bar
    - Hide boss health bar within 1 second of Cat Keeper defeat
    - No floating damage numbers
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [ ] 8.2 Implement Main Menu
    - Create Scenes/UI/MainMenu.tscn and Scripts/UI/main_menu.gd
    - Options: Continue, New Game, Settings, Credits, Exit
    - Continue visually disabled and non-selectable when no save data exists (check SaveManager.has_save_data())
    - Keyboard and gamepad navigation with visible selection indicator
    - Menu opens and accepts input within 100ms of triggering input
    - _Requirements: 13.1, 13.2, 13.6, 13.7_

  - [ ] 8.3 Implement Pause Menu
    - Create Scenes/UI/PauseMenu.tscn and Scripts/UI/pause_menu.gd
    - Triggered by pause input: freeze all gameplay simulation within same frame (set tree paused)
    - Options: Resume, Amulets, Controls, Settings, Main Menu
    - Keyboard/gamepad navigation with selection indicator
    - _Requirements: 13.3, 13.6, 13.7_

  - [ ] 8.4 Implement Death Screen and Victory Screen
    - Create Scenes/UI/DeathScreen.tscn and Scripts/UI/death_screen.gd
    - Fade gameplay, display "Stand once more" message, options: Retry, Main Menu
    - Retry reloads arena and resets Player + Cat Keeper to initial states within 1 second
    - Create Scenes/UI/VictoryScreen.tscn and Scripts/UI/victory_screen.gd
    - Display defeated boss name, reward obtained, Continue option
    - Keyboard/gamepad navigation for both screens
    - _Requirements: 13.4, 13.5, 13.6, 23.4_

  - [ ] 8.5 Implement Dialogue System
    - Create Scenes/UI/DialogueWindow.tscn and Scripts/UI/dialogue_system.gd
    - Rounded dialogue window, text rendered character-by-character (30-50 chars/sec)
    - Advance input while typing: complete current line immediately
    - Advance input while line complete: next line or close window
    - Block Player_Character movement and combat inputs while dialogue active
    - Restore inputs within 200ms of dialogue close
    - Display character portrait adjacent to text when entry includes one
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 8.6 Write property test for Pause Freezes Simulation (Property 24)
    - **Property 24: Pause Freezes Simulation**
    - Test that pause freezes all gameplay simulation in same frame
    - Test that resume restores exact frozen state
    - **Validates: Requirements 13.3**

  - [ ]* 8.7 Write property test for Dialogue Input Restriction (Property 20)
    - **Property 20: Dialogue Input Restriction and Advance**
    - Test movement/combat inputs blocked during active dialogue
    - Test advance input behavior (complete line, advance, close)
    - **Validates: Requirements 14.3, 14.4, 14.5**

- [ ] 9. Audio system
  - [ ] 9.1 Implement AudioManager singleton
    - Implement Scripts/Managers/audio_manager.gd
    - Set up audio buses: Master, Music, SFX, UI, Ambience
    - Methods: play_sfx(stream, bus), play_music(stream, crossfade_duration), duck_music(amount_db, duration), set_bus_volume(bus, linear)
    - OGG format for music, WAV format for SFX
    - Integrate with SettingsManager for persisted volume levels (independent per bus, 0-100% in ≤10% increments)
    - _Requirements: 15.1, 15.6, 15.7_

  - [ ] 9.2 Implement combat audio cues and music ducking
    - Play distinct audio telegraphs for each special attack (Swift Slash, Assault, Seismic Strike) ≥ 300ms before hitbox
    - Duck music by ≥ 50% (≈-6dB) for 500-1000ms starting at telegraph
    - Each special attack uses a unique, distinguishable sound cue
    - Wire to AnimationPlayer method tracks for frame-accurate triggering
    - _Requirements: 15.2, 15.3_

  - [ ] 9.3 Implement phase-based music system
    - Phase 1 music: strings, brass, timpani, disciplined noble mood
    - Phase 2 music: unstable harmony, intense percussion, brief choir elements
    - Crossfade from Phase 1 to Phase 2 over 1-3 seconds on phase_changed signal
    - _Requirements: 15.4, 15.5_

  - [ ] 9.4 Implement dialogue gibberish vocalizations
    - Play expressive gibberish vocalizations varying in pitch/rhythm per character during text typing
    - Stop vocalizations immediately when text finishes or dialogue closes
    - Route through SFX bus
    - _Requirements: 14.2_

- [ ] 10. Checkpoint, arena, and game flow
  - [ ] 10.1 Implement Checkpoint system
    - Create Scenes/Checkpoints/Checkpoint.tscn with Area2D trigger (Layer 8)
    - On interaction input: restore player health to max, display visual confirmation
    - While in checkpoint area: allow amulet/tool changes via AmuletController and ToolController
    - On checkpoint exit: respawn non-boss enemies, lock equipment changes
    - Trigger SaveManager.save_game() on activation, show "Progress Saved" notification (fades after 2s)
    - _Requirements: 16.1, 16.2, 16.4, 16.5, 19.6_

  - [ ] 10.2 Implement Arena scene
    - Create Scenes/Levels/Arena_CatKeeper.tscn
    - StaticBody2D boundaries (floor, walls, ceiling) on Layer 1 preventing exit
    - Flat combat floor with no elevation or interactive obstacles
    - Background/environmental layers at lower z-index than Player/Boss/combat elements
    - GPUParticles2D environmental animations: max 3 emitters, max 50 particles each, behind gameplay
    - Static storytelling elements on non-interactive background layers (no collision, no gameplay effect)
    - Horizontal width ≥ 5760 pixels (3 screen widths at 1920×1080)
    - Target 60 FPS with all effects enabled
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_

  - [ ] 10.3 Implement game flow: boss defeat persistence and retry logic
    - On Cat Keeper defeat: record permanently in save file (never respawns), emit boss_defeated signal
    - Death → Retry: reload Arena, reset Player + Boss to initial states (full HP, Phase 1, starting positions) within 1 second
    - Wire GameManager state tracking: current_scene_id, current_boss_phase, is_player_alive, is_paused
    - _Requirements: 16.6, 23.3, 23.4_

  - [ ]* 10.4 Write property test for Checkpoint Health Restoration (Property 22)
    - **Property 22: Checkpoint Health Restoration and Equipment Access**
    - Test health restored to max on activation
    - Test equipment changes allowed in checkpoint area and locked outside
    - **Validates: Requirements 16.1, 16.4**

  - [ ]* 10.5 Write property test for Scene Transition (Property 25)
    - **Property 25: Scene Transition Fade Duration**
    - Test fade transition completes within 200-500ms
    - Test retry resets both Player and Boss within 1 second
    - **Validates: Requirements 23.2, 23.4**

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Accessibility and settings UI
  - [ ] 12.1 Implement Settings menu with accessibility options
    - Camera shake toggle (on/off) and intensity slider (0-100%, ≤10% increments)
    - Hit flash intensity slider (0-100%, ≤10% increments)
    - UI scale: 100%, 125%, 150%
    - Subtitle text size: Small, Medium (default), Large; optional opaque background toggle
    - Full controller remapping independent of keyboard bindings
    - Changes apply immediately without restart
    - Independent volume controls per audio bus (Master, Music, SFX, UI, Ambience)
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 15.7_

  - [ ] 12.2 Implement Throwing Knife projectile scene
    - Create Scenes/Objects/ThrowingKnife.tscn with Area2D on Layer 9 masking Layer 7
    - Travels in straight horizontal line at defined speed
    - Deals 1.5× base branch damage on hit
    - Freed on hitting target or leaving screen bounds
    - _Requirements: 11.2_

- [ ] 13. Integration wiring and final polish
  - [ ] 13.1 Wire full combat loop integration
    - Connect Player HitboxComponent → CombatManager → Boss HealthComponent
    - Connect Boss HitboxComponent → CombatManager → Player HealthComponent
    - Ensure hit stop, screen shake, knockback all fire on every confirmed hit
    - Shockwave projectiles (Seismic Strike, Swift Slash ground pound) interact with Player Hurtbox via Layer 9
    - Validate deterministic damage (no random variation on player attacks)
    - _Requirements: 3.5, 3.6, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 13.2 Wire boss encounter intro sequence
    - On player entering arena: trigger dialogue system for pre-fight narrative
    - After dialogue closes: show boss health bar, enable boss AI
    - Ensure Boss AI does not act until intro sequence completes
    - _Requirements: 12.4, 14.1, 14.5_

  - [ ] 13.3 Wire checkpoint → arena → death/victory flow
    - Checkpoint activation → save → enter arena → boss encounter
    - Death → death screen → retry (reset) or main menu
    - Victory → victory screen → continue
    - Scene transitions with fade effects (200-500ms)
    - Equipment locked during combat, unlocked at checkpoints
    - _Requirements: 10.5, 16.1, 16.4, 16.5, 16.6, 23.1, 23.2, 23.4_

  - [ ] 13.4 Wire controller disconnect handling and UI prompt switching
    - Auto-pause on controller disconnect, display "Controller disconnected" prompt
    - Update all on-screen UI prompts to match active input device within 1 second of change
    - _Requirements: 18.6_

  - [ ]* 13.5 Write integration tests for full combat loop
    - Test: Player attacks boss → damage → feedback → boss responds
    - Test: Phase transition at 40% → animation → Phase 2 active
    - Test: Death → death screen → retry → full reset
    - Test: Checkpoint save → quit → load → state restored
    - _Requirements: 9.1, 9.2, 9.3, 8.1, 23.4, 16.2_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code uses GDScript for Godot Engine 4.x targeting Windows Desktop at 1920×1080
- AnimationPlayer is the source of truth for all frame-accurate gameplay events
- Combat values are data-driven via Resource files (.tres) for easy tuning
- GdUnit4 is the testing framework for all property-based and unit tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "1.6"] },
    { "id": 2, "tasks": ["1.7", "1.8", "1.9", "3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5", "3.6"] },
    { "id": 4, "tasks": ["3.7", "3.8", "3.9", "3.10", "3.11", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4", "4.5"] },
    { "id": 6, "tasks": ["4.6", "4.7", "4.8", "4.9", "4.10", "4.11"] },
    { "id": 7, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 8, "tasks": ["6.5", "6.6", "6.7"] },
    { "id": 9, "tasks": ["6.8", "6.9", "6.10", "6.11", "6.12", "6.13", "6.14", "6.15", "6.16"] },
    { "id": 10, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 11, "tasks": ["8.6", "8.7", "9.1"] },
    { "id": 12, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 13, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 14, "tasks": ["10.4", "10.5", "12.1", "12.2"] },
    { "id": 15, "tasks": ["13.1", "13.2", "13.3", "13.4"] },
    { "id": 16, "tasks": ["13.5"] }
  ]
}
```
