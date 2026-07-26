## GameManager Autoload Singleton
## Tracks global game state including current scene, boss phase, player status, and pause state.
## Requirement 23.3: Exposes readable state properties.
## Requirement 23.5: Registered as an autoload singleton.
extends Node

# --- Signals ---

## Emitted when any tracked game state property changes.
signal game_state_changed(property: StringName, value: Variant)

## Emitted when a boss is defeated.
signal boss_defeated(boss_id: StringName)

# --- State Properties ---

## Identifier for the currently active scene.
var current_scene_id: StringName = &"":
	set(value):
		if current_scene_id != value:
			current_scene_id = value
			game_state_changed.emit(&"current_scene_id", value)

## The current phase of the boss encounter (0 = no encounter, 1 = Phase 1, 2 = Phase 2).
var current_boss_phase: int = 0:
	set(value):
		if current_boss_phase != value:
			current_boss_phase = value
			game_state_changed.emit(&"current_boss_phase", value)

## Whether the player character is currently alive.
var is_player_alive: bool = true:
	set(value):
		if is_player_alive != value:
			is_player_alive = value
			game_state_changed.emit(&"is_player_alive", value)

## Whether the game is currently paused.
var is_paused: bool = false:
	set(value):
		if is_paused != value:
			is_paused = value
			get_tree().paused = value
			game_state_changed.emit(&"is_paused", value)


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS


## Resets all game state to initial values (used on retry / new game).
func reset_state() -> void:
	current_scene_id = &""
	current_boss_phase = 0
	is_player_alive = true
	is_paused = false
