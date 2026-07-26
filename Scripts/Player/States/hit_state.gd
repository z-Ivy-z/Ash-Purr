class_name HitState extends State
## Player hit state. Entered on damage received.
## Cancels active combo, zeros velocity, plays hit-reaction animation.
## Blocks most transitions until hit-reaction animation completes.

## Set to true when hit-reaction animation finishes.
var _animation_done: bool = false


func enter() -> void:
	_animation_done = false

	# Cancel any active combo.
	player.combo_controller.reset_combo()

	# Zero horizontal velocity.
	player.stop_movement()

	# Play hit-reaction animation.
	player.animation_player.play("hit")

	# Connect animation_finished signal.
	if not player.animation_player.animation_finished.is_connected(_on_animation_finished):
		player.animation_player.animation_finished.connect(_on_animation_finished)


func exit() -> void:
	_animation_done = false

	# Disconnect the signal.
	if player.animation_player.animation_finished.is_connected(_on_animation_finished):
		player.animation_player.animation_finished.disconnect(_on_animation_finished)


func physics_process(_delta: float) -> void:
	# Wait for animation to finish, then transition to Idle.
	if _animation_done:
		state_machine.transition_to(PlayerStateMachine.STATE_IDLE)


func can_transition_to(target: StringName) -> bool:
	# Hit blocks all transitions until animation completes,
	# except Death (which always takes priority).
	if not _animation_done:
		if target == PlayerStateMachine.STATE_DEATH:
			return true
		return false
	return true


## Called when the AnimationPlayer finishes the hit-reaction animation.
func _on_animation_finished(_anim_name: StringName) -> void:
	_animation_done = true
