## InputManager Autoload Singleton
## Handles input mapping, device detection, rebinding, and persistence.
## Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
extends Node

# --- Signals ---

## Emitted when the active input device changes (keyboard ↔ controller).
signal device_changed(device: StringName)

## Emitted when an action binding is changed.
signal binding_changed(action: StringName)

# --- Constants ---

const SAVE_PATH: String = "user://input_bindings.json"

## All gameplay actions managed by the InputManager.
const GAMEPLAY_ACTIONS: Array[StringName] = [
	&"move_left",
	&"move_right",
	&"attack",
	&"dodge",
	&"use_tool",
	&"interact",
	&"pause",
	&"advance_dialogue",
]

# --- State ---

## Currently active input device: "keyboard" or "controller".
var active_device: StringName = &"keyboard":
	set(value):
		if active_device != value:
			active_device = value
			device_changed.emit(active_device)


# --- Lifecycle ---

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_ensure_advance_dialogue_action()
	load_bindings()
	Input.joy_connection_changed.connect(_on_joy_connection_changed)


func _input(event: InputEvent) -> void:
	# Detect active device based on last input event type.
	if event is InputEventKey or event is InputEventMouse or event is InputEventMouseButton:
		active_device = &"keyboard"
	elif event is InputEventJoypadButton or event is InputEventJoypadMotion:
		active_device = &"controller"


# --- Public API ---

## Returns a human-readable label for the first event bound to [action] on the active device.
func get_action_key(action: StringName) -> String:
	var events := InputMap.action_get_events(action)
	for ev in events:
		if _get_device_type_for_event(ev) == active_device:
			if ev is InputEventKey:
				return OS.get_keycode_string(ev.physical_keycode) if ev.physical_keycode != 0 else OS.get_keycode_string(ev.keycode)
			elif ev is InputEventJoypadButton:
				return "Joy %d" % ev.button_index
			elif ev is InputEventJoypadMotion:
				var dir := "+" if ev.axis_value > 0 else "-"
				return "Axis %d%s" % [ev.axis, dir]
	return ""


## Attempts to rebind [action] to [event]. Returns false if there is a conflict
## (caller is responsible for presenting confirmation UI before forcing).
func rebind_action(action: StringName, event: InputEvent) -> bool:
	var conflict := has_conflict(action, event)
	if conflict != &"":
		return false

	_apply_rebind(action, event)
	return true


## Forces a rebind even if a conflict exists — removes the conflicting binding first.
func force_rebind_action(action: StringName, event: InputEvent) -> void:
	var conflict := has_conflict(action, event)
	if conflict != &"":
		_remove_event_from_action(conflict, event)
		binding_changed.emit(conflict)

	_apply_rebind(action, event)


## Returns the action name that already uses [event] on the same device,
## or an empty StringName if no conflict exists.
func has_conflict(action: StringName, event: InputEvent) -> StringName:
	var device_type := _get_device_type_for_event(event)

	for other_action in GAMEPLAY_ACTIONS:
		if other_action == action:
			continue
		var events := InputMap.action_get_events(other_action)
		for existing_ev in events:
			if _get_device_type_for_event(existing_ev) != device_type:
				continue
			if _events_are_equal(existing_ev, event):
				return other_action
	return &""


## Persists current bindings to user://input_bindings.json.
func save_bindings() -> void:
	var data := {}
	for action in GAMEPLAY_ACTIONS:
		var action_events := []
		var events := InputMap.action_get_events(action)
		for ev in events:
			var serialized := _serialize_event(ev)
			if serialized.size() > 0:
				action_events.append(serialized)
		data[action] = action_events

	var json_string := JSON.stringify(data, "\t")
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(json_string)
		file.close()


## Loads persisted bindings from user://input_bindings.json and applies them.
func load_bindings() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return

	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return

	var json_string := file.get_as_text()
	file.close()

	var json := JSON.new()
	var parse_result := json.parse(json_string)
	if parse_result != OK:
		push_warning("InputManager: Failed to parse input bindings file.")
		return

	var data: Dictionary = json.data
	if not data is Dictionary:
		return

	for action in GAMEPLAY_ACTIONS:
		if not data.has(String(action)):
			continue

		# Erase all current events for this action before restoring saved ones.
		InputMap.action_erase_events(action)

		var action_events: Array = data[String(action)]
		for ev_data in action_events:
			var ev := _deserialize_event(ev_data)
			if ev:
				InputMap.action_add_event(action, ev)

		binding_changed.emit(action)


# --- Private Helpers ---

## Ensures advance_dialogue exists in the InputMap (same default as interact).
func _ensure_advance_dialogue_action() -> void:
	if not InputMap.has_action(&"advance_dialogue"):
		InputMap.add_action(&"advance_dialogue")
		# Copy interact's events as default for advance_dialogue.
		var interact_events := InputMap.action_get_events(&"interact")
		for ev in interact_events:
			InputMap.action_add_event(&"advance_dialogue", ev)


## Applies the rebind by removing existing events for the same device and adding the new one.
func _apply_rebind(action: StringName, event: InputEvent) -> void:
	var device_type := _get_device_type_for_event(event)

	# Remove existing events on the same device type for this action.
	var events := InputMap.action_get_events(action)
	for ev in events:
		if _get_device_type_for_event(ev) == device_type:
			InputMap.action_erase_event(action, ev)

	# Add the new event.
	InputMap.action_add_event(action, event)
	binding_changed.emit(action)
	save_bindings()


## Removes a specific event from an action's bindings.
func _remove_event_from_action(action: StringName, event: InputEvent) -> void:
	var events := InputMap.action_get_events(action)
	for ev in events:
		if _events_are_equal(ev, event):
			InputMap.action_erase_event(action, ev)
			return


## Returns "keyboard" or "controller" depending on the event type.
func _get_device_type_for_event(event: InputEvent) -> StringName:
	if event is InputEventKey or event is InputEventMouse or event is InputEventMouseButton:
		return &"keyboard"
	elif event is InputEventJoypadButton or event is InputEventJoypadMotion:
		return &"controller"
	return &"unknown"


## Compares two InputEvents for binding equality.
func _events_are_equal(a: InputEvent, b: InputEvent) -> bool:
	if a.get_class() != b.get_class():
		return false

	if a is InputEventKey and b is InputEventKey:
		var key_a: int = a.physical_keycode if a.physical_keycode != 0 else a.keycode
		var key_b: int = b.physical_keycode if b.physical_keycode != 0 else b.keycode
		return key_a == key_b

	if a is InputEventJoypadButton and b is InputEventJoypadButton:
		return a.button_index == b.button_index

	if a is InputEventJoypadMotion and b is InputEventJoypadMotion:
		return a.axis == b.axis and sign(a.axis_value) == sign(b.axis_value)

	return false


## Serializes an InputEvent to a dictionary for JSON storage.
func _serialize_event(event: InputEvent) -> Dictionary:
	if event is InputEventKey:
		return {
			"type": "key",
			"physical_keycode": event.physical_keycode,
			"keycode": event.keycode,
		}
	elif event is InputEventJoypadButton:
		return {
			"type": "joypad_button",
			"button_index": event.button_index,
		}
	elif event is InputEventJoypadMotion:
		return {
			"type": "joypad_motion",
			"axis": event.axis,
			"axis_value": event.axis_value,
		}
	return {}


## Deserializes a dictionary back into an InputEvent.
func _deserialize_event(data: Dictionary) -> InputEvent:
	if not data.has("type"):
		return null

	match data["type"]:
		"key":
			var ev := InputEventKey.new()
			ev.physical_keycode = int(data.get("physical_keycode", 0))
			ev.keycode = int(data.get("keycode", 0))
			return ev
		"joypad_button":
			var ev := InputEventJoypadButton.new()
			ev.button_index = int(data.get("button_index", 0))
			return ev
		"joypad_motion":
			var ev := InputEventJoypadMotion.new()
			ev.axis = int(data.get("axis", 0))
			ev.axis_value = float(data.get("axis_value", 0.0))
			return ev

	return null


## Called when a controller is connected or disconnected.
func _on_joy_connection_changed(device_id: int, connected: bool) -> void:
	if connected:
		active_device = &"controller"
	else:
		# If no controllers remain, fall back to keyboard.
		var connected_joypads := Input.get_connected_joypads()
		if connected_joypads.is_empty():
			active_device = &"keyboard"
