class_name SettingsMenu extends Control
## Settings menu with accessibility options.
## Camera shake toggle/intensity, hit flash intensity, UI scale,
## subtitle size, volume controls, controller remapping.
## Changes apply immediately without restart.
## Requirements: 20.1-20.6, 15.7

@onready var camera_shake_toggle: CheckButton = $Panel/TabContainer/Accessibility/VBox/CameraShakeToggle
@onready var camera_shake_slider: HSlider = $Panel/TabContainer/Accessibility/VBox/CameraShakeSlider
@onready var hit_flash_slider: HSlider = $Panel/TabContainer/Accessibility/VBox/HitFlashSlider
@onready var ui_scale_option: OptionButton = $Panel/TabContainer/Accessibility/VBox/UIScaleOption
@onready var subtitle_size_option: OptionButton = $Panel/TabContainer/Accessibility/VBox/SubtitleSizeOption
@onready var subtitle_bg_toggle: CheckButton = $Panel/TabContainer/Accessibility/VBox/SubtitleBgToggle

@onready var master_slider: HSlider = $Panel/TabContainer/Audio/VBox/MasterSlider
@onready var music_slider: HSlider = $Panel/TabContainer/Audio/VBox/MusicSlider
@onready var sfx_slider: HSlider = $Panel/TabContainer/Audio/VBox/SFXSlider
@onready var ui_slider: HSlider = $Panel/TabContainer/Audio/VBox/UISlider
@onready var ambience_slider: HSlider = $Panel/TabContainer/Audio/VBox/AmbienceSlider

@onready var back_button: Button = $Panel/BackButton


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

	# Initialize values from SettingsManager.
	_load_current_values()

	# Connect signals.
	camera_shake_toggle.toggled.connect(_on_camera_shake_toggled)
	camera_shake_slider.value_changed.connect(_on_camera_shake_intensity)
	hit_flash_slider.value_changed.connect(_on_hit_flash_intensity)
	ui_scale_option.item_selected.connect(_on_ui_scale_selected)
	subtitle_size_option.item_selected.connect(_on_subtitle_size_selected)
	subtitle_bg_toggle.toggled.connect(_on_subtitle_bg_toggled)

	master_slider.value_changed.connect(_on_master_volume)
	music_slider.value_changed.connect(_on_music_volume)
	sfx_slider.value_changed.connect(_on_sfx_volume)
	ui_slider.value_changed.connect(_on_ui_volume)
	ambience_slider.value_changed.connect(_on_ambience_volume)

	back_button.pressed.connect(_on_back)
	back_button.grab_focus()


func _load_current_values() -> void:
	camera_shake_toggle.button_pressed = SettingsManager.camera_shake_enabled
	camera_shake_slider.value = SettingsManager.camera_shake_intensity
	hit_flash_slider.value = SettingsManager.hit_flash_intensity

	# UI Scale: 100%=0, 125%=1, 150%=2
	ui_scale_option.clear()
	ui_scale_option.add_item("100%", 0)
	ui_scale_option.add_item("125%", 1)
	ui_scale_option.add_item("150%", 2)
	var scale_idx: int = 0
	if is_equal_approx(SettingsManager.ui_scale, 1.25):
		scale_idx = 1
	elif is_equal_approx(SettingsManager.ui_scale, 1.5):
		scale_idx = 2
	ui_scale_option.selected = scale_idx

	# Subtitle size: Small=0, Medium=1, Large=2
	subtitle_size_option.clear()
	subtitle_size_option.add_item("Small", 0)
	subtitle_size_option.add_item("Medium", 1)
	subtitle_size_option.add_item("Large", 2)
	subtitle_size_option.selected = SettingsManager.subtitle_size

	subtitle_bg_toggle.button_pressed = SettingsManager.subtitle_background

	master_slider.value = SettingsManager.master_volume
	music_slider.value = SettingsManager.music_volume
	sfx_slider.value = SettingsManager.sfx_volume
	ui_slider.value = SettingsManager.ui_volume
	ambience_slider.value = SettingsManager.ambience_volume


func _on_camera_shake_toggled(enabled: bool) -> void:
	SettingsManager.camera_shake_enabled = enabled

func _on_camera_shake_intensity(value: float) -> void:
	SettingsManager.camera_shake_intensity = value

func _on_hit_flash_intensity(value: float) -> void:
	SettingsManager.hit_flash_intensity = value

func _on_ui_scale_selected(idx: int) -> void:
	match idx:
		0: SettingsManager.ui_scale = 1.0
		1: SettingsManager.ui_scale = 1.25
		2: SettingsManager.ui_scale = 1.5

func _on_subtitle_size_selected(idx: int) -> void:
	SettingsManager.subtitle_size = idx

func _on_subtitle_bg_toggled(enabled: bool) -> void:
	SettingsManager.subtitle_background = enabled

func _on_master_volume(value: float) -> void:
	SettingsManager.master_volume = value

func _on_music_volume(value: float) -> void:
	SettingsManager.music_volume = value

func _on_sfx_volume(value: float) -> void:
	SettingsManager.sfx_volume = value

func _on_ui_volume(value: float) -> void:
	SettingsManager.ui_volume = value

func _on_ambience_volume(value: float) -> void:
	SettingsManager.ambience_volume = value

func _on_back() -> void:
	SettingsManager.save_settings()
	queue_free()
