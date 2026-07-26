class_name BossPhaseConfig extends Resource
## Configuration resource for Cat Keeper phase parameters.
## Phase 1 uses baseline (1.0) multipliers; Phase 2 escalates aggression via configurable values.

@export var phase_number: int
@export var attack_speed_multiplier: float = 1.0  ## 1.0 for P1, >= 1.3 for P2
@export var recover_duration_multiplier: float = 1.0  ## 1.0 for P1, <= 0.5 for P2
@export var movement_speed_multiplier: float = 1.0  ## 1.0 for P1, >= 1.3 for P2
@export var shockwave_area_multiplier: float = 1.0  ## 1.0 for P1, >= 1.5 for P2
@export var can_chain_swift_slash: bool = false  ## false P1, true P2
@export var can_double_assault: bool = false  ## false P1, true P2
@export var min_telegraph_frames: int = 12  ## 12 P1, 8 P2
