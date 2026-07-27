class_name BossSpecialAttackState extends BossState
## Boss special attack state handling Swift Slash, Assault, and Seismic Strike.
## Each has unique telegraphs (>= 12 frames P1, >= 8 frames P2) before hitbox.

const SHOCKWAVE_SCENE_PATH: String = "res://Scenes/Effects/Shockwave.tscn"

## Swift Slash landing randomization range (frames after peak).
const SWIFT_SLASH_LANDING_MIN: int = 6
const SWIFT_SLASH_LANDING_MAX: int = 18
## Assault charge speed multiplier relative to walk speed.
const ASSAULT_SPEED_MULTIPLIER: float = 3.0

enum SpecialType { SWIFT_SLASH, ASSAULT, SEISMIC_STRIKE }

var _special_type: SpecialType = SpecialType.SWIFT_SLASH
var _phase: int = 0  # 0=telegraph, 1=execute, 2=follow_up
var _frame_counter: int = 0
var _telegraph_duration: int = 12
var _animation_done: bool = false
var _charge_direction: float = 0.0
var _charge_distance: float = 0.0
var _charge_traveled: float = 0.0


func enter() -> void:
	if not boss:
		return
	_phase = 0
	_frame_counter = 0
	_animation_done = false
	_charge_traveled = 0.0

	# Determine special type from attack name.
	var attack_name: String = str(boss.current_attack.attack_name)
	if attack_name.contains("swift"):
		_special_type = SpecialType.SWIFT_SLASH
	elif attack_name.contains("assault"):
		_special_type = SpecialType.ASSAULT
	else:
		_special_type = SpecialType.SEISMIC_STRIKE

	# Set telegraph duration based on phase.
	_telegraph_duration = boss.phase_controller.get_min_telegraph_frames()

	# Start telegraph phase.
	_start_telegraph()


func exit() -> void:
	boss.hitbox_component.disable()
	boss.velocity.x = 0.0
	if boss.animation_player.animation_finished.is_connected(_on_animation_finished):
		boss.animation_player.animation_finished.disconnect(_on_animation_finished)


func physics_process(_delta: float) -> void:
	match _phase:
		0:
			_process_telegraph()
		1:
			_process_execute()
		2:
			_process_follow_up()


func can_transition_to(target: StringName) -> bool:
	if target == BossStateMachine.STATE_DEATH:
		return true
	if target == BossStateMachine.STATE_RECOVER:
		return true
	return _animation_done


func _start_telegraph() -> void:
	# Face the player.
	boss.update_facing(boss.get_player_direction())

	match _special_type:
		SpecialType.SWIFT_SLASH:
			boss.animation_player.play("telegraph_swift_slash")
		SpecialType.ASSAULT:
			boss.animation_player.play("telegraph_assault")
			_charge_direction = boss.get_player_direction()
			# Charge distance = player distance clamped to reasonable range.
			_charge_distance = clampf(boss.get_player_distance(), 100.0, 500.0)
		SpecialType.SEISMIC_STRIKE:
			boss.animation_player.play("telegraph_seismic_strike")

	# Emit audio telegraph signal (AudioManager listens for this).
	boss.special_attack_telegraphed.emit(_special_type)


func _process_telegraph() -> void:
	_frame_counter += 1
	if _frame_counter >= _telegraph_duration:
		_phase = 1
		_frame_counter = 0
		_start_execution()


func _start_execution() -> void:
	if not boss.animation_player.animation_finished.is_connected(_on_animation_finished):
		boss.animation_player.animation_finished.connect(_on_animation_finished)

	match _special_type:
		SpecialType.SWIFT_SLASH:
			_execute_swift_slash()
		SpecialType.ASSAULT:
			_execute_assault()
		SpecialType.SEISMIC_STRIKE:
			_execute_seismic_strike()


func _execute_swift_slash() -> void:
	# Rising slash + ground pound with shockwave.
	boss.animation_player.play("swift_slash")
	boss.hitbox_component.load_from_attack_resource(boss.current_attack)
	boss.hitbox_component.enable()


func _execute_assault() -> void:
	# Charge at 3x walk speed toward player.
	var charge_speed: float = BossWalkState.BASE_WALK_SPEED * ASSAULT_SPEED_MULTIPLIER
	charge_speed *= boss.phase_controller.get_movement_multiplier()
	boss.velocity.x = _charge_direction * charge_speed
	boss.animation_player.play("assault")
	boss.hitbox_component.load_from_attack_resource(boss.current_attack)
	boss.hitbox_component.enable()


func _execute_seismic_strike() -> void:
	# Sword into ground, spawns shockwave.
	boss.animation_player.play("seismic_strike")
	boss.hitbox_component.load_from_attack_resource(boss.current_attack)
	boss.hitbox_component.enable()


func _process_execute() -> void:
	match _special_type:
		SpecialType.ASSAULT:
			# Track charge distance traveled.
			_charge_traveled += absf(boss.velocity.x) * get_physics_process_delta_time()
			if _charge_traveled >= _charge_distance:
				boss.velocity.x = 0.0
				boss.hitbox_component.disable()
				_on_attack_finished()
		SpecialType.SWIFT_SLASH:
			# Randomized landing timing handled by animation length.
			pass
		SpecialType.SEISMIC_STRIKE:
			pass


func _process_follow_up() -> void:
	_frame_counter += 1
	# Seismic Strike follow-up: if player stays within dodge-distance for 0.5s, chain.
	if _special_type == SpecialType.SEISMIC_STRIKE:
		if _frame_counter >= 30:  # 0.5s at 60fps
			var dist: float = boss.get_player_distance()
			if dist < 150.0:
				# Player stayed close — chain next attack.
				state_machine.transition_to(BossStateMachine.STATE_IDLE)
				return
			state_machine.transition_to(BossStateMachine.STATE_RECOVER)
			return
	else:
		state_machine.transition_to(BossStateMachine.STATE_RECOVER)


func _on_attack_finished() -> void:
	_animation_done = true
	boss.hitbox_component.disable()
	boss.velocity.x = 0.0

	# Check for Phase 2 chaining rules.
	var config: BossPhaseConfig = boss.phase_controller.current_config
	if _special_type == SpecialType.SWIFT_SLASH and config.can_chain_swift_slash:
		# Chain without recover in Phase 2.
		state_machine.transition_to(BossStateMachine.STATE_IDLE)
		return

	if _special_type == SpecialType.ASSAULT and config.can_double_assault:
		# Allow double assault in Phase 2 (handled by attack selector).
		pass

	# Seismic strike has follow-up check.
	if _special_type == SpecialType.SEISMIC_STRIKE:
		_phase = 2
		_frame_counter = 0
		_spawn_shockwave()
		return

	state_machine.transition_to(BossStateMachine.STATE_RECOVER)


func _on_animation_finished(_anim_name: StringName) -> void:
	if _phase == 1:
		_on_attack_finished()


func _spawn_shockwave() -> void:
	# Instantiate shockwave projectile.
	var scene: PackedScene = load(SHOCKWAVE_SCENE_PATH) as PackedScene
	if scene == null:
		return

	var shockwave: Node2D = scene.instantiate() as Node2D
	boss.get_parent().add_child(shockwave)
	shockwave.global_position = boss.global_position
	shockwave.global_position.y = boss.global_position.y

	# Set direction toward player.
	var direction: float = boss.get_player_direction()
	if shockwave.has_method("set_direction"):
		shockwave.set_direction(Vector2(direction, 0.0))
	else:
		shockwave.scale.x = direction
