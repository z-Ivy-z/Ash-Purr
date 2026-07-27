class_name BossIdleState extends BossState
## Boss idle state. Waits briefly then decides next action based on player distance.
## Transitions to Walk if too far/close, or to Combo/SpecialAttack if in range.

## Minimum time to idle before making a decision (seconds).
const MIN_IDLE_TIME: float = 0.3
## Maximum time to idle before making a decision (seconds).
const MAX_IDLE_TIME: float = 0.8

var _idle_timer: float = 0.0
var _idle_duration: float = 0.0


func enter() -> void:
	_idle_duration = randf_range(MIN_IDLE_TIME, MAX_IDLE_TIME)
	_idle_timer = 0.0

	# Play idle animation.
	boss.animation_player.play("idle")


func physics_process(delta: float) -> void:
	_idle_timer += delta

	if _idle_timer >= _idle_duration:
		_decide_next_action()


func _decide_next_action() -> void:
	var player_distance: float = boss.get_player_distance()

	# Use attack selector to pick next attack.
	var attack: AttackResource = boss.attack_selector.select_next_attack(player_distance)

	if attack == null:
		# No valid attack — walk toward preferred range.
		state_machine.transition_to(BossStateMachine.STATE_WALK)
		return

	# Determine if this is a combo or special attack.
	var attack_name: String = str(attack.attack_name)
	if attack_name.begins_with("boss_basic") or attack_name.begins_with("boss_advanced"):
		boss.current_attack = attack
		state_machine.transition_to(BossStateMachine.STATE_COMBO)
	else:
		boss.current_attack = attack
		state_machine.transition_to(BossStateMachine.STATE_SPECIAL_ATTACK)
