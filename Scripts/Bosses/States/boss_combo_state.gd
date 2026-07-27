class_name BossComboState extends BossState
## Boss combo state handling Basic Combo (3 strikes) and Advanced Combo (5 strikes).
## Basic: randomized inter-strike delays (8-20 frames each).
## Advanced: alternating slow (18-24) and fast (8-12) frame delays, direction adjustment.
## Counterattack: if player hits boss during active combo, cancel and counter within 6 frames.

## Basic combo inter-strike delay range (physics frames).
const BASIC_DELAY_MIN: int = 8
const BASIC_DELAY_MAX: int = 20
## Advanced combo slow strike delay range (physics frames).
const ADVANCED_SLOW_MIN: int = 18
const ADVANCED_SLOW_MAX: int = 24
## Advanced combo fast strike delay range (physics frames).
const ADVANCED_FAST_MIN: int = 8
const ADVANCED_FAST_MAX: int = 12
## Number of strikes in basic combo.
const BASIC_STRIKES: int = 3
## Number of strikes in advanced combo.
const ADVANCED_STRIKES: int = 5
## Frames within which counterattack must start after being hit.
const COUNTERATTACK_WINDOW_FRAMES: int = 6

## Whether this is an advanced combo (set before entering state).
var is_advanced: bool = false
## Current strike index (0-based).
var _current_strike: int = 0
## Total strikes for this combo.
var _total_strikes: int = 3
## Frame counter between strikes.
var _delay_counter: int = 0
## Delay before next strike in physics frames.
var _current_delay: int = 0
## Whether we're in the delay between strikes.
var _waiting_for_delay: bool = false
## Whether the current strike animation is playing.
var _strike_animating: bool = false
## Whether a counterattack was triggered.
var _counterattack_triggered: bool = false
## Frame counter for counterattack timing.
var _counterattack_frames: int = 0
## Whether the combo was interrupted by player damage.
var _was_interrupted: bool = false


func enter() -> void:
	if not boss:
		return
	_current_strike = 0
	_delay_counter = 0
	_waiting_for_delay = false
	_strike_animating = false
	_counterattack_triggered = false
	_counterattack_frames = 0
	_was_interrupted = false

	# Determine combo type from current attack name.
	var attack_name: String = str(boss.current_attack.attack_name)
	is_advanced = attack_name.contains("advanced")
	_total_strikes = ADVANCED_STRIKES if is_advanced else BASIC_STRIKES

	# Connect to hit detection for counterattack logic.
	if not boss.health_component.damage_taken.is_connected(_on_boss_hit_during_combo):
		boss.health_component.damage_taken.connect(_on_boss_hit_during_combo)

	# Connect animation finished.
	if not boss.animation_player.animation_finished.is_connected(_on_animation_finished):
		boss.animation_player.animation_finished.connect(_on_animation_finished)

	# Start with randomized startup delay.
	_waiting_for_delay = true
	_current_delay = _get_startup_delay()


func exit() -> void:
	# Disconnect signals.
	if boss.health_component.damage_taken.is_connected(_on_boss_hit_during_combo):
		boss.health_component.damage_taken.disconnect(_on_boss_hit_during_combo)

	if boss.animation_player.animation_finished.is_connected(_on_animation_finished):
		boss.animation_player.animation_finished.disconnect(_on_animation_finished)

	# Disable hitbox on exit.
	boss.hitbox_component.disable()


func physics_process(_delta: float) -> void:
	# Handle counterattack.
	if _counterattack_triggered:
		_counterattack_frames += 1
		if _counterattack_frames >= COUNTERATTACK_WINDOW_FRAMES:
			_execute_counterattack()
		return

	# Handle delay between strikes.
	if _waiting_for_delay:
		_delay_counter += 1
		if _delay_counter >= _current_delay:
			_waiting_for_delay = false
			_execute_strike()
		return

	# Strike animation playing — wait for it to finish via signal.


func can_transition_to(target: StringName) -> bool:
	# Always allow death transition.
	if target == BossStateMachine.STATE_DEATH:
		return true
	# Allow stagger (enters recover).
	if target == BossStateMachine.STATE_RECOVER:
		return true
	return true


## Executes the current strike.
func _execute_strike() -> void:
	_strike_animating = true

	# Update facing toward player for each strike (advanced combo adjusts direction).
	if is_advanced:
		boss.update_facing(boss.get_player_direction())

	# Enable hitbox with attack data.
	boss.hitbox_component.load_from_attack_resource(boss.current_attack)
	boss.hitbox_component.enable()

	# Play strike animation.
	var anim_name: String = "combo_strike_%d" % (_current_strike + 1)
	boss.animation_player.play(anim_name)


## Called when a strike animation finishes.
func _on_animation_finished(_anim_name: StringName) -> void:
	if _counterattack_triggered:
		return

	_strike_animating = false
	boss.hitbox_component.disable()

	_current_strike += 1

	# Check if combo is complete.
	if _current_strike >= _total_strikes:
		_finish_combo()
		return

	# Set up delay for next strike.
	_waiting_for_delay = true
	_delay_counter = 0
	_current_delay = _get_inter_strike_delay()


## Returns the startup delay before the first strike (frames).
func _get_startup_delay() -> int:
	# Randomize between 0.8-1.5 seconds worth of frames at 60 FPS.
	var attack_speed: float = boss.phase_controller.get_attack_speed_multiplier()
	var base_frames: int = randi_range(48, 90)  # 0.8s-1.5s at 60fps
	return maxi(int(float(base_frames) / attack_speed), 4)


## Returns the inter-strike delay for the current combo type (frames).
func _get_inter_strike_delay() -> int:
	var attack_speed: float = boss.phase_controller.get_attack_speed_multiplier()

	if is_advanced:
		# Alternate slow and fast.
		var is_slow_strike: bool = (_current_strike % 2 == 0)
		var base_delay: int
		if is_slow_strike:
			base_delay = randi_range(ADVANCED_SLOW_MIN, ADVANCED_SLOW_MAX)
		else:
			base_delay = randi_range(ADVANCED_FAST_MIN, ADVANCED_FAST_MAX)
		return maxi(int(float(base_delay) / attack_speed), 4)
	else:
		var base_delay: int = randi_range(BASIC_DELAY_MIN, BASIC_DELAY_MAX)
		return maxi(int(float(base_delay) / attack_speed), 4)


## Called when the player hits the boss during an active combo.
func _on_boss_hit_during_combo(_amount: int, _source: Node) -> void:
	if _counterattack_triggered or _was_interrupted:
		return

	# Cancel remaining strikes and trigger counterattack.
	_counterattack_triggered = true
	_counterattack_frames = 0
	_was_interrupted = true

	# Cancel current animation.
	boss.hitbox_component.disable()


## Executes the counterattack after the COUNTERATTACK_WINDOW_FRAMES delay.
func _execute_counterattack() -> void:
	_counterattack_triggered = false

	# Play counterattack animation and enable hitbox.
	boss.hitbox_component.load_from_attack_resource(boss.current_attack)
	boss.hitbox_component.enable()
	boss.animation_player.play("counterattack")

	# After counterattack, transition to recover.
	# The animation_finished signal will handle this.
	_current_strike = _total_strikes  # Ensure combo ends after counter.


## Finishes the combo and transitions to recover or follow-up.
func _finish_combo() -> void:
	if is_advanced:
		# Advanced Combo: recover window >= 1.5x Basic Combo recover.
		var recover_state: BossRecoverState = state_machine.get_state(BossStateMachine.STATE_RECOVER) as BossRecoverState
		if recover_state:
			recover_state.advanced_combo_multiplier = 1.5
	else:
		# Basic Combo follow-up: if player in melee range, chain; otherwise recover.
		var player_dist: float = boss.get_player_distance()
		if player_dist < 96.0:  # Melee range (< 3 character widths)
			# Chain next attack without recover.
			state_machine.transition_to(BossStateMachine.STATE_IDLE)
			return

	state_machine.transition_to(BossStateMachine.STATE_RECOVER)
