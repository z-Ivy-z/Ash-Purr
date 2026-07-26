class_name CombatManager extends Node
## Scene-level combat coordinator (NOT an autoload).
## Placed in each Arena scene to wire hitbox/hurtbox interactions into damage,
## hit stop, screen shake, and knockback.
##
## Requirements: 9.1, 9.2, 9.3, 9.4, 9.5

# --- Signals ---

## Emitted when a hit is confirmed after damage is applied.
signal hit_confirmed(attacker: Node, defender: Node, attack_data: AttackResource)
## Emitted when hit stop begins.
signal hit_stop_started(duration_frames: int)
## Emitted when screen shake is requested.
signal screen_shake_requested(intensity: float, duration: float)
## Emitted when knockback is applied to a target.
signal knockback_applied(target: Node, direction: Vector2, force: float)

# --- Constants ---

## Maximum screen shake duration in seconds (Requirement 9.2).
const MAX_SHAKE_DURATION: float = 0.3

# --- Internal State ---

## Reference to the scene's Camera2D, found on ready.
var _camera: Camera2D = null
## Original camera offset to restore after shake.
var _camera_original_offset: Vector2 = Vector2.ZERO
## Active shake tween (killed before starting a new one).
var _shake_tween: Tween = null
## Tracks nodes currently frozen by hit stop so they can be unfrozen.
var _frozen_nodes: Array[Node] = []
## Frame counter for hit stop duration.
var _hit_stop_remaining: int = 0


func _ready() -> void:
	# Find Camera2D in the scene tree (search upward from parent).
	_camera = _find_camera()
	if _camera:
		_camera_original_offset = _camera.offset


func _physics_process(_delta: float) -> void:
	_process_hit_stop()


# --- Public API ---


## Main entry point: called when a hitbox overlaps a hurtbox.
## Extracts attack data from the hitbox, applies damage, hit stop, screen shake,
## and knockback in sequence.
func process_hit(hitbox: HitboxComponent, hurtbox: HurtboxComponent) -> void:
	var attacker: Node = hitbox.get_parent()
	var defender: Node = hurtbox.get_parent()

	# --- Apply damage ---
	var health: HealthComponent = _find_health_component(defender)
	if health:
		health.take_damage(hitbox.damage, attacker)

	# --- Build a lightweight attack_data reference for signal consumers ---
	var attack_data := AttackResource.new()
	attack_data.damage = hitbox.damage
	attack_data.hit_stop_frames = hitbox.hit_stop_frames
	attack_data.screen_shake_pixels = hitbox.screen_shake_intensity
	attack_data.knockback_pixels = hitbox.knockback_force
	attack_data.knockback_direction = hitbox.knockback_direction

	hit_confirmed.emit(attacker, defender, attack_data)

	# --- Apply hit stop to both attacker and defender ---
	_register_hit_stop_targets(attacker, defender)
	apply_hit_stop(hitbox.hit_stop_frames)

	# --- Apply screen shake ---
	var shake_duration: float = minf(MAX_SHAKE_DURATION, MAX_SHAKE_DURATION)
	apply_screen_shake(hitbox.screen_shake_intensity, shake_duration)

	# --- Apply knockback ---
	if defender is CharacterBody2D:
		# Determine direction: use hitbox exported direction resolved to world facing.
		var direction := _resolve_knockback_direction(hitbox)
		apply_knockback(defender as CharacterBody2D, direction, hitbox.knockback_force)


## Freezes both the attacker and defender for the given number of physics frames.
## Uses set_physics_process(false) on the affected nodes to pause them in place.
func apply_hit_stop(duration_frames: int) -> void:
	if duration_frames <= 0:
		return

	# If already in hit stop, extend/reset the duration.
	_hit_stop_remaining = duration_frames

	# Freeze all currently tracked nodes (they'll be unfrozen when counter expires).
	# Nodes are added by process_hit before this call — we freeze attacker & defender.
	for node in _frozen_nodes:
		if is_instance_valid(node):
			node.set_physics_process(false)

	hit_stop_started.emit(duration_frames)


## Applies screen shake to the scene Camera2D with random displacement and decay.
## Respects SettingsManager.camera_shake_enabled and camera_shake_intensity.
func apply_screen_shake(intensity: float, duration: float) -> void:
	# Respect accessibility settings.
	if not SettingsManager.camera_shake_enabled:
		return

	# Scale intensity by the user's camera shake preference (0.0 – 1.0).
	intensity *= SettingsManager.camera_shake_intensity

	if intensity <= 0.0:
		return

	# Clamp duration to maximum allowed.
	duration = minf(duration, MAX_SHAKE_DURATION)

	screen_shake_requested.emit(intensity, duration)

	if _camera == null:
		_camera = _find_camera()
		if _camera == null:
			return
		_camera_original_offset = _camera.offset

	# Kill any active shake tween to prevent overlap.
	if _shake_tween and _shake_tween.is_valid():
		_shake_tween.kill()

	_shake_tween = create_tween()
	_shake_tween.set_ease(Tween.EASE_OUT)
	_shake_tween.set_trans(Tween.TRANS_SINE)

	var steps: int = maxi(int(duration / 0.016), 2)  # Roughly one step per frame at 60 FPS.
	var step_duration: float = duration / float(steps)

	for i in range(steps):
		var decay: float = 1.0 - (float(i) / float(steps))
		var offset := Vector2(
			randf_range(-intensity, intensity) * decay,
			randf_range(-intensity, intensity) * decay
		)
		_shake_tween.tween_property(_camera, "offset", _camera_original_offset + offset, step_duration)

	# Final step: return to the original offset.
	_shake_tween.tween_property(_camera, "offset", _camera_original_offset, step_duration)


## Applies knockback to a CharacterBody2D target by setting its velocity.
func apply_knockback(target: CharacterBody2D, direction: Vector2, force: float) -> void:
	if force <= 0.0:
		return

	var impulse: Vector2 = direction.normalized() * force
	target.velocity += impulse

	knockback_applied.emit(target, direction, force)


# --- Internal Helpers ---


## Processes the hit stop frame counter each physics tick.
func _process_hit_stop() -> void:
	if _hit_stop_remaining <= 0:
		return

	_hit_stop_remaining -= 1

	if _hit_stop_remaining <= 0:
		# Unfreeze all tracked nodes.
		for node in _frozen_nodes:
			if is_instance_valid(node):
				node.set_physics_process(true)
		_frozen_nodes.clear()


## Resolves the knockback direction from the hitbox, accounting for the attacker's facing.
func _resolve_knockback_direction(hitbox: HitboxComponent) -> Vector2:
	var direction := hitbox.knockback_direction
	var attacker := hitbox.get_parent()

	# If the attacker has a sprite, use its flip state to determine facing direction.
	if attacker and attacker.has_method("get_facing_direction"):
		var facing: float = attacker.get_facing_direction()
		direction.x *= facing
	elif attacker:
		# Fallback: check for Sprite2D child flip_h to infer facing.
		var sprite := _find_sprite(attacker)
		if sprite and sprite.flip_h:
			direction.x *= -1.0

	return direction.normalized()


## Searches for a HealthComponent child node on the given entity.
func _find_health_component(entity: Node) -> HealthComponent:
	for child in entity.get_children():
		if child is HealthComponent:
			return child as HealthComponent
	return null


## Searches the scene tree for the Camera2D (checks siblings and parent tree).
func _find_camera() -> Camera2D:
	# First check direct scene children.
	var root := get_tree().current_scene
	if root:
		return _find_camera_recursive(root)
	return null


## Recursively searches for a Camera2D in the subtree.
func _find_camera_recursive(node: Node) -> Camera2D:
	if node is Camera2D:
		return node as Camera2D
	for child in node.get_children():
		var found := _find_camera_recursive(child)
		if found:
			return found
	return null


## Searches for a Sprite2D in the entity's children.
func _find_sprite(entity: Node) -> Sprite2D:
	for child in entity.get_children():
		if child is Sprite2D:
			return child as Sprite2D
	return null


## Registers attacker and defender for hit stop freezing.
## Called internally before apply_hit_stop to track which nodes to freeze/unfreeze.
func _register_hit_stop_targets(attacker: Node, defender: Node) -> void:
	_frozen_nodes.clear()
	if attacker and is_instance_valid(attacker):
		_frozen_nodes.append(attacker)
	if defender and is_instance_valid(defender):
		_frozen_nodes.append(defender)
