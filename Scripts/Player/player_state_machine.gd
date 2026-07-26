class_name PlayerStateMachine extends Node
## Manages player state transitions with one active state at a time.
## Each State is a child node of this machine, registered by name on _ready.
## Transitions are validated per-state via State.can_transition_to().

## Emitted whenever the active state changes. Provides old and new state names.
signal state_changed(old_state: StringName, new_state: StringName)

## State name constants used throughout the player system.
const STATE_IDLE: StringName = &"idle"
const STATE_RUN: StringName = &"run"
const STATE_ATTACK: StringName = &"attack"
const STATE_RECOVERY: StringName = &"recovery"
const STATE_DODGE: StringName = &"dodge"
const STATE_HIT: StringName = &"hit"
const STATE_DEATH: StringName = &"death"

## The currently active state node.
var current_state: State = null

## Dictionary mapping state name (StringName) → State node.
var _states: Dictionary = {}

## The CharacterBody2D player node this state machine controls.
@export var player: CharacterBody2D = null

## The initial state to enter on _ready. Defaults to idle.
@export var initial_state: StringName = STATE_IDLE


func _ready() -> void:
	# Register all child State nodes by their node name (lowercased as StringName).
	for child in get_children():
		if child is State:
			var state_name: StringName = StringName(child.name.to_lower())
			_states[state_name] = child
			child.state_machine = self
			child.player = player

	# Enter the initial state.
	if _states.has(initial_state):
		current_state = _states[initial_state]
		current_state.enter()
	else:
		push_warning("PlayerStateMachine: initial state '%s' not found among children." % initial_state)


func _process(delta: float) -> void:
	if current_state:
		current_state.process(delta)


func _physics_process(delta: float) -> void:
	if current_state:
		current_state.physics_process(delta)


func _unhandled_input(event: InputEvent) -> void:
	if current_state:
		current_state.handle_input(event)


## Validates and executes a transition from the current state to [param new_state_name].
## The transition is blocked if the current state's can_transition_to() returns false.
func transition_to(new_state_name: StringName) -> void:
	if not _states.has(new_state_name):
		push_warning("PlayerStateMachine: state '%s' does not exist." % new_state_name)
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


## Returns the State node for the given state name, or null if not found.
func get_state(state_name: StringName) -> State:
	return _states.get(state_name, null)


## Returns whether the machine has a registered state with the given name.
func has_state(state_name: StringName) -> bool:
	return _states.has(state_name)
