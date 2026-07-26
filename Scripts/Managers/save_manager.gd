## SaveManager Autoload Singleton
## Manages game progress persistence using JSON serialization to user://.
## Requirement 19.1: Serializes game progress using JSON format.
## Requirement 19.2: Writes save data to user:// path.
## Requirement 19.4: Loads existing save data on launch.
## Requirement 19.5: Handles corrupted or missing data gracefully.
## Requirement 16.2: Persists checkpoint data.
## Requirement 16.3: Retains previous save on write failure.
extends Node

const SAVE_PATH: String = "user://save_data.json"

## Emitted when a save operation completes. Success indicates whether the write succeeded.
signal save_completed(success: bool)

## Emitted when a load operation completes with the loaded data.
signal load_completed(data: SaveData)

## Emitted when the save system needs to notify the player about an issue.
signal notification_requested(message: String)

## The currently loaded save data instance.
var _current_data: SaveData = null


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS


## Returns the current in-memory save data. Loads from disk if not yet loaded.
func get_data() -> SaveData:
	if _current_data == null:
		_current_data = load_game()
	return _current_data


## Saves the current game progress to disk.
## Returns true on success, false on failure.
## Requirement 16.3: On write failure, retains the previous valid save data.
func save_game() -> bool:
	if _current_data == null:
		_current_data = SaveData.new()

	var json_string: String = JSON.stringify(_current_data.to_dict(), "\t")

	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		var error_code := FileAccess.get_open_error()
		push_warning("SaveManager: Failed to open save file for writing. Error: %s" % error_string(error_code))
		notification_requested.emit("Save Failed")
		save_completed.emit(false)
		return false

	file.store_string(json_string)
	file.close()

	# Verify the write by checking the file is readable
	var verify_file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if verify_file == null:
		push_warning("SaveManager: Save file verification failed after write.")
		notification_requested.emit("Save Failed")
		save_completed.emit(false)
		return false
	verify_file.close()

	save_completed.emit(true)
	return true


## Loads game data from disk. Returns a SaveData instance.
## If the file is missing (first launch), returns defaults silently.
## If the file is corrupted, returns defaults with a notification.
## Requirement 19.5: Corrupted/missing file creates defaults with notification.
func load_game() -> SaveData:
	var data := SaveData.new()

	if not FileAccess.file_exists(SAVE_PATH):
		# First launch — silent default creation
		_current_data = data
		load_completed.emit(data)
		return data

	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		# File exists but can't be opened — treat as corruption
		push_warning("SaveManager: Could not open save file for reading.")
		notification_requested.emit("Save data corrupted. New save created.")
		_current_data = data
		load_completed.emit(data)
		return data

	var json_string: String = file.get_as_text()
	file.close()

	if json_string.is_empty():
		push_warning("SaveManager: Save file is empty.")
		notification_requested.emit("Save data corrupted. New save created.")
		_current_data = data
		load_completed.emit(data)
		return data

	# Parse JSON
	var json := JSON.new()
	var parse_result := json.parse(json_string)
	if parse_result != OK:
		push_warning("SaveManager: JSON parse error: %s" % json.get_error_message())
		notification_requested.emit("Save data corrupted. New save created.")
		_current_data = data
		load_completed.emit(data)
		return data

	var parsed_data = json.get_data()
	if not parsed_data is Dictionary:
		push_warning("SaveManager: Parsed data is not a Dictionary.")
		notification_requested.emit("Save data corrupted. New save created.")
		_current_data = data
		load_completed.emit(data)
		return data

	# Attempt to populate from parsed dictionary
	if not data.from_dict(parsed_data):
		push_warning("SaveManager: Failed to deserialize save data (version mismatch or invalid structure).")
		data = SaveData.new()
		notification_requested.emit("Save data corrupted. New save created.")

	_current_data = data
	load_completed.emit(data)
	return data


## Returns true if a save file exists on disk.
func has_save_data() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


## Deletes the save file from disk and resets in-memory data to defaults.
func delete_save() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(SAVE_PATH)
	_current_data = SaveData.new()
