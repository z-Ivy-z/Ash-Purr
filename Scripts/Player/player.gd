class_name Player extends CharacterBody2D
## Main player script attached to the CharacterBody2D root.
## Manages movement, sprite flipping, and wires signals from components to the state machine.

## Emitted when the player dies — used by death screen system.
signal player_died()

## Movement speed in pixels per second.
const SPEED: float = 300.0

## References to child components (set via @onready).
@onready var state_machine: PlayerStateMachine = $PlayerStateMachine
@onready var health_component: HealthComponent = $HealthComponent
@onready var hurtbox_component: HurtboxComponent = $HurtboxComponent
@onready var hitbox_component: HitboxComponent = $HitboxComponent
@onready var combo_controller: ComboController = $ComboController
@onready var tool_controller: ToolController = $ToolController
@onready var amulet_controller: AmuletController = $AmuletController
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var sprite: Sprite2D = $Sprite2D

## Tracks the direction the player is currently facing. 1.0 = right, -1.0 = left.
var _facing_direction: float = 1.0


func _ready() -> void:
	# Connect health component signals.
	health_component.died.connect(_on_died)
	# HurtboxComponent.hurt is handled by CombatManager in the scene,
	# which then calls state_machine.transition_to(hit) after processing.


func _physics_process(_delta: float) -> void:
	move_and_slide()


## Returns the direction the player is currently facing (1.0 right, -1.0 left).
func get_facing_direction() -> float:
	return _facing_direction


## Applies horizontal movement at SPEED in the given direction and flips the sprite.
## Called by Run state each physics frame.
func apply_movement(direction: float) -> void:
	if direction != 0.0:
		velocity.x = direction * SPEED
		_update_facing(direction)
	else:
		velocity.x = 0.0


## Stops horizontal movement instantly. Called by states that require zero velocity.
func stop_movement() -> void:
	velocity.x = 0.0


## Flips the sprite to match the given direction.
func _update_facing(direction: float) -> void:
	if direction > 0.0:
		_facing_direction = 1.0
		sprite.flip_h = false
	elif direction < 0.0:
		_facing_direction = -1.0
		sprite.flip_h = true


## Called when health reaches zero. Triggers death state.
func _on_died() -> void:
	state_machine.transition_to(PlayerStateMachine.STATE_DEATH)
	player_died.emit()
