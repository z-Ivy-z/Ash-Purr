class_name HitboxComponent extends Area2D
## Reusable hitbox component for dealing damage on overlap with a HurtboxComponent.
## Starts DISABLED. Enabled/disabled by AnimationPlayer keyframes per attack frame.
## Collision layers are configured per-instance in the scene (Player Hitbox Layer 4, Boss Hitbox Layer 6).

## Emitted when this hitbox successfully lands on a vulnerable hurtbox target.
signal hit_landed(target: HurtboxComponent)

@export var damage: int = 10
@export var knockback_force: float = 50.0
@export var knockback_direction: Vector2 = Vector2.RIGHT
@export var hit_stop_frames: int = 3
@export var screen_shake_intensity: float = 4.0


func _ready() -> void:
	# Start disabled — AnimationPlayer or state machine will call enable()
	disable()
	area_entered.connect(_on_area_entered)


## Enables the hitbox: activates monitoring and enables all collision shapes.
func enable() -> void:
	monitoring = true
	_set_collision_shapes_disabled(false)


## Disables the hitbox: deactivates monitoring and disables all collision shapes.
func disable() -> void:
	monitoring = false
	_set_collision_shapes_disabled(true)


## Configures this hitbox from an AttackResource data object.
func load_from_attack_resource(attack: AttackResource) -> void:
	damage = attack.damage
	knockback_force = attack.knockback_pixels
	knockback_direction = attack.knockback_direction
	hit_stop_frames = attack.hit_stop_frames
	screen_shake_intensity = attack.screen_shake_pixels


## Internal: enables or disables all child CollisionShape2D nodes.
func _set_collision_shapes_disabled(disabled: bool) -> void:
	for child in get_children():
		if child is CollisionShape2D or child is CollisionPolygon2D:
			child.disabled = disabled


## Internal: handles overlap with another Area2D.
## Only processes HurtboxComponent targets that are not invulnerable.
func _on_area_entered(area: Area2D) -> void:
	if area is HurtboxComponent:
		var hurtbox: HurtboxComponent = area as HurtboxComponent
		if not hurtbox.is_invulnerable:
			hit_landed.emit(hurtbox)
