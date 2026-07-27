class_name DialogueVoice extends Node
## Plays expressive gibberish vocalizations during dialogue text display.
## Varies pitch and rhythm per character for expressiveness.
## Stops immediately when text finishes or dialogue closes.
## Requirements: 14.2

## Base vocalization sound (short syllable sample).
@export var voice_sample: AudioStream
## Minimum pitch scale for variation.
@export var pitch_min: float = 0.8
## Maximum pitch scale for variation.
@export var pitch_max: float = 1.4
## Minimum characters between vocalization sounds (rhythm variation).
@export var min_chars_between: int = 1
## Maximum characters between vocalization sounds.
@export var max_chars_between: int = 3

var _char_counter: int = 0
var _next_voice_at: int = 1
var _voice_player: AudioStreamPlayer
var _dialogue_system: DialogueSystem = null


func _ready() -> void:
	_voice_player = AudioStreamPlayer.new()
	_voice_player.bus = AudioManager.BUS_SFX
	_voice_player.name = "VoicePlayer"
	add_child(_voice_player)

	# Find dialogue system in the scene tree.
	await get_tree().process_frame
	_find_and_connect_dialogue()


func _find_and_connect_dialogue() -> void:
	# Search for DialogueSystem in the scene.
	var nodes := get_tree().get_nodes_in_group("dialogue_system")
	if nodes.size() > 0:
		_dialogue_system = nodes[0] as DialogueSystem
	else:
		# Try to find by type in the tree.
		_dialogue_system = _find_dialogue_recursive(get_tree().current_scene)

	if _dialogue_system:
		_dialogue_system.character_displayed.connect(_on_character_displayed)
		_dialogue_system.dialogue_finished.connect(_on_dialogue_finished)


func _find_dialogue_recursive(node: Node) -> DialogueSystem:
	if node is DialogueSystem:
		return node as DialogueSystem
	for child in node.get_children():
		var found := _find_dialogue_recursive(child)
		if found:
			return found
	return null


func _on_character_displayed(character: String) -> void:
	# Skip whitespace and punctuation for voice.
	if character == " " or character == "\n" or character == "." or character == ",":
		return

	_char_counter += 1
	if _char_counter >= _next_voice_at:
		_play_voice_sample()
		_char_counter = 0
		_next_voice_at = randi_range(min_chars_between, max_chars_between)


func _play_voice_sample() -> void:
	if voice_sample == null:
		return
	_voice_player.stream = voice_sample
	_voice_player.pitch_scale = randf_range(pitch_min, pitch_max)
	_voice_player.play()


func _on_dialogue_finished() -> void:
	_voice_player.stop()
	_char_counter = 0
