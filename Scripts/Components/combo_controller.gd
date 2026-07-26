class_name ComboController extends Node
## Manages the 3-hit combo sequence and chaining windows for the Player.
## The combo window is the period (10-15 frames) after the hitbox deactivates
## where the player can press attack to chain into the next hit.
## AnimationPlayer method calls trigger open/close of the combo window externally.

## Emitted when the third combo hit completes (full combo executed).
signal combo_completed()
## Emitted when the combo is broken (window expired or combo reset while active).
signal combo_broken()

## Current step in the combo sequence.
## 0 = no active combo, 1 = first hit active, 2 = second hit active, 3 = third hit active.
var current_combo_step: int = 0
## Whether the player is currently within the combo chaining window.
var is_in_combo_window: bool = false

## Duration of the current combo window in physics frames.
var _combo_window_duration: int = 12
## Frame counter tracking how long the combo window has been open.
var _window_frame_counter: int = 0
## Whether the window is actively counting frames.
var _window_active: bool = false


## Attempts to advance the combo to the next step.
## Returns true if the chain succeeds:
## - Step 0 → 1 is always allowed (starting a new combo).
## - Steps 1 → 2 and 2 → 3 require is_in_combo_window == true.
## After advancing to step 3, emits combo_completed (no further advances possible).
func advance_combo() -> bool:
	# Starting a new combo from step 0 is always allowed.
	if current_combo_step == 0:
		current_combo_step = 1
		is_in_combo_window = false
		_close_window_internal()
		return true

	# Chaining requires being within the combo window and not at max step.
	if is_in_combo_window and current_combo_step < 3:
		current_combo_step += 1
		is_in_combo_window = false
		_close_window_internal()

		if current_combo_step == 3:
			combo_completed.emit()

		return true

	return false


## Resets the combo to step 0. Emits combo_broken if a combo was active.
func reset_combo() -> void:
	var was_active: bool = current_combo_step > 0
	current_combo_step = 0
	is_in_combo_window = false
	_close_window_internal()

	if was_active:
		combo_broken.emit()


## Opens the combo window, starting the frame counter.
## Called externally by AnimationPlayer method tracks at the appropriate frame.
func open_combo_window() -> void:
	is_in_combo_window = true
	_window_frame_counter = 0
	_window_active = true


## Closes the combo window manually.
## Called externally by AnimationPlayer method tracks or when window expires.
## If the combo was active and no advance happened, emits combo_broken.
func close_combo_window() -> void:
	if is_in_combo_window and current_combo_step > 0:
		# Window closed without the player advancing — combo breaks.
		is_in_combo_window = false
		_close_window_internal()
		combo_broken.emit()
		current_combo_step = 0
	else:
		is_in_combo_window = false
		_close_window_internal()


## Sets the combo window duration in physics frames.
## Typically derived from AttackResource: combo_window_end_frame - combo_window_start_frame.
func set_combo_window_duration(frames: int) -> void:
	_combo_window_duration = clampi(frames, 1, 60)


## Tracks combo window frame timing. When the counter exceeds the duration,
## the window closes automatically.
func _physics_process(_delta: float) -> void:
	if not _window_active:
		return

	_window_frame_counter += 1

	if _window_frame_counter >= _combo_window_duration:
		close_combo_window()


## Internal helper to stop frame counting without side effects.
func _close_window_internal() -> void:
	_window_active = false
	_window_frame_counter = 0
