class_name StaggerController extends Node
## Tracks hits received during boss Recover state.
## When hits_during_recover >= 3, triggers a 2-second stagger.
## Limited to once per phase; resets on phase transition.

## Emitted when stagger is triggered (boss should pause for 2 seconds).
signal stagger_triggered()

## Number of hits required during Recover to trigger stagger.
const STAGGER_THRESHOLD: int = 3
## Duration of the stagger pause in seconds.
const STAGGER_DURATION: float = 2.0

## Number of hits received during the current Recover period.
var hits_during_recover: int = 0
## Whether a stagger has already been used this phase.
var stagger_used_this_phase: bool = false
## Whether the boss is currently in the Recover state.
var _in_recover: bool = false
## Whether the boss is currently staggered.
var is_staggered: bool = false
## Timer for stagger duration.
var _stagger_timer: float = 0.0

## Reference to the boss's HealthComponent for damage tracking.
@export var health_component: HealthComponent
## Reference to the phase controller for reset on phase change.
@export var phase_controller: PhaseController


func _ready() -> void:
	if health_component:
		health_component.damage_taken.connect(_on_damage_taken)
	if phase_controller:
		phase_controller.phase_changed.connect(_on_phase_changed)


func _physics_process(delta: float) -> void:
	if not is_staggered:
		return

	_stagger_timer += delta
	if _stagger_timer >= STAGGER_DURATION:
		is_staggered = false
		_stagger_timer = 0.0


## Called by BossRecoverState when recovery begins.
func on_recover_entered() -> void:
	_in_recover = true
	hits_during_recover = 0


## Called by BossRecoverState when recovery ends.
func on_recover_exited() -> void:
	_in_recover = false
	hits_during_recover = 0


## Called when boss takes damage. Tracks hits during recover.
func _on_damage_taken(_amount: int, _source: Node) -> void:
	if not _in_recover:
		return
	if stagger_used_this_phase:
		return

	hits_during_recover += 1

	if hits_during_recover >= STAGGER_THRESHOLD:
		_trigger_stagger()


## Triggers the stagger effect.
func _trigger_stagger() -> void:
	is_staggered = true
	stagger_used_this_phase = true
	_stagger_timer = 0.0
	stagger_triggered.emit()


## Called on phase transition — resets stagger availability.
func _on_phase_changed(_new_phase: int) -> void:
	stagger_used_this_phase = false
	hits_during_recover = 0
	is_staggered = false
	_stagger_timer = 0.0


## Full reset (used on boss retry).
func reset() -> void:
	stagger_used_this_phase = false
	hits_during_recover = 0
	is_staggered = false
	_stagger_timer = 0.0
	_in_recover = false
