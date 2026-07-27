class_name Checkpoint extends Area2D
## Checkpoint system: restores health, allows equipment changes, saves progress.
## Layer 8 trigger area. On interaction input: heal, show notification, allow equip.
## On exit: respawn non-boss enemies, lock equipment, save.
## Requirements: 16.1, 16.2, 16.4, 16.5, 19.6

## Emitted when the checkpoint is activated.
signal checkpoint_activated()

## Whether a player is currently in the checkpoint area.
var _player_in_area: bool = false
## Whether this checkpoint has been activated.
var _is_activated: bool = false
## Reference to the player node.
var _player: Node = null

## Notification label for "Progress Saved" message.
@onready var notification_label: Label = $NotificationLabel


func _ready() -> void:
	# Set to Layer 8 (Checkpoints).
	collision_layer = 128  # Layer 8
	collision_mask = 2     # Player Body (Layer 2)

	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)

	if notification_label:
		notification_label.visible = false


func _unhandled_input(event: InputEvent) -> void:
	if not _player_in_area:
		return

	if event.is_action_pressed("interact"):
		_activate_checkpoint()
		get_viewport().set_input_as_handled()


func _activate_checkpoint() -> void:
	if _player == null:
		return

	# Restore player health to max.
	var health: HealthComponent = _find_health_component(_player)
	if health:
		health.heal(health.max_health)

	# Allow equipment changes.
	_set_equipment_access(true)

	# Save game.
	SaveManager.save_game()

	# Show notification.
	_show_save_notification()

	_is_activated = true
	checkpoint_activated.emit()


func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("player"):
		_player_in_area = true
		_player = body
		# Allow equipment changes while in checkpoint area.
		_set_equipment_access(true)


func _on_body_exited(body: Node2D) -> void:
	if body.is_in_group("player"):
		_player_in_area = false
		# Lock equipment changes outside checkpoint.
		_set_equipment_access(false)
		# Respawn non-boss enemies (emit signal for level to handle).
		_player = null


func _set_equipment_access(allowed: bool) -> void:
	if _player == null:
		return

	# Find AmuletController and ToolController on the player.
	for child in _player.get_children():
		if child is AmuletController:
			(child as AmuletController).can_change_equipment = allowed
		elif child is ToolController:
			(child as ToolController).can_change_equipment = allowed


func _show_save_notification() -> void:
	if notification_label == null:
		return
	notification_label.text = "Progress Saved"
	notification_label.visible = true
	notification_label.modulate.a = 1.0

	# Fade out after 2 seconds.
	var tween := create_tween()
	tween.tween_interval(2.0)
	tween.tween_property(notification_label, "modulate:a", 0.0, 0.5)
	tween.tween_callback(func(): notification_label.visible = false)


func _find_health_component(entity: Node) -> HealthComponent:
	for child in entity.get_children():
		if child is HealthComponent:
			return child as HealthComponent
	return null
