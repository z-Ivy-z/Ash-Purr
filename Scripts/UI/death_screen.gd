class_name DeathScreen extends Control
## Death screen displayed when the player dies.
## Shows "Stand once more" message with Retry and Main Menu options.
## Retry resets arena within 1 second.

@onready var retry_button: Button = $Panel/VBoxContainer/RetryButton
@onready var main_menu_button: Button = $Panel/VBoxContainer/MainMenuButton
@onready var message_label: Label = $Panel/VBoxContainer/MessageLabel


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	message_label.text = "Stand once more"

	retry_button.pressed.connect(_on_retry)
	main_menu_button.pressed.connect(_on_main_menu)

	# Fade in.
	modulate.a = 0.0
	var tween := create_tween()
	tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(self, "modulate:a", 1.0, 0.5)
	tween.tween_callback(func(): retry_button.grab_focus())


func _on_retry() -> void:
	GameManager.is_paused = false
	GameManager.reset_state()
	SceneManager.reload_current_scene(0.3)
	queue_free()


func _on_main_menu() -> void:
	GameManager.is_paused = false
	GameManager.reset_state()
	SceneManager.transition_to("res://Scenes/UI/MainMenu.tscn")
	queue_free()
