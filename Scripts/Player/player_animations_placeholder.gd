extends AnimationPlayer
## Placeholder animation setup for testing without art assets.
## Creates minimal animations so state machine calls don't produce errors.

const PLACEHOLDER_ANIMS: Array[String] = [
	"idle", "run", "attack_1", "attack_2", "attack_3",
	"dodge", "hit", "death", "recovery",
]


func _ready() -> void:
	for anim_name in PLACEHOLDER_ANIMS:
		if not has_animation(anim_name):
			var anim := Animation.new()
			anim.length = 0.4
			var lib := get_animation_library(&"")
			if lib:
				lib.add_animation(anim_name, anim)
			else:
				var new_lib := AnimationLibrary.new()
				new_lib.add_animation(anim_name, anim)
				add_animation_library(&"", new_lib)
