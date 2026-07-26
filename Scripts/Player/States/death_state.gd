class_name DeathState extends State
## Player death state. Entered when health reaches zero.
## Disables all input processing, plays death animation, and emits signal
## for the death screen system. This is a terminal state — no transitions out.

## Emitted when death animation finishes — the death screen can listen for this.
signal death_animation_finished()


func enter() -> void:
	# Zero horizontal velocity.
	player.stop_movement()

	# Disable all input/physics processing on the player to prevent any further actions.
	player.set_physics_process(false)
	player.set_process_input(false)

	# Cancel any active combo.
	player.combo_controller.reset_combo()

	# Play death animation.
	player.animation_player.play("death")

	# Connect animation_finished to emit the death screen signal.
	if not player.animation_player.animation_finished.is_connected(_on_animation_finished):
		player.animation_player.animation_finished.connect(_on_animation_finished)


func exit() -> void:
	# Disconnect the signal (only relevant if the state is force-exited on reset).
	if player.animation_player.animation_finished.is_connected(_on_animation_finished):
		player.animation_player.animation_finished.disconnect(_on_animation_finished)


func can_transition_to(_target: StringName) -> bool:
	# Death is a terminal state — no transitions allowed.
	return false


## Called when the death animation finishes.
func _on_animation_finished(_anim_name: StringName) -> void:
	death_animation_finished.emit()
