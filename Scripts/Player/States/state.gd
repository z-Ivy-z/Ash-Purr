class_name State extends Node
## Base class for all player states in the FSM.
## Each state is a child node of the PlayerStateMachine.
## Override virtual methods to define state-specific behavior.

## Reference to the player CharacterBody2D. Set by the state machine on _ready.
var player: CharacterBody2D = null
## Reference back to the owning PlayerStateMachine. Set on _ready.
var state_machine: PlayerStateMachine = null


## Called when this state becomes the active state.
func enter() -> void:
	pass


## Called when this state is exited in favor of another state.
func exit() -> void:
	pass


## Called every frame while this state is active. Override for per-frame logic.
func process(_delta: float) -> void:
	pass


## Called every physics frame while this state is active. Override for physics logic.
func physics_process(_delta: float) -> void:
	pass


## Called for unhandled input events while this state is active.
func handle_input(_event: InputEvent) -> void:
	pass


## Returns whether this state allows transitioning to the given target state.
## Override in subclasses to restrict transitions (e.g., Attack blocks Run).
## Default: allows all transitions.
func can_transition_to(_target: StringName) -> bool:
	return true
