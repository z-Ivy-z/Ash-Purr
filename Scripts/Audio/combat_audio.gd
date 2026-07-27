class_name CombatAudio extends Node
## Handles combat-specific audio: special attack telegraphs and music ducking.
## Placed in the Arena scene, listens to boss signals.
## Requirements: 15.2, 15.3

## Telegraph audio streams for each special attack type.
@export var swift_slash_telegraph: AudioStream
@export var assault_telegraph: AudioStream
@export var seismic_strike_telegraph: AudioStream

## Music duck amount in dB (>= 6dB per requirement).
const DUCK_AMOUNT_DB: float = 6.0
## Music duck duration range (500-1000ms).
const DUCK_DURATION: float = 0.75

## Reference to the boss (set on ready or exported).
var _boss: CatKeeper = null


func _ready() -> void:
	# Find the boss in the scene.
	await get_tree().process_frame
	var bosses := get_tree().get_nodes_in_group("boss")
	if bosses.size() > 0:
		_boss = bosses[0] as CatKeeper
		if _boss:
			_boss.special_attack_telegraphed.connect(_on_special_telegraph)


## Called when the boss emits a special attack telegraph signal.
## Plays the unique audio cue >= 300ms before hitbox activation
## and ducks music by >= 50% (~6dB) for 500-1000ms.
func _on_special_telegraph(attack_type: int) -> void:
	var telegraph_stream: AudioStream = null

	# Match BossSpecialAttackState.SpecialType enum values.
	match attack_type:
		0:  # SWIFT_SLASH
			telegraph_stream = swift_slash_telegraph
		1:  # ASSAULT
			telegraph_stream = assault_telegraph
		2:  # SEISMIC_STRIKE
			telegraph_stream = seismic_strike_telegraph

	if telegraph_stream:
		AudioManager.play_sfx(telegraph_stream)

	# Duck music during telegraph.
	AudioManager.duck_music(DUCK_AMOUNT_DB, DUCK_DURATION)
