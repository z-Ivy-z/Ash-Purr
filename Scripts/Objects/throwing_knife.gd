class_name ThrowingKnife extends Area2D
## Throwing Knife projectile. Travels in a straight horizontal line.
## Deals 1.5× base damage on hit. Freed on hit or leaving screen bounds.
## Layer 9 (Projectiles) masking Layer 7 (Boss Hurtbox).
## Requirement: 11.2

const SPEED: float = 800.0
const MAX_LIFETIME: float = 3.0

var _direction: Vector2 = Vector2.RIGHT
var _damage: int = 15  # 1.5× base (will be set by ToolController)
var _lifetime: float = 0.0


func _ready() -> void:
	collision_layer = 256   # Layer 9 (Projectiles)
	collision_mask = 64     # Layer 7 (Boss Hurtbox)
	area_entered.connect(_on_area_entered)


func _physics_process(delta: float) -> void:
	position += _direction * SPEED * delta
	_lifetime += delta
	if _lifetime >= MAX_LIFETIME:
		queue_free()


## Sets the travel direction. Called by ToolController on spawn.
func set_direction(dir: Vector2) -> void:
	_direction = dir.normalized()
	if _direction.x < 0.0:
		scale.x = -1.0


## Sets the damage value. Called by ToolController.
func set_damage(amount: int) -> void:
	_damage = amount


func _on_area_entered(area: Area2D) -> void:
	if area is HurtboxComponent:
		var hurtbox: HurtboxComponent = area as HurtboxComponent
		if not hurtbox.is_invulnerable:
			# Apply damage directly via the hurtbox's health component.
			if hurtbox.health_component:
				hurtbox.health_component.take_damage(_damage, self)
			queue_free()
