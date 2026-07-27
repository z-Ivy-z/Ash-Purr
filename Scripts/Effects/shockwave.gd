class_name Shockwave extends Area2D
## Linear shockwave projectile spawned by Seismic Strike.
## Travels full arena width horizontally, dealing damage on contact.
## Layer 9 (Projectiles), masks Player Hurtbox (Layer 5).

const SPEED: float = 600.0
const MAX_LIFETIME: float = 5.0

var _direction: Vector2 = Vector2.RIGHT
var _lifetime: float = 0.0


func _ready() -> void:
	# Configure collision for projectile layer.
	collision_layer = 256   # Layer 9
	collision_mask = 16     # Layer 5 (Player Hurtbox)
	area_entered.connect(_on_area_entered)


func _physics_process(delta: float) -> void:
	position += _direction * SPEED * delta
	_lifetime += delta
	if _lifetime >= MAX_LIFETIME:
		queue_free()


## Sets the travel direction. Called by the spawner.
func set_direction(dir: Vector2) -> void:
	_direction = dir.normalized()
	if _direction.x < 0.0:
		scale.x = -1.0


func _on_area_entered(area: Area2D) -> void:
	if area is HurtboxComponent:
		var hurtbox: HurtboxComponent = area as HurtboxComponent
		if not hurtbox.is_invulnerable:
			# Apply damage directly since Shockwave is not a HitboxComponent.
			if hurtbox.health_component:
				hurtbox.health_component.take_damage(20, self)
