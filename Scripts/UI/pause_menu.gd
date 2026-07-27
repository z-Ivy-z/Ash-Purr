class_name PauseMenu extends Control
## Pause menu — freezes all gameplay simulation within the same frame.
## Options: Resume, Amulets, Controls, Settings, Main Menu.
## Supports keyboard and gamepad navigation.

@onready var resume_button: Button = $Panel/VBoxContainer/ResumeButton
@onready var amulets_button: Button = $Panel/VBoxContainer/AmuletsButton
@onready var controls_button: Button = $Panel/VBoxContainer/ControlsButton
@onready var settings_button: Button = $Panel/VBoxContainer/SettingsButton
@onready var main_menu_button: Button = $Panel/VBoxContainer/MainMenuButton


func _ready() -> void:
	# This node processes even when the tree is paused.
	process_mode = Node.PROCESS_MODE_ALWAYS

	resume_button.pressed.connect(_on_resume)
	amulets_button.pressed.connect(_on_amulets)
	controls_button.pressed.connect(_on_controls)
	settings_button.pressed.connect(_on_settings)
	main_menu_button.pressed.connect(_on_main_menu)

	resume_button.grab_focus()

	# Freeze gameplay.
	GameManager.is_paused = true


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		_on_resume()
		get_viewport().set_input_as_handled()


func _on_resume() -> void:
	GameManager.is_paused = false
	queue_free()


func _on_amulets() -> void:
	# Open amulet selection (placeholder for now).
	pass


func _on_controls() -> void:
	# Open controls remapping menu.
	pass


func _on_settings() -> void:
	var settings_scene := load("res://Scenes/UI/SettingsMenu.tscn") as PackedScene
	if settings_scene:
		var settings := settings_scene.instantiate()
		add_child(settings)


func _on_main_menu() -> void:
	GameManager.is_paused = false
	SceneManager.transition_to("res://Scenes/UI/MainMenu.tscn")
