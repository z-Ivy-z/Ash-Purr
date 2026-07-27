class_name BossPhaseTransitionState extends BossState
## Boss phase transition state. Plays transition animation.
## Boss ignores all damage during transition.
## Player is granted invulnerability for the full duration.

var _animation_done: bool = false


func enter() -> void:
	_animation_done = false

	# Boss ignores damage during transition.
	boss.health_component.set_invulnerable(true)

	# Grant player invulnerability.
	var player_node: Node = _find_player()
	if player_node:
		var player_health: HealthComponent = _find_component(player_node)
		if player_health:
			player_health.set_invulnerable(true)

	# Play transition animation.
	boss.animation_player.play("phase_transition")

	if not boss.animation_player.animation_finished.is_connected(_on_anim_finished):
		boss.animation_player.animation_finished.connect(_on_anim_finished)


func exit() -> void:
	# Re-enable boss damage reception.
	boss.health_component.set_invulnerable(false)

	# Remove player invulnerability.
	var player_node: Node = _find_player()
	if player_node:
		var player_health: HealthComponent = _find_component(player_node)
		if player_health:
			player_health.set_invulnerable(false)

	if boss.animation_player.animation_finished.is_connected(_on_anim_finished):
		boss.animation_player.animation_finished.disconnect(_on_anim_finished)


func can_transition_to(target: StringName) -> bool:
	# Only allow transition when animation is done.
	if not _animation_done:
		if target == BossStateMachine.STATE_DEATH:
			return true
		return false
	return true


func _on_anim_finished(_anim_name: StringName) -> void:
	_animation_done = true

	# Apply Phase 2 configuration.
	boss.phase_controller.apply_phase_2()

	# Update GameManager.
	GameManager.current_boss_phase = 2

	# Transition to idle to resume AI.
	state_machine.transition_to(BossStateMachine.STATE_IDLE)


func _find_player() -> Node:
	var players := boss.get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		return players[0]
	return null


func _find_component(entity: Node) -> HealthComponent:
	for child in entity.get_children():
		if child is HealthComponent:
			return child as HealthComponent
	return null
