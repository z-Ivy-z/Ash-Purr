class_name PhaseMusic extends Node
## Manages phase-based music for the boss encounter.
## Phase 1: strings, brass, timpani (disciplined noble mood).
## Phase 2: unstable harmony, intense percussion, choir.
## Crossfades between phases over 1-3 seconds.
## Requirements: 15.4, 15.5

## Music streams for each phase (exported for scene assignment).
@export var phase_1_music: AudioStream
@export var phase_2_music: AudioStream
## Crossfade duration in seconds (1-3s).
@export var crossfade_duration: float = 2.0

var _boss: CatKeeper = null


func _ready() -> void:
	await get_tree().process_frame
	var bosses := get_tree().get_nodes_in_group("boss")
	if bosses.size() > 0:
		_boss = bosses[0] as CatKeeper
		if _boss:
			_boss.phase_controller.phase_changed.connect(_on_phase_changed)

	# Start Phase 1 music when encounter begins.
	# This will be triggered by the intro sequence completing.


## Starts the Phase 1 music (called when boss encounter begins).
func start_encounter_music() -> void:
	if phase_1_music:
		AudioManager.play_music(phase_1_music, 0.5)


## Called when the boss transitions to Phase 2.
func _on_phase_changed(new_phase: int) -> void:
	if new_phase == 2 and phase_2_music:
		AudioManager.play_music(phase_2_music, crossfade_duration)
