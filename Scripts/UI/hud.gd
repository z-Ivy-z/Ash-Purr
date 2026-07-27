class_name HUD extends CanvasLayer
## In-game HUD displaying player health, tool cooldown, amulet icon, and boss health.
## Requirements: 12.1-12.8

## Duration for smooth health bar animation (seconds).
const HEALTH_ANIM_DURATION: float = 0.3

@onready var player_health_bar: ProgressBar = $PlayerHealthContainer/PlayerHealthBar
@onready var tool_icon: TextureRect = $PlayerHealthContainer/ToolIcon
@onready var tool_cooldown_overlay: TextureProgressBar = $PlayerHealthContainer/ToolIcon/CooldownOverlay
@onready var amulet_icon: TextureRect = $PlayerHealthContainer/AmuletIcon
@onready var boss_health_container: Control = $BossHealthContainer
@onready var boss_health_bar: ProgressBar = $BossHealthContainer/BossHealthBar
@onready var boss_name_label: Label = $BossHealthContainer/BossNameLabel

var _player_health_tween: Tween = null
var _boss_health_tween: Tween = null


func _ready() -> void:
	# Hide boss health bar initially (shown after intro).
	boss_health_container.visible = false


## Connects to a player's HealthComponent to track HP changes.
func connect_player(health: HealthComponent) -> void:
	health.health_changed.connect(_on_player_health_changed)
	player_health_bar.max_value = health.max_health
	player_health_bar.value = health.current_health


## Connects to a boss's HealthComponent to track HP changes.
func connect_boss(health: HealthComponent, boss_display_name: String) -> void:
	health.health_changed.connect(_on_boss_health_changed)
	health.died.connect(_on_boss_died)
	boss_health_bar.max_value = health.max_health
	boss_health_bar.value = health.current_health
	boss_name_label.text = boss_display_name


## Shows the boss health bar (called after intro sequence).
func show_boss_health() -> void:
	boss_health_container.visible = true


## Hides the boss health bar within 1 second of defeat.
func hide_boss_health() -> void:
	var tween := create_tween()
	tween.tween_property(boss_health_container, "modulate:a", 0.0, 1.0)
	tween.tween_callback(func(): boss_health_container.visible = false)


## Connects to a ToolController to track cooldown.
func connect_tool(tool_ctrl: ToolController) -> void:
	tool_ctrl.cooldown_updated.connect(_on_tool_cooldown_updated)
	tool_ctrl.tool_activated.connect(_on_tool_activated)


## Updates tool icon based on equipped tool.
func update_tool_icon(tool_res: ToolResource) -> void:
	if tool_res and tool_res.icon:
		tool_icon.texture = tool_res.icon
		tool_icon.modulate = Color.WHITE
	else:
		tool_icon.texture = null


## Updates amulet icon based on equipped amulet.
func update_amulet_icon(amulet_res: AmuletResource) -> void:
	if amulet_res and amulet_res.icon:
		amulet_icon.texture = amulet_res.icon
	else:
		amulet_icon.texture = null


## Applies Phase 2 visual effect to boss health bar (crack/color shift).
func apply_phase_2_effect() -> void:
	boss_health_bar.modulate = Color(0.8, 0.2, 0.2, 1.0)


func _on_player_health_changed(current: int, max_hp: int) -> void:
	player_health_bar.max_value = max_hp
	if _player_health_tween and _player_health_tween.is_valid():
		_player_health_tween.kill()
	_player_health_tween = create_tween()
	_player_health_tween.tween_property(player_health_bar, "value", float(current), HEALTH_ANIM_DURATION)


func _on_boss_health_changed(current: int, max_hp: int) -> void:
	boss_health_bar.max_value = max_hp
	if _boss_health_tween and _boss_health_tween.is_valid():
		_boss_health_tween.kill()
	_boss_health_tween = create_tween()
	_boss_health_tween.tween_property(boss_health_bar, "value", float(current), HEALTH_ANIM_DURATION)


func _on_boss_died() -> void:
	hide_boss_health()


func _on_tool_cooldown_updated(remaining: float, total: float) -> void:
	if total <= 0.0:
		tool_cooldown_overlay.value = 0.0
		tool_icon.modulate = Color.WHITE
		return
	tool_cooldown_overlay.max_value = total
	tool_cooldown_overlay.value = remaining
	# Desaturate icon when on cooldown.
	tool_icon.modulate = Color(0.5, 0.5, 0.5) if remaining > 0.0 else Color.WHITE


func _on_tool_activated(_tool: ToolResource) -> void:
	# Brief flash effect on tool icon.
	tool_icon.modulate = Color(1.5, 1.5, 1.5)
	var tween := create_tween()
	tween.tween_property(tool_icon, "modulate", Color(0.5, 0.5, 0.5), 0.1)
