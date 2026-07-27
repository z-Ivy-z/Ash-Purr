## Controller disconnect/reconnect handler.
## Auto-pauses on controller disconnect, displays prompt.
## Updates UI prompts to match active input device within 1 second of change.
## Requirement 18.6
extends Node

const DISCONNECT_PROMPT_SCENE: String = "res://Scenes/UI/ControllerDisconnect.tscn"

var _disconnect_prompt: Control = null


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	Input.joy_connection_changed.connect(_on_joy_connection_changed)
	InputManager.device_changed.connect(_on_device_changed)


## Called when a controller connects or disconnects.
func _on_joy_connection_changed(_device_id: int, connected: bool) -> void:
	if not connected:
		# Check if this was the active device.
		var connected_pads := Input.get_connected_joypads()
		if connected_pads.is_empty() and InputManager.active_device == &"controller":
			_show_disconnect_prompt()
	else:
		_hide_disconnect_prompt()


## Called when the active input device changes (for UI prompt updates).
func _on_device_changed(_device: StringName) -> void:
	# UI elements can listen to InputManager.device_changed directly.
	# This handler ensures the disconnect prompt is dismissed on reconnect.
	if _disconnect_prompt and InputManager.active_device == &"controller":
		_hide_disconnect_prompt()


func _show_disconnect_prompt() -> void:
	if _disconnect_prompt != null:
		return

	# Auto-pause the game.
	GameManager.is_paused = true

	# Show disconnect UI.
	var scene := load(DISCONNECT_PROMPT_SCENE) as PackedScene
	if scene:
		_disconnect_prompt = scene.instantiate() as Control
		get_tree().current_scene.add_child(_disconnect_prompt)
	else:
		# Fallback: create a simple label.
		_disconnect_prompt = _create_fallback_prompt()
		get_tree().current_scene.add_child(_disconnect_prompt)


func _hide_disconnect_prompt() -> void:
	if _disconnect_prompt:
		_disconnect_prompt.queue_free()
		_disconnect_prompt = null
	# Resume if still paused from disconnect.
	if GameManager.is_paused:
		GameManager.is_paused = false


func _create_fallback_prompt() -> Control:
	var overlay := ColorRect.new()
	overlay.anchors_preset = Control.PRESET_FULL_RECT
	overlay.color = Color(0, 0, 0, 0.7)

	var label := Label.new()
	label.text = "Controller disconnected\nPlease reconnect to continue"
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.anchors_preset = Control.PRESET_CENTER
	overlay.add_child(label)

	return overlay
