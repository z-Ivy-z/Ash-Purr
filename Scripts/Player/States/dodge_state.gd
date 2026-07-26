class_name DodgeState extends State
## Player dodge state. Grants I-Frames and moves the player a fixed distance.
## Blocks all transitions (except Death) until dodge animation completes.

## Dodge covers 150 pixels over approximately 6 physics frames at 60 FPS.
const DODGE_DISTANCE: float = 150.0
## Number of physics frames the dodge lasts (i-frames active for this duration).
const DODGE_FRAMES: int = 6
## Dodge speed calculated as distance / (frames * physics_step).
## At 60 FPS: 150 / (6 * 1/60) = 150 / 0.1 = 1500 px/s.
const DODGE_SPEED: float = DODGE_DISTANCE / (DODGE_FRAMES * (1.0 / 60.0))

## Set to true when dodge animation finishes.
var _animation_done: bool = false
## The direction of the dodge (1.0 or -1.0).
var _dodge_direction: float = 1.0
## Frame counter for tracking dodge duration.
var _frame_counter: int = 0


func enter() -> void:
	_animation_done = false
	_frame_counter = 0

	# Determine dodge direction: use current input, fallback to facing direction.
	var input_dir: float = Input.get_axis("move_left", "move_right")
	if input_dir != 0.0:
		_dodge_direction = signf(input_dir)
	else:
		_dodge_direction = player.get_facing_direction()

	# Enable invulnerability (I-Frames).
	player.hurtbox_component.set_invulnerable(true)

	# Play dodge animation.
	player.animation_player.play("dodge")

	# Connect animation_finished signal.
	if not player.animation_player.animation_finished.is_connected(_on_animation_finished):
		player.animation_player.animation_finished.connect(_on_animation_finished)


func exit() -> void:
	_animation_done = false

	# Ensure invulnerability is disabled on exit (safety net).
	player.hurtbox_component.set_invulnerable(false)

	# Stop dodge momentum.
	player.stop_movement()

	# Disconnect the signal.
	if player.animation_player.animation_finished.is_connected(_on_animation_finished):
		player.animation_player.animation_finished.disconnect(_on_animation_finished)


func physics_process(_delta: float) -> void:
	_frame_counter += 1

	# Apply dodge movement for the dodge duration.
	if _frame_counter <= DODGE_FRAMES:
		player.velocity.x = _dodge_direction * DODGE_SPEED
	else:
		player.velocity.x = 0.0

	# End I-Frames after dodge frames expire.
	if _frame_counter == DODGE_FRAMES + 1:
		player.hurtbox_component.set_invulnerable(false)

	# Once the animation finishes, transition to Idle.
	if _animation_done:
		state_machine.transition_to(PlayerStateMachine.STATE_IDLE)


func can_transition_to(target: StringName) -> bool:
	# Dodge blocks all transitions until animation completes.
	if not _animation_done:
		# Only allow Death (death override always goes through).
		if target == PlayerStateMachine.STATE_DEATH:
			return true
		return false
	return true


## Called when the AnimationPlayer finishes the dodge animation.
func _on_animation_finished(_anim_name: StringName) -> void:
	_animation_done = true
