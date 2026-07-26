## SettingsManager Autoload Singleton
## Persists user preferences between sessions using JSON serialization to user://.
## Requirement 19.3: Persists all user settings.
## Requirement 15.7: Independent volume controls per bus, 0-100% in ≤10% increments.
## Requirement 16.2: Settings saved alongside game progress.
extends Node

const SETTINGS_PATH: String = "user://settings.json"

## Emitted when any setting is changed. Key is the property name, value is the new value.
signal setting_changed(key: String, value: Variant)

# --- Display Settings ---

var fullscreen: bool = true:
	set(value):
		if fullscreen != value:
			fullscreen = value
			_apply_fullscreen()
			setting_changed.emit("fullscreen", value)

var resolution: Vector2i = Vector2i(1920, 1080):
	set(value):
		if resolution != value:
			resolution = value
			_apply_resolution()
			setting_changed.emit("resolution", value)

var brightness: float = 1.0:
	set(value):
		value = clampf(value, 0.0, 2.0)
		if not is_equal_approx(brightness, value):
			brightness = value
			setting_changed.emit("brightness", value)

# --- Audio Settings ---

var master_volume: float = 1.0:
	set(value):
		value = clampf(value, 0.0, 1.0)
		if not is_equal_approx(master_volume, value):
			master_volume = value
			_apply_bus_volume("Master", value)
			setting_changed.emit("master_volume", value)

var music_volume: float = 0.8:
	set(value):
		value = clampf(value, 0.0, 1.0)
		if not is_equal_approx(music_volume, value):
			music_volume = value
			_apply_bus_volume("Music", value)
			setting_changed.emit("music_volume", value)

var sfx_volume: float = 1.0:
	set(value):
		value = clampf(value, 0.0, 1.0)
		if not is_equal_approx(sfx_volume, value):
			sfx_volume = value
			_apply_bus_volume("SFX", value)
			setting_changed.emit("sfx_volume", value)

var ui_volume: float = 0.7:
	set(value):
		value = clampf(value, 0.0, 1.0)
		if not is_equal_approx(ui_volume, value):
			ui_volume = value
			_apply_bus_volume("UI", value)
			setting_changed.emit("ui_volume", value)

var ambience_volume: float = 0.6:
	set(value):
		value = clampf(value, 0.0, 1.0)
		if not is_equal_approx(ambience_volume, value):
			ambience_volume = value
			_apply_bus_volume("Ambience", value)
			setting_changed.emit("ambience_volume", value)

# --- Accessibility Settings ---

var camera_shake_enabled: bool = true:
	set(value):
		if camera_shake_enabled != value:
			camera_shake_enabled = value
			setting_changed.emit("camera_shake_enabled", value)

var camera_shake_intensity: float = 1.0:
	set(value):
		value = clampf(value, 0.0, 1.0)
		if not is_equal_approx(camera_shake_intensity, value):
			camera_shake_intensity = value
			setting_changed.emit("camera_shake_intensity", value)

var hit_flash_intensity: float = 1.0:
	set(value):
		value = clampf(value, 0.0, 1.0)
		if not is_equal_approx(hit_flash_intensity, value):
			hit_flash_intensity = value
			setting_changed.emit("hit_flash_intensity", value)

var ui_scale: float = 1.0:
	set(value):
		# Clamp to valid values: 1.0, 1.25, 1.5
		value = clampf(value, 1.0, 1.5)
		if not is_equal_approx(ui_scale, value):
			ui_scale = value
			setting_changed.emit("ui_scale", value)

var subtitle_size: int = 1:
	set(value):
		# 0=Small, 1=Medium, 2=Large
		value = clampi(value, 0, 2)
		if subtitle_size != value:
			subtitle_size = value
			setting_changed.emit("subtitle_size", value)

var subtitle_background: bool = false:
	set(value):
		if subtitle_background != value:
			subtitle_background = value
			setting_changed.emit("subtitle_background", value)


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	load_settings()


## Saves all settings to disk as JSON.
func save_settings() -> void:
	var data := _to_dict()
	var json_string := JSON.stringify(data, "\t")

	var file := FileAccess.open(SETTINGS_PATH, FileAccess.WRITE)
	if file == null:
		push_warning("SettingsManager: Failed to open settings file for writing.")
		return

	file.store_string(json_string)
	file.close()


## Loads settings from disk. If the file is missing or invalid, uses defaults.
func load_settings() -> void:
	if not FileAccess.file_exists(SETTINGS_PATH):
		# First launch — apply defaults immediately
		_apply_all_settings()
		return

	var file := FileAccess.open(SETTINGS_PATH, FileAccess.READ)
	if file == null:
		push_warning("SettingsManager: Failed to open settings file for reading. Using defaults.")
		_apply_all_settings()
		return

	var json_string := file.get_as_text()
	file.close()

	if json_string.is_empty():
		push_warning("SettingsManager: Settings file is empty. Using defaults.")
		_apply_all_settings()
		return

	var json := JSON.new()
	var parse_result := json.parse(json_string)
	if parse_result != OK:
		push_warning("SettingsManager: JSON parse error: %s. Using defaults." % json.get_error_message())
		_apply_all_settings()
		return

	var data = json.get_data()
	if not data is Dictionary:
		push_warning("SettingsManager: Parsed settings is not a Dictionary. Using defaults.")
		_apply_all_settings()
		return

	_from_dict(data)
	_apply_all_settings()


## Serializes all settings to a Dictionary.
func _to_dict() -> Dictionary:
	return {
		"display": {
			"fullscreen": fullscreen,
			"resolution": [resolution.x, resolution.y],
			"brightness": brightness
		},
		"audio": {
			"master_volume": master_volume,
			"music_volume": music_volume,
			"sfx_volume": sfx_volume,
			"ui_volume": ui_volume,
			"ambience_volume": ambience_volume
		},
		"accessibility": {
			"camera_shake_enabled": camera_shake_enabled,
			"camera_shake_intensity": camera_shake_intensity,
			"hit_flash_intensity": hit_flash_intensity,
			"ui_scale": ui_scale,
			"subtitle_size": subtitle_size,
			"subtitle_background": subtitle_background
		},
		"input": {
			"keyboard": {},
			"controller": {}
		}
	}


## Populates settings from a parsed Dictionary.
func _from_dict(data: Dictionary) -> void:
	# Display
	var display: Dictionary = data.get("display", {})
	if display is Dictionary:
		fullscreen = bool(display.get("fullscreen", true))
		var res = display.get("resolution", [1920, 1080])
		if res is Array and res.size() >= 2:
			resolution = Vector2i(int(res[0]), int(res[1]))
		brightness = float(display.get("brightness", 1.0))

	# Audio
	var audio: Dictionary = data.get("audio", {})
	if audio is Dictionary:
		master_volume = float(audio.get("master_volume", 1.0))
		music_volume = float(audio.get("music_volume", 0.8))
		sfx_volume = float(audio.get("sfx_volume", 1.0))
		ui_volume = float(audio.get("ui_volume", 0.7))
		ambience_volume = float(audio.get("ambience_volume", 0.6))

	# Accessibility
	var accessibility: Dictionary = data.get("accessibility", {})
	if accessibility is Dictionary:
		camera_shake_enabled = bool(accessibility.get("camera_shake_enabled", true))
		camera_shake_intensity = float(accessibility.get("camera_shake_intensity", 1.0))
		hit_flash_intensity = float(accessibility.get("hit_flash_intensity", 1.0))
		ui_scale = float(accessibility.get("ui_scale", 1.0))
		subtitle_size = int(accessibility.get("subtitle_size", 1))
		subtitle_background = bool(accessibility.get("subtitle_background", false))


## Applies all current settings to the engine systems.
func _apply_all_settings() -> void:
	_apply_fullscreen()
	_apply_resolution()
	_apply_bus_volume("Master", master_volume)
	_apply_bus_volume("Music", music_volume)
	_apply_bus_volume("SFX", sfx_volume)
	_apply_bus_volume("UI", ui_volume)
	_apply_bus_volume("Ambience", ambience_volume)


## Sets the window fullscreen mode.
func _apply_fullscreen() -> void:
	if fullscreen:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)


## Applies the resolution setting to the window.
func _apply_resolution() -> void:
	if not fullscreen:
		DisplayServer.window_set_size(resolution)


## Applies a linear volume value (0.0 - 1.0) to the specified audio bus.
## Converts linear to decibels. A value of 0.0 mutes the bus.
func _apply_bus_volume(bus_name: String, linear_value: float) -> void:
	var bus_idx := AudioServer.get_bus_index(bus_name)
	if bus_idx == -1:
		return
	linear_value = clampf(linear_value, 0.0, 1.0)
	if linear_value <= 0.0:
		AudioServer.set_bus_mute(bus_idx, true)
	else:
		AudioServer.set_bus_mute(bus_idx, false)
		AudioServer.set_bus_volume_db(bus_idx, linear_to_db(linear_value))
