## AudioManager Autoload Singleton
## Manages audio buses, SFX playback, music streaming, and music ducking.
## Requirements: 15.1, 15.6, 15.7
extends Node

# --- Constants ---

const BUS_MASTER: StringName = &"Master"
const BUS_MUSIC: StringName = &"Music"
const BUS_SFX: StringName = &"SFX"
const BUS_UI: StringName = &"UI"
const BUS_AMBIENCE: StringName = &"Ambience"

const MAX_SFX_PLAYERS: int = 8

# --- Signals ---

## Emitted when music crossfade completes.
signal music_changed()

# --- Node References ---

var _music_player_a: AudioStreamPlayer
var _music_player_b: AudioStreamPlayer
var _active_music_player: AudioStreamPlayer
var _sfx_players: Array[AudioStreamPlayer] = []
var _sfx_index: int = 0

# --- State ---

var _is_ducking: bool = false
var _duck_tween: Tween = null


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_setup_audio_buses()
	_setup_players()
	_apply_saved_volumes()


## Plays a one-shot sound effect on the specified bus.
func play_sfx(stream: AudioStream, bus: StringName = BUS_SFX) -> void:
	if stream == null:
		return
	var player: AudioStreamPlayer = _sfx_players[_sfx_index]
	player.stream = stream
	player.bus = bus
	player.play()
	_sfx_index = (_sfx_index + 1) % MAX_SFX_PLAYERS


## Plays music with optional crossfade from the current track.
func play_music(stream: AudioStream, crossfade_duration: float = 1.0) -> void:
	if stream == null:
		return

	var new_player: AudioStreamPlayer
	if _active_music_player == _music_player_a:
		new_player = _music_player_b
	else:
		new_player = _music_player_a

	new_player.stream = stream
	new_player.volume_db = -80.0
	new_player.play()

	# Crossfade tween.
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(new_player, "volume_db", 0.0, crossfade_duration)
	if _active_music_player.playing:
		tween.tween_property(_active_music_player, "volume_db", -80.0, crossfade_duration)
	tween.set_parallel(false)
	tween.tween_callback(func():
		_active_music_player.stop()
		_active_music_player = new_player
		music_changed.emit()
	)


## Ducks music volume by the given amount (in dB) for the specified duration.
## Used for special attack telegraphs: duck by >= 6dB for 500-1000ms.
func duck_music(amount_db: float, duration: float) -> void:
	if _is_ducking:
		return
	_is_ducking = true

	var original_db: float = _active_music_player.volume_db

	if _duck_tween and _duck_tween.is_valid():
		_duck_tween.kill()

	_duck_tween = create_tween()
	_duck_tween.tween_property(_active_music_player, "volume_db", original_db - amount_db, 0.05)
	_duck_tween.tween_interval(duration)
	_duck_tween.tween_property(_active_music_player, "volume_db", original_db, 0.2)
	_duck_tween.tween_callback(func(): _is_ducking = false)


## Sets the volume for the given bus using a linear value (0.0 to 1.0).
func set_bus_volume(bus: StringName, linear: float) -> void:
	linear = clampf(linear, 0.0, 1.0)
	var bus_idx: int = AudioServer.get_bus_index(bus)
	if bus_idx == -1:
		return
	var db: float = linear_to_db(linear) if linear > 0.0 else -80.0
	AudioServer.set_bus_volume_db(bus_idx, db)


## Gets the linear volume for the given bus (0.0 to 1.0).
func get_bus_volume(bus: StringName) -> float:
	var bus_idx: int = AudioServer.get_bus_index(bus)
	if bus_idx == -1:
		return 1.0
	var db: float = AudioServer.get_bus_volume_db(bus_idx)
	return db_to_linear(db)


## Stops all music playback.
func stop_music() -> void:
	_music_player_a.stop()
	_music_player_b.stop()


# --- Private Setup ---

func _setup_audio_buses() -> void:
	# Ensure buses exist. Godot loads them from default_bus_layout.tres,
	# but we verify and create missing ones at runtime.
	_ensure_bus(BUS_MUSIC, BUS_MASTER)
	_ensure_bus(BUS_SFX, BUS_MASTER)
	_ensure_bus(BUS_UI, BUS_MASTER)
	_ensure_bus(BUS_AMBIENCE, BUS_MASTER)


func _ensure_bus(bus_name: StringName, parent_bus: StringName) -> void:
	if AudioServer.get_bus_index(bus_name) != -1:
		return
	var idx: int = AudioServer.bus_count
	AudioServer.add_bus(idx)
	AudioServer.set_bus_name(idx, bus_name)
	var parent_idx: int = AudioServer.get_bus_index(parent_bus)
	if parent_idx != -1:
		AudioServer.set_bus_send(idx, parent_bus)


func _setup_players() -> void:
	_music_player_a = AudioStreamPlayer.new()
	_music_player_a.bus = BUS_MUSIC
	_music_player_a.name = "MusicPlayerA"
	add_child(_music_player_a)

	_music_player_b = AudioStreamPlayer.new()
	_music_player_b.bus = BUS_MUSIC
	_music_player_b.name = "MusicPlayerB"
	add_child(_music_player_b)

	_active_music_player = _music_player_a

	# Create SFX player pool.
	for i in range(MAX_SFX_PLAYERS):
		var player := AudioStreamPlayer.new()
		player.bus = BUS_SFX
		player.name = "SFXPlayer_%d" % i
		add_child(player)
		_sfx_players.append(player)


func _apply_saved_volumes() -> void:
	set_bus_volume(BUS_MASTER, SettingsManager.master_volume)
	set_bus_volume(BUS_MUSIC, SettingsManager.music_volume)
	set_bus_volume(BUS_SFX, SettingsManager.sfx_volume)
	set_bus_volume(BUS_UI, SettingsManager.ui_volume)
	set_bus_volume(BUS_AMBIENCE, SettingsManager.ambience_volume)
