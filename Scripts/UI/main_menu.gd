class_name MainMenu extends Control
## Main menu screen with Continue, New Game, Settings, Credits, Exit.
## Continue is disabled when no save data exists.
## Supports keyboard and gamepad navigation.

@onready var continue_button: Button = $VBoxContainer/ContinueButton
@onready var new_game_button: Button = $VBoxContainer/NewGameButton
@onready var settings_button: Button = $VBoxContainer/SettingsButton
@onready var credits_button: Button = $VBoxContainer/CreditsButton
@onready var exit_button: Button = $VBoxContainer/ExitButton


func _ready() -> void:
	# Check if save data exists for Continue button.
	if SaveManager.has_save_data():
		continue_button.disabled = false
	else:
		continue_button.disabled = true
		continue_button.focus_mode = Control.FOCUS_NONE

	# Connect button signals.
	continue_button.pressed.connect(_on_continue_pressed)
	new_game_button.pressed.connect(_on_new_game_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	credits_button.pressed.connect(_on_credits_pressed)
	exit_button.pressed.connect(_on_exit_pressed)

	# Set initial focus for gamepad navigation.
	if continue_button.disabled:
		new_game_button.grab_focus()
	else:
		continue_button.grab_focus()


func _on_continue_pressed() -> void:
	# Load saved game state and transition to last checkpoint.
	SaveManager.load_game()
	SceneManager.transition_to("res://Scenes/Levels/Arena_CatKeeper.tscn")


func _on_new_game_pressed() -> void:
	# Start a new game — reset save and go to first level.
	SaveManager.delete_save()
	GameManager.reset_state()
	SceneManager.transition_to("res://Scenes/Levels/Arena_CatKeeper.tscn")


func _on_settings_pressed() -> void:
	# Open settings menu (overlay or scene).
	var settings_scene := load("res://Scenes/UI/SettingsMenu.tscn") as PackedScene
	if settings_scene:
		var settings := settings_scene.instantiate()
		add_child(settings)


func _on_credits_pressed() -> void:
	# Show credits (can be a simple scrolling label or separate scene).
	pass


func _on_exit_pressed() -> void:
	get_tree().quit()
