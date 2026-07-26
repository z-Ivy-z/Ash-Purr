class_name AmuletController extends Node
## Manages the currently equipped amulet and provides stat modifier queries.
## Equipment changes are locked during active combat encounters.
## Requirement 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7

## Emitted when the equipped amulet changes (including unequip/null).
signal amulet_changed(amulet: AmuletResource)

## The currently equipped amulet. Null means no amulet is active.
var equipped_amulet: AmuletResource = null

## External flag that can be toggled (e.g., by checkpoint system) to block equip changes.
var can_change_equipment: bool = true


## Returns true if the player is currently in active combat.
## Active combat is defined as boss phase > 0 and the player being alive.
func is_in_combat() -> bool:
	return GameManager.current_boss_phase > 0 and GameManager.is_player_alive


## Equips the given amulet (or null to unequip).
## Rejects the change if in active combat or if external flag disallows it.
func equip(amulet: AmuletResource) -> void:
	if is_in_combat():
		return
	if not can_change_equipment:
		return

	equipped_amulet = amulet
	amulet_changed.emit(amulet)


## Returns the damage multiplier from the equipped amulet, or 1.0 if none.
func get_damage_modifier() -> float:
	if equipped_amulet == null:
		return 1.0
	return equipped_amulet.damage_modifier


## Returns the defense multiplier from the equipped amulet, or 1.0 if none.
func get_defense_modifier() -> float:
	if equipped_amulet == null:
		return 1.0
	return equipped_amulet.defense_modifier


## Returns the health multiplier from the equipped amulet, or 1.0 if none.
func get_health_modifier() -> float:
	if equipped_amulet == null:
		return 1.0
	return equipped_amulet.health_modifier


## Returns the cooldown multiplier from the equipped amulet, or 1.0 if none.
func get_cooldown_modifier() -> float:
	if equipped_amulet == null:
		return 1.0
	return equipped_amulet.cooldown_modifier
