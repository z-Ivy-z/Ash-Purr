class_name ArenaCatKeeper extends Node2D
## Arena scene for the Cat Keeper boss encounter.
## Contains: Player, Boss, CombatManager, HUD, DialogueSystem, audio systems.
## Manages the encounter flow: intro → fight → death/victory.
## Requirements: 17.1-17.7

const PAUSE_MENU_SCENE: String = "res://Scenes/UI/PauseMenu.tscn"
const DEATH_SCREEN_SCENE: String = "res://Scenes/UI/DeathScreen.tscn"
const VICTORY_SCREEN_SCENE: String = "res://Scenes/UI/VictoryScreen.tscn"

@onready var player: Player = $Player
@onready var boss: CatKeeper = $CatKeeper
@onready var combat_manager: CombatManager = $CombatManager
@onready var hud: HUD = $HUD
@onready var dialogue_system: DialogueSystem = $DialogueSystem
@onready var combat_audio: CombatAudio = $CombatAudio
@onready var phase_music: PhaseMusic = $PhaseMusic
@onready var dialogue_voice: DialogueVoice = $DialogueVoice
@onready var camera: Camera2D = $Player/Camera2D


func _ready() -> void:
	# Wire combat manager to hitbox/hurtbox signals.
	player.hurtbox_component.hurt.connect(_on_player_hurt)
	boss.hurtbox_component.hurt.connect(_on_boss_hurt)

	# Wire HUD connections.
	hud.connect_player(player.health_component)
	hud.connect_boss(boss.health_component, "The Cat Keeper")
	hud.connect_tool(player.tool_controller)

	# Wire player death.
	player.player_died.connect(_on_player_died)

	# Wire boss defeat.
	boss.boss_defeated.connect(_on_boss_defeated)

	# Wire phase 2 HUD effect.
	boss.phase_controller.phase_changed.connect(_on_boss_phase_changed)

	# Wire dialogue blocking.
	dialogue_system.dialogue_started.connect(_on_dialogue_started)
	dialogue_system.dialogue_finished.connect(_on_dialogue_finished)

	# Set GameManager state.
	GameManager.current_scene_id = &"arena_cat_keeper"
	GameManager.is_player_alive = true
	GameManager.current_boss_phase = 1

	# Start intro sequence.
	_start_intro()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and not GameManager.is_paused:
		_open_pause_menu()
		get_viewport().set_input_as_handled()


func _on_player_hurt(hitbox: HitboxComponent) -> void:
	combat_manager.process_hit(hitbox, player.hurtbox_component)


func _on_boss_hurt(hitbox: HitboxComponent) -> void:
	combat_manager.process_hit(hitbox, boss.hurtbox_component)


func _on_player_died() -> void:
	GameManager.is_player_alive = false
	# Show death screen after brief delay.
	await get_tree().create_timer(1.0).timeout
	var death_scene := load(DEATH_SCREEN_SCENE) as PackedScene
	if death_scene:
		var screen := death_scene.instantiate()
		add_child(screen)


func _on_boss_defeated() -> void:
	# Record boss defeat permanently in save.
	SaveManager.save_game()
	# Show victory screen.
	await get_tree().create_timer(1.5).timeout
	var victory_scene := load(VICTORY_SCREEN_SCENE) as PackedScene
	if victory_scene:
		var screen := victory_scene.instantiate()
		add_child(screen)


func _on_boss_phase_changed(new_phase: int) -> void:
	if new_phase == 2:
		hud.apply_phase_2_effect()


func _on_dialogue_started() -> void:
	# Block player movement/combat inputs during dialogue.
	player.set_physics_process(false)
	player.set_process_input(false)


func _on_dialogue_finished() -> void:
	# Restore player inputs within 200ms.
	await get_tree().create_timer(0.2).timeout
	player.set_physics_process(true)
	player.set_process_input(true)

	# After intro dialogue: show boss health bar, enable boss AI, start music.
	hud.show_boss_health()
	boss.state_machine.enable_ai()
	phase_music.start_encounter_music()


func _start_intro() -> void:
	# Boss AI disabled until intro completes.
	boss.state_machine.disable_ai()

	# Start intro dialogue.
	var intro_entries: Array[Dictionary] = [
		{"text": "You dare enter my domain, little one?"},
		{"text": "These cats are mine to keep. Mine to protect."},
		{"text": "If you want them back... you will have to take them."},
	]
	dialogue_system.start_dialogue(intro_entries)


func _open_pause_menu() -> void:
	var pause_scene := load(PAUSE_MENU_SCENE) as PackedScene
	if pause_scene:
		var menu := pause_scene.instantiate()
		add_child(menu)
