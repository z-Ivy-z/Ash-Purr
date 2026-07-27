class_name AttackSelector extends Node
## Selects the next boss attack based on player distance and combat rules.
## Close range (<3 character-widths): Basic/Advanced Combo.
## Far range (>5 character-widths): Assault or Swift Slash.
## Never repeats the same combo type consecutively.
## Randomizes startup delay within 0.8-1.5 seconds.

## Distance thresholds in pixels (character width ≈ 32px).
const CLOSE_RANGE: float = 96.0   # 3 character widths
const FAR_RANGE: float = 160.0    # 5 character widths

## Attack resource references (exported for scene assignment).
@export var basic_combo: AttackResource
@export var advanced_combo: AttackResource
@export var swift_slash: AttackResource
@export var assault: AttackResource
@export var seismic_strike: AttackResource

## Tracks the last attack type to prevent consecutive repeats.
var _last_attack_type: StringName = &""
## Tracks last assault count for Phase 2 double assault.
var _consecutive_assault_count: int = 0

## Reference to phase controller for Phase 2 chaining rules.
@export var phase_controller: PhaseController


## Selects the next attack based on player distance and combat rules.
## Returns null if no valid attack is available (triggers walk behavior).
func select_next_attack(player_distance: float) -> AttackResource:
	var candidates: Array[AttackResource] = []

	if player_distance < CLOSE_RANGE:
		# Close range: combo attacks.
		candidates = _get_close_range_attacks()
	elif player_distance > FAR_RANGE:
		# Far range: gap-closers.
		candidates = _get_far_range_attacks()
	else:
		# Mid range: any attack is valid.
		candidates = _get_mid_range_attacks()

	if candidates.is_empty():
		return null

	# Pick a random candidate from the filtered list.
	var selected: AttackResource = candidates[randi() % candidates.size()]
	_last_attack_type = selected.attack_name

	# Track assault count for Phase 2 double assault.
	if str(selected.attack_name).contains("assault"):
		_consecutive_assault_count += 1
	else:
		_consecutive_assault_count = 0

	return selected


## Returns valid close-range attacks, excluding consecutive same-type combos.
func _get_close_range_attacks() -> Array[AttackResource]:
	var attacks: Array[AttackResource] = []

	# Never repeat same combo type consecutively.
	if basic_combo and _last_attack_type != basic_combo.attack_name:
		attacks.append(basic_combo)
	if advanced_combo and _last_attack_type != advanced_combo.attack_name:
		attacks.append(advanced_combo)

	# If both were filtered out (shouldn't happen), allow any.
	if attacks.is_empty():
		if basic_combo:
			attacks.append(basic_combo)
		if advanced_combo:
			attacks.append(advanced_combo)

	return attacks


## Returns valid far-range attacks (gap closers).
func _get_far_range_attacks() -> Array[AttackResource]:
	var attacks: Array[AttackResource] = []

	if assault:
		# Phase 2: allow double assault. Phase 1: no consecutive assault.
		var can_assault: bool = true
		if _consecutive_assault_count >= 1:
			if phase_controller and phase_controller.current_config.can_double_assault:
				can_assault = _consecutive_assault_count < 2
			else:
				can_assault = false
		if can_assault:
			attacks.append(assault)

	if swift_slash and _last_attack_type != swift_slash.attack_name:
		attacks.append(swift_slash)

	# Seismic strike can be used at far range too.
	if seismic_strike:
		attacks.append(seismic_strike)

	if attacks.is_empty() and assault:
		attacks.append(assault)

	return attacks


## Returns valid mid-range attacks (mix of close and far options).
func _get_mid_range_attacks() -> Array[AttackResource]:
	var attacks: Array[AttackResource] = []

	# Include close-range options.
	if basic_combo and _last_attack_type != basic_combo.attack_name:
		attacks.append(basic_combo)
	if advanced_combo and _last_attack_type != advanced_combo.attack_name:
		attacks.append(advanced_combo)

	# Include far-range options.
	if swift_slash and _last_attack_type != swift_slash.attack_name:
		attacks.append(swift_slash)
	if assault:
		var can_assault: bool = _consecutive_assault_count < 1
		if phase_controller and phase_controller.current_config.can_double_assault:
			can_assault = _consecutive_assault_count < 2
		if can_assault:
			attacks.append(assault)
	if seismic_strike:
		attacks.append(seismic_strike)

	return attacks


## Resets internal state (called on phase transition or boss reset).
func reset() -> void:
	_last_attack_type = &""
	_consecutive_assault_count = 0
