class_name ToolController extends Node
## Manages equipped tool activation and cooldown.
## Handles MELEE, RANGED, and HEALING tool types with independent cooldown timers.
## Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8

## Emitted when a tool is successfully activated.
signal tool_activated(tool: ToolResource)
## Emitted each physics frame while the cooldown is ticking.
signal cooldown_updated(remaining: float, total: float)

## The currently equipped tool. Null means no tool equipped.
var equipped_tool: ToolResource = null

## Time remaining on the current cooldown (seconds).
var cooldown_remaining: float = 0.0

## Whether the tool is currently on cooldown and cannot be activated.
var is_on_cooldown: bool = false

## External flag toggled by checkpoint/combat systems to block equipment changes.
var can_change_equipment: bool = true

## Total cooldown duration for the current cycle (used for UI progress).
var _total_cooldown: float = 0.0

## Reference to sibling AmuletController for cooldown modifier.
@export var amulet_controller: AmuletController

## Reference to sibling HealthComponent for healing tools.
@export var health_component: HealthComponent


func _physics_process(delta: float) -> void:
	if not is_on_cooldown:
		return

	cooldown_remaining -= delta
	if cooldown_remaining <= 0.0:
		cooldown_remaining = 0.0
		is_on_cooldown = false

	cooldown_updated.emit(cooldown_remaining, _total_cooldown)


## Attempts to activate the equipped tool. Ignored if on cooldown or no tool equipped.
func activate_tool() -> void:
	if is_on_cooldown:
		return
	if equipped_tool == null:
		return

	_execute_tool_effect()
	tool_activated.emit(equipped_tool)
	_start_cooldown()


## Equips a new tool (or null to unequip). Blocked during active combat.
func equip(tool: ToolResource) -> void:
	if _is_in_combat():
		return
	if not can_change_equipment:
		return

	equipped_tool = tool


## Returns true if the player is currently in active combat.
func _is_in_combat() -> bool:
	return GameManager.current_boss_phase > 0 and GameManager.is_player_alive


## Executes the tool-specific effect based on tool_type.
func _execute_tool_effect() -> void:
	match equipped_tool.tool_type:
		ToolResource.ToolType.RANGED:
			_activate_ranged()
		ToolResource.ToolType.MELEE:
			_activate_melee()
		ToolResource.ToolType.HEALING:
			_activate_healing()


## Instantiates the projectile scene, positions it at the owner, and aims in facing direction.
func _activate_ranged() -> void:
	if equipped_tool.projectile_scene == null:
		return

	var projectile: Node2D = equipped_tool.projectile_scene.instantiate() as Node2D
	var owner_node: Node2D = get_parent() as Node2D
	if owner_node == null:
		return

	# Add projectile to the scene tree at the same level as the owner.
	owner_node.get_parent().add_child(projectile)
	projectile.global_position = owner_node.global_position

	# Determine facing direction from the owner's method or fallback to scale.
	var facing: float = 1.0
	if owner_node.has_method("get_facing_direction"):
		facing = owner_node.get_facing_direction()
	elif owner_node.scale.x != 0.0:
		facing = signf(owner_node.scale.x)

	if projectile.has_method("set_direction"):
		projectile.set_direction(Vector2(facing, 0.0))
	else:
		projectile.scale.x = facing


## Activates a melee hitbox for the tool's startup_frames duration.
func _activate_melee() -> void:
	# Emit a signal the melee hitbox child can listen to, or enable directly.
	if has_node("MeleeHitbox"):
		var hitbox: Node = get_node("MeleeHitbox")
		if hitbox.has_method("activate"):
			hitbox.activate(equipped_tool.startup_frames)


## Restores 10% of max health via the HealthComponent.
func _activate_healing() -> void:
	if health_component == null:
		return

	var heal_amount: int = int(health_component.max_health * 0.1)
	health_component.heal(heal_amount)


## Starts the cooldown timer with amulet modifier applied.
func _start_cooldown() -> void:
	var modifier: float = 1.0
	if amulet_controller != null:
		modifier = amulet_controller.get_cooldown_modifier()

	_total_cooldown = equipped_tool.cooldown_seconds * modifier
	cooldown_remaining = _total_cooldown
	is_on_cooldown = true
