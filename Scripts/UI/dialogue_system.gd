class_name DialogueSystem extends CanvasLayer
## Dialogue system with character-by-character text rendering.
## Blocks player movement/combat inputs while active.
## Advance input: completes line if typing, next line if complete, close if done.
## Requirements: 14.1-14.7

## Text rendering speed in characters per second.
const CHARS_PER_SECOND_MIN: float = 30.0
const CHARS_PER_SECOND_MAX: float = 50.0
const CHARS_PER_SECOND: float = 40.0

## Emitted when dialogue starts (to block player input).
signal dialogue_started()
## Emitted when dialogue ends (to restore player input).
signal dialogue_finished()
## Emitted for each character displayed (for vocalization system).
signal character_displayed(character: String)

@onready var dialogue_window: PanelContainer = $DialogueWindow
@onready var text_label: RichTextLabel = $DialogueWindow/MarginContainer/HBoxContainer/TextLabel
@onready var portrait: TextureRect = $DialogueWindow/MarginContainer/HBoxContainer/Portrait

## The dialogue entries to display. Each entry has "text" and optional "portrait".
var _entries: Array[Dictionary] = []
var _current_entry_index: int = 0
var _current_visible_chars: float = 0.0
var _target_visible_chars: int = 0
var _is_typing: bool = false
var _is_active: bool = false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	dialogue_window.visible = false
	set_process(false)


func _process(delta: float) -> void:
	if not _is_typing:
		return

	_current_visible_chars += CHARS_PER_SECOND * delta
	var new_count: int = mini(int(_current_visible_chars), _target_visible_chars)

	# Emit character_displayed for each new character (vocalization).
	var old_count: int = text_label.visible_characters
	for i in range(old_count, new_count):
		var full_text: String = text_label.text
		if i < full_text.length():
			character_displayed.emit(full_text[i])

	text_label.visible_characters = new_count

	if new_count >= _target_visible_chars:
		_is_typing = false


func _unhandled_input(event: InputEvent) -> void:
	if not _is_active:
		return

	if event.is_action_pressed("advance_dialogue") or event.is_action_pressed("interact"):
		if _is_typing:
			# Complete current line immediately.
			_complete_current_line()
		else:
			# Advance to next line or close.
			_advance()
		get_viewport().set_input_as_handled()


## Starts a dialogue sequence from an array of entries.
## Each entry: {"text": "Hello!", "portrait": <Texture2D or null>}
func start_dialogue(entries: Array[Dictionary]) -> void:
	if entries.is_empty():
		return

	_entries = entries
	_current_entry_index = 0
	_is_active = true

	dialogue_window.visible = true
	dialogue_started.emit()
	set_process(true)

	_display_entry(_entries[0])


## Closes the dialogue and restores input.
func close_dialogue() -> void:
	_is_active = false
	_is_typing = false
	dialogue_window.visible = false
	set_process(false)
	dialogue_finished.emit()


func _display_entry(entry: Dictionary) -> void:
	var text: String = entry.get("text", "")
	text_label.text = text
	text_label.visible_characters = 0
	_current_visible_chars = 0.0
	_target_visible_chars = text.length()
	_is_typing = true

	# Set portrait if provided.
	var portrait_tex: Texture2D = entry.get("portrait", null) as Texture2D
	if portrait_tex:
		portrait.texture = portrait_tex
		portrait.visible = true
	else:
		portrait.visible = false


func _complete_current_line() -> void:
	_is_typing = false
	text_label.visible_characters = _target_visible_chars


func _advance() -> void:
	_current_entry_index += 1
	if _current_entry_index >= _entries.size():
		close_dialogue()
	else:
		_display_entry(_entries[_current_entry_index])
