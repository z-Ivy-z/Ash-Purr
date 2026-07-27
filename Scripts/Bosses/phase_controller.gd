class_name PhaseController extends Node
## Manages boss phase transitions and provides multiplier queries.
## Phase 1 uses baseline (1.0×) values. Phase 2 escalates at health <= 40%.

## Emitted when the boss transitions to Phase 2.
signal phase_changed(new_phase: int)

## Current phase (1 or 2).
var current_phase: int = 1

## The active phase configuration resource.
var current_config: BossPhaseConfig = null

## Phase config resources (exported for scene assignment).
@export var phase_1_config: BossPhaseConfig
@export var phase_2_config: BossPhaseConfig


func _ready() -> void:
	current_config = phase_1_config
	current_phase = 1


## Triggers the phase transition. Called by CatKeeper when HP <= 40%.
func trigger_phase_transition() -> void:
	if current_phase == 2:
		return
	current_phase = 2
	phase_changed.emit(2)


## Applies Phase 2 configuration (called after transition animation completes).
func apply_phase_2() -> void:
	current_config = phase_2_config


## Returns the attack speed multiplier for the current phase.
func get_attack_speed_multiplier() -> float:
	if current_config:
		return current_config.attack_speed_multiplier
	return 1.0


## Returns the recover duration multiplier for the current phase.
func get_recover_multiplier() -> float:
	if current_config:
		return current_config.recover_duration_multiplier
	return 1.0


## Returns the movement speed multiplier for the current phase.
func get_movement_multiplier() -> float:
	if current_config:
		return current_config.movement_speed_multiplier
	return 1.0


## Returns the shockwave area multiplier for the current phase.
func get_shockwave_multiplier() -> float:
	if current_config:
		return current_config.shockwave_area_multiplier
	return 1.0


## Returns the minimum telegraph frames for the current phase.
func get_min_telegraph_frames() -> int:
	if current_config:
		return current_config.min_telegraph_frames
	return 12


## Resets to Phase 1 (used on boss retry/reset).
func reset() -> void:
	current_phase = 1
	current_config = phase_1_config
