class_name BossRecoverState extends BossState
## Boss recovery state after an attack. Provides a punish window for the player.
## Duration is 1.0-1.8 seconds (scaled by phase multiplier and combo type).
## Has a 3-second maximum timeout to prevent permanent locks.

## Base recover duration range (seconds).
const BASE_RECOVER_MIN: float = 1.0
const BASE_RECOVER_MAX: float = 1.8
## Maximum absolute duration (safety timeout).
const MAX_RECOVER_TIMEOUT: float = 3.0

## Emitted when recovery finishes naturally.
signal recover_finished()

## The actual recover duration for this instance (set on enter).
var _recover_duration: float = 0.0
var _recover_timer: float = 0.0
## Multiplier for advanced combo (1.5× longer recovery).
var advanced_combo_multiplier: float = 1.0


func enter() -> void:
	if not boss:
		return
	_recover_timer = 0.0

	# Calculate recover duration with phase multiplier.
	var base_duration: float = randf_range(BASE_RECOVER_MIN, BASE_RECOVER_MAX)
	var phase_multiplier: float = boss.phase_controller.get_recover_multiplier()
	_recover_duration = base_duration * phase_multiplier * advanced_combo_multiplier
	_recover_duration = minf(_recover_duration, MAX_RECOVER_TIMEOUT)

	# Reset the advanced combo multiplier for next use.
	advanced_combo_multiplier = 1.0

	# Play recover animation.
	boss.animation_player.play("recover")

	# Notify stagger controller that we entered recovery.
	boss.stagger_controller.on_recover_entered()


func exit() -> void:
	# Notify stagger controller that we left recovery.
	boss.stagger_controller.on_recover_exited()
	recover_finished.emit()


func physics_process(delta: float) -> void:
	_recover_timer += delta

	if _recover_timer >= _recover_duration:
		state_machine.transition_to(BossStateMachine.STATE_IDLE)


func can_transition_to(target: StringName) -> bool:
	# Recovery allows all transitions (stagger can interrupt, death always allowed).
	return true


## Returns the current recover duration for external queries (e.g., stagger controller).
func get_recover_duration() -> float:
	return _recover_duration
