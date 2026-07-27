class_name BossAttackState extends BossState
## Generic boss single-attack state (used for standalone attacks like counterattack).
## For combo sequences, use BossComboState instead.

var _animation_done: bool = false


func enter() -> void:
	_animation_done = false

	# Face the player.
	boss.update_facing(boss.get_player_direction())

	# Enable hitbox with current attack data.
	boss.hitbox_component.load_from_attack_resource(boss.current_attack)
	boss.hitbox_component.enable()

	# Play attack animation.
	var anim_name: String = str(boss.current_attack.animation_name)
	if anim_name.is_empty():
		anim_name = "attack"
	boss.animation_player.play(anim_name)

	if not boss.animation_player.animation_finished.is_connected(_on_anim_finished):
		boss.animation_player.animation_finished.connect(_on_anim_finished)


func exit() -> void:
	boss.hitbox_component.disable()
	if boss.animation_player.animation_finished.is_connected(_on_anim_finished):
		boss.animation_player.animation_finished.disconnect(_on_anim_finished)


func physics_process(_delta: float) -> void:
	if _animation_done:
		state_machine.transition_to(BossStateMachine.STATE_RECOVER)


func can_transition_to(target: StringName) -> bool:
	if target == BossStateMachine.STATE_DEATH:
		return true
	return _animation_done


func _on_anim_finished(_anim_name: StringName) -> void:
	_animation_done = true
	boss.hitbox_component.disable()
