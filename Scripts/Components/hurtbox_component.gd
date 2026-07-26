class_name HurtboxComponent extends Area2D
## Reusable hurtbox component for receiving damage from overlapping HitboxComponents.
## Collision layers are configured per-instance in the scene (Player Hurtbox Layer 5, Boss Hurtbox Layer 7).

## Emitted when a hitbox lands on this hurtbox while not invulnerable.
signal hurt(hitbox: HitboxComponent)

## Invulnerability state — when true, incoming hits are ignored.
## Typically delegated from the parent's HealthComponent or Dodge state.
@export var is_invulnerable: bool = false

## Optional reference to the owning entity's HealthComponent for delegation.
@export var health_component: HealthComponent


func _ready() -> void:
	area_entered.connect(_on_area_entered)


## Sets invulnerability state. Called by dodge logic or HealthComponent delegation.
func set_invulnerable(active: bool) -> void:
	is_invulnerable = active


## Internal: handles overlap from an incoming hitbox.
## Only processes HitboxComponent sources when not invulnerable.
func _on_area_entered(area: Area2D) -> void:
	if area is HitboxComponent:
		if not is_invulnerable:
			var hitbox: HitboxComponent = area as HitboxComponent
			hurt.emit(hitbox)
