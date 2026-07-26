class_name RunState extends State
## Player run state. Active while horizontal input is held.
## Applies movement velocity each physics frame.


func enter() -> void:
	# Apply initial movement on the frame we enter.
	var direction: float = Input.get_axis("move_left", "move_right")
	player.apply_movement(direction)


func physics_process(_delta: float) -> void:
	# Check for attack input first (higher priority).
	if Input.is_action_just_pressed("attack"):
		state_machine.transition_to(PlayerStateMachine.STATE_ATTACK)
		return

	# Check for dodge input.
	if Input.is_action_just_pressed("dodge"):
		state_machine.transition_to(PlayerStateMachine.STATE_DODGE)
		return

	# Apply movement. If no input, transition back to Idle.
	var direction: float = Input.get_axis("move_left", "move_right")
	if direction == 0.0:
		state_machine.transition_to(PlayerStateMachine.STATE_IDLE)
		return

	player.apply_movement(direction)


func can_transition_to(_target: StringName) -> bool:
	# Run allows transitions to any state.
	return true
