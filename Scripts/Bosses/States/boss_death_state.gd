class_name BossDeathState extends BossState
## Boss death state. Entered when health reaches zero.
## Plays death animation, disables all AI, emits defeat signal.

## Emitted when the death animation finishes.
signal death_animation_finished()


func enter() -> void:
	if not boss:
		return
	# Disable AI processing.
	state_machine.disable_ai()

	# Zero velocity.
	boss.velocity.x = 0.0

	# Disable hitbox.
	boss.hitbox_component.disable()

	# Play death animation.
	boss.animation_player.play("death")

	if not boss.animation_player.animation_finished.is_connected(_on_anim_finished):
		boss.animation_player.animation_finished.connect(_on_anim_finished)


func exit() -> void:
	if boss.animation_player.animation_finished.is_connected(_on_anim_finished):
		boss.animation_player.animation_finished.disconnect(_on_anim_finished)


func can_transition_to(_target: StringName) -> bool:
	# Death is a terminal state.
	return false


func _on_anim_finished(_anim_name: StringName) -> void:
	death_animation_finished.emit()
	boss.boss_defeated.emit()
	GameManager.boss_defeated.emit(&"cat_keeper")
