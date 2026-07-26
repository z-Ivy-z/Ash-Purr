class_name AttackResource extends Resource
## Data resource defining all properties of a single attack (player or boss).
## Used by CombatManager, ComboController, and AnimationPlayer to drive frame-accurate combat.

@export var attack_name: StringName
@export var damage: int
@export var hitbox_start_frame: int
@export var hitbox_end_frame: int
@export var combo_window_start_frame: int
@export var combo_window_end_frame: int
@export var hit_stop_frames: int  ## 3-6 for player, 4-8 for boss
@export var screen_shake_pixels: float  ## 2-8 for player hits, 4-10 for boss hits
@export var knockback_pixels: float  ## 30-120 for player hits, 50-150 for boss hits
@export var knockback_direction: Vector2
@export var animation_name: StringName
@export var total_frames: int
@export var recovery_frames: int
