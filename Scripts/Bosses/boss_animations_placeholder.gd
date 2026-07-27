extends AnimationPlayer
## Placeholder animation setup for the boss, testing without art assets.
## Creates minimal animations so state machine calls don't produce errors.

const PLACEHOLDER_ANIMS: Array[String] = [
	"idle", "walk", "attack", "combo_strike_1", "combo_strike_2",
	"combo_strike_3", "combo_strike_4", "combo_strike_5",
	"counterattack", "recover",
	"telegraph_swift_slash", "telegraph_assault", "telegraph_seismic_strike",
	"swift_slash", "assault", "seismic_strike",
	"phase_transition", "death",
]


func _ready() -> void:
	for anim_name in PLACEHOLDER_ANIMS:
		if not has_animation(anim_name):
			var anim := Animation.new()
			anim.length = 0.5
			var lib := get_animation_library(&"")
			if lib:
				lib.add_animation(anim_name, anim)
			else:
				var new_lib := AnimationLibrary.new()
				new_lib.add_animation(anim_name, anim)
				add_animation_library(&"", new_lib)
