class_name ToolResource extends Resource
## Data resource defining a tool's identity, type, and combat properties.
## Tools provide tactical options on independent cooldowns complementing branch attacks.

enum ToolType { MELEE, RANGED, HEALING }

@export var tool_name: StringName
@export var display_name: String
@export var description: String
@export var icon: Texture2D
@export var damage_multiplier: float  ## Relative to base branch damage
@export var cooldown_seconds: float
@export var startup_frames: int
@export var tool_type: ToolType  ## MELEE, RANGED, or HEALING
@export var projectile_scene: PackedScene  ## null for melee/healing tools
