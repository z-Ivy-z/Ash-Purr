class_name HealthComponent extends Node
## Reusable health management component for any entity (Player, Boss).
## Tracks current/max HP, handles damage and healing, and supports invulnerability.

## Emitted when health changes. Provides current and max values for UI updates.
signal health_changed(current: int, max_hp: int)
## Emitted when health reaches zero.
signal died()
## Emitted when damage is successfully applied (not blocked by invulnerability).
signal damage_taken(amount: int, source: Node)

@export var max_health: int = 100

var current_health: int = 0
var is_invulnerable: bool = false


func _ready() -> void:
	current_health = max_health


## Applies damage to this entity. Ignored entirely when invulnerable.
## When health reaches zero, emits both damage_taken and died signals.
func take_damage(amount: int, source: Node) -> void:
	if is_invulnerable:
		return

	var actual_damage: int = clampi(amount, 0, current_health)
	current_health -= actual_damage
	damage_taken.emit(actual_damage, source)
	health_changed.emit(current_health, max_health)

	if current_health <= 0:
		died.emit()


## Restores health by the given amount, clamped to max_health.
func heal(amount: int) -> void:
	var previous_health: int = current_health
	current_health = clampi(current_health + amount, 0, max_health)
	if current_health != previous_health:
		health_changed.emit(current_health, max_health)


## Toggles invulnerability state. While active, take_damage has no effect.
func set_invulnerable(active: bool) -> void:
	is_invulnerable = active
