class_name BossStateMachine extends Node
## Manages boss state transitions with one active state at a time.
## Same pattern as PlayerStateMachine but for the Cat Keeper boss.
## Each BossState is a child node registered by lowercase name on _ready.

## Emitted whenever the active state changes.
signal state_changed(old_state: StringName, new_state: StringName)

## State name constants for the boss.
const STATE_IDLE: StringName = &"idle"
const STATE_WALK: StringName = &"walk"
const STATE_ATTACK: StringName = &"attack"
const STATE_COMBO: StringName = &"combo"
const STATE_RECOVER: StringName = &"recover"
const STATE_SPECIAL_ATTACK: StringName = &"special_attack"
const STATE_PHASE_TRANSITION: StringName = &"phase_transition"
const STATE_DEATH: StringName = &"death"

## The currently active state node.
var current_state: BossState = null

## Dictionary mapping state name (StringName) → BossState node.
var _states: Dictionary = {}

## The CharacterBody2D boss node this state machine controls.
@export var boss: CharacterBody2D = null

## The initial state to enter on _ready.
@export var initial_state: StringName = STATE_IDLE

## Whether the boss AI is enabled (disabled during intro sequence).
var ai_enabled: bool = false


func _ready() -> void:
	# Register all child BossState nodes by their node name (lowercased).
	for child in get_children():
		if child is BossState:
			var state_name: StringName = StringName(child.name.to_lower())
			_states[state_name] = child
			child.state_machine = self
			child.boss = boss

	# Enter the initial state.
	if _states.has(initial_state):
		current_state = _states[initial_state]
		current_state.enter()
	else:
		push_warning("BossStateMachine: initial state '%s' not found." % initial_state)


func _process(delta: float) -> void:
	if current_state and ai_enabled:
		current_state.process(delta)


func _physics_process(delta: float) -> void:
	if current_state and ai_enabled:
		current_state.physics_process(delta)


## Validates and executes a transition from the current state to [param new_state_name].
func transition_to(new_state_name: StringName) -> void:
	if not _states.has(new_state_name):
		push_warning("BossStateMachine: state '%s' does not exist." % new_state_name)
		return

	if current_state and not current_state.can_transition_to(new_state_name):
		return

	var old_state_name: StringName = &""
	if current_state:
		old_state_name = StringName(current_state.name.to_lower())
		current_state.exit()

	current_state = _states[new_state_name]
	current_state.enter()
	state_changed.emit(old_state_name, new_state_name)


## Returns the BossState node for the given name, or null.
func get_state(state_name: StringName) -> BossState:
	return _states.get(state_name, null)


## Returns whether the machine has a registered state with the given name.
func has_state(state_name: StringName) -> bool:
	return _states.has(state_name)


## Enables the boss AI (called after intro sequence).
func enable_ai() -> void:
	ai_enabled = true


## Disables the boss AI (called during phase transitions or cutscenes).
func disable_ai() -> void:
	ai_enabled = false
