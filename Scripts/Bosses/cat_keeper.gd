class_name CatKeeper extends CharacterBody2D
## Main Cat Keeper boss script. Attached to the CharacterBody2D root.
## Manages references to components, player tracking, and facing direction.

## Emitted when the boss is defeated (listened to by game flow systems).
signal boss_defeated()
## Emitted when a special attack telegraph begins (for audio system).
signal special_attack_telegraphed(attack_type: int)

## References to child components (set via @onready).
@onready var state_machine: BossStateMachine = $BossStateMachine
@onready var health_component: HealthComponent = $HealthComponent
@onready var hurtbox_component: HurtboxComponent = $HurtboxComponent
@onready var hitbox_component: HitboxComponent = $HitboxComponent
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var phase_controller: PhaseController = $PhaseController
@onready var attack_selector: AttackSelector = $AttackSelector
@onready var stagger_controller: StaggerController = $StaggerController
@onready var sprite: Sprite2D = $Sprite2D

## The currently selected attack resource (set by IdleState before transitioning).
var current_attack: AttackResource = null

## Reference to the player node in the scene (found on ready).
var _player: Node2D = null

## Tracks the direction the boss is currently facing. 1.0 = right, -1.0 = left.
var _facing_direction: float = -1.0  # Bosses typically start facing left (toward player).


func _ready() -> void:
	# Find the player in the scene tree.
	_player = _find_player()

	# Connect health signals.
	health_component.died.connect(_on_died)

	# Connect phase controller for phase transition trigger.
	health_component.health_changed.connect(_on_health_changed)

	# Connect stagger controller.
	stagger_controller.stagger_triggered.connect(_on_stagger_triggered)

	# Add to boss group for easy lookup.
	add_to_group("boss")


func _physics_process(delta: float) -> void:
	# Apply gravity.
	if not is_on_floor():
		velocity.y += 980.0 * delta
	move_and_slide()


## Returns the signed distance to the player (positive = player to the right).
func get_player_distance() -> float:
	if _player == null:
		_player = _find_player()
	if _player == null:
		return 999.0
	return absf(_player.global_position.x - global_position.x)


## Returns the direction toward the player (1.0 = right, -1.0 = left).
func get_player_direction() -> float:
	if _player == null:
		_player = _find_player()
	if _player == null:
		return _facing_direction
	return signf(_player.global_position.x - global_position.x)


## Returns the current facing direction (1.0 right, -1.0 left).
func get_facing_direction() -> float:
	return _facing_direction


## Updates the sprite facing direction.
func update_facing(direction: float) -> void:
	if direction > 0.0:
		_facing_direction = 1.0
		sprite.flip_h = false
	elif direction < 0.0:
		_facing_direction = -1.0
		sprite.flip_h = true


## Called when boss health reaches zero.
func _on_died() -> void:
	state_machine.transition_to(BossStateMachine.STATE_DEATH)


## Called on health change to check for phase transition threshold (40%).
func _on_health_changed(current: int, max_hp: int) -> void:
	if phase_controller.current_phase == 1:
		var health_ratio: float = float(current) / float(max_hp)
		if health_ratio <= 0.4:
			phase_controller.trigger_phase_transition()
			state_machine.transition_to(BossStateMachine.STATE_PHASE_TRANSITION)


## Called when stagger is triggered by the StaggerController.
func _on_stagger_triggered() -> void:
	# Force transition to recover (stagger acts as extended recovery).
	state_machine.transition_to(BossStateMachine.STATE_RECOVER)


## Finds the player node in the scene tree.
func _find_player() -> Node2D:
	var players := get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		return players[0] as Node2D
	return null
