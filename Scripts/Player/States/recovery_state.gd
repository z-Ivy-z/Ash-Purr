class_name RecoveryState extends State
## Player recovery state after an attack. Blocks Attack until recovery completes.
## Allows Dodge and Run transitions during recovery for responsiveness.

## Set to true when recovery animation finishes.
var _animation_done: bool = false


func enter() -> void:
	if not player:
		return
	_animation_done = false

	# Zero horizontal velocity during recovery.
	player.stop_movement()

	# Play the recovery animation (blends back to idle pose).
	player.animation_player.play("recovery")

	# Connect animation_finished signal.
	if not player.animation_player.animation_finished.is_connected(_on_animation_finished):
		player.animation_player.animation_finished.connect(_on_animation_finished)


func exit() -> void:
	_animation_done = false

	# Disconnect the signal.
	if player.animation_player.animation_finished.is_connected(_on_animation_finished):
		player.animation_player.animation_finished.disconnect(_on_animation_finished)


func physics_process(_delta: float) -> void:
	# Allow dodge during recovery (escape option).
	if Input.is_action_just_pressed("dodge"):
		state_machine.transition_to(PlayerStateMachine.STATE_DODGE)
		return

	# Allow run during recovery (cancel recovery with movement).
	var direction: float = Input.get_axis("move_left", "move_right")
	if direction != 0.0:
		state_machine.transition_to(PlayerStateMachine.STATE_RUN)
		return

	# If animation finished, transition to Idle.
	if _animation_done:
		state_machine.transition_to(PlayerStateMachine.STATE_IDLE)
		return


func can_transition_to(target: StringName) -> bool:
	# Recovery blocks Attack until animation completes.
	if not _animation_done:
		if target == PlayerStateMachine.STATE_ATTACK:
			return false
	# Always allow Dodge, Run, Hit, Death transitions.
	return true


## Called when the AnimationPlayer finishes the recovery animation.
func _on_animation_finished(_anim_name: StringName) -> void:
	_animation_done = true
