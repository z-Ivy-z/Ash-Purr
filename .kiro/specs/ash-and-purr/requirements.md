# Requirements Document

## Introduction

This document specifies the software requirements for **Ash & Purr**, a 2D arcade action game with soulslike combat featuring a single boss encounter: The Cat Keeper. The game is built in Godot Engine 4.x using GDScript, targeting Windows Desktop at 1920×1080 resolution. The scope covers the player character (Bob), combat system, boss AI with two phases, items (amulets and tools), UI/HUD, audio systems, checkpoint mechanics, arena design, and accessibility features. The game follows a one-life philosophy where player skill and knowledge drive progression rather than character power.

## Glossary

- **Game**: The Ash & Purr application running on Godot Engine 4.x
- **Player_Character**: Bob, the playable protagonist controlled via keyboard or gamepad
- **Combat_System**: The frame-accurate system managing hitboxes, hurtboxes, i-frames, damage, knockback, and hit stop
- **Boss_AI**: The finite state machine controlling The Cat Keeper's behavior, attack selection, and phase transitions
- **Cat_Keeper**: The sole boss enemy, a gigantic armored paladin with a colossal greatsword operating in two combat phases
- **FSM**: Finite State Machine, the pattern used for managing Player_Character and Boss_AI states
- **Hitbox**: An Area2D node that deals damage when overlapping a Hurtbox
- **Hurtbox**: An Area2D node that receives damage when overlapping a Hitbox
- **I-Frames**: Invulnerability frames during the dodge action where the Player_Character cannot receive damage
- **Punish_Window**: A recovery period after boss attacks during which the Player_Character can safely attack
- **Amulet_System**: The equipment system allowing one amulet with paired advantage and disadvantage
- **Tool_System**: The equipment system allowing one tool with independent cooldown
- **HUD**: The minimal heads-up display showing health, tool cooldown, amulet icon, and boss health
- **Checkpoint_System**: Save points that restore health, persist progress, and allow equipment changes
- **Audio_Manager**: The autoload singleton routing all sounds through dedicated audio buses
- **Scene_Manager**: The autoload singleton handling scene transitions and loading
- **Save_Manager**: The autoload singleton managing JSON serialization of game progress
- **Settings_Manager**: The autoload singleton persisting user preferences between sessions
- **Input_Manager**: The autoload singleton handling input mapping and remapping for keyboard and controllers
- **Game_Manager**: The autoload singleton managing global game state and flow
- **Arena**: The bounded combat environment for The Cat Keeper encounter
- **Phase_Transition**: The event at 40% Cat_Keeper health triggering Phase 2 behavior
- **Stagger**: A brief interrupt state caused by specific player attacks under specific conditions
- **Dialogue_System**: The text-based narrative delivery system using typed text and gibberish vocalizations

## Requirements

### Requirement 1: Player Character State Machine

**User Story:** As a player, I want Bob to respond immediately to my inputs with distinct movement states, so that I feel in complete control during combat.

#### Acceptance Criteria

1. THE Player_Character SHALL implement an FSM with the following states: Idle, Run, Attack, Recovery, Dodge, Hit, Death
2. WHEN the player provides horizontal movement input while the Player_Character is in the Idle state, THE Player_Character SHALL transition to Run within one physics frame
3. WHEN the player releases all movement input while the Player_Character is in the Run state, THE Player_Character SHALL transition to Idle within one physics frame
4. WHILE the Player_Character is in the Attack state, THE Player_Character SHALL prevent transition to Run or Idle until the attack animation completes, at which point the Player_Character SHALL transition to the Recovery state
5. WHILE the Player_Character is in the Dodge state, THE Player_Character SHALL prevent all other state transitions until the dodge animation completes, at which point the Player_Character SHALL transition to Idle
6. WHEN the Player_Character receives damage while not in the Dodge state and not during invulnerability frames, THE Player_Character SHALL transition to the Hit state and remain in it until the hit-reaction animation completes, at which point the Player_Character SHALL transition to Idle
7. WHEN the Player_Character health reaches zero, THE Player_Character SHALL transition to the Death state and disable all input processing
8. WHILE the Player_Character is in the Recovery state, THE Player_Character SHALL prevent transition to Attack until the recovery animation completes, but SHALL allow transition to Dodge or Run
9. WHEN the player provides attack input while the Player_Character is in the Idle or Run state, THE Player_Character SHALL transition to Attack within one physics frame
10. WHEN the player provides dodge input while the Player_Character is in the Idle, Run, or Recovery state, THE Player_Character SHALL transition to Dodge within one physics frame, and invulnerability frames SHALL begin on the first frame of the dodge animation and end no later than the final frame of the dodge animation

### Requirement 2: Player Movement

**User Story:** As a player, I want Bob to move with instant acceleration and immediate stopping, so that positioning during combat feels precise and responsive.

#### Acceptance Criteria

1. WHEN horizontal movement input begins, THE Player_Character SHALL reach maximum horizontal speed of 300 pixels per second within one physics frame
2. WHEN horizontal movement input ends, THE Player_Character SHALL decelerate to zero horizontal speed within one physics frame
3. WHEN the opposite horizontal input is pressed while moving, THE Player_Character SHALL reverse to maximum speed in the new direction within one physics frame and flip the character sprite to face the new direction
4. THE Player_Character SHALL use CharacterBody2D with move_and_slide for all movement and collision processing
5. WHILE the Player_Character is in the Hit or Death state, THE Player_Character SHALL ignore movement input and apply zero horizontal velocity
6. WHILE the Player_Character is in the Attack, Recovery, or Dodge state, THE Player_Character SHALL ignore movement input and maintain zero horizontal velocity unless the state applies its own motion

### Requirement 3: Player Attack System

**User Story:** As a player, I want to perform a short combo of 1 to 3 hits when I attack at the correct timing, so that I can punish boss openings without button mashing.

#### Acceptance Criteria

1. WHEN the player presses the attack input during Idle or Run state, THE Combat_System SHALL execute the first attack in the combo sequence
2. WHEN the player presses the attack input during the combo window of a previous attack (a window of 10 to 15 animation frames after the active hitbox deactivates), THE Combat_System SHALL chain to the next attack in the sequence up to a maximum of three hits
3. WHEN the combo window expires without additional attack input, THE Player_Character SHALL transition to the Recovery state
4. THE Combat_System SHALL enable the Hitbox for a specific frame range defined by the AnimationPlayer for each attack in the combo
5. WHEN the Player_Character Hitbox overlaps the Cat_Keeper Hurtbox, THE Combat_System SHALL apply damage, hit stop (3 to 5 frames), knockback (30 to 80 pixels), and screen shake
6. THE Combat_System SHALL produce deterministic damage values with no random variation
7. WHEN the Player_Character receives damage during an active combo, THE Combat_System SHALL cancel the remaining combo and transition the Player_Character to the Hit state

### Requirement 4: Player Dodge

**User Story:** As a player, I want to dodge through attacks using precise timing, so that I can avoid damage and reposition during combat.

#### Acceptance Criteria

1. WHEN the player presses the dodge input during Idle, Run, or Recovery state, THE Player_Character SHALL transition to the Dodge state and move a defined distance in the current input direction (or facing direction if no input is held)
2. WHILE the Player_Character is in the Dodge state, THE Combat_System SHALL grant I-Frames for a defined number of physics frames between 3 and 6 at 60 FPS
3. WHILE I-Frames are active, THE Player_Character Hurtbox SHALL NOT register damage from any overlapping Hitbox
4. WHEN the Dodge animation completes, THE Player_Character SHALL transition to the Idle state with input availability restored within one physics frame
5. WHILE the Player_Character is in the Attack state, THE Player_Character SHALL NOT transition to the Dodge state until the current attack's active frames complete
6. IF the player presses the dodge input while the Player_Character is in the Hit or Death state, THEN THE Player_Character SHALL ignore the input and remain in the current state

### Requirement 5: Cat Keeper Phase 1 Behavior

**User Story:** As a player, I want The Cat Keeper to behave like a disciplined master swordsman who adapts to my positioning, so that the fight demands pattern recognition and patience rather than memorization.

#### Acceptance Criteria

1. THE Boss_AI SHALL manage Cat_Keeper behavior through the states: Idle, Walk, Attack, Combo, Recover, SpecialAttack, PhaseTransition, and Death, where only one state is active at any time and every state transition is triggered by a defined game event or condition
2. WHILE in Phase 1 (health above 40%), THE Cat_Keeper SHALL walk toward the Player_Character at a speed between 30% and 50% of the Player_Character's base movement speed, seeking to maintain a preferred distance of 3 to 5 character-widths from the Player_Character
3. WHEN the Boss_AI selects an attack, THE Cat_Keeper SHALL choose from close-range attacks (Basic Combo, Advanced Combo) if the Player_Character is within 3 character-widths, or from gap-closing attacks (Assault, Swift Slash) if the Player_Character is beyond 5 character-widths, rather than following a fixed sequence
4. THE Boss_AI SHALL avoid repeating the same combo type (Basic Combo or Advanced Combo) twice in immediate succession, selecting either the alternate combo type or a special attack as the next offensive action
5. THE Boss_AI SHALL vary the startup delay of each attack within a range of 0.8 to 1.5 seconds from the base animation timing, so that no two consecutive uses of the same attack share identical timing
6. WHEN the Player_Character remains beyond 5 character-widths from the Cat_Keeper for more than 2 seconds, THE Cat_Keeper SHALL close distance by transitioning to either the Walk state or the Assault special attack
7. WHEN a combo sequence completes (final hit of Basic Combo or Advanced Combo), THE Cat_Keeper SHALL enter the Recover state for a duration of 1.0 to 1.8 seconds, during which the Player_Character may safely perform 1 to 2 attacks, before the Cat_Keeper selects the next action

### Requirement 6: Cat Keeper Basic and Advanced Combos

**User Story:** As a player, I want The Cat Keeper's combos to have varied timing and multiple possible endings, so that I must read each attack rather than memorizing a pattern.

#### Acceptance Criteria

1. WHEN the Boss_AI selects Basic Combo, THE Cat_Keeper SHALL execute a three-strike sequence where each inter-strike delay is independently randomized within a range of 8 to 20 animation frames
2. WHEN the Basic Combo third strike completes and the Player_Character is within melee range, THE Boss_AI SHALL select a follow-up attack instead of transitioning to Recover
3. WHEN the Basic Combo third strike completes and the Player_Character is outside melee range, THE Boss_AI SHALL transition to Recover providing a Punish_Window
4. WHEN the Boss_AI selects Advanced Combo, THE Cat_Keeper SHALL execute a five-strike sequence where slow strikes use a delay of 18 to 24 animation frames and fast strikes use a delay of 8 to 12 animation frames, alternating between slow and fast
5. WHILE executing the Advanced Combo, THE Cat_Keeper SHALL adjust each strike's direction toward the Player_Character's current position by up to a maximum defined rotation angle per strike
6. WHEN the Advanced Combo fully completes, THE Cat_Keeper SHALL enter Recover with a Punish_Window duration at least 1.5 times the Basic Combo Punish_Window duration
7. IF the Player_Character attacks the Cat_Keeper during an active Basic Combo or Advanced Combo sequence before all strikes have completed, THEN THE Cat_Keeper SHALL cancel the remaining combo strikes and execute a counterattack within 6 animation frames

### Requirement 7: Cat Keeper Special Attacks

**User Story:** As a player, I want The Cat Keeper to have distinct special attacks that deny specific defensive habits, so that I must adapt my strategy throughout the fight.

#### Acceptance Criteria

1. WHEN the Boss_AI selects Swift Slash, THE Cat_Keeper SHALL perform a rising slash followed by a ground pound with a shockwave at the landing point, where landing timing varies randomly between 6 and 18 frames after reaching peak height
2. WHEN the Boss_AI selects Assault, THE Cat_Keeper SHALL lower his stance and charge forward at a minimum of 3× his walk speed, traveling a distance equal to the Player_Character distance at charge initiation clamped between a defined minimum and maximum range
3. WHEN Assault ends without the Cat_Keeper Hitbox overlapping the Player_Character Hurtbox, THE Cat_Keeper SHALL enter a Recover state shorter than the Player_Character three-hit combo duration, allowing the Cat_Keeper to counterattack if the player commits to a full combo
4. WHEN the Boss_AI selects Seismic Strike, THE Cat_Keeper SHALL drive his sword into the ground producing a ground-level shockwave that travels the full width of the Arena floor
5. IF the Player_Character remains within one dodge-distance of their position for more than 0.5 seconds after Seismic Strike completes, THEN THE Boss_AI SHALL chain into a follow-up attack without entering Recover
6. THE Combat_System SHALL provide a unique visual telegraph animation and a unique audio cue for each special attack, beginning at least 12 animation frames before the attack Hitbox becomes active
7. WHEN Swift Slash ground pound lands, THE Combat_System SHALL activate a radial shockwave Hitbox around the landing point, and WHEN Seismic Strike activates, THE Combat_System SHALL activate a linear shockwave Hitbox that travels horizontally across the Arena floor

### Requirement 8: Cat Keeper Phase 2 Transition and Behavior

**User Story:** As a player, I want The Cat Keeper to transform into a frenzied, aggressive fighter at 40% health, so that the final stretch of the battle demands everything I have learned.

#### Acceptance Criteria

1. WHEN the Cat_Keeper health drops to 40% or below for the first time, THE Boss_AI SHALL transition to the PhaseTransition state, play the phase transition animation, and grant the Player_Character invulnerability for the full duration of the transition animation
2. WHILE the Cat_Keeper is in the PhaseTransition state, THE Cat_Keeper SHALL ignore all incoming damage until the transition animation completes and Phase 2 begins
3. WHILE in Phase 2, THE Cat_Keeper SHALL multiply attack speed by at least 1.3× compared to Phase 1 values, exposed as a configurable parameter
4. WHILE in Phase 2, THE Cat_Keeper SHALL multiply Recover state duration by no more than 0.5× compared to Phase 1 values, exposed as a configurable parameter
5. WHILE in Phase 2, THE Boss_AI SHALL allow chaining Swift Slash without entering Recover afterward
6. WHILE in Phase 2, THE Boss_AI SHALL allow performing Assault twice in immediate succession
7. WHILE in Phase 2, THE Cat_Keeper Seismic Strike SHALL produce shockwaves covering at least 1.5× the area of Phase 1 shockwaves, exposed as a configurable parameter
8. WHILE in Phase 2, THE Cat_Keeper SHALL multiply movement speed by at least 1.3× compared to Phase 1 values, exposed as a configurable parameter
9. WHILE in Phase 2, every Cat_Keeper attack SHALL maintain readable visual telegraphs with a minimum anticipation window of 8 animation frames

### Requirement 9: Combat Feedback System

**User Story:** As a player, I want to feel every hit I land and receive through screen shake, hit stop, and knockback, so that combat has satisfying weight and clarity.

#### Acceptance Criteria

1. WHEN the Player_Character Hitbox overlaps an enemy Hurtbox, THE Combat_System SHALL pause both the Player_Character and the target for a hit stop duration of 3 to 6 frames at 60 FPS, where the exact frame count is defined per attack in the attack data resource
2. WHEN the Player_Character Hitbox overlaps an enemy Hurtbox, THE Combat_System SHALL apply screen shake with a displacement between 2 and 8 pixels, scaled linearly relative to the damage dealt within the Player_Character's minimum and maximum damage range, lasting no longer than 0.3 seconds before returning to the neutral camera position
3. WHEN the Player_Character Hitbox overlaps an enemy Hurtbox, THE Combat_System SHALL apply knockback to the target in the direction the attack faces, displacing the target between 30 and 120 pixels as defined per attack in the attack data resource
4. WHEN any enemy Hitbox overlaps the Player_Character Hurtbox, THE Combat_System SHALL apply hit stop of 4 to 8 frames at 60 FPS, screen shake of 4 to 10 pixels displacement, and knockback of 50 to 150 pixels to the Player_Character in the direction the enemy attack faces, where exact values are defined per enemy attack in the attack data resource
5. THE Combat_System SHALL use frame-accurate collision detection using Area2D nodes with CollisionShape2D defined per animation frame via AnimationPlayer

### Requirement 10: Amulet System

**User Story:** As a player, I want to equip one amulet before combat that provides both an advantage and a disadvantage, so that I make meaningful strategic preparations for each attempt.

#### Acceptance Criteria

1. THE Amulet_System SHALL allow equipping exactly one amulet at a time from the available set: Photograph of Almohadita, Almohadita's Collar, Fish Plush
2. WHEN the Photograph of Almohadita is equipped, THE Amulet_System SHALL increase Player_Character attack damage by 25% and increase damage received by 25%
3. WHEN Almohadita's Collar is equipped, THE Amulet_System SHALL decrease Player_Character damage received by 20% and increase Tool_System cooldown duration by 30%
4. WHEN the Fish Plush is equipped, THE Amulet_System SHALL increase Player_Character maximum health by 30% and decrease Player_Character attack damage by 20%
5. WHILE the Player_Character is in active combat (inside the Arena with the Cat_Keeper alive), THE Amulet_System SHALL prevent amulet changes until the player returns to a checkpoint
6. THE Amulet_System SHALL persist the equipped amulet selection through the Save_Manager
7. WHEN no amulet is equipped, THE Amulet_System SHALL apply no modifiers and the Player_Character SHALL use base statistics

### Requirement 11: Tool System

**User Story:** As a player, I want to equip one tool with an independent cooldown that complements my branch attacks, so that I have tactical options without replacing core combat mastery.

#### Acceptance Criteria

1. THE Tool_System SHALL allow equipping exactly one tool at a time from the available set: Throwing Knife, Short Sword, Small Mace, Dreamcatcher
2. WHEN the player activates the Throwing Knife, THE Tool_System SHALL instantiate a projectile traveling in a straight horizontal line dealing 1.5× base branch damage with a cooldown of 4 seconds
3. WHEN the player activates the Short Sword, THE Tool_System SHALL execute a fast melee attack dealing 1.2× base branch damage with instant activation, short recovery, and a cooldown of 3 seconds
4. WHEN the player activates the Small Mace, THE Tool_System SHALL execute a high-damage melee attack dealing 2.5× base branch damage with slow startup (at least 12 frames) capable of interrupting specific Cat_Keeper attacks during their Recover state, with a cooldown of 8 seconds
5. WHEN the player activates the Dreamcatcher, THE Tool_System SHALL restore 10% of Player_Character maximum health with a cooldown of 12 seconds
6. WHEN a tool is activated, THE Tool_System SHALL start an independent cooldown timer preventing reuse until the cooldown expires
7. WHILE the tool cooldown is active, THE HUD SHALL display a radial cooldown indicator on the tool icon, and activation input SHALL be ignored
8. THE Tool_System SHALL persist the equipped tool selection through the Save_Manager

### Requirement 12: HUD Display

**User Story:** As a player, I want a minimal HUD that shows only essential combat information, so that I remain focused on the action without visual clutter.

#### Acceptance Criteria

1. THE HUD SHALL display the Player_Character health bar in the top-left corner as a rounded container with red fill and no numeric values
2. THE HUD SHALL display the equipped tool icon with a radial cooldown indicator below the health bar, showing the icon fully illuminated when the tool is available and desaturated when the tool is on cooldown
3. THE HUD SHALL display the equipped amulet icon beside the tool icon
4. WHEN the boss encounter intro sequence ends, THE HUD SHALL display the Cat_Keeper health bar at the top-center of the screen with the boss name label
5. THE HUD SHALL NOT display floating damage numbers at any time
6. WHEN the Player_Character or Cat_Keeper health decreases, THE HUD SHALL animate the health bar reduction smoothly over no more than 0.3 seconds
7. WHEN the Cat_Keeper reaches 40% remaining health and enters Phase 2, THE HUD SHALL apply a brief crack or color-shift effect to the boss health bar indicating the phase transition
8. WHEN the Cat_Keeper is defeated, THE HUD SHALL hide the boss health bar and boss name label within 1 second

### Requirement 13: Menu System

**User Story:** As a player, I want clear and responsive menus for the main menu, pause, death, and victory screens, so that I can navigate game options without frustration.

#### Acceptance Criteria

1. WHEN the game is launched or the player returns to the title screen, THE Game SHALL display a Main Menu with the following options: Continue, New Game, Settings, Credits, Exit
2. IF no save data exists, THEN THE Game SHALL display the Continue option as visually disabled and non-selectable
3. WHEN the player presses the pause input during gameplay, THE Game SHALL freeze all gameplay simulation within the same frame and display the Pause Menu with options: Resume, Amulets, Controls, Settings, Main Menu
4. WHEN the Player_Character enters the Death state, THE Game SHALL fade the gameplay scene, display a death screen with the message "Stand once more", and present the options: Retry, Main Menu
5. WHEN the Cat_Keeper health reaches zero, THE Game SHALL display a victory screen showing the defeated boss name, the reward obtained, and a Continue option
6. THE Game SHALL allow all menu options to be highlighted and selected using keyboard input or gamepad directional input and confirm/cancel buttons, with the currently highlighted option showing a visible selection indicator
7. WHEN any menu opens, THE Game SHALL complete the open transition and accept input within 100 milliseconds of the triggering input

### Requirement 14: Dialogue System

**User Story:** As a player, I want narrative delivery through a text dialogue system with character vocalizations, so that I receive story context without cinematic interruptions.

#### Acceptance Criteria

1. WHEN a dialogue trigger activates, THE Dialogue_System SHALL display a rounded dialogue window and render the dialogue text character-by-character at a rate between 30 and 50 characters per second
2. WHILE dialogue text is typing, THE Audio_Manager SHALL play expressive gibberish vocalizations that vary in pitch and rhythm per character, and SHALL stop vocalizations immediately when the text finishes typing or the dialogue window closes
3. WHEN the player presses the advance input while text is still typing, THE Dialogue_System SHALL complete the remaining text of the current line immediately
4. WHEN the player presses the advance input while the current line is fully displayed, THE Dialogue_System SHALL advance to the next dialogue line or close the dialogue window if no lines remain
5. WHILE a dialogue window is active, THE Dialogue_System SHALL restrict Player_Character movement and combat inputs until the dialogue window closes
6. WHEN all dialogue lines have been displayed and the player presses the advance input, THE Dialogue_System SHALL close the dialogue window and restore full movement and combat input to the Player_Character within 200 milliseconds
7. WHERE a dialogue entry includes a character portrait, THE Dialogue_System SHALL display the portrait adjacent to the dialogue text for the duration of that entry

### Requirement 15: Audio System

**User Story:** As a player, I want sound to serve as a gameplay mechanic where I can recognize attacks by audio cues and feel impact through sound design, so that audio enhances my combat awareness.

#### Acceptance Criteria

1. THE Audio_Manager SHALL route all audio through dedicated buses: Master, Music, SFX, UI, Ambience
2. WHEN the Cat_Keeper begins a special attack (Swift Slash, Assault, or Seismic Strike), THE Audio_Manager SHALL play a distinct audio telegraph at least 300 milliseconds before the attack's hitbox becomes active, with each special attack using a unique sound cue distinguishable from the others
3. WHEN the Cat_Keeper performs a special attack, THE Audio_Manager SHALL reduce the Music bus volume by at least 50% for a duration of 500 to 1000 milliseconds beginning at the telegraph, while SFX bus volume remains unchanged
4. WHILE in the Cat_Keeper Phase 1, THE Audio_Manager SHALL play music characterized by strings, brass, and timpani with a disciplined noble mood
5. WHEN the Cat_Keeper enters Phase 2, THE Audio_Manager SHALL crossfade from Phase 1 music to Phase 2 music over a duration of 1 to 3 seconds, where Phase 2 music is characterized by unstable harmony, intense percussion, and brief choir elements
6. THE Game SHALL use OGG format for music files and WAV format for sound effect files
7. THE Settings_Manager SHALL provide independent volume controls for each audio bus with a range of 0% to 100% in increments no larger than 10%, and persist settings between sessions

### Requirement 16: Checkpoint System

**User Story:** As a player, I want checkpoints that save my progress, restore my health, and allow equipment changes, so that I have safe preparation points between challenges.

#### Acceptance Criteria

1. WHEN the Player_Character enters a checkpoint trigger area and presses the interaction input, THE Checkpoint_System SHALL restore Player_Character health to maximum and display a visual confirmation of activation
2. WHEN the Player_Character activates a checkpoint, THE Save_Manager SHALL persist the following to a JSON file: current level, boss defeat states, unlocked amulets, unlocked tools, collectibles obtained, and player statistics
3. IF the Save_Manager fails to write the save file, THEN THE Save_Manager SHALL display an error message indicating the save failed and shall retain the previous valid save data
4. WHILE the Player_Character remains within the checkpoint interaction area, THE Amulet_System and Tool_System SHALL allow the player to change the equipped amulet and the equipped tool
5. WHEN the Player_Character exits the checkpoint area, THE Game SHALL respawn all non-boss enemies in the current level
6. WHEN a boss is defeated, THE Checkpoint_System SHALL record the defeat permanently in the save file so that the boss never respawns across sessions

### Requirement 17: Arena Design System

**User Story:** As a player, I want The Cat Keeper's arena to be a bounded combat space that prioritizes readability with environmental storytelling, so that I can focus on the fight while absorbing atmosphere.

#### Acceptance Criteria

1. THE Arena SHALL define boundaries using StaticBody2D collision shapes that prevent the Player_Character and Cat_Keeper from exiting the combat area on all sides, including floor, walls, and ceiling
2. THE Arena SHALL maintain a flat combat floor with no elevation changes, no interactive obstacles, and no collision shapes other than the boundary walls within the playable area
3. THE Arena SHALL render all background and environmental layers at a lower z-index than the Player_Character, Cat_Keeper, and all combat elements so that gameplay sprites are never occluded by environmental art
4. THE Arena SHALL include environmental animations using GPUParticles2D (such as dust particles, torch flickering, and wind effects) limited to a maximum of 3 simultaneous emitters with no more than 50 particles each, rendered behind gameplay elements
5. THE Arena SHALL include static environmental storytelling elements (such as broken weapons, old banners, and worn architecture) placed exclusively on non-interactive background layers that have no collision shapes and no effect on gameplay
6. THE Arena SHALL have a horizontal combat area width of at least 3 screen widths (5760 pixels at 1920x1080 reference resolution) to accommodate Cat_Keeper movement patterns including Assault charges and Seismic Strike shockwaves
7. WHILE the combat encounter is active, THE Arena SHALL maintain a stable frame rate of 60 FPS with all environmental animations and background layers enabled

### Requirement 18: Input System

**User Story:** As a player, I want full support for keyboard and Xbox/PlayStation controllers with remappable bindings, so that I can play comfortably with my preferred input device.

#### Acceptance Criteria

1. THE Input_Manager SHALL support keyboard and mouse input using Godot's Input Map system for all gameplay actions including: movement, attack, dodge, tool use, interact, and pause
2. THE Input_Manager SHALL support Xbox and PlayStation controller input using Godot's Input Map system, mapping all gameplay actions to standard gamepad buttons and analog sticks
3. THE Input_Manager SHALL allow rebinding of every gameplay action through the Settings menu, preventing duplicate bindings for the same input device and displaying a confirmation prompt before overwriting an existing binding
4. THE Input_Manager SHALL persist custom key bindings through the Save_Manager between sessions, restoring them on game launch
5. THE Input_Manager SHALL never poll raw keyboard keys directly, using only mapped actions defined in Godot's Input Map
6. WHEN a controller is connected or disconnected during gameplay, THE Input_Manager SHALL detect the change within 1 second and update all on-screen UI prompts to display icons matching the active input device
7. IF the player attempts to bind a key or button that is already assigned to another action on the same device, THEN THE Input_Manager SHALL display a warning indicating the conflict and require the player to confirm the reassignment or cancel

### Requirement 19: Save and Settings Persistence

**User Story:** As a player, I want my progress and preferences saved automatically and restored when I return, so that I never lose my progress or settings.

#### Acceptance Criteria

1. THE Save_Manager SHALL serialize game progress using JSON format including: current level, boss progression, unlocked amulets, unlocked tools, equipped loadout, player statistics, and game completion status
2. THE Save_Manager SHALL write save data to the user data directory using Godot's user:// path, creating the directory if it does not exist
3. THE Settings_Manager SHALL persist all user settings including: fullscreen mode, resolution, master volume, music volume, SFX volume, brightness, key bindings, controller bindings, and accessibility options
4. WHEN the Game launches, THE Save_Manager SHALL load existing save data from the user:// path and restore game state automatically within 2 seconds of reaching the main menu
5. IF save data is corrupted or missing, THEN THE Save_Manager SHALL create a new save file with default values without crashing and display a brief notification to the player indicating that a new save was created
6. WHEN the player reaches a checkpoint, THE Save_Manager SHALL automatically write all current progress to the save file and display a "Progress Saved" notification in the lower corner of the screen that fades after 2 seconds

### Requirement 20: Accessibility Features

**User Story:** As a player, I want accessibility options that improve readability without reducing game challenge, so that more players can experience the game comfortably.

#### Acceptance Criteria

1. THE Settings_Manager SHALL provide a camera shake toggle (on/off) and intensity slider ranging from 0% to 100% in increments of no more than 10%
2. THE Settings_Manager SHALL provide a hit flash intensity slider ranging from 0% to 100% in increments of no more than 10%
3. THE Settings_Manager SHALL provide a UI scale option with at least 3 size increments: 100% (default), 125%, and 150%
4. THE Settings_Manager SHALL provide subtitle text size options of Small, Medium (default), and Large, and an optional opaque subtitle background toggle
5. THE Settings_Manager SHALL provide full controller remapping independent of keyboard bindings, allowing each input device to maintain its own separate set of action mappings
6. WHEN any accessibility setting is changed, THE Game SHALL apply the change immediately without requiring a restart or scene reload

### Requirement 21: Technical Performance

**User Story:** As a player, I want the game to maintain stable performance at 60 FPS, so that combat timing and responsiveness remain consistent.

#### Acceptance Criteria

1. THE Game SHALL target 60 frames per second during all gameplay scenarios including boss encounters with particle effects active, with frame drops below 55 FPS occurring in no more than 1% of frames during any 10-second window
2. THE Game SHALL use CharacterBody2D for Player_Character and Cat_Keeper movement with physics processing via _physics_process
3. THE Game SHALL synchronize gameplay events (hitbox activation, hitbox deactivation, recovery start, sound cues) through AnimationPlayer signals rather than hardcoded timers
4. THE Game SHALL free unused scene instances when transitioning between scenes and avoid memory leaks by releasing references to nodes removed from the scene tree
5. THE Game SHALL be exportable as a Windows executable (.exe) using Godot's official export templates without requiring code modifications or external plugins

### Requirement 22: Stagger Mechanic

**User Story:** As a player, I want a rare stagger mechanic that briefly interrupts the boss under specific conditions, so that intelligent aggressive play receives meaningful reward.

#### Acceptance Criteria

1. WHEN the Player_Character lands 3 or more hits during a single Cat_Keeper Recover state window, THE Combat_System SHALL trigger a Stagger on the Cat_Keeper
2. WHILE the Cat_Keeper is in the Stagger state, THE Cat_Keeper SHALL pause all actions for 2 seconds, providing an extended Punish_Window during which the Player_Character may attack freely
3. THE Combat_System SHALL limit Stagger activation to a maximum of once per boss phase, resetting the Stagger allowance only when the Cat_Keeper transitions to a new phase
4. WHEN Stagger activates, THE Game SHALL provide distinct visual feedback (unique stagger animation on the Cat_Keeper) and a distinct audio cue that differs from normal hit sounds, indicating the successful Stagger

### Requirement 23: Scene and Game Flow Management

**User Story:** As a player, I want smooth transitions between the main menu, arena, checkpoints, and game states, so that the experience feels cohesive and polished.

#### Acceptance Criteria

1. THE Scene_Manager SHALL handle all scene transitions including: Main Menu to gameplay, gameplay to pause, gameplay to death screen, gameplay to victory screen, and death screen to retry
2. WHEN a scene transition occurs, THE Scene_Manager SHALL apply a fade transition effect with a duration between 200 and 500 milliseconds, completing both the fade-out and fade-in within that range
3. THE Game_Manager SHALL track global game state including: current scene identifier, current boss phase, player alive status, and pause state, exposing these as readable properties
4. WHEN the player selects Retry from the death screen, THE Scene_Manager SHALL reload the Arena scene and reset both the Player_Character and Cat_Keeper to their initial states (full health, Phase 1, starting positions) within 1 second of the player's selection
5. THE Game SHALL implement all global systems as autoload singletons registered in Project Settings: GameManager, AudioManager, SaveManager, SceneManager, SettingsManager, and InputManager
