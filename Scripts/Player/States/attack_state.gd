class_name AttackState extends State
## Player attack state. Blocks transitions to Run/Idle until animation completes.
## Manages the combo flow by calling ComboController on entry and handling
## the combo window for chaining.

## Set to true by AnimationPlayer's "animation_finished" signal.
var _animation_done: bool = false
## Tracks whether we are waiting in the combo window for additional input.
var _waiting_for_combo: bool = false


func enter() -> void:
	_animation_done = false
	_waiting_for_combo = false

	# Zero horizontal velocity during attack.
	player.stop_movement()

	# Advance the combo. If it fails (e.g., window expired), go to Recovery.
	var combo: ComboController = player.combo_controller
	var success: bool = combo.advance_combo()
	if not success:
		# Combo chain failed — transition to Recovery immediately.
		state_machine.transition_to(PlayerStateMachine.STATE_RECOVERY)
		return

	# Play the attack animation for the current combo step.
	var anim_name: String = _get_attack_animation(combo.current_combo_step)
	player.animation_player.play(anim_name)

	# Connect animation_finished to know when the attack animation ends.
	if not player.animation_player.animation_finished.is_connected(_on_animation_finished):
		player.animation_player.animation_finished.connect(_on_animation_finished)


func exit() -> void:
	_animation_done = false
	_waiting_for_combo = false

	# Disconnect the signal to avoid stale connections.
	if player.animation_player.animation_finished.is_connected(_on_animation_finished):
		player.animation_player.animation_finished.disconnect(_on_animation_finished)


func physics_process(_delta: float) -> void:
	# While waiting in the combo window, check for additional attack input.
	if _waiting_for_combo:
		if Input.is_action_just_pressed("attack"):
			# Player pressed attack during combo window — chain next hit.
			_waiting_for_combo = false
			state_machine.transition_to(PlayerStateMachine.STATE_ATTACK)
			return

		# If the combo window expired (ComboController auto-closes it),
		# transition to Recovery.
		if not player.combo_controller.is_in_combo_window:
			_waiting_for_combo = false
			state_machine.transition_to(PlayerStateMachine.STATE_RECOVERY)
			return

	# If animation finished and we're not in combo window, go to Recovery.
	if _animation_done and not _waiting_for_combo:
		if player.combo_controller.is_in_combo_window:
			_waiting_for_combo = true
		else:
			state_machine.transition_to(PlayerStateMachine.STATE_RECOVERY)


func can_transition_to(target: StringName) -> bool:
	# Attack blocks transitions to Run and Idle until animation completes.
	if not _animation_done:
		match target:
			PlayerStateMachine.STATE_RUN, PlayerStateMachine.STATE_IDLE:
				return false
	# Always allow transitions to Hit, Death, Recovery, and Attack (combo chain).
	return true


## Called when the AnimationPlayer finishes the current attack animation.
func _on_animation_finished(_anim_name: StringName) -> void:
	_animation_done = true


## Returns the animation name for the given combo step (1, 2, or 3).
func _get_attack_animation(combo_step: int) -> String:
	match combo_step:
		1:
			return "attack_1"
		2:
			return "attack_2"
		3:
			return "attack_3"
		_:
			return "attack_1"
