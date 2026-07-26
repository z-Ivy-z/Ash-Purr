class_name IdleState extends State
## Player idle state. Awaits input to transition to Run, Attack, or Dodge.


func enter() -> void:
	player.stop_movement()


func physics_process(_delta: float) -> void:
	# Check for attack input first (higher priority).
	if Input.is_action_just_pressed("attack"):
		state_machine.transition_to(PlayerStateMachine.STATE_ATTACK)
		return

	# Check for dodge input.
	if Input.is_action_just_pressed("dodge"):
		state_machine.transition_to(PlayerStateMachine.STATE_DODGE)
		return

	# Check for horizontal movement input.
	var direction: float = Input.get_axis("move_left", "move_right")
	if direction != 0.0:
		state_machine.transition_to(PlayerStateMachine.STATE_RUN)
		return


func can_transition_to(_target: StringName) -> bool:
	# Idle allows transitions to any state.
	return true
