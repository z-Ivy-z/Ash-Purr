class_name VictoryScreen extends Control
## Victory screen displayed when the boss is defeated.
## Shows defeated boss name, reward obtained, and Continue option.

@onready var boss_name_label: Label = $Panel/VBoxContainer/BossNameLabel
@onready var reward_label: Label = $Panel/VBoxContainer/RewardLabel
@onready var continue_button: Button = $Panel/VBoxContainer/ContinueButton


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	boss_name_label.text = "The Cat Keeper - Defeated"
	reward_label.text = ""

	continue_button.pressed.connect(_on_continue)

	# Fade in.
	modulate.a = 0.0
	var tween := create_tween()
	tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(self, "modulate:a", 1.0, 0.8)
	tween.tween_callback(func(): continue_button.grab_focus())


## Sets the reward text to display.
func set_reward(reward_text: String) -> void:
	reward_label.text = reward_text


func _on_continue() -> void:
	GameManager.is_paused = false
	# Save boss defeat permanently.
	SaveManager.save_game()
	SceneManager.transition_to("res://Scenes/UI/MainMenu.tscn")
	queue_free()
