## SaveData class for serialization/deserialization of game progress.
## Requirement 19.1: Serializes game progress as JSON.
## Requirement 19.5: Creates default values when data is missing or corrupted.
class_name SaveData
extends RefCounted

const CURRENT_VERSION: int = 1

var version: int = CURRENT_VERSION
var current_level: String = "arena_cat_keeper"
var boss_progression: Dictionary = {}
var unlocked_amulets: Array[String] = []
var unlocked_tools: Array[String] = []
var equipped_amulet: String = ""
var equipped_tool: String = ""
var player_statistics: Dictionary = {}
var game_completion: bool = false
var collectibles: Array[String] = []


func _init() -> void:
	_set_defaults()


## Resets all fields to their default values.
func _set_defaults() -> void:
	version = CURRENT_VERSION
	current_level = "arena_cat_keeper"
	boss_progression = {
		"cat_keeper": { "defeated": false, "phase_reached": 1 }
	}
	unlocked_amulets = ["photograph", "collar", "fish_plush"]
	unlocked_tools = ["throwing_knife", "short_sword", "small_mace", "dreamcatcher"]
	equipped_amulet = "photograph"
	equipped_tool = "throwing_knife"
	player_statistics = {
		"deaths": 0,
		"damage_dealt": 0,
		"damage_taken": 0,
		"dodges_performed": 0,
		"staggers_triggered": 0
	}
	game_completion = false
	collectibles = []


## Serializes the save data to a Dictionary suitable for JSON conversion.
func to_dict() -> Dictionary:
	return {
		"version": version,
		"current_level": current_level,
		"boss_progression": boss_progression,
		"unlocked_amulets": unlocked_amulets,
		"unlocked_tools": unlocked_tools,
		"equipped_amulet": equipped_amulet,
		"equipped_tool": equipped_tool,
		"player_statistics": player_statistics,
		"game_completion": game_completion,
		"collectibles": collectibles
	}


## Populates the save data from a dictionary (parsed from JSON).
## Returns true if successful, false if data was invalid.
func from_dict(data: Dictionary) -> bool:
	if not data.has("version"):
		return false

	var data_version: int = int(data.get("version", 0))

	# Version mismatch: attempt migration
	if data_version != CURRENT_VERSION:
		if not _migrate(data, data_version):
			return false

	version = int(data.get("version", CURRENT_VERSION))
	current_level = str(data.get("current_level", "arena_cat_keeper"))

	# Boss progression
	var bp = data.get("boss_progression", {})
	if bp is Dictionary:
		boss_progression = bp
	else:
		boss_progression = { "cat_keeper": { "defeated": false, "phase_reached": 1 } }

	# Unlocked amulets
	var ua = data.get("unlocked_amulets", [])
	unlocked_amulets = []
	if ua is Array:
		for item in ua:
			unlocked_amulets.append(str(item))

	# Unlocked tools
	var ut = data.get("unlocked_tools", [])
	unlocked_tools = []
	if ut is Array:
		for item in ut:
			unlocked_tools.append(str(item))

	equipped_amulet = str(data.get("equipped_amulet", ""))
	equipped_tool = str(data.get("equipped_tool", ""))

	# Player statistics
	var ps = data.get("player_statistics", {})
	if ps is Dictionary:
		player_statistics = {
			"deaths": int(ps.get("deaths", 0)),
			"damage_dealt": int(ps.get("damage_dealt", 0)),
			"damage_taken": int(ps.get("damage_taken", 0)),
			"dodges_performed": int(ps.get("dodges_performed", 0)),
			"staggers_triggered": int(ps.get("staggers_triggered", 0))
		}
	else:
		player_statistics = {
			"deaths": 0, "damage_dealt": 0, "damage_taken": 0,
			"dodges_performed": 0, "staggers_triggered": 0
		}

	game_completion = bool(data.get("game_completion", false))

	# Collectibles
	var col = data.get("collectibles", [])
	collectibles = []
	if col is Array:
		for item in col:
			collectibles.append(str(item))

	return true


## Attempts to migrate save data from an older version to the current version.
## Returns true if migration succeeds, false otherwise.
func _migrate(data: Dictionary, from_version: int) -> bool:
	# Future migration logic goes here.
	# For now, version 1 is the only version, so any mismatch fails gracefully.
	if from_version < 1:
		return false
	# If from a future version, we can't migrate forward.
	if from_version > CURRENT_VERSION:
		return false
	# Bump the version in data for downstream processing.
	data["version"] = CURRENT_VERSION
	return true
