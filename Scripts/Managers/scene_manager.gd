## SceneManager Autoload Singleton
## Handles all scene transitions with fade effects and memory management.
## Requirement 23.1: Handles all scene transitions (menu, gameplay, death, victory, retry).
## Requirement 23.2: Applies fade transition effect with duration between 200-500ms.
## Requirement 21.4: Frees unused scene instances on transition to prevent memory leaks.
extends Node

# --- Signals ---

## Emitted when a scene transition begins (fade-out starts).
signal transition_started()

## Emitted when a scene transition completes (fade-in finishes).
signal transition_completed()

# --- Constants ---

const MIN_FADE_DURATION: float = 0.2  # 200ms minimum total
const MAX_FADE_DURATION: float = 0.5  # 500ms maximum total
const FADE_LAYER: int = 100  # High canvas layer to render above everything

# --- Node References ---

var _canvas_layer: CanvasLayer
var _color_rect: ColorRect

# --- State ---

## Whether a transition is currently in progress.
var is_transitioning: bool = false

# --- Lifecycle ---

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_setup_fade_overlay()


# --- Public Methods ---

## Transitions to a new scene at the given path with a fade effect.
## fade_duration is the TOTAL duration (fade-out + fade-in). Clamped to 200-500ms.
func transition_to(scene_path: String, fade_duration: float = 0.3) -> void:
	if is_transitioning:
		return

	is_transitioning = true
	fade_duration = clampf(fade_duration, MIN_FADE_DURATION, MAX_FADE_DURATION)
	var half_duration: float = fade_duration / 2.0

	transition_started.emit()

	# Fade to black
	await _fade_to_black(half_duration)

	# Change scene (Godot frees the old scene automatically)
	var error := get_tree().change_scene_to_file(scene_path)
	if error != OK:
		push_error("SceneManager: Failed to change scene to '%s'. Error: %d" % [scene_path, error])
		# Still fade back even on error to avoid stuck black screen
	
	# Wait one frame for the new scene to be ready
	await get_tree().process_frame

	# Fade from black
	await _fade_from_black(half_duration)

	is_transitioning = false
	transition_completed.emit()


## Reloads the current scene with the same fade transition.
func reload_current_scene(fade_duration: float = 0.3) -> void:
	if is_transitioning:
		return

	is_transitioning = true
	fade_duration = clampf(fade_duration, MIN_FADE_DURATION, MAX_FADE_DURATION)
	var half_duration: float = fade_duration / 2.0

	transition_started.emit()

	# Fade to black
	await _fade_to_black(half_duration)

	# Reload current scene (Godot frees the old scene automatically)
	var error := get_tree().reload_current_scene()
	if error != OK:
		push_error("SceneManager: Failed to reload current scene. Error: %d" % error)

	# Wait one frame for the reloaded scene to be ready
	await get_tree().process_frame

	# Fade from black
	await _fade_from_black(half_duration)

	is_transitioning = false
	transition_completed.emit()


# --- Private Methods ---

## Sets up the fade overlay. Uses existing scene-tree nodes if present,
## otherwise creates them dynamically (for flexibility).
func _setup_fade_overlay() -> void:
	_canvas_layer = get_node_or_null("FadeLayer") as CanvasLayer
	if _canvas_layer == null:
		_canvas_layer = CanvasLayer.new()
		_canvas_layer.layer = FADE_LAYER
		_canvas_layer.name = "FadeLayer"
		add_child(_canvas_layer)

	_color_rect = _canvas_layer.get_node_or_null("FadeOverlay") as ColorRect
	if _color_rect == null:
		_color_rect = ColorRect.new()
		_color_rect.name = "FadeOverlay"
		_color_rect.color = Color.BLACK
		_color_rect.anchors_preset = Control.PRESET_FULL_RECT
		_color_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_color_rect.modulate.a = 0.0
		_canvas_layer.add_child(_color_rect)
	else:
		# Ensure starting state is transparent
		_color_rect.modulate.a = 0.0


## Tweens the overlay from transparent to opaque (fade to black).
func _fade_to_black(duration: float) -> void:
	var tween := create_tween()
	tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(_color_rect, "modulate:a", 1.0, duration)
	await tween.finished


## Tweens the overlay from opaque to transparent (fade from black).
func _fade_from_black(duration: float) -> void:
	var tween := create_tween()
	tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tween.tween_property(_color_rect, "modulate:a", 0.0, duration)
	await tween.finished
