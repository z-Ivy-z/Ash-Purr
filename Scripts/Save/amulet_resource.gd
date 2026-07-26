class_name AmuletResource extends Resource
## Data resource defining an amulet's identity and stat modifiers.
## Each amulet provides a paired advantage and disadvantage via multiplicative modifiers.

@export var amulet_name: StringName
@export var display_name: String
@export var description: String
@export var icon: Texture2D
@export var damage_modifier: float = 1.0  ## 1.0 = no change, 1.25 = +25% damage dealt
@export var defense_modifier: float = 1.0  ## 1.0 = no change, 0.8 = -20% damage received
@export var health_modifier: float = 1.0  ## 1.0 = no change, 1.3 = +30% max HP
@export var cooldown_modifier: float = 1.0  ## 1.0 = no change, 1.3 = +30% cooldown duration
