class_name BossState extends Node
## Base class for all boss states in the Cat Keeper FSM.
## Each state is a child node of BossStateMachine.
## Override virtual methods to define state-specific behavior.

## Reference to the boss CharacterBody2D. Set by the state machine on _ready.
var boss: CharacterBody2D = null
## Reference back to the owning BossStateMachine. Set on _ready.
var state_machine: BossStateMachine = null


## Called when this state becomes the active state.
func enter() -> void:
	pass


## Called when this state is exited in favor of another state.
func exit() -> void:
	pass


## Called every frame while this state is active.
func process(_delta: float) -> void:
	pass


## Called every physics frame while this state is active.
func physics_process(_delta: float) -> void:
	pass


## Returns whether this state allows transitioning to the given target state.
## Override in subclasses to restrict transitions.
func can_transition_to(_target: StringName) -> bool:
	return true
