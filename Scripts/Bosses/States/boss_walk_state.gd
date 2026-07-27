class_name BossWalkState extends BossState
## Boss walk state. Seeks preferred distance from the player (3-5 character widths).
## Walk speed is 30-50% of player speed, scaled by phase multiplier.

## Base walk speed (30-50% of player's 300 px/s).
const BASE_WALK_SPEED: float = 120.0  # ~40% of player speed
## Preferred minimum distance in pixels (3 character widths ≈ 3 × 32 = 96).
const PREFERRED_MIN_DISTANCE: float = 96.0
## Preferred maximum distance in pixels (5 character widths ≈ 5 × 32 = 160).
const PREFERRED_MAX_DISTANCE: float = 160.0
## Maximum walk duration before re-evaluating (prevents getting stuck).
const MAX_WALK_DURATION: float = 2.0

var _walk_timer: float = 0.0


func enter() -> void:
	_walk_timer = 0.0
	boss.animation_player.play("walk")


func exit() -> void:
	boss.velocity.x = 0.0


func physics_process(delta: float) -> void:
	_walk_timer += delta

	var player_distance: float = boss.get_player_distance()
	var player_direction: float = boss.get_player_direction()

	# Check if in preferred range — if so, transition to Idle to decide next action.
	if player_distance >= PREFERRED_MIN_DISTANCE and player_distance <= PREFERRED_MAX_DISTANCE:
		state_machine.transition_to(BossStateMachine.STATE_IDLE)
		return

	# Walk toward/away from player to reach preferred range.
	var walk_speed: float = BASE_WALK_SPEED * boss.phase_controller.get_movement_multiplier()

	if player_distance < PREFERRED_MIN_DISTANCE:
		# Too close — walk away from player.
		boss.velocity.x = -player_direction * walk_speed
	else:
		# Too far — walk toward player.
		boss.velocity.x = player_direction * walk_speed

	# Update facing direction.
	boss.update_facing(player_direction)

	# Timeout: re-evaluate after MAX_WALK_DURATION.
	if _walk_timer >= MAX_WALK_DURATION:
		state_machine.transition_to(BossStateMachine.STATE_IDLE)
