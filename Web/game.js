// ============================================================
// ASH & PURR — HTML5 Canvas Version v2
// Jump (right-click), Attack (left-click), Equipment menu
// ============================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 960;
canvas.height = 540;

// Responsive canvas scaling
function resizeCanvas() {
  const ratio = canvas.width / canvas.height;
  let w = window.innerWidth;
  let h = window.innerHeight;
  if (w / h > ratio) { w = h * ratio; } else { h = w / ratio; }
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Fullscreen from game.js
function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
  else document.exitFullscreen();
}

// Prevent context menu on right-click
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.style.cursor = 'none'; // Hide cursor during game

// --- CONSTANTS ---
const GRAVITY = 1800;
const FLOOR_Y = 460;
const PLAYER_SPEED = 300;
const DODGE_SPEED = 600;
const DODGE_DURATION = 0.2;
const DODGE_COOLDOWN = 0.5;
const JUMP_FORCE = -550;

// --- AUDIO SYSTEM ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playSound(freq, duration, type = 'square', volume = 0.15, decay = true) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (decay) gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function sfxAttack() { playSound(220 + Math.random()*80, 0.08, 'sawtooth', 0.25); }
function sfxHit() { playSound(120, 0.15, 'square', 0.35); playSound(80, 0.1, 'sawtooth', 0.3); }
function sfxPlayerHit() { playSound(180, 0.2, 'sawtooth', 0.4); playSound(90, 0.15, 'square', 0.2); }
function sfxDodge() { playSound(400, 0.06, 'sine', 0.15); playSound(600, 0.04, 'sine', 0.12); }
function sfxJump() { playSound(300, 0.1, 'sine', 0.15); playSound(500, 0.08, 'sine', 0.1); }
function sfxBossStrike() { playSound(80, 0.2, 'sawtooth', 0.5); playSound(60, 0.15, 'square', 0.35); }
function sfxBossSlam() { playSound(40, 0.4, 'sawtooth', 0.6); playSound(30, 0.3, 'square', 0.5); }
function sfxPhaseTransition() { for(let i=0;i<5;i++) setTimeout(()=>playSound(50+i*30,0.5,'sawtooth',0.35),i*200); }
function sfxToolUse() { playSound(500, 0.1, 'triangle', 0.2); playSound(700, 0.08, 'sine', 0.15); }
function sfxDash() { playSound(150, 0.15, 'sawtooth', 0.25); playSound(250, 0.1, 'sine', 0.2); }
function sfxLionRoar() { playSound(60, 0.5, 'sawtooth', 0.4); playSound(80, 0.4, 'square', 0.3); playSound(45, 0.6, 'sine', 0.2); }
function sfxLadySlash() { playSound(500, 0.06, 'sawtooth', 0.2); playSound(700, 0.04, 'sine', 0.15); }
function sfxGolemSlam() { playSound(50, 0.4, 'sawtooth', 0.4); playSound(35, 0.5, 'square', 0.3); playSound(70, 0.2, 'triangle', 0.15); }
function sfxVictory() { [400,500,600,800].forEach((f,i)=>setTimeout(()=>playSound(f,0.3,'triangle',0.25),i*150)); }
function sfxDeath() { playSound(200, 0.5, 'sawtooth', 0.35); playSound(100, 0.8, 'square', 0.25); }
function sfxMeow() {
  if (!audioCtx) return;
  // Realistic "miau" — frequency sweep up then down
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  // Sweep: starts at 600Hz, rises to 1000Hz, then drops to 400Hz
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.linearRampToValueAtTime(1000, now + 0.15);
  osc.frequency.linearRampToValueAtTime(700, now + 0.3);
  osc.frequency.linearRampToValueAtTime(400, now + 0.5);
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.linearRampToValueAtTime(0.6, now + 0.1);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(now); osc.stop(now + 0.55);
  // Add a second harmonic for texture
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(900, now);
  osc2.frequency.linearRampToValueAtTime(1500, now + 0.12);
  osc2.frequency.linearRampToValueAtTime(1100, now + 0.25);
  osc2.frequency.linearRampToValueAtTime(600, now + 0.45);
  gain2.gain.setValueAtTime(0.2, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc2.connect(gain2); gain2.connect(audioCtx.destination);
  osc2.start(now); osc2.stop(now + 0.5);
}
function sfxRevive() {
  playSound(300, 0.2, 'triangle', 0.2);
  setTimeout(() => playSound(400, 0.2, 'triangle', 0.2), 150);
  setTimeout(() => playSound(600, 0.3, 'triangle', 0.25), 300);
}

// Phase 2 ambient rumble
let ambientInterval = null;
function startPhase2Ambient() {
  if (ambientInterval) return;
  ambientInterval = setInterval(() => {
    if (gameState !== 'playing' || boss.phase !== 2) { stopPhase2Ambient(); return; }
    playSound(25 + Math.random()*15, 0.6, 'sawtooth', 0.06 + Math.random()*0.04);
    if (Math.random() < 0.3) playSound(40, 0.3, 'square', 0.03);
  }, 800);
}
function stopPhase2Ambient() { if (ambientInterval) { clearInterval(ambientInterval); ambientInterval = null; } }

// --- BACKGROUND MUSIC SYSTEM ---
let musicInterval = null;
let musicPhase = 0; // 0=not playing, 1=phase1, 2=phase2
const PHASE1_NOTES = [220, 262, 294, 330, 262, 220, 196, 220]; // Minor key, slow
const PHASE2_NOTES = [147, 165, 175, 196, 220, 247, 262, 294, 330, 349, 294, 262]; // Aggressive ascending

function startMusic() {
  if (musicInterval) return;
  let noteIdx = 0;

  if (currentEnemy === 'golem') {
    // Golem: calm, earthy, steady — low triangle notes like nature breathing
    const notes = [147, 165, 175, 196, 175, 165, 147, 131];
    musicInterval = setInterval(() => {
      if (gameState !== 'playing') { stopMusic(); return; }
      const note = notes[noteIdx % notes.length];
      playSound(note, 0.5, 'triangle', 0.07);
      playSound(note * 0.5, 0.6, 'sine', 0.04);
      if (golem.phase === 2 && noteIdx % 2 === 0) playSound(65, 0.2, 'square', 0.06); // P2 tension
      noteIdx++;
    }, golem.phase === 2 ? 350 : 500);
  } else if (currentEnemy === 'lady') {
    // Lady Death: tense, fast, precise — staccato minor notes like stalking
    const notes = [330, 311, 294, 262, 294, 311, 330, 349];
    musicInterval = setInterval(() => {
      if (gameState !== 'playing') { stopMusic(); return; }
      const note = notes[noteIdx % notes.length];
      playSound(note, 0.12, 'square', 0.09);
      if (noteIdx % 3 === 0) playSound(note * 0.5, 0.2, 'triangle', 0.05);
      if (lady.phase === 2) { playSound(note * 1.01, 0.1, 'sawtooth', 0.06); } // P2 dissonance
      noteIdx++;
    }, lady.phase === 2 ? 150 : 220);
  } else if (currentEnemy === 'lion') {
    // White Lion: noble, powerful, melancholic — broad orchestral feel
    const notes = [196, 220, 262, 294, 262, 220, 196, 175];
    musicInterval = setInterval(() => {
      if (gameState !== 'playing') { stopMusic(); return; }
      const note = notes[noteIdx % notes.length];
      playSound(note, 0.4, 'triangle', 0.1);
      playSound(note * 0.5, 0.5, 'sine', 0.06);
      if (noteIdx % 4 === 0) playSound(98, 0.3, 'sine', 0.05); // Deep bass heartbeat
      if (lion.phase === 2) {
        playSound(note * 0.75, 0.3, 'sawtooth', 0.05); // P2: darker undertone
        if (noteIdx % 2 === 0) playSound(55, 0.2, 'square', 0.07); // Desperate drums
      }
      noteIdx++;
    }, lion.phase === 2 ? 280 : 420);
  } else {
    // Spirit/Keeper: use existing system
    musicPhase = 1;
    let nIdx = 0;
    const P1_NOTES = [220, 262, 294, 330, 262, 220, 196, 220];
    musicInterval = setInterval(() => {
      if (gameState !== 'playing') { stopMusic(); return; }
      const note = P1_NOTES[nIdx % P1_NOTES.length];
      playSound(note, 0.4, 'triangle', 0.08);
      playSound(note * 0.5, 0.5, 'sine', 0.04);
      nIdx++;
    }, 400);
  }
}

function switchMusicToPhase2() {
  stopMusic();
  musicPhase = 2;
  let noteIdx = 0;
  musicInterval = setInterval(() => {
    if (gameState !== 'playing') { stopMusic(); return; }
    const note = PHASE2_NOTES[noteIdx % PHASE2_NOTES.length];
    playSound(note, 0.18, 'sawtooth', 0.13);
    playSound(note * 1.02, 0.18, 'sawtooth', 0.09); // Dissonance
    playSound(note * 0.5, 0.25, 'square', 0.07); // Bass
    if (noteIdx % 2 === 0) playSound(50 + Math.random()*20, 0.1, 'square', 0.12); // Percussive hits
    if (noteIdx % 4 === 0) playSound(30, 0.3, 'sawtooth', 0.08); // Sub bass
    noteIdx++;
  }, 160); // Much faster tempo
}

function stopMusic() { if (musicInterval) { clearInterval(musicInterval); musicInterval = null; } }

// --- VISUAL FX STATE ---
let playerDamageFlash = 0; // Timer for red flash overlay on hit
let dashTrail = []; // For short sword dash
let victoryAnimTimer = 0;

// --- COLOR PALETTE ---
const COLORS = {
  armorLight: '#C0C8D4', armorHighlight: '#E8EDF2', armorShadow: '#8A9AAF',
  tunicRed: '#C44B4B', tunicDark: '#8B3232',
  belt: '#2A2A2A', buckle: '#D4A017',
  cape: '#5C3A1E', capeDark: '#3D2510',
  branch: '#6B4226', leaf: '#4CAF50',
  visor: '#1A1A2E',
  bossRock: '#3D2B1F', bossRockLight: '#5C4033',
  bossGlow: '#FF3300', bossGlowOrange: '#FF6600', bossEyes: '#FF0000',
  floor: '#3D3229', floorLight: '#5C4A3D',
  bgDark: '#1A1A2E', bgMid: '#2D2B45',
  healthRed: '#CC3333', healthBg: '#333333',
  white: '#FFFFFF', black: '#000000',
  healGreen: '#44CC66', cooldownBlue: '#4488CC',
};

// --- EQUIPMENT DATA ---
const AMULETS = [
  { id: 'none', name: 'No Amulet', desc: 'No bonus, no penalty', dmgMod: 1.0, defMod: 1.0, hpMod: 1.0, cdMod: 1.0, color: '#555555' },
  { id: 'photograph', name: 'Photograph', desc: '+ATK power, +DMG received', dmgMod: 1.3, defMod: 0.7, hpMod: 1.0, cdMod: 1.0, color: '#E8D4A0' },
  { id: 'collar', name: "Almohadita's Collar", desc: '+DEF, +Tool cooldown', dmgMod: 1.0, defMod: 1.3, hpMod: 1.0, cdMod: 1.4, color: '#CC8844' },
  { id: 'fish_plush', name: 'Fish Plush', desc: '+Max HP, -ATK power', dmgMod: 0.75, defMod: 1.0, hpMod: 1.35, cdMod: 1.0, color: '#88BBDD' },
];
const TOOLS = [
  { id: 'none', name: 'No Tool', desc: 'Branch only', dmgMult: 0, cooldown: 999, type: 'none', color: '#555555' },
  { id: 'throwing_knife', name: 'Throwing Knife', desc: '0.8x DMG, 4s CD, ranged', dmgMult: 0.8, cooldown: 4, type: 'ranged', color: '#AAAAAA' },
  { id: 'short_sword', name: 'Short Sword', desc: '1.8x DMG, 3s CD, dash', dmgMult: 1.8, cooldown: 3, type: 'melee', color: '#7799BB' },
  { id: 'small_mace', name: 'Small Mace', desc: '2.5x DMG, 8s CD, heavy', dmgMult: 2.5, cooldown: 8, type: 'melee', color: '#997755' },
  { id: 'dreamcatcher', name: 'Dreamcatcher', desc: 'Heal 6% HP, 16s CD', dmgMult: 0, cooldown: 16, type: 'heal', color: '#BB88DD' },
];

// --- INPUT ---
const keys = {};
const keysJustPressed = {};
let keysThisFrame = {};
let mouseButtons = { left: false, right: false };
let mouseJust = { left: false, right: false };
let mouseJustFrame = { left: false, right: false };
let mouseX = 0, mouseY = 0;

document.addEventListener('keydown', e => {
  keysJustPressed[e.code] = !keys[e.code]; keys[e.code] = true;
  if (e.code === 'F11') { e.preventDefault(); toggleFullscreen(); }
  // Prevent Space and Enter from exiting fullscreen
  if (document.fullscreenElement && (e.code === 'Space' || e.code === 'Enter')) {
    e.preventDefault();
  }
});
document.addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  if (e.button === 0) { mouseJust.left = !mouseButtons.left; mouseButtons.left = true; }
  if (e.button === 2) { mouseJust.right = !mouseButtons.right; mouseButtons.right = true; }
});
canvas.addEventListener('mouseup', e => {
  if (e.button === 0) mouseButtons.left = false;
  if (e.button === 2) mouseButtons.right = false;
});
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
});

function isPressed(code) { return !!keys[code]; }
function justPressed(code) { return !!keysThisFrame[code]; }
function mouseJustLeft() { return mouseJustFrame.left; }
function mouseJustRight() { return mouseJustFrame.right; }

// --- GAME STATE ---
let gameState = 'menu'; // menu, cinematic, equip, intro, playing, midequip, death, victory
let equippedAmulet = AMULETS[0];
let equippedTool = TOOLS[0];
let equipSelection = 0; // 0=amulets tab, 1=tools tab
let equipCursor = 0;
let toolCooldown = 0;
let toolMaxCooldown = 0;

let introLines = [];
let introSpeaker = '';
const GOLEM_INTRO = [
  "...",
  "The flowers... they are afraid.",
  "You... you are the one hurting them.",
  "I will not let you destroy my garden."
];
const GOLEM_DEFEAT = [
  "...the flowers... they are not afraid of you.",
  "I was wrong. You are not the enemy.",
  "Go, little one. I am sorry."
];
const LADY_INTRO = [
  "...",
  "You survived the garden. Impressive.",
  "But I am not a golem bound by sentiment.",
  "I am Lady Death. And I never fail a contract."
];
const LADY_DEFEAT = [
  "...how? No one has ever...",
  "Perhaps I underestimated your determination.",
  "Go. But know this — what awaits you is far beyond blades."
];
const SPIRIT_INTRO = [
  "...another soul, wandering where it should not.",
  "I was once a mage who swore to protect the innocent.",
  "Now I am bound here... forced to stop anyone who passes.",
  "Forgive me, little knight. I have no choice."
];
const KEEPER_INTRO = [
  "So... you defeated even the spirit.",
  "I am the Cat Keeper. The kingdom's greatest sword.",
  "My king ordered me to protect this creature with my life.",
  "I will not fail him. Not even for someone as brave as you.",
  "Come then, little one. Show me your resolve."
];
const SPIRIT_DEFEAT = [
  "...free. At last, I am free.",
  "Thank you, little knight. Go... save your friend.",
  "But beware. The one ahead truly believes he is righteous."
];
const KEEPER_DEFEAT = [
  "...impossible. A branch... defeated the kingdom's champion?",
  "Perhaps... I was wrong. Perhaps my king was never truly mine.",
  "Take him. Take your cat home. You have earned it."
];

// --- OPENING CINEMATIC ---
const CINEMATIC_LINES = [
  { text: "Bob has been searching for a long time.", delay: 2.5 },
  { text: "His best friend, Almohadita, was taken from him.", delay: 2.5 },
  { text: "Every clue... every trail... has led him here.", delay: 2.5 },
  { text: "To this strange, forgotten place.", delay: 2.2 },
  { text: "", delay: 1.0 },
  { text: "Something tells him his friend is close.", delay: 2.5 },
  { text: "He can feel it.", delay: 1.8 },
  { text: "", delay: 1.0 },
  { text: "He will not stop.", delay: 1.8 },
  { text: "He will not turn back.", delay: 1.8 },
  { text: "He will do whatever it takes to bring Almohadita home.", delay: 3.0 },
];
let cinematicIndex = 0;
let cinematicTimer = 0;
let cinematicAlpha = 0;
let introIndex = 0, introCharIndex = 0, introTimer = 0;
let deathTimer = 0, victoryTimer = 0;

// --- STATS TRACKING ---
let stats = { damageDealt: 0, damageTaken: 0, dodges: 0, jumps: 0, hits: 0, toolUses: 0, comboMax: 0, timePlayed: 0, usedLastBreath: false };
let spiritStats = null;
let keeperStats = null;
let golemStats = null;
let ladyStats = null;

// --- LAST BREATH MECHANIC ---
let lastBreathAvailable = true; // One-time revive per fight
let lastBreathActive = false; // Currently in revive animation
let lastBreathTimer = 0;
let lastBreathMeowed = false;
let lastBreathDialogue = 0; // Timer for showing dialogue (>0 = showing)

// --- PLAYER ---
const player = {
  x: 200, y: FLOOR_Y, w: 32, h: 56,
  vx: 0, vy: 0, facing: 1,
  hp: 100, maxHp: 100, baseMaxHp: 100,
  state: 'idle', stateTimer: 0,
  comboStep: 0, comboWindow: false, comboWindowTimer: 0,
  dodgeCooldown: 0, invulnerable: false, invulTimer: 0,
  attackHitbox: null, animFrame: 0, animTimer: 0,
  armAngle: 0, legOffset: 0, bodyBob: 0, weaponAngle: 0,
  onGround: true, jumpCount: 0, maxJumps: 1,
  _hitConnected: false,
};

// --- BOSS ---
const boss = {
  x: 700, y: FLOOR_Y, w: 48, h: 80,
  vx: 0, vy: 0, facing: -1,
  hp: 500, maxHp: 500,
  state: 'idle', stateTimer: 0, phase: 1,
  attackType: '', comboStrike: 0, totalStrikes: 3,
  strikeTimer: 0, strikeDelay: 0, recoverDuration: 1.5,
  hitsDuringRecover: 0, staggerUsed: false, telegraphTimer: 0,
  attackHitbox: null, chargeDir: 0, chargeDistance: 0, chargeTraveled: 0,
  lastAttack: '', aiTimer: 0, invulnerable: false,
  animFrame: 0, animTimer: 0, armAngle: 0, bodyShake: 0, glowIntensity: 0,
  _seismicFired: false, _swiftHit: false,
};

// --- FX ---
let shakeIntensity = 0, shakeDuration = 0, shakeOffsetX = 0, shakeOffsetY = 0;
let hitStopTimer = 0;
let particles = [];
let shockwaves = [];
let projectiles = []; // Player thrown tools

// --- THE LOST SPIRIT ---
const spirit = {
  x: 700, y: FLOOR_Y, w: 40, h: 70,
  vx: 0, vy: 0, facing: -1,
  hp: 350, maxHp: 350,
  state: 'idle', stateTimer: 0, phase: 1,
  castType: '', // lightning, fireball, blackout, teleport
  castTimer: 0, spellInterval: 1.2,
  floatTimer: 0, floatCooldown: 10, isFloating: false, floatDuration: 3,
  floatY: FLOOR_Y, // Base Y when floating
  teleportTarget: 0,
  invulnerable: false,
  blackoutTimer: 0, // >0 means blackout active
  lightningTargets: [], // x positions for lightning strikes
  fireballs: [], // active fireball projectiles
  animTimer: 0, armAngle: 0, bodyBob: 0, glowPulse: 0,
  _lightningFired: false, _phaseTransitioned: false,
};

// --- GAME FLOW ---
let currentEnemy = 'golem'; // 'golem', 'lady', 'lion', 'spirit' or 'boss'
let enemyTransition = false;
let transitionTimer = 0;

// --- THE GARDEN GOLEM ---
const golem = {
  x: 700, y: FLOOR_Y, w: 56, h: 90,
  vx: 0, vy: 0, facing: -1,
  hp: 280, maxHp: 280,
  state: 'idle', stateTimer: 0, phase: 1,
  castType: '', castTimer: 0,
  attackInterval: 1.8,
  invulnerable: false, _phaseTransitioned: false,
  animTimer: 0, armAngle: 0, bodyShake: 0,
  // Hazards
  platforms: [], // {x, y, timer, rising}
  poisonClouds: [], // {x, y, life}
  roots: [], // {x, targetX, speed}
  rocks: [], // {x, y, vx, vy, damage}
  _slamHit: false,
  _hitsReceived: 0, // Counter for consecutive hits — triggers push back
  _hitResetTimer: 0, // Resets hit counter after a delay
};

// --- LADY DEATH ---
const lady = {
  x: 700, y: FLOOR_Y, w: 30, h: 60,
  vx: 0, vy: 0, facing: -1,
  hp: 320, maxHp: 320,
  state: 'idle', stateTimer: 0, phase: 1,
  castType: '', castTimer: 0,
  invulnerable: false, _phaseTransitioned: false,
  animTimer: 0, armAngle: 0, bodyBob: 0,
  comboCount: 0,
  shadowStepping: false, shadowChains: 0,
  daggers: [],
};

function spawnParticles(x, y, count, color, speed) {
  for (let i = 0; i < count; i++) {
    particles.push({ x, y, vx: (Math.random()-0.5)*speed, vy: -Math.random()*speed*0.7,
      life: 0.3+Math.random()*0.4, size: 2+Math.random()*4, color });
  }
}
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rectOverlap(a, b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
function screenShake(i, d) { shakeIntensity = i; shakeDuration = d; }
function hitStop(f) { hitStopTimer = f / 60; }

// ============================================================
// PLAYER LOGIC
// ============================================================
function updatePlayer(dt) {
  // Immobilize during enemy death animation (victory cinematic)
  if ((currentEnemy === 'boss' && boss.state === 'death') || (currentEnemy === 'spirit' && spirit.state === 'dead' && spirit.stateTimer > 2) || (currentEnemy === 'golem' && golem.state === 'dead' && golem.stateTimer > 2) || (currentEnemy === 'lady' && lady.state === 'dead' && lady.stateTimer > 2) || (currentEnemy === 'lion' && lion.state === 'dead' && lion.stateTimer > 2)) {
    player.vx = 0;
    player.weaponAngle = 0;
    player.animTimer += dt;
    player.bodyBob = Math.sin(player.animTimer * 2) * 1;
    return;
  }

  player.stateTimer += dt;
  player.animTimer += dt;
  player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
  if (player.invulnerable) { player.invulTimer -= dt; if (player.invulTimer <= 0) player.invulnerable = false; }

  // Tool cooldown
  if (toolCooldown > 0) toolCooldown = Math.max(0, toolCooldown - dt);

  switch (player.state) {
    case 'idle': playerIdle(dt); break;
    case 'run': playerRun(dt); break;
    case 'attack': playerAttack(dt); break;
    case 'dodge': playerDodge(dt); break;
    case 'hit': playerHit(dt); break;
    case 'death': playerDeath(dt); break;
  }

  // Gravity
  player.vy += GRAVITY * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  if (player.y >= FLOOR_Y) { player.y = FLOOR_Y; player.vy = 0; player.onGround = true; player.jumpCount = 0; }
  else { player.onGround = false; }
  player.x = clamp(player.x, 20, canvas.width - 20);

  // Combo window
  if (player.comboWindow) {
    player.comboWindowTimer -= dt;
    if (player.comboWindowTimer <= 0) { player.comboWindow = false; player.comboStep = 0; }
  }

  // Jump with right-click (allowed from any non-death state)
  if (mouseJustRight() && player.state !== 'death' && player.state !== 'hit') {
    if (player.jumpCount < player.maxJumps) {
      player.vy = JUMP_FORCE;
      player.jumpCount++;
      player.onGround = false;
      spawnParticles(player.x, player.y, 4, COLORS.armorShadow, 80);
      sfxJump();
      stats.jumps++;
    }
  }

  // Use tool with K or E
  if ((justPressed('KeyK') || justPressed('KeyE')) && toolCooldown <= 0 && player.state !== 'death') {
    if (equippedTool.type !== 'none') activateTool();
  }
}

function playerIdle(dt) {
  player.vx *= 0.85;
  player.bodyBob = Math.sin(player.animTimer * 3) * 2;
  player.legOffset = 0;
  player.armAngle = -0.3;
  if (player.state !== 'attack') player.weaponAngle = 0; // Weapon vertical (0 = straight up)

  if (justPressed('Space') && player.dodgeCooldown <= 0) { enterDodge(); return; }
  if (mouseJustLeft() || justPressed('KeyJ')) { enterAttack(); return; }
  if (isPressed('KeyA') || isPressed('KeyD')) { player.state = 'run'; player.stateTimer = 0; }
}

function playerRun(dt) {
  let dir = 0;
  if (isPressed('KeyA')) dir -= 1;
  if (isPressed('KeyD')) dir += 1;
  if (dir === 0) { player.state = 'idle'; player.stateTimer = 0; return; }
  player.facing = dir;
  player.vx = dir * PLAYER_SPEED;
  player.legOffset = Math.sin(player.animTimer * 12) * 8;
  player.bodyBob = Math.abs(Math.sin(player.animTimer * 12)) * 3;
  player.armAngle = -0.3 + Math.sin(player.animTimer * 12) * 0.08;
  if (player.state !== 'attack') player.weaponAngle = 0; // Weapon stays vertical

  if (justPressed('Space') && player.dodgeCooldown <= 0) { enterDodge(); return; }
  if (mouseJustLeft() || justPressed('KeyJ')) { enterAttack(); return; }
}

function enterAttack() {
  // Can attack from ANY state except death/hit
  if (player.state === 'death' || player.state === 'hit') return;
  if (player.comboStep === 0 || player.comboWindow) {
    player.comboStep = Math.min(player.comboStep + 1, 3);
    if (player.comboStep > stats.comboMax) stats.comboMax = player.comboStep;
    player.comboWindow = false;
    player.state = 'attack';
    player.stateTimer = 0;
    player.attackHitbox = null;
    sfxAttack();
  }
}

function playerAttack(dt) {
  // FULL movement freedom during attack
  let dir = 0;
  if (isPressed('KeyA')) dir -= 1;
  if (isPressed('KeyD')) dir += 1;
  if (dir !== 0) {
    player.facing = dir;
    player.vx = dir * PLAYER_SPEED;
    player.legOffset = Math.sin(player.animTimer * 12) * 8;
  } else if (player.onGround) {
    player.vx *= 0.85;
    player.legOffset *= 0.8;
  }

  const duration = player.comboStep === 3 ? 0.25 : 0.18; // Fast consistent attacks
  const hitStart = 0.04;
  const hitEnd = 0.13;
  const t = player.stateTimer;
  const swingProgress = clamp(t / duration, 0, 1);

  // Weapon swing: from vertical (0) to horizontal outward (π/2 = 1.57)
  // Always swings OUTWARD from Bob, never inward
  const swingEnd = 1.57; // 90 degrees outward
  if (player.comboStep === 1) player.weaponAngle = lerp(0, swingEnd, swingProgress);
  else if (player.comboStep === 2) player.weaponAngle = lerp(0, swingEnd * 0.8, swingProgress);
  else player.weaponAngle = lerp(0, swingEnd * 1.1, swingProgress); // Slightly past 90° for finisher

  // Hitbox active during entire hit window — consistent detection
  if (t >= hitStart && t <= hitEnd) {
    const hx = player.x + player.facing * 40;
    player.attackHitbox = { x: hx - 25, y: player.y - 55, w: 50, h: 55 };
    // Check every frame during active window
    if (!player._hitConnected) { checkPlayerHit(); }
  } else {
    player.attackHitbox = null;
    if (t < hitStart) player._hitConnected = false; // Reset for next swing
  }

  // End attack — weapon returns to vertical
  if (t >= duration) {
    player.attackHitbox = null;
    player.comboWindow = true;
    player.comboWindowTimer = 0.3;
    player.weaponAngle = 0; // Back to vertical
    player.state = 'idle';
    player.stateTimer = 0;
    if (player.comboStep >= 3) { player.comboStep = 0; player.comboWindow = false; }
  }

  // Can dodge/jump out at any time
  if (justPressed('Space') && player.dodgeCooldown <= 0) enterDodge();
  if (mouseJustRight() && player.jumpCount < player.maxJumps) {
    player.vy = JUMP_FORCE; player.jumpCount++; player.onGround = false; sfxJump();
  }
}

function enterDodge() {
  let dir = player.facing;
  if (isPressed('KeyA')) dir = -1;
  if (isPressed('KeyD')) dir = 1;
  player.state = 'dodge'; player.stateTimer = 0;
  player.vx = dir * DODGE_SPEED; player.facing = dir;
  player.invulnerable = true; player.invulTimer = DODGE_DURATION;
  player.dodgeCooldown = DODGE_COOLDOWN;
  player.comboStep = 0; player.comboWindow = false;
  spawnParticles(player.x, player.y, 5, COLORS.armorLight, 100);
  sfxDodge();
  stats.dodges++;
}

function playerDodge(dt) {
  player.bodyBob = 0;
  if (player.stateTimer >= DODGE_DURATION) { player.vx = 0; player.state = 'idle'; player.stateTimer = 0; }
}
function playerHit(dt) {
  player.vx *= 0.9;
  player.bodyBob = Math.sin(player.stateTimer * 30) * 3;
  if (player.stateTimer >= 0.4) { player.state = 'idle'; player.stateTimer = 0; }
}
function playerDeath(dt) { player.vx = 0; player.bodyBob = Math.min(player.stateTimer * 20, 15); }

function damagePlayer(amount, knockbackDir) {
  if (player.invulnerable || player.state === 'death') return;
  const actualDmg = Math.round(amount / equippedAmulet.defMod);
  player.hp -= actualDmg;
  stats.damageTaken += actualDmg;
  player.vx = knockbackDir * 200;
  player.state = 'hit'; player.stateTimer = 0;
  player.comboStep = 0; player.comboWindow = false; player.attackHitbox = null;
  playerDamageFlash = 0.4; // Red flash for 0.4 seconds
  screenShake(6, 0.15); hitStop(4);
  spawnParticles(player.x, player.y - 30, 8, COLORS.healthRed, 150);
  sfxPlayerHit();
  if (player.hp <= 0) {
    player.hp = 0;
    if (lastBreathAvailable) {
      // LAST BREATH — Bob falls but gets back up
      lastBreathAvailable = false;
      lastBreathActive = true;
      lastBreathTimer = 0;
      stats.usedLastBreath = true;
      player.state = 'death'; player.stateTimer = 0;
      sfxDeath();
      // Meow and revive will happen after 2 seconds (in game loop)
    } else {
      // True death — no more chances
      player.state = 'death'; player.stateTimer = 0; deathTimer = 2.0;
      sfxDeath();
    }
  }
}

// --- TOOL ACTIVATION ---
function activateTool() {
  const tool = equippedTool;
  toolCooldown = tool.cooldown / equippedAmulet.cdMod;
  toolMaxCooldown = toolCooldown;
  sfxToolUse();
  stats.toolUses++;

  if (tool.type === 'ranged') {
    projectiles.push({
      x: player.x + player.facing * 20, y: player.y - 30,
      vx: player.facing * 500, damage: Math.round(12 * tool.dmgMult * equippedAmulet.dmgMod),
      life: 2.0, color: tool.color,
    });
  } else if (tool.type === 'melee') {
    if (tool.id === 'short_sword') {
      // DASH attack — lunge forward with i-frames
      sfxDash();
      player.vx = player.facing * 900;
      player.invulnerable = true; player.invulTimer = 0.18;
      for (let i = 0; i < 5; i++) dashTrail.push({ x: player.x - player.facing*i*8, y: player.y-30, life: 0.3, alpha: 1-i*0.15 });
      setTimeout(() => {
        const hx = player.x + player.facing * 40;
        const dmg = Math.round(12 * tool.dmgMult * equippedAmulet.dmgMod);
        const hitbox = { x: hx-30, y: player.y-55, w: 60, h: 55 };
        const bossRect = { x: boss.x-boss.w/2, y: boss.y-boss.h, w: boss.w, h: boss.h };
        if (!boss.invulnerable && boss.state !== 'death' && rectOverlap(hitbox, bossRect)) {
          boss.hp -= dmg; spawnParticles(boss.x,boss.y-40,8,tool.color,150); screenShake(5,0.12); sfxHit();
          if (boss.hp<=0){boss.hp=0;boss.state='death';boss.stateTimer=0;victoryTimer=3;screenShake(15,0.5);}
        }
        spawnParticles(hx, player.y-30, 6, tool.color, 120);
      }, 80);
    } else {
      // Small Mace — visible mace appears and slams
      sfxBossSlam();
      const hx = player.x + player.facing * 45;
      const dmg = Math.round(12 * tool.dmgMult * equippedAmulet.dmgMod);
      // Visual: draw mace swing particles in arc
      for (let a = 0; a < 5; a++) {
        const angle = (a / 5) * 1.5;
        const px = player.x + player.facing * (20 + a * 8);
        const py = player.y - 50 + a * 5;
        particles.push({ x: px, y: py, vx: player.facing * 30, vy: 20, life: 0.3, size: 6 - a, color: tool.color });
      }
      // Mace head impact particles
      spawnParticles(hx, player.y - 30, 12, tool.color, 200);
      spawnParticles(hx, player.y - 20, 5, '#FFD700', 100); // Impact sparks
      screenShake(8, 0.2);
      const hitbox = { x: hx-30, y: player.y-55, w: 60, h: 55 };
      const bossRect = { x: boss.x-boss.w/2, y: boss.y-boss.h, w: boss.w, h: boss.h };
      if (!boss.invulnerable && boss.state !== 'death' && rectOverlap(hitbox, bossRect)) {
        boss.hp -= dmg; spawnParticles(boss.x,boss.y-40,10,'#FFD700',180); sfxHit();
        if (boss.hp<=0){boss.hp=0;boss.state='death';boss.stateTimer=0;victoryTimer=3;screenShake(15,0.5);}
      }
    }
  } else if (tool.type === 'heal') {
    // Dreamcatcher heal with visible healing animation
    const healAmt = Math.round(player.maxHp * 0.06);
    player.hp = Math.min(player.hp + healAmt, player.maxHp);
    // Healing ring particles — spiral upward
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      particles.push({
        x: player.x + Math.cos(angle) * 15,
        y: player.y - 25 + Math.sin(angle) * 10,
        vx: Math.cos(angle) * 30,
        vy: -60 - Math.random() * 40,
        life: 0.6 + Math.random() * 0.3,
        size: 3 + Math.random() * 3,
        color: i % 2 === 0 ? COLORS.healGreen : '#88FFAA',
      });
    }
    // Green flash on player
    playerDamageFlash = -0.4; // Negative = green heal flash (handled in render)
    spawnParticles(player.x, player.y - 50, 8, '#88FFAA', 60);
  }
}

// ============================================================
// BOSS AI (same as before, condensed)
// ============================================================
function updateBoss(dt) {
  if (boss.state === 'death') { boss.stateTimer += dt; boss.bodyShake = Math.max(0, 5-boss.stateTimer*3); if(Math.random()<0.2) spawnParticles(boss.x+(Math.random()-0.5)*30, boss.y-40, 1, COLORS.bossRockLight, 50); return; }
  boss.stateTimer += dt; boss.animTimer += dt;
  if (boss.state !== 'assault' && boss.state !== 'transition') boss.facing = player.x < boss.x ? -1 : 1;

  switch (boss.state) {
    case 'idle': bossIdle(dt); break;
    case 'walk': bossWalk(dt); break;
    case 'combo': bossCombo(dt); break;
    case 'recover': bossRecover(dt); break;
    case 'telegraph': bossTelegraph(dt); break;
    case 'special': bossSpecial(dt); break;
    case 'assault': bossAssault(dt); break;
    case 'transition': bossTransition(dt); break;
  }

  boss.vy += GRAVITY * dt; boss.x += boss.vx * dt; boss.y += boss.vy * dt;
  if (boss.y >= FLOOR_Y) { boss.y = FLOOR_Y; boss.vy = 0; }
  boss.x = clamp(boss.x, 40, canvas.width - 40);

  if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.4 && boss.state !== 'transition') {
    boss.state = 'transition'; boss.stateTimer = 0; boss.invulnerable = true; boss.vx = 0; boss.attackHitbox = null;
  }
  if (boss.phase === 2) boss.glowIntensity = 0.5 + Math.sin(boss.animTimer * 4) * 0.3;
}

function bossIdle(dt) { boss.vx = 0; boss.armAngle = Math.sin(boss.animTimer*2)*0.1; boss.aiTimer += dt; const decideTime = boss.phase === 1 ? 0.15 + Math.random()*0.15 : 0.08 + Math.random()*0.12; if (boss.aiTimer >= decideTime) { boss.aiTimer = 0; bossDecideAction(); } }

function bossDecideAction() {
  const dist = Math.abs(player.x - boss.x);
  const attacks = [];
  // Boss actively pursues — if too far, always walk first
  if (dist > 200) { boss.state = 'walk'; boss.stateTimer = 0; return; }
  if (dist < 150) {
    if (boss.lastAttack !== 'basic_combo') attacks.push('basic_combo');
    if (boss.lastAttack !== 'advanced_combo') attacks.push('advanced_combo');
    // Specials at close range
    attacks.push('swift_slash');
    if (Math.random() < 0.5) attacks.push('seismic');
    if (boss.phase === 2) { attacks.push('swift_slash', 'seismic'); }
  } else if (dist > 180) {
    attacks.push('assault', 'assault', 'swift_slash', 'seismic');
    if (boss.phase === 2) { attacks.push('assault', 'seismic', 'swift_slash', 'seismic'); }
  } else {
    attacks.push('basic_combo', 'swift_slash', 'assault', 'seismic');
    if (boss.phase === 2) { attacks.push('advanced_combo', 'seismic', 'swift_slash', 'assault', 'seismic'); }
  }
  if (!attacks.length) { boss.state = 'walk'; boss.stateTimer = 0; return; }
  const chosen = attacks[Math.floor(Math.random()*attacks.length)]; boss.lastAttack = chosen;
  if (chosen === 'basic_combo' || chosen === 'advanced_combo') { boss.state = 'combo'; boss.attackType = chosen; boss.comboStrike = 0; boss.totalStrikes = chosen === 'advanced_combo' ? 5 : 3; boss.strikeTimer = 0; boss.strikeDelay = 0.2+Math.random()*0.3; boss.stateTimer = 0; }
  else { boss.state = 'telegraph'; boss.attackType = chosen; boss.stateTimer = 0; boss.telegraphTimer = boss.phase === 1 ? 0.4 : 0.25; }
}

function bossWalk(dt) { const dist = Math.abs(player.x-boss.x); const speed = boss.phase === 1 ? 160 : 200; boss.vx = boss.facing * speed; if(dist < 100) { boss.vx=0; boss.state='idle'; boss.stateTimer=0; boss.aiTimer=0; return; } if(boss.stateTimer>3){boss.state='idle';boss.stateTimer=0; boss.aiTimer=0;} }

function bossCombo(dt) {
  boss.vx = 0; boss.strikeTimer += dt; const sm = boss.phase===2?1.3:1;
  if (boss.strikeTimer >= boss.strikeDelay/sm) { boss.strikeTimer=0; boss.comboStrike++; bossStrike();
    if (boss.comboStrike >= boss.totalStrikes) { boss.state='recover'; boss.stateTimer=0; boss.hitsDuringRecover=0; boss.recoverDuration=boss.attackType==='advanced_combo'?2:1.3; if(boss.phase===2)boss.recoverDuration*=0.5; boss.attackHitbox=null; return; }
    boss.strikeDelay = boss.attackType==='advanced_combo'?(boss.comboStrike%2===0?0.35:0.18):(0.2+Math.random()*0.15); }
  boss.armAngle = lerp(0, -0.8, clamp(boss.strikeTimer/(boss.strikeDelay/sm),0,1));
}

function bossStrike() {
  const dmg = boss.phase===2?18:15; const hx = boss.x+boss.facing*55;
  boss.attackHitbox = {x:hx-35, y:boss.y-55, w:70, h:65}; boss.armAngle = 1.2;
  sfxBossStrike();
  setTimeout(()=>{ if(boss.attackHitbox&&rectOverlap(boss.attackHitbox,{x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) damagePlayer(dmg,boss.facing); boss.attackHitbox=null; },50);
  spawnParticles(hx,boss.y-30,3,COLORS.bossRockLight,80); screenShake(3,0.1);
}

function bossRecover(dt) { boss.vx=0; boss.armAngle=lerp(boss.armAngle,0.3,dt*3); boss.bodyShake=Math.sin(boss.stateTimer*8); if(boss.stateTimer>=boss.recoverDuration*0.7){boss.state='idle';boss.stateTimer=0;boss.bodyShake=0;} }
function bossTelegraph(dt) { boss.vx=0; boss.armAngle=lerp(boss.armAngle,-1.5,dt*6); boss.bodyShake=Math.sin(boss.stateTimer*20)*2; if(boss.stateTimer>=boss.telegraphTimer){if(boss.attackType==='assault'){boss.state='assault';boss.chargeDir=boss.facing;boss.chargeDistance=Math.abs(player.x-boss.x)+50;boss.chargeTraveled=0;}else{boss.state='special';}boss.stateTimer=0;boss.bodyShake=0;} }

function bossSpecial(dt) {
  boss.vx=0; const dmg=boss.phase===2?22:18;
  if(boss.attackType==='swift_slash'){if(boss.stateTimer<0.3){boss.vy=-400;boss.armAngle=-1.5;}else if(boss.stateTimer>=0.5&&!boss._swiftHit){boss._swiftHit=true;const hx=boss.x+boss.facing*40;boss.attackHitbox={x:hx-35,y:FLOOR_Y-60,w:70,h:60};boss.armAngle=1.5;screenShake(8,0.2);spawnParticles(boss.x,FLOOR_Y,12,COLORS.bossRockLight,200);if(rectOverlap(boss.attackHitbox,{x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h}))damagePlayer(dmg,boss.facing);}if(boss.stateTimer>=0.8){boss.attackHitbox=null;boss._swiftHit=false;enterBossRecover(1.2);}}
  else if(boss.attackType==='seismic'){const seismicDmg=boss.phase===2?35:18;if(boss.stateTimer<0.2)boss.armAngle=-1.5;else if(boss.stateTimer>=0.3&&!boss._seismicFired){boss._seismicFired=true;boss.armAngle=1.8;screenShake(10,0.25);spawnParticles(boss.x,FLOOR_Y,15,COLORS.bossRock,250);shockwaves.push({x:boss.x,y:FLOOR_Y-10,dir:boss.facing,speed:boss.phase===2?500:400,w:boss.phase===2?55:40,h:30,damage:seismicDmg,life:2,hasHit:false});}if(boss.stateTimer>=0.8){boss.attackHitbox=null;boss._seismicFired=false;enterBossRecover(1.5);}}
  else{if(boss.stateTimer>=0.5)enterBossRecover(1.3);}
}

function bossAssault(dt) {
  const speed=500*(boss.phase===2?1.3:1); boss.vx=boss.chargeDir*speed; boss.chargeTraveled+=speed*dt; boss.armAngle=0.8;
  boss.attackHitbox={x:boss.x+boss.chargeDir*20-25,y:boss.y-50,w:50,h:60}; const dmg=boss.phase===2?20:16;
  if(rectOverlap(boss.attackHitbox,{x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})){damagePlayer(dmg,boss.chargeDir);boss.attackHitbox=null;boss.vx=0;enterBossRecover(1);return;}
  if(boss.chargeTraveled>=boss.chargeDistance||boss.x<=50||boss.x>=canvas.width-50){boss.vx=0;boss.attackHitbox=null;enterBossRecover(1);screenShake(5,0.15);spawnParticles(boss.x,FLOOR_Y,8,COLORS.floorLight,150);}
}

function bossTransition(dt) { boss.vx=0; boss.bodyShake=Math.sin(boss.stateTimer*15)*4; boss.glowIntensity=boss.stateTimer/2; if(Math.random()<0.3)spawnParticles(boss.x+(Math.random()-0.5)*40,boss.y-40,1,COLORS.bossGlow,100); if(boss.stateTimer>=2.5){boss.phase=2;boss.invulnerable=false;boss.state='idle';boss.stateTimer=0;boss.bodyShake=0;boss.staggerUsed=false;screenShake(12,0.4);spawnParticles(boss.x,boss.y-40,30,COLORS.bossGlow,300);sfxPhaseTransition();startPhase2Ambient();switchMusicToPhase2();} }

function enterBossRecover(d){boss.state='recover';boss.stateTimer=0;boss.hitsDuringRecover=0;boss.recoverDuration=d;if(boss.phase===2)boss.recoverDuration*=0.5;boss.attackHitbox=null;}

// --- COMBAT ---
function checkPlayerHit() {
  if (!player.attackHitbox) return;
  if (currentEnemy === 'golem') { checkGolemHit(); return; }
  if (currentEnemy === 'lady') { checkLadyHit(); return; }
  if (currentEnemy === 'lion') { checkLionHit(); return; }
  if (currentEnemy === 'spirit') { checkSpiritHit(); return; }
  if (boss.invulnerable || boss.state === 'death') return;
  const bossRect = {x:boss.x-boss.w/2, y:boss.y-boss.h, w:boss.w, h:boss.h};
  if (rectOverlap(player.attackHitbox, bossRect)) {
    const baseDmg = player.comboStep === 3 ? 14 : 8; // Reduced damage
    const dmg = Math.round(baseDmg * equippedAmulet.dmgMod);
    boss.hp -= dmg;
    stats.damageDealt += dmg; stats.hits++;
    player._hitConnected = true;
    spawnParticles(boss.x, boss.y-40, 6, COLORS.armorHighlight, 120);
    screenShake(4, 0.1); hitStop(3); sfxHit();
    if (boss.state === 'recover') { boss.hitsDuringRecover++; if(boss.hitsDuringRecover>=3&&!boss.staggerUsed){boss.staggerUsed=true;boss.recoverDuration=boss.stateTimer+2;screenShake(10,0.3);spawnParticles(boss.x,boss.y-40,15,COLORS.buckle,200);} }
    if (boss.hp <= 0) { boss.hp=0; boss.state='death'; boss.stateTimer=0; boss.attackHitbox=null; victoryTimer=3; screenShake(15,0.5); spawnParticles(boss.x,boss.y-40,30,COLORS.bossRockLight,300); }
  }
}

// --- PROJECTILES ---
function updateProjectiles(dt) {
  for (let i = projectiles.length-1; i >= 0; i--) {
    const p = projectiles[i]; p.x += p.vx * dt; p.life -= dt;
    const pRect = {x:p.x-5, y:p.y-5, w:10, h:10};

    if (currentEnemy === 'golem') {
      if (!golem.invulnerable && golem.state !== 'dead') {
        const gRect = {x:golem.x-golem.w/2, y:golem.y-golem.h, w:golem.w, h:golem.h};
        if (rectOverlap(pRect, gRect)) {
          golem.hp -= p.damage; spawnParticles(golem.x, golem.y-45, 5, '#8A8070', 100); screenShake(3, 0.08); sfxHit();
          if (golem.hp<=0){golem.hp=0;golem.state='dead';golem.stateTimer=0;golem.platforms=[];golem.poisonClouds=[];golem.roots=[];screenShake(10,0.3);}
          projectiles.splice(i, 1); continue;
        }
      }
    } else if (currentEnemy === 'lady') {
      if (!lady.invulnerable && lady.state !== 'dead' && !(lady.state==='shadow_step'&&lady.stateTimer<0.15)) {
        const lRect = {x:lady.x-lady.w/2, y:lady.y-lady.h, w:lady.w, h:lady.h};
        if (rectOverlap(pRect, lRect)) {
          lady.hp -= p.damage; spawnParticles(lady.x, lady.y-30, 5, '#882233', 100); screenShake(2, 0.06); sfxHit();
          if (lady.hp<=0){lady.hp=0;lady.state='dead';lady.stateTimer=0;lady.daggers=[];screenShake(10,0.3);}
          projectiles.splice(i, 1); continue;
        }
      }
    } else if (currentEnemy === 'lion') {
      if (!lion.invulnerable && lion.state !== 'dead') {
        const lnRect = {x:lion.x-lion.w/2, y:lion.y-lion.h, w:lion.w, h:lion.h};
        if (rectOverlap(pRect, lnRect)) {
          lion.hp -= p.damage; spawnParticles(lion.x, lion.y-40, 5, '#F5F0E8', 100); screenShake(2, 0.06); sfxHit();
          if (lion.hp<=0){lion.hp=0;lion.state='dead';lion.stateTimer=0;screenShake(12,0.4);}
          projectiles.splice(i, 1); continue;
        }
      }
    } else if (currentEnemy === 'spirit') {
      if (!spirit.invulnerable && spirit.state !== 'dead') {
        // If floating, only hits if projectile is at spirit height
        if (spirit.isFloating && p.y > spirit.y + 20) { /* miss */ }
        else {
          const sRect = {x:spirit.x-spirit.w/2, y:spirit.y-spirit.h, w:spirit.w, h:spirit.h};
          if (rectOverlap(pRect, sRect)) {
            spirit.hp -= p.damage; spawnParticles(spirit.x, spirit.y-40, 6, '#66EEFF', 120); screenShake(3, 0.08); sfxHit();
            if (spirit.hp<=0){spirit.hp=0;spirit.state='dead';spirit.stateTimer=0;spirit.fireballs=[];spirit.lightningTargets=[];screenShake(12,0.4);spawnParticles(spirit.x,spirit.y-35,25,'#66EEFF',250);}
            projectiles.splice(i, 1); continue;
          }
        }
      }
    } else {
      const bossRect = {x:boss.x-boss.w/2, y:boss.y-boss.h, w:boss.w, h:boss.h};
      if (!boss.invulnerable && boss.state !== 'death' && rectOverlap(pRect, bossRect)) {
        boss.hp -= p.damage; spawnParticles(boss.x, boss.y-40, 6, p.color, 120); screenShake(4, 0.1);
        if (boss.hp <= 0) { boss.hp=0; boss.state='death'; boss.stateTimer=0; victoryTimer=3; screenShake(15,0.5); }
        projectiles.splice(i, 1); continue;
      }
    }
    if (p.life <= 0 || p.x < -20 || p.x > canvas.width+20) projectiles.splice(i, 1);
  }
}

function updateShockwaves(dt) {
  for (let i = shockwaves.length-1; i >= 0; i--) {
    const s = shockwaves[i]; s.x += s.dir*s.speed*dt; s.life -= dt;
    if (!s.hasHit && rectOverlap({x:s.x-s.w/2,y:s.y-s.h,w:s.w,h:s.h},{x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
      damagePlayer(s.damage,s.dir);
      s.hasHit = true; // Only hit once
    }
    if (s.life<=0||s.x<-50||s.x>canvas.width+50) shockwaves.splice(i,1);
  }
}
function updateParticles(dt) { for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=400*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);} }

// ============================================================
// THE LOST SPIRIT AI
// ============================================================
function updateSpirit(dt) {
  if (spirit.state === 'dead') { spirit.stateTimer += dt; return; }
  spirit.stateTimer += dt;
  spirit.animTimer += dt;
  spirit.glowPulse = Math.sin(spirit.animTimer * 3) * 0.3 + 0.7;
  spirit.bodyBob = Math.sin(spirit.animTimer * 2) * 3;

  // Face player
  if (spirit.state !== 'teleport') spirit.facing = player.x < spirit.x ? -1 : 1;

  // Floating state timer
  if (!spirit.isFloating) {
    spirit.floatCooldown -= dt;
    if (spirit.floatCooldown <= 0) { enterSpiritFloat(); }
  } else {
    spirit.floatTimer += dt;
    spirit.floatY = FLOOR_Y - 80 - Math.sin(spirit.animTimer * 2) * 10; // Hover high
    spirit.y = spirit.floatY;
    if (spirit.floatTimer >= spirit.floatDuration) { exitSpiritFloat(); }
  }

  // Blackout timer
  if (spirit.blackoutTimer > 0) spirit.blackoutTimer -= dt;

  // Phase transition check
  if (!spirit._phaseTransitioned && spirit.hp <= spirit.maxHp * 0.5) {
    spirit._phaseTransitioned = true;
    spirit.state = 'phase_transition';
    spirit.stateTimer = 0;
    spirit.invulnerable = true;
    spirit.phase = 2;
    spirit.spellInterval = 0.7;
    spirit.floatDuration = 4;
    sfxPhaseTransition();
    screenShake(8, 0.3);
    return;
  }

  switch (spirit.state) {
    case 'idle': spiritIdle(dt); break;
    case 'casting': spiritCasting(dt); break;
    case 'telegraph': spiritTelegraph(dt); break;
    case 'teleport': spiritTeleport(dt); break;
    case 'phase_transition': spiritPhaseTransition(dt); break;
  }

  // Gravity (only when not floating)
  if (!spirit.isFloating) {
    spirit.vy += GRAVITY * dt;
    spirit.y += spirit.vy * dt;
    if (spirit.y >= FLOOR_Y) { spirit.y = FLOOR_Y; spirit.vy = 0; }
  }
  spirit.x += spirit.vx * dt;
  spirit.x = clamp(spirit.x, 60, canvas.width - 60);

  // Update fireballs
  updateSpiritFireballs(dt);
  // Update lightning
  updateSpiritLightning(dt);
}

function spiritIdle(dt) {
  spirit.vx = 0;
  spirit.castTimer += dt;
  const interval = spirit.phase === 2 ? 0.7 : 1.2;
  if (spirit.castTimer >= interval) {
    spirit.castTimer = 0;
    spiritChooseSpell();
  }
}

function spiritChooseSpell() {
  const spells = ['lightning', 'fireball', 'fireball', 'lightning'];
  if (Math.random() < 0.2) spells.push('blackout');
  if (spirit.phase === 2) { spells.push('lightning', 'lightning', 'fireball'); }
  // Melee if player is close
  const dist = Math.abs(player.x - spirit.x);
  if (dist < 120) { spells.push('melee', 'melee'); }
  // Teleport chance after every cast
  if (Math.random() < (spirit.phase === 2 ? 0.5 : 0.25)) {
    spirit.state = 'teleport';
    spirit.stateTimer = 0;
    return;
  }
  spirit.castType = spells[Math.floor(Math.random() * spells.length)];
  spirit.state = 'telegraph';
  spirit.stateTimer = 0;
}

function spiritTelegraph(dt) {
  spirit.vx = 0;
  spirit.armAngle = lerp(spirit.armAngle, -0.8, dt * 6);
  const telegraphDur = spirit.phase === 2 ? 0.35 : 0.5;
  if (spirit.stateTimer >= telegraphDur) {
    spirit.state = 'casting';
    spirit.stateTimer = 0;
    executeSpiritSpell();
  }
}

function spiritCasting(dt) {
  spirit.vx = 0;
  const recoveryDur = spirit.phase === 2 ? 0.4 : 0.8;
  spirit.armAngle = lerp(spirit.armAngle, 0.3, dt * 4);
  if (spirit.stateTimer >= recoveryDur) {
    spirit.state = 'idle';
    spirit.stateTimer = 0;
    spirit.castTimer = 0;
  }
}

function spiritTeleport(dt) {
  if (spirit.stateTimer < 0.2) {
    // Dissolve particles
    spawnParticles(spirit.x, spirit.y - 35, 2, '#66EEFF', 60);
  } else if (spirit.stateTimer >= 0.2 && spirit.stateTimer < 0.25) {
    // DEPARTURE DAMAGE AREA — magical burst where he was
    if (!spirit._teleportDamaged) {
      spirit._teleportDamaged = true;
      const damage = spirit.phase === 2 ? 12 : 8;
      const blastRect = {x: spirit.x - 60, y: spirit.y - 80, w: 120, h: 85};
      const pRect = {x: player.x - player.w/2, y: player.y - player.h, w: player.w, h: player.h};
      if (rectOverlap(blastRect, pRect)) {
        damagePlayer(damage, player.x < spirit.x ? -1 : 1);
      }
      // Explosion visual
      spawnParticles(spirit.x, spirit.y - 35, 15, '#66EEFF', 180);
      spawnParticles(spirit.x, spirit.y - 35, 8, '#AADDFF', 120);
      screenShake(3, 0.08);
      sfxDodge(); // Burst sound
    }
    // Move to new position
    const positions = [150, 300, 480, 650, 800];
    const filtered = positions.filter(p => Math.abs(p - player.x) > 100);
    spirit.x = filtered[Math.floor(Math.random() * filtered.length)] || 480;
  } else if (spirit.stateTimer >= 0.5) {
    spawnParticles(spirit.x, spirit.y - 35, 4, '#66EEFF', 80);
    spirit.state = 'idle';
    spirit.stateTimer = 0;
    spirit.castTimer = 0;
    spirit._teleportDamaged = false;
  }
}

function spiritPhaseTransition(dt) {
  spirit.vx = 0;
  if (Math.random() < 0.3) spawnParticles(spirit.x + (Math.random()-0.5)*30, spirit.y - 40, 1, '#66EEFF', 80);
  if (spirit.stateTimer >= 2.0) {
    spirit.invulnerable = false;
    spirit.state = 'idle';
    spirit.stateTimer = 0;
    spirit.castTimer = 0;
    spirit.floatCooldown = 5;
    screenShake(10, 0.3);
    spawnParticles(spirit.x, spirit.y - 35, 20, '#66EEFF', 200);
  }
}

function enterSpiritFloat() {
  spirit.isFloating = true;
  spirit.floatTimer = 0;
  spirit.floatY = FLOOR_Y - 80;
  spirit.vy = 0;
  spawnParticles(spirit.x, spirit.y, 8, '#AADDFF', 60);
}

function exitSpiritFloat() {
  spirit.isFloating = false;
  spirit.floatCooldown = spirit.phase === 2 ? (5 + Math.random()*3) : (8 + Math.random()*4);
  spirit.vy = 0;
  spawnParticles(spirit.x, spirit.y, 6, '#AADDFF', 50);
}

// --- SPIRIT SPELL EXECUTION ---
function executeSpiritSpell() {
  switch (spirit.castType) {
    case 'lightning': castLightningSpear(); break;
    case 'fireball': castFireBall(); break;
    case 'blackout': castBlackout(); break;
    case 'melee': castSpiritMelee(); break;
  }
  sfxToolUse(); // Spell cast sound
}

function castSpiritMelee() {
  // Staff slam — swings staff in a wide arc at close range
  sfxBossStrike();
  const hx = spirit.x + spirit.facing * 50;
  const hitbox = {x: hx - 30, y: spirit.y - 60, w: 60, h: 60};
  const pRect = {x: player.x - player.w/2, y: player.y - player.h, w: player.w, h: player.h};
  if (rectOverlap(hitbox, pRect)) {
    damagePlayer(spirit.phase === 2 ? 14 : 10, spirit.facing);
  }
  // Visual: magic burst at impact point
  spawnParticles(hx, spirit.y - 30, 8, '#66EEFF', 120);
  spawnParticles(hx, spirit.y - 30, 4, '#AADDFF', 80);
  screenShake(4, 0.1);
  spirit.armAngle = 1.2 * spirit.facing; // Staff swung forward
}

function castLightningSpear() {
  const count = spirit.phase === 2 ? 3 : 1;
  spirit.lightningTargets = [];
  for (let i = 0; i < count; i++) {
    // Target player's position with slight offset for consecutive bolts
    spirit.lightningTargets.push({
      x: player.x + i * 60 * (Math.random() > 0.5 ? 1 : -1),
      delay: i * 0.4,
      timer: 0,
      fired: false,
      warningTimer: 0.6, // Warning circle duration
    });
  }
  spirit._lightningFired = true;
}

function castFireBall() {
  const baseAngle = Math.atan2(player.y - 30 - spirit.y, player.x - spirit.x);
  const spread = 0.4; // Radians between projectiles
  const speed = spirit.phase === 2 ? 320 : 260;
  for (let i = -1; i <= 1; i++) {
    const angle = baseAngle + i * spread;
    spirit.fireballs.push({
      x: spirit.x, y: spirit.y - 35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 3.0, damage: spirit.phase === 2 ? 12 : 10,
      hasHit: false,
    });
  }
  spawnParticles(spirit.x, spirit.y - 35, 5, '#FF6622', 80);
}

function castBlackout() {
  spirit.blackoutTimer = 3.0;
}

// --- SPIRIT PROJECTILE UPDATES ---
function updateSpiritFireballs(dt) {
  for (let i = spirit.fireballs.length - 1; i >= 0; i--) {
    const fb = spirit.fireballs[i];
    fb.x += fb.vx * dt;
    fb.y += fb.vy * dt;
    fb.life -= dt;
    // Hit player
    if (!fb.hasHit && rectOverlap({x:fb.x-8,y:fb.y-8,w:16,h:16},{x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
      fb.hasHit = true;
      damagePlayer(fb.damage, fb.vx > 0 ? 1 : -1);
    }
    if (fb.life <= 0 || fb.x < -30 || fb.x > canvas.width+30 || fb.y > canvas.height+30) {
      spirit.fireballs.splice(i, 1);
    }
  }
}

function updateSpiritLightning(dt) {
  for (let i = spirit.lightningTargets.length - 1; i >= 0; i--) {
    const lt = spirit.lightningTargets[i];
    lt.timer += dt;
    if (!lt.fired && lt.timer >= lt.delay + lt.warningTimer) {
      lt.fired = true;
      // Strike!
      const damage = spirit.phase === 2 ? 15 : 12;
      const strikeRect = {x: lt.x - 20, y: FLOOR_Y - 70, w: 40, h: 70};
      if (rectOverlap(strikeRect, {x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
        damagePlayer(damage, lt.x > player.x ? -1 : 1);
      }
      spawnParticles(lt.x, FLOOR_Y - 20, 10, '#66EEFF', 150);
      screenShake(4, 0.1);
      sfxBossStrike();
    }
    // Remove after strike + brief display time
    if (lt.fired && lt.timer >= lt.delay + lt.warningTimer + 0.3) {
      spirit.lightningTargets.splice(i, 1);
    }
  }
}

// ============================================================
// LADY DEATH AI
// ============================================================
function updateLady(dt) {
  if (lady.state === 'dead') { lady.stateTimer += dt; return; }
  lady.stateTimer += dt; lady.animTimer += dt;
  lady.facing = player.x < lady.x ? -1 : 1;
  lady.bodyBob = Math.sin(lady.animTimer * 4) * 1.5;

  // Phase check
  if (!lady._phaseTransitioned && lady.hp <= lady.maxHp * 0.5) {
    lady._phaseTransitioned = true; lady.state = 'phase_transition'; lady.stateTimer = 0;
    lady.invulnerable = true; lady.phase = 2; sfxPhaseTransition(); screenShake(5, 0.2); return;
  }

  switch (lady.state) {
    case 'idle': ladyIdle(dt); break;
    case 'approach': ladyApproach(dt); break;
    case 'attack': ladyAttack(dt); break;
    case 'shadow_step': ladyShadowStep(dt); break;
    case 'throw': ladyThrow(dt); break;
    case 'recover': ladyRecover(dt); break;
    case 'phase_transition': ladyPhaseTransition(dt); break;
  }

  lady.x += lady.vx * dt;
  lady.x = clamp(lady.x, 40, canvas.width - 40);

  // Update daggers
  for (let i = lady.daggers.length-1; i >= 0; i--) {
    const d = lady.daggers[i]; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt;
    if (!d.hasHit && rectOverlap({x:d.x-5,y:d.y-5,w:10,h:10},{x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
      d.hasHit = true; damagePlayer(6, d.vx > 0 ? 1 : -1);
    }
    if (d.life <= 0 || d.x < -20 || d.x > canvas.width+20) lady.daggers.splice(i, 1);
  }
}

function ladyIdle(dt) {
  lady.vx = 0; lady.castTimer += dt;
  const interval = lady.phase === 2 ? 0.35 : 0.6;
  if (lady.castTimer >= interval) { lady.castTimer = 0; ladyChooseAction(); }
}

function ladyChooseAction() {
  const dist = Math.abs(player.x - lady.x);
  if (dist > 200) {
    // Far: throw daggers or shadow step to close distance
    if (Math.random() < 0.5) { lady.state = 'shadow_step'; lady.stateTimer = 0; lady.shadowChains = 0; }
    else { lady.state = 'throw'; lady.stateTimer = 0; }
  } else if (dist > 100) {
    // Mid: approach or shadow step
    if (Math.random() < 0.4) { lady.state = 'shadow_step'; lady.stateTimer = 0; lady.shadowChains = 0; }
    else { lady.state = 'approach'; lady.stateTimer = 0; }
  } else {
    // Close: attack combo
    const attacks = ['twin_slash', 'quick_slash', 'quick_slash'];
    if (lady.phase === 2) attacks.push('twin_slash', 'twin_slash');
    lady.castType = attacks[Math.floor(Math.random()*attacks.length)];
    lady.state = 'attack'; lady.stateTimer = 0; lady.comboCount = 0;
  }
}

function ladyApproach(dt) {
  lady.vx = lady.facing * 220;
  if (Math.abs(player.x - lady.x) < 90 || lady.stateTimer > 0.8) {
    lady.vx = 0; lady.state = 'idle'; lady.stateTimer = 0; lady.castTimer = lady.phase === 2 ? 0.2 : 0.4;
  }
}

function ladyAttack(dt) {
  lady.vx = 0;
  const slashDur = 0.15;
  const maxSlashes = lady.castType === 'twin_slash' ? (lady.phase === 2 ? 5 : 4) : 3;

  if (lady.stateTimer >= slashDur) {
    lady.stateTimer = 0;
    lady.comboCount++;
    // Execute slash
    sfxLadySlash();
    lady.armAngle = lady.comboCount % 2 === 0 ? 1.2 : -0.8;
    const hx = lady.x + lady.facing * 40;
    const hitbox = {x: hx-25, y: lady.y-50, w: 50, h: 50};
    if (rectOverlap(hitbox, {x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
      const dmg = lady.castType === 'twin_slash' ? 10 : 8;
      damagePlayer(dmg, lady.facing);
    }
    spawnParticles(hx, lady.y-30, 2, '#CCCCDD', 80);

    if (lady.comboCount >= maxSlashes) {
      if (lady.phase === 2 && lady.castType === 'twin_slash') {
        const spinHitbox = {x: lady.x-45, y: lady.y-55, w: 90, h: 55};
        if (rectOverlap(spinHitbox, {x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
          damagePlayer(12, lady.facing);
        }
        spawnParticles(lady.x, lady.y-30, 8, '#882233', 120);
        screenShake(3, 0.08);
      }
      lady.state = 'recover'; lady.stateTimer = 0; lady.comboCount = 0;
    }
  }
}

function ladyShadowStep(dt) {
  if (lady.stateTimer < 0.12) {
    // Disappear
    lady.vx = 0;
    if (lady.stateTimer < 0.05) spawnParticles(lady.x, lady.y-30, 3, '#3A3A44', 50);
  } else if (lady.stateTimer >= 0.12 && lady.stateTimer < 0.15) {
    // Teleport behind player
    lady.x = player.x - lady.facing * 60;
    lady.x = clamp(lady.x, 40, canvas.width - 40);
    lady.facing = player.x < lady.x ? -1 : 1;
    spawnParticles(lady.x, lady.y-30, 4, '#3A3A44', 60);
  } else if (lady.stateTimer >= 0.2 && lady.stateTimer < 0.25) {
    // Immediate slash after appearing
    sfxAttack();
    const hx = lady.x + lady.facing * 35;
    const hitbox = {x: hx-20, y: lady.y-45, w: 40, h: 45};
    if (rectOverlap(hitbox, {x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
      damagePlayer(10, lady.facing);
    }
    spawnParticles(hx, lady.y-30, 3, '#CCCCDD', 80);
    lady.armAngle = 1.0;
  } else if (lady.stateTimer >= 0.4) {
    lady.shadowChains++;
    // P2: Can chain twice
    if (lady.phase === 2 && lady.shadowChains < 2 && Math.random() < 0.6) {
      lady.stateTimer = 0; // Chain another shadow step
    } else {
      lady.state = 'recover'; lady.stateTimer = 0;
    }
  }
}

function ladyThrow(dt) {
  lady.vx = 0;
  if (lady.stateTimer >= 0.15 && lady.stateTimer < 0.2) {
    sfxToolUse();
    const count = lady.phase === 2 ? 5 : 3;
    const baseAngle = Math.atan2(player.y - 30 - lady.y, player.x - lady.x);
    for (let i = 0; i < count; i++) {
      const spread = lady.phase === 2 ? (i - 2) * 0.2 : (i - 1) * 0.15;
      const angle = baseAngle + spread;
      lady.daggers.push({ x: lady.x, y: lady.y-30, vx: Math.cos(angle)*450, vy: Math.sin(angle)*450, life: 2, hasHit: false });
    }
    spawnParticles(lady.x, lady.y-30, 4, '#CCCCDD', 60);
    lady.armAngle = 0.6;
  }
  if (lady.stateTimer >= 0.5) { lady.state = 'idle'; lady.stateTimer = 0; lady.castTimer = 0; }
}

function ladyRecover(dt) {
  lady.vx = 0; lady.armAngle = lerp(lady.armAngle, 0, dt * 5);
  const dur = lady.phase === 2 ? 0.3 : 0.5;
  if (lady.stateTimer >= dur) { lady.state = 'idle'; lady.stateTimer = 0; lady.castTimer = 0; }
}

function ladyPhaseTransition(dt) {
  lady.vx = 0;
  if (Math.random() < 0.2) spawnParticles(lady.x + (Math.random()-0.5)*20, lady.y-30, 1, '#882233', 50);
  if (lady.stateTimer >= 1.5) { lady.invulnerable = false; lady.state = 'idle'; lady.stateTimer = 0; screenShake(6, 0.2); spawnParticles(lady.x, lady.y-30, 12, '#882233', 150); stopMusic(); startMusic(); }
}

// --- LADY DEATH DAMAGE CHECK ---
function checkLadyHit() {
  if (!player.attackHitbox || lady.invulnerable || lady.state === 'dead') return;
  if (lady.state === 'shadow_step' && lady.stateTimer < 0.15) return; // Can't hit during disappear
  const lRect = {x: lady.x - lady.w/2, y: lady.y - lady.h, w: lady.w, h: lady.h};
  if (rectOverlap(player.attackHitbox, lRect)) {
    const baseDmg = player.comboStep === 3 ? 14 : 8;
    const dmg = Math.round(baseDmg * equippedAmulet.dmgMod);
    lady.hp -= dmg;
    stats.damageDealt += dmg; stats.hits++;
    player._hitConnected = true;
    spawnParticles(lady.x, lady.y-30, 5, '#882233', 100);
    screenShake(2, 0.06); sfxHit();
    if (lady.hp <= 0) {
      lady.hp = 0; lady.state = 'dead'; lady.stateTimer = 0; lady.daggers = [];
      screenShake(10, 0.3); spawnParticles(lady.x, lady.y-30, 20, '#882233', 200);
    }
  }
}

// ============================================================
// THE GARDEN GOLEM AI
// ============================================================
function updateGolem(dt) {
  if (golem.state === 'dead') { golem.stateTimer += dt; golem.bodyShake = Math.max(0, 4 - golem.stateTimer*2); return; }
  golem.stateTimer += dt; golem.animTimer += dt;
  golem.facing = player.x < golem.x ? -1 : 1;

  // Phase check
  if (!golem._phaseTransitioned && golem.hp <= golem.maxHp * 0.5) {
    golem._phaseTransitioned = true; golem.state = 'phase_transition'; golem.stateTimer = 0;
    golem.invulnerable = true; golem.phase = 2; golem.attackInterval = 1.2;
    sfxPhaseTransition(); screenShake(6, 0.3); return;
  }

  switch (golem.state) {
    case 'idle': golemIdle(dt); break;
    case 'telegraph': golemTelegraph(dt); break;
    case 'attack': golemAttack(dt); break;
    case 'recover': golemRecover(dt); break;
    case 'phase_transition': golemPhaseTransition(dt); break;
  }

  // Movement: actively retreat if player is too close, approach if too far
  const dist = Math.abs(player.x - golem.x);
  if (golem.state === 'idle' || golem.state === 'recover') {
    if (dist < 100) {
      // Back away from player — like boss/spirit maintaining distance
      golem.vx = (player.x < golem.x ? 1 : -1) * 120;
    } else if (dist > 250) {
      golem.vx = golem.facing * 80;
    } else {
      golem.vx = 0;
    }
  } else if (golem.state !== 'attack') { golem.vx = 0; }

  golem.x += golem.vx * dt;
  golem.x = clamp(golem.x, 60, canvas.width - 60);

  // Update hazards
  updateGolemHazards(dt);
}

function golemIdle(dt) {
  golem.castTimer += dt;
  golem.armAngle = Math.sin(golem.animTimer * 1.5) * 0.05;
  // Reset hit counter if player hasn't hit in a while
  if (golem._hitResetTimer > 0) { golem._hitResetTimer -= dt; if (golem._hitResetTimer <= 0) golem._hitsReceived = 0; }
  // Aggressive timing — attacks fast
  const interval = golem.phase === 2 ? 0.8 : 1.2;
  if (golem.castTimer >= interval) { golem.castTimer = 0; golemChooseAttack(); }
}

function golemChooseAttack() {
  const attacks = ['platform', 'mist', 'rocks', 'platform', 'rocks', 'mist'];
  if (golem.phase === 2) attacks.push('roots', 'platform', 'mist', 'rocks', 'rocks', 'roots');
  // Push attack when player is close
  if (Math.abs(player.x - golem.x) < 130) {
    if (Math.random() < 0.4) { golem.castType = 'push'; golem.state = 'telegraph'; golem.stateTimer = 0; golem._slamHit = false; return; }
    attacks.push('stone_fist');
  }
  golem.castType = attacks[Math.floor(Math.random() * attacks.length)];
  golem.state = 'telegraph'; golem.stateTimer = 0; golem._slamHit = false;
}

function golemTelegraph(dt) {
  golem.vx = 0;
  golem.armAngle = lerp(golem.armAngle, -1.0, dt * 4);
  golem.bodyShake = Math.sin(golem.stateTimer * 15) * 1;
  const dur = golem.phase === 2 ? 0.5 : 0.7;
  if (golem.stateTimer >= dur) { golem.state = 'attack'; golem.stateTimer = 0; executeGolemAttack(); }
}

function executeGolemAttack() {
  switch (golem.castType) {
    case 'stone_fist': golemStoneFist(); break;
    case 'platform': golemRisingPlatform(); break;
    case 'mist': golemToxicMist(); break;
    case 'roots': golemRootAwakening(); break;
    case 'rocks': golemThrowRocks(); break;
    case 'push': golemPushBack(); break;
  }
}

function golemPushBack() {
  // Powerful shove that sends Bob flying if he's close
  sfxBossSlam();
  golem.armAngle = 0.8;
  screenShake(5, 0.12);
  const pushDir = player.x < golem.x ? -1 : 1;
  const hitbox = {x: golem.x - 50, y: golem.y - 70, w: 100, h: 70};
  if (rectOverlap(hitbox, {x:player.x-player.w/2, y:player.y-player.h, w:player.w, h:player.h})) {
    player.vx = pushDir * 500;
    player.vy = -200;
    player.onGround = false;
    const dmg = golem.phase === 2 ? 10 : 7;
    player.hp -= dmg;
    stats.damageTaken += dmg;
    playerDamageFlash = 0.3;
    sfxPlayerHit();
    spawnParticles(player.x, player.y - 30, 8, '#8A8070', 150);
    if (player.hp <= 0) { player.hp = 0; player.state = 'death'; player.stateTimer = 0; sfxDeath(); }
  }
  spawnParticles(golem.x, golem.y - 40, 6, '#6B5A42', 100);
  // Golem retreats away from player after push (like boss/spirit repositioning)
  golem.vx = -pushDir * 200;
  setTimeout(() => { golem.vx = 0; }, 400);
}

function golemStoneFist() {
  sfxGolemSlam();
  golem.armAngle = 1.5;
  screenShake(6, 0.15);
  spawnParticles(golem.x + golem.facing * 40, FLOOR_Y - 10, 10, '#8A8070', 150);
  const hx = golem.x + golem.facing * 50;
  const hitbox = {x: hx - 35, y: FLOOR_Y - 60, w: 70, h: 60};
  if (!golem._slamHit && rectOverlap(hitbox, {x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
    golem._slamHit = true; damagePlayer(golem.phase === 2 ? 15 : 12, golem.facing);
  }
}

function golemRisingPlatform() {
  golem.platforms.push({ x: player.x, y: FLOOR_Y, timer: 0, maxTime: 1.5, rising: true, warned: false });
  spawnParticles(player.x, FLOOR_Y - 5, 5, '#6B5A42', 60);
  // Phase 2: wider platform + secondary platform nearby
  if (golem.phase === 2) {
    golem.platforms.push({ x: player.x + (Math.random() > 0.5 ? 80 : -80), y: FLOOR_Y, timer: 0.2, maxTime: 1.5, rising: true, warned: false });
  }
}

function golemToxicMist() {
  const count = golem.phase === 2 ? 4 : 2;
  for (let i = 0; i < count; i++) {
    const mx = 100 + Math.random() * (canvas.width - 200);
    golem.poisonClouds.push({ x: mx, y: FLOOR_Y - 30, life: 4.0 });
  }
}

function golemRootAwakening() {
  const count = golem.phase === 2 ? 5 : 3;
  for (let i = 0; i < count; i++) {
    golem.roots.push({ x: golem.x, targetX: player.x + (Math.random()-0.5)*100, speed: 120 + i*20, life: 3.0 });
  }
}

function golemThrowRocks() {
  // Throws 3-5 small rocks in an arc toward the player
  const count = golem.phase === 2 ? 5 : 3;
  sfxBossStrike();
  for (let i = 0; i < count; i++) {
    const angle = -0.8 - Math.random() * 0.6; // Upward arc
    const speed = 250 + Math.random() * 100;
    const spread = (i - Math.floor(count/2)) * 0.2; // Spread shots
    golem.rocks.push({
      x: golem.x + golem.facing * 20,
      y: golem.y - 60,
      vx: golem.facing * speed * Math.cos(angle + spread),
      vy: speed * Math.sin(angle + spread),
      damage: golem.phase === 2 ? 10 : 7,
      hasHit: false,
      life: 3.0,
    });
  }
  spawnParticles(golem.x + golem.facing * 20, golem.y - 60, 6, '#8A8070', 80);
}

function golemAttack(dt) {
  golem.vx = 0;
  golem.armAngle = lerp(golem.armAngle, 0, dt * 3);
  if (golem.stateTimer >= 0.3) { golem.state = 'recover'; golem.stateTimer = 0; }
}

function golemRecover(dt) {
  golem.vx = 0; golem.armAngle = lerp(golem.armAngle, 0.2, dt * 2);
  golem.bodyShake = 0;
  // Reset hit counter during recovery
  if (golem._hitResetTimer > 0) { golem._hitResetTimer -= dt; if (golem._hitResetTimer <= 0) golem._hitsReceived = 0; }
  const dur = golem.phase === 2 ? 0.5 : 0.8;
  if (golem.stateTimer >= dur) { golem.state = 'idle'; golem.stateTimer = 0; golem.castTimer = 0; }
}

function golemPhaseTransition(dt) {
  golem.vx = 0; golem.bodyShake = Math.sin(golem.stateTimer * 12) * 3;
  if (Math.random() < 0.2) spawnParticles(golem.x + (Math.random()-0.5)*30, golem.y - 50, 1, '#5A8A4A', 60);

  // If player hits during transition — punish with poison burst
  if (golem._hitsReceived > 0) {
    golem._hitsReceived = 0;
    // Spawn poison clouds around golem as punishment
    for (let i = 0; i < 3; i++) {
      golem.poisonClouds.push({ x: golem.x + (i-1)*60, y: FLOOR_Y - 30, life: 4.0 });
    }
    spawnParticles(golem.x, golem.y - 40, 12, '#44AA33', 150);
    screenShake(5, 0.15);
    // Also push player away
    const pushDir = player.x < golem.x ? -1 : 1;
    player.vx = pushDir * 400; player.vy = -150; player.onGround = false;
    sfxBossSlam();
  }

  if (golem.stateTimer >= 2.0) { golem.invulnerable = false; golem.state = 'idle'; golem.stateTimer = 0; golem.bodyShake = 0; screenShake(8, 0.3); spawnParticles(golem.x, golem.y-40, 15, '#66DD66', 180); stopMusic(); startMusic(); }
}

function updateGolemHazards(dt) {
  // Platforms
  for (let i = golem.platforms.length-1; i >= 0; i--) {
    const p = golem.platforms[i]; p.timer += dt;
    const rise = Math.min(p.timer / p.maxTime, 1) * 60;
    const pw = golem.phase === 2 ? 55 : 40;

    // If Bob is standing on the platform, carry him upward
    if (player.onGround && Math.abs(player.x - p.x) < pw/2 + 5 && p.timer < p.maxTime) {
      player.y = FLOOR_Y - rise - 12;
      player.onGround = true;
      player.vy = 0;
    }

    if (p.timer >= p.maxTime) {
      // Collapse — if player was on or near it, he falls and takes damage
      const hitRange = golem.phase === 2 ? 45 : 30;
      if (Math.abs(player.x - p.x) < hitRange) {
        // Player falls from the height
        player.vy = 0;
        player.onGround = false;
        damagePlayer(18, player.x < p.x ? -1 : 1);
      }
      spawnParticles(p.x, FLOOR_Y - 40, 8, '#8A8070', 120);
      screenShake(4, 0.1);
      golem.platforms.splice(i, 1);
    }
  }
  // Poison clouds
  for (let i = golem.poisonClouds.length-1; i >= 0; i--) {
    const c = golem.poisonClouds[i]; c.life -= dt;
    if (c.life <= 0) { golem.poisonClouds.splice(i, 1); continue; }
    // Damage player inside cloud (stronger in Phase 2)
    const poisonDps = golem.phase === 2 ? 6 : 3; // 6 HP/sec in P2
    if (Math.abs(player.x - c.x) < 35 && player.y >= FLOOR_Y - 50) {
      player.hp -= poisonDps * dt;
      if (player.hp <= 0 && player.state !== 'death') { player.hp = 0; player.state = 'death'; player.stateTimer = 0; sfxDeath(); }
    }
  }
  // Roots
  for (let i = golem.roots.length-1; i >= 0; i--) {
    const r = golem.roots[i]; r.life -= dt;
    r.x += (r.targetX - r.x) > 0 ? r.speed * dt : -r.speed * dt;
    if (r.life <= 0) { golem.roots.splice(i, 1); continue; }
    if (Math.abs(player.x - r.x) < 20 && player.onGround) {
      damagePlayer(5, r.x > player.x ? -1 : 1);
      golem.roots.splice(i, 1);
    }
  }
  // Rocks (aerial projectiles with gravity)
  for (let i = golem.rocks.length-1; i >= 0; i--) {
    const rk = golem.rocks[i];
    rk.x += rk.vx * dt;
    rk.vy += 600 * dt; // Gravity on rocks
    rk.y += rk.vy * dt;
    rk.life -= dt;
    // Hit player
    if (!rk.hasHit && rectOverlap({x:rk.x-8,y:rk.y-8,w:16,h:16},{x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
      rk.hasHit = true;
      damagePlayer(rk.damage, rk.vx > 0 ? 1 : -1);
      spawnParticles(rk.x, rk.y, 4, '#8A8070', 60);
    }
    // Remove if off screen or hit ground
    if (rk.life <= 0 || rk.y > FLOOR_Y || rk.x < -30 || rk.x > canvas.width + 30) {
      if (!rk.hasHit && rk.y >= FLOOR_Y) spawnParticles(rk.x, FLOOR_Y, 3, '#6B5A42', 40); // Dust on landing
      golem.rocks.splice(i, 1);
    }
  }
}

// --- GOLEM DAMAGE CHECK ---
function checkGolemHit() {
  if (!player.attackHitbox || golem.invulnerable || golem.state === 'dead') return;
  const gRect = {x: golem.x - golem.w/2, y: golem.y - golem.h, w: golem.w, h: golem.h};
  if (rectOverlap(player.attackHitbox, gRect)) {
    const baseDmg = player.comboStep === 3 ? 14 : 8;
    const dmg = Math.round(baseDmg * equippedAmulet.dmgMod);
    golem.hp -= dmg;
    stats.damageDealt += dmg; stats.hits++;
    player._hitConnected = true;
    spawnParticles(golem.x, golem.y - 45, 5, '#8A8070', 100);
    screenShake(2, 0.05); sfxHit();
    // NO hitStop on golem — he must be able to react

    // Track consecutive hits — after 2, FORCE push back immediately
    golem._hitsReceived++;
    golem._hitResetTimer = 0.8;
    if (golem._hitsReceived >= 2 && golem.state !== 'phase_transition' && golem.state !== 'dead') {
      golem._hitsReceived = 0;
      // Immediately interrupt and push — no telegraph
      golem.state = 'attack'; golem.stateTimer = 0;
      golem.castType = 'push';
      golemPushBack();
      return;
    }

    if (golem.hp <= 0) {
      golem.hp = 0; golem.state = 'dead'; golem.stateTimer = 0;
      golem.platforms = []; golem.poisonClouds = []; golem.roots = []; golem.rocks = [];
      screenShake(10, 0.3); spawnParticles(golem.x, golem.y-45, 20, '#5A8A4A', 200);
    }
  }
}

// --- SPIRIT DAMAGE CHECK ---
function checkSpiritHit() {
  if (!player.attackHitbox || spirit.invulnerable || spirit.state === 'dead') return;
  // If floating, only air attacks damage
  if (spirit.isFloating && player.onGround) return;

  const spiritRect = {x: spirit.x - spirit.w/2, y: spirit.y - spirit.h, w: spirit.w, h: spirit.h};
  if (rectOverlap(player.attackHitbox, spiritRect)) {
    const baseDmg = player.comboStep === 3 ? 14 : 8;
    const dmg = Math.round(baseDmg * equippedAmulet.dmgMod);
    spirit.hp -= dmg;
    stats.damageDealt += dmg; stats.hits++;
    player._hitConnected = true;
    spawnParticles(spirit.x, spirit.y - 40, 6, '#66EEFF', 120);
    screenShake(3, 0.08); hitStop(2); sfxHit();

    if (spirit.hp <= 0) {
      spirit.hp = 0;
      spirit.state = 'dead';
      spirit.stateTimer = 0;
      spirit.fireballs = [];
      spirit.lightningTargets = [];
      spirit.blackoutTimer = 0;
      screenShake(12, 0.4);
      spawnParticles(spirit.x, spirit.y - 35, 25, '#66EEFF', 250);
    }
  }
}
// RENDERING
// ============================================================
function render() {
  ctx.save();
  if (shakeDuration > 0) { shakeOffsetX=(Math.random()-0.5)*shakeIntensity*2; shakeOffsetY=(Math.random()-0.5)*shakeIntensity*2; ctx.translate(shakeOffsetX, shakeOffsetY); }

  // Background
  if (currentEnemy === 'golem') {
    // GARDEN ARENA: Peaceful, green, alive — earliest area
    const grad = ctx.createLinearGradient(0,0,0,FLOOR_Y);
    grad.addColorStop(0, '#88BBDD'); grad.addColorStop(0.6, '#AADDEE'); grad.addColorStop(1, '#77AA77');
    ctx.fillStyle=grad; ctx.fillRect(0,0,canvas.width,FLOOR_Y);
    // Trees in background
    ctx.fillStyle='#3A7744';
    for(let i=0;i<6;i++){const tx=80+i*160,th=100+Math.sin(i*1.7)*30;ctx.beginPath();ctx.ellipse(tx,FLOOR_Y-120,25+i*3,th/2,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#5A3A22';for(let i=0;i<6;i++){const tx=80+i*160;ctx.fillRect(tx-4,FLOOR_Y-70,8,70);}
    // Flowers
    const time=golem.animTimer;
    for(let i=0;i<15;i++){const fx=(i*67+20)%canvas.width,fy=FLOOR_Y-5-Math.sin(time*0.5+i)*2;
      ctx.fillStyle=['#FFAA66','#FF88AA','#AADDFF','#FFEE55'][i%4];ctx.beginPath();ctx.arc(fx,fy,3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#4A8A3A';ctx.fillRect(fx-0.5,fy,1,5);}
    // Stone path
    ctx.fillStyle='#7A7060';ctx.fillRect(0,FLOOR_Y,canvas.width,80);
    ctx.fillStyle='#8A8070';for(let x=0;x<canvas.width;x+=50)ctx.fillRect(x+3,FLOOR_Y+1,44,3);
    // Grass tufts on edges
    ctx.fillStyle='#5A9A4A';for(let x=0;x<canvas.width;x+=35){ctx.fillRect(x,FLOOR_Y-3,4,5);ctx.fillRect(x+10,FLOOR_Y-5,3,6);}
  } else if (currentEnemy === 'lady') {
    // LADY DEATH ARENA: Moonlit courtyard — elegant, cold, silent
    const grad = ctx.createLinearGradient(0,0,0,FLOOR_Y);
    grad.addColorStop(0, '#0A0A1A'); grad.addColorStop(0.5, '#151525'); grad.addColorStop(1, '#1A1A2A');
    ctx.fillStyle=grad; ctx.fillRect(0,0,canvas.width,FLOOR_Y);
    // Moon
    ctx.fillStyle='#DDDDEE'; ctx.beginPath(); ctx.arc(150, 60, 25, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#0A0A1A'; ctx.beginPath(); ctx.arc(140, 55, 22, 0, Math.PI*2); ctx.fill(); // Crescent
    // Broken statues
    ctx.fillStyle='#2A2A35';
    ctx.fillRect(70,FLOOR_Y-130,18,130); ctx.fillRect(65,FLOOR_Y-135,28,8); // Left statue base
    ctx.fillRect(canvas.width-88,FLOOR_Y-145,18,145); ctx.fillRect(canvas.width-93,FLOOR_Y-150,28,8);
    // Dead leaves drifting
    const lt=lady.animTimer;
    for(let i=0;i<8;i++){const lx=(i*120+lt*20+i*37)%canvas.width,ly=FLOOR_Y-10-Math.sin(lt*0.5+i*2)*30;ctx.fillStyle='#4A3A2A';ctx.fillRect(lx,ly,4,2);}
    // Lanterns (dim orange glow)
    ctx.fillStyle='rgba(255,150,50,0.08)';ctx.beginPath();ctx.arc(100,FLOOR_Y-20,40,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(canvas.width-100,FLOOR_Y-20,40,0,Math.PI*2);ctx.fill();
    // Stone floor
    ctx.fillStyle='#1E1E28';ctx.fillRect(0,FLOOR_Y,canvas.width,80);
    ctx.fillStyle='#2A2A34';for(let x=0;x<canvas.width;x+=55)ctx.fillRect(x+2,FLOOR_Y,50,2);
  } else if (currentEnemy === 'lion') {
    // LION ARENA: drawn from white_lion.js
    drawLionArena();
  } else if (currentEnemy === 'spirit') {
    const grad = ctx.createLinearGradient(0,0,0,FLOOR_Y);
    grad.addColorStop(0, '#1E1A3A'); grad.addColorStop(0.4, '#2D2850'); grad.addColorStop(1, '#3A3060');
    ctx.fillStyle=grad; ctx.fillRect(0,0,canvas.width,FLOOR_Y);
    // Forest silhouette
    ctx.fillStyle='#1A1835';
    for(let i=0;i<8;i++){const tx=i*130+30,th=80+Math.sin(i*2.3)*30;ctx.beginPath();ctx.moveTo(tx-20,FLOOR_Y-160);ctx.lineTo(tx,FLOOR_Y-160-th);ctx.lineTo(tx+20,FLOOR_Y-160);ctx.closePath();ctx.fill();}
    // Stone pillars
    ctx.fillStyle='#4A4560';ctx.fillRect(30,FLOOR_Y-180,25,180);ctx.fillRect(canvas.width-55,FLOOR_Y-180,25,180);
    ctx.strokeStyle='#4A4560';ctx.lineWidth=12;ctx.beginPath();ctx.arc(canvas.width/2,FLOOR_Y-160,180,Math.PI+0.3,-0.3);ctx.stroke();
    ctx.fillStyle='#3D3855';ctx.fillRect(160,FLOOR_Y-100,15,100);ctx.fillRect(canvas.width-175,FLOOR_Y-120,15,120);
    ctx.fillStyle='#5A5575';ctx.fillRect(25,FLOOR_Y-185,35,8);ctx.fillRect(canvas.width-60,FLOOR_Y-185,35,8);
    // Moss on ruins
    ctx.fillStyle='#3A6644';ctx.fillRect(30,FLOOR_Y-140,8,20);ctx.fillRect(35,FLOOR_Y-80,6,15);ctx.fillRect(canvas.width-50,FLOOR_Y-130,7,18);
    // Floating runes
    ctx.globalAlpha=0.15+Math.sin(spirit.animTimer*0.8)*0.08;ctx.strokeStyle='#88AADD';ctx.lineWidth=1;
    for(let i=0;i<4;i++){const rx=200+i*180+Math.sin(spirit.animTimer*0.5+i)*15,ry=100+i*40+Math.cos(spirit.animTimer*0.7+i)*10;ctx.beginPath();ctx.arc(rx,ry,8+i*2,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(rx,ry-5);ctx.lineTo(rx+5,ry);ctx.lineTo(rx,ry+5);ctx.lineTo(rx-5,ry);ctx.closePath();ctx.stroke();}
    ctx.globalAlpha=1;
    // Fireflies
    const time=spirit.animTimer;
    for(let i=0;i<12;i++){const fx=(i*97+Math.sin(time*0.6+i*1.3)*40)%canvas.width,fy=80+(i*43)%(FLOOR_Y-120)+Math.sin(time*0.8+i*2)*15;ctx.globalAlpha=0.3+Math.sin(time*2+i*1.7)*0.25;ctx.fillStyle=i%3===0?'#FFEEAA':'#AADDFF';ctx.beginPath();ctx.arc(fx,fy,1.5+Math.sin(time+i)*0.5,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    // Floor: purple stone tiles with moss
    ctx.fillStyle='#3A3555';ctx.fillRect(0,FLOOR_Y,canvas.width,80);
    ctx.fillStyle='#4A4565';for(let x=0;x<canvas.width;x+=48)ctx.fillRect(x+2,FLOOR_Y,44,3);
    ctx.fillStyle='#2A5533';for(let x=0;x<canvas.width;x+=96)ctx.fillRect(x+46,FLOOR_Y+1,4,2);
    // Phase 2: debris rises, vignette
    if(spirit.phase===2){for(let i=0;i<6;i++){const dx=100+i*150+Math.sin(time*0.4+i)*20,dy=FLOOR_Y-50-i*30-Math.sin(time*0.6+i*2)*15;ctx.fillStyle='#4A4565';ctx.fillRect(dx-4,dy-3,8,6);}const vig=ctx.createRadialGradient(canvas.width/2,FLOOR_Y/2,200,canvas.width/2,FLOOR_Y/2,500);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(10,5,20,0.3)');ctx.fillStyle=vig;ctx.fillRect(0,0,canvas.width,FLOOR_Y);}
  } else {
    // CAT KEEPER ARENA
    const grad = ctx.createLinearGradient(0,0,0,FLOOR_Y); grad.addColorStop(0,COLORS.bgDark); grad.addColorStop(1,COLORS.bgMid); ctx.fillStyle=grad; ctx.fillRect(0,0,canvas.width,FLOOR_Y);
    if (boss.phase === 2 && gameState === 'playing') {
      ctx.strokeStyle=`rgba(140,60,200,${0.3+Math.sin(boss.animTimer*2)*0.15})`;ctx.lineWidth=1.5;
      for(let i=0;i<12;i++){const baseX=((i*137+42)%canvas.width),baseY=((i*89+42)%(FLOOR_Y-50));ctx.beginPath();ctx.moveTo(baseX,baseY);let fx=baseX,fy=baseY;for(let j=0;j<4;j++){fx+=(Math.sin(boss.animTimer*(1+i*0.3)+j)*20+(i%2===0?15:-15));fy+=15+Math.sin(boss.animTimer+i+j)*8;ctx.lineTo(fx,fy);}ctx.stroke();}
      ctx.fillStyle=`rgba(80,20,120,${0.05+Math.sin(boss.animTimer*1.5)*0.03})`;ctx.fillRect(0,0,canvas.width,FLOOR_Y);
    }
    ctx.fillStyle='#2A2235';ctx.fillRect(50,FLOOR_Y-200,20,200);ctx.fillRect(canvas.width-70,FLOOR_Y-200,20,200);
    ctx.strokeStyle='#2A2235';ctx.lineWidth=8;ctx.beginPath();ctx.arc(canvas.width/2,FLOOR_Y-180,200,Math.PI,0);ctx.stroke();
    ctx.fillStyle=COLORS.floor;ctx.fillRect(0,FLOOR_Y,canvas.width,80);ctx.fillStyle=COLORS.floorLight;for(let x=0;x<canvas.width;x+=60)ctx.fillRect(x,FLOOR_Y,30,3);
  }

  // Shockwaves
  shockwaves.forEach(s=>{ctx.save();ctx.translate(s.x,s.y);ctx.fillStyle=boss.phase===2?COLORS.bossGlow:COLORS.bossRockLight;ctx.globalAlpha=Math.min(s.life,1);ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(-10,-15);ctx.lineTo(0,-5);ctx.lineTo(10,-18);ctx.lineTo(20,0);ctx.lineTo(10,5);ctx.lineTo(-10,5);ctx.closePath();ctx.fill();ctx.restore();});

  // Projectiles
  projectiles.forEach(p=>{ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(p.x+8*(p.vx>0?1:-1),p.y);ctx.lineTo(p.x-4*(p.vx>0?1:-1),p.y-3);ctx.lineTo(p.x-4*(p.vx>0?1:-1),p.y+3);ctx.closePath();ctx.fill();});

  drawPlayer();
  if (currentEnemy === 'golem') drawGolem();
  else if (currentEnemy === 'lady') drawLady();
  else if (currentEnemy === 'lion') drawLion();
  else if (currentEnemy === 'spirit') drawSpirit();
  else drawBoss();

  // Particles
  particles.forEach(p=>{ctx.globalAlpha=clamp(p.life/0.3,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);});
  ctx.globalAlpha=1;

  // HUD
  if (gameState === 'playing') drawHUD();
  ctx.restore();

  // Overlays
  if (gameState === 'menu') drawMenu();
  if (gameState === 'cinematic') drawCinematic();
  if (gameState === 'equip' || gameState === 'midequip') drawEquipMenu();
  if (gameState === 'intro') drawIntro();
  if (gameState === 'death') drawDeathScreen();
  if (gameState === 'victory') drawVictoryScreen();

  // Last Breath dialogue overlay
  if (lastBreathDialogue > 0 && (gameState === 'playing' || gameState === 'death')) {
    const alpha = lastBreathDialogue > 2.0 ? (2.5 - lastBreathDialogue) * 2 : // Fade in
                  lastBreathDialogue < 0.5 ? lastBreathDialogue * 2 : 1; // Fade out
    ctx.globalAlpha = clamp(alpha, 0, 1);

    // Small dialogue box from Almohadita
    const bx = canvas.width/2 - 90, by = canvas.height/2 - 60;
    ctx.fillStyle = 'rgba(20, 18, 30, 0.9)';
    ctx.strokeStyle = '#FFDDAA';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bx, by, 180, 50, 6); ctx.fill(); ctx.stroke();

    // Cat name
    ctx.fillStyle = '#FFDDAA'; ctx.font = 'bold 9px monospace';
    ctx.fillText('Almohadita', bx + 8, by + 14);

    // "Miau"
    ctx.fillStyle = COLORS.white; ctx.font = '13px monospace';
    ctx.fillText('Miau~', bx + 8, by + 34);

    // "Tu último aliento" text below — subtle
    if (lastBreathDialogue < 2.0) {
      ctx.fillStyle = `rgba(255, 221, 170, ${clamp(alpha * 0.7, 0, 0.7)})`;
      ctx.font = '10px monospace'; ctx.textAlign = 'center';
      ctx.fillText('Tu último aliento', canvas.width/2, by + 70);
      ctx.textAlign = 'left';
    }

    ctx.globalAlpha = 1;
  }
}

function drawPlayer() {
  if (player.state==='death'&&player.stateTimer>2) return;

  // Dash trail
  dashTrail.forEach(t => { ctx.globalAlpha = t.alpha * (t.life/0.3); ctx.fillStyle = COLORS.cooldownBlue; ctx.fillRect(t.x-8, t.y-10, 16, 20); });
  ctx.globalAlpha = 1;

  ctx.save(); ctx.translate(player.x, player.y);
  if(player.invulnerable&&Math.floor(player.animTimer*20)%2===0) ctx.globalAlpha=0.4;
  if(player.state==='hit'&&player.stateTimer<0.1) ctx.globalAlpha=0.6;

  // DAMAGE FLASH — red overlay
  const damageFlashActive = playerDamageFlash !== 0;

  const f=player.facing, bob=player.bodyBob, leg=player.legOffset;
  const df=player.state==='death'?Math.min(player.stateTimer*2,1):0;
  ctx.rotate(df*f*1.2);

  ctx.fillStyle=COLORS.cape; ctx.beginPath(); ctx.ellipse(-f*5,-28+bob,14,22,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=COLORS.armorShadow; ctx.fillRect(-8+leg*0.3,-12,6,14); ctx.fillRect(2-leg*0.3,-12,6,14);
  ctx.fillStyle=COLORS.armorLight; ctx.fillRect(-9+leg*0.3,-2,8,5); ctx.fillRect(1-leg*0.3,-2,8,5);
  ctx.fillStyle=COLORS.tunicRed; ctx.fillRect(-12,-38+bob,24,28);
  ctx.fillStyle=COLORS.belt; ctx.fillRect(-13,-18+bob,26,5); ctx.fillStyle=COLORS.buckle; ctx.fillRect(-3,-17+bob,6,3);
  ctx.fillStyle=COLORS.armorLight; ctx.fillRect(-10,-48+bob,20,14); ctx.fillStyle=COLORS.armorHighlight; ctx.fillRect(-6,-46+bob,4,8);

  // Arm + Weapon — weapon held vertical, swings outward only
  ctx.save(); ctx.translate(f*12,-35+bob); ctx.rotate(player.armAngle*f);
  ctx.fillStyle=COLORS.armorLight; ctx.fillRect(-3,0,7,16);
  // Weapon: pivots from hand. angle=0 means vertical UP. Positive angle = outward (in facing direction)
  ctx.save(); ctx.translate(2,14); ctx.rotate(player.weaponAngle * f); // f ensures it always goes OUTWARD
  ctx.fillStyle=COLORS.branch; ctx.fillRect(-2,-38,4,40); // Branch extends UP from hand
  ctx.fillStyle=COLORS.leaf; ctx.beginPath(); ctx.ellipse(0,-40,5,3,0,0,Math.PI*2); ctx.fill(); // Leaf at top
  ctx.restore(); ctx.restore();

  ctx.fillStyle=COLORS.armorShadow; ctx.fillRect(-f*12-2,-35+bob,6,14);
  ctx.fillStyle=COLORS.armorLight; ctx.beginPath(); ctx.arc(0,-55+bob,14,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=COLORS.armorHighlight; ctx.beginPath(); ctx.arc(0,-60+bob,8,Math.PI,0); ctx.fill();
  ctx.fillStyle=COLORS.visor; ctx.fillRect(-9,-56+bob,18,5);
  ctx.fillStyle=COLORS.armorShadow; ctx.fillRect(-6,-50+bob,3,2); ctx.fillRect(0,-50+bob,3,2); ctx.fillRect(3,-50+bob,3,2);

  // DAMAGE FLASH overlay (red) or HEAL FLASH (green)
  if (damageFlashActive) {
    if (playerDamageFlash > 0) {
      ctx.globalAlpha = playerDamageFlash * 1.5;
      ctx.fillStyle = '#FF2222';
    } else {
      ctx.globalAlpha = Math.abs(playerDamageFlash) * 1.5;
      ctx.fillStyle = '#44FF66';
    }
    ctx.fillRect(-16, -72+bob, 32, 74);
    ctx.beginPath(); ctx.arc(0,-55+bob,15,0,Math.PI*2); ctx.fill();
  }

  ctx.restore();
}

function drawBoss() {
  if(boss.state==='death'&&boss.stateTimer>4) return;
  ctx.save(); ctx.translate(boss.x+boss.bodyShake, boss.y);
  const f=boss.facing, fade=boss.state==='death'?Math.max(0,1-boss.stateTimer/4):1;
  ctx.globalAlpha=fade;

  ctx.fillStyle='#1A1210'; ctx.beginPath(); ctx.moveTo(-f*8,-65); ctx.lineTo(-f*25,-10); ctx.lineTo(-f*5,-10); ctx.closePath(); ctx.fill();
  ctx.fillStyle=COLORS.bossRock; ctx.fillRect(-14,-20,10,22); ctx.fillRect(4,-20,10,22);
  ctx.fillStyle=COLORS.bossRockLight; ctx.fillRect(-16,-2,14,6); ctx.fillRect(2,-2,14,6);
  ctx.fillStyle=COLORS.bossRock; ctx.fillRect(-20,-65,40,50);
  ctx.fillStyle=COLORS.bossRockLight; ctx.fillRect(-18,-60,8,20); ctx.fillRect(10,-60,8,20);

  if(boss.phase===2){ctx.strokeStyle=COLORS.bossGlow;ctx.lineWidth=2;ctx.globalAlpha=fade*boss.glowIntensity;ctx.beginPath();ctx.moveTo(-10,-60);ctx.lineTo(-5,-45);ctx.lineTo(-12,-30);ctx.moveTo(8,-55);ctx.lineTo(12,-40);ctx.lineTo(6,-25);ctx.stroke();ctx.globalAlpha=fade;}

  ctx.save(); ctx.translate(f*20,-50); ctx.rotate(boss.armAngle*f);
  ctx.fillStyle=COLORS.bossRock; ctx.fillRect(-5,0,10,24);
  ctx.fillStyle='#4A4A4A'; ctx.fillRect(-3,22,6,35); ctx.fillStyle='#666'; ctx.fillRect(-5,20,10,5);
  if(boss.phase===2){ctx.fillStyle=`rgba(255,51,0,${boss.glowIntensity*0.5})`;ctx.fillRect(-2,24,4,30);}
  ctx.restore();

  ctx.fillStyle=COLORS.bossRock; ctx.fillRect(-f*18,-55,8,20);
  ctx.fillStyle=COLORS.bossRock; ctx.beginPath(); ctx.arc(0,-78,18,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=COLORS.bossRockLight; ctx.beginPath(); ctx.arc(0,-84,12,Math.PI,0); ctx.fill();
  ctx.fillStyle=boss.phase===2?COLORS.bossEyes:'#111'; ctx.fillRect(-10,-80,20,6);
  if(boss.phase===2){ctx.shadowColor=COLORS.bossGlow;ctx.shadowBlur=10;ctx.fillStyle=COLORS.bossEyes;ctx.fillRect(-8,-79,6,4);ctx.fillRect(2,-79,6,4);ctx.shadowBlur=0;}
  ctx.restore();
}

// --- DRAW LADY DEATH ---
function drawLady() {
  if (lady.state === 'dead' && lady.stateTimer > 3) return;
  const fade = lady.state === 'dead' ? Math.max(0, 1-lady.stateTimer/3) : 1;
  // Daggers in flight
  lady.daggers.forEach(d => { if(d.hasHit)return; ctx.fillStyle='#CCCCDD'; ctx.save(); ctx.translate(d.x,d.y); ctx.rotate(Math.atan2(d.vy,d.vx)); ctx.fillRect(-6,-1.5,12,3); ctx.restore(); });
  // Body
  if (lady.state === 'shadow_step' && lady.stateTimer < 0.15) { ctx.globalAlpha = 0.3 * fade; } else { ctx.globalAlpha = fade; }
  ctx.save(); ctx.translate(lady.x, lady.y + lady.bodyBob);
  const f = lady.facing;
  // Cloak
  ctx.fillStyle='#3A3A44'; ctx.beginPath(); ctx.moveTo(-f*5,-50); ctx.lineTo(-f*18,-5); ctx.lineTo(-f*3,-5); ctx.closePath(); ctx.fill();
  // Legs
  ctx.fillStyle='#2A2A2A'; ctx.fillRect(-6,-8,5,10); ctx.fillRect(2,-8,5,10);
  // Body
  ctx.fillStyle='#2A2A2A'; ctx.fillRect(-10,-42,20,36);
  // Crimson sash
  ctx.fillStyle='#882233'; ctx.fillRect(-11,-20,22,4);
  // Arms + daggers
  ctx.save(); ctx.translate(f*10,-32); ctx.rotate(lady.armAngle*f);
  ctx.fillStyle='#2A2A2A'; ctx.fillRect(-2,0,5,14);
  ctx.fillStyle='#CCCCDD'; ctx.fillRect(-1,12,3,12); // Dagger blade
  ctx.restore();
  ctx.fillStyle='#2A2A2A'; ctx.fillRect(-f*8,-35,4,12); // Back arm
  // Head/hood
  ctx.fillStyle='#2A2A2A'; ctx.beginPath(); ctx.arc(0,-48,10,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1A1A1A'; ctx.beginPath(); ctx.arc(0,-51,8,Math.PI,0); ctx.fill(); // Hood top
  // Eyes (pale, cold)
  ctx.fillStyle='#DDDDDD'; ctx.fillRect(-4,-49,3,2); ctx.fillRect(1,-49,3,2);
  ctx.restore(); ctx.globalAlpha = 1;
}

// --- DRAW GOLEM ---
function drawGolem() {
  if (golem.state === 'dead' && golem.stateTimer > 3) return;
  const fade = golem.state === 'dead' ? Math.max(0, 1-golem.stateTimer/3) : 1;

  // Draw hazards first
  // Poison clouds
  golem.poisonClouds.forEach(c => {
    const cloudSize = golem.phase === 2 ? 45 : 35;
    ctx.globalAlpha = Math.min(c.life/0.5, 1) * (golem.phase === 2 ? 0.65 : 0.5) * fade;
    ctx.fillStyle = golem.phase === 2 ? '#33AA22' : '#44AA33';
    ctx.beginPath(); ctx.ellipse(c.x, c.y, cloudSize, cloudSize * 0.55, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = golem.phase === 2 ? '#55DD33' : '#66CC44';
    ctx.beginPath(); ctx.ellipse(c.x+5, c.y-5, cloudSize*0.6, cloudSize*0.35, 0, 0, Math.PI*2); ctx.fill();
    // Phase 2: small flower particles inside poison
    if (golem.phase === 2 && Math.random() < 0.05) {
      spawnParticles(c.x + (Math.random()-0.5)*30, c.y - 10, 1, '#FFEE55', 20);
    }
  });
  ctx.globalAlpha = 1;
  // Platforms (rising stones) — wider in Phase 2
  golem.platforms.forEach(p => {
    const rise = Math.min(p.timer / p.maxTime, 1) * 60;
    const pw = golem.phase === 2 ? 55 : 40;
    ctx.fillStyle = '#8A8070'; ctx.fillRect(p.x - pw/2, FLOOR_Y - rise - 10, pw, 12);
    ctx.fillStyle = '#6A6050'; ctx.fillRect(p.x - pw/2 + 3, FLOOR_Y - rise - 8, pw - 6, 3);
    // Warning circle
    ctx.strokeStyle = `rgba(255,100,50,${0.5 + Math.sin(p.timer*10)*0.3})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, FLOOR_Y-2, pw/2 + 5, 6, 0, 0, Math.PI*2); ctx.stroke();
  });
  // Roots
  golem.roots.forEach(r => {
    ctx.fillStyle = '#5A3A22'; ctx.fillRect(r.x - 4, FLOOR_Y - 15, 8, 18);
    ctx.fillStyle = '#4A8A3A'; ctx.fillRect(r.x - 2, FLOOR_Y - 18, 4, 5);
  });
  // Rocks (flying stones)
  golem.rocks.forEach(rk => {
    if (rk.hasHit) return;
    ctx.fillStyle = '#7A7060';
    ctx.beginPath(); ctx.arc(rk.x, rk.y, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#5A5040';
    ctx.beginPath(); ctx.arc(rk.x-2, rk.y-2, 3, 0, Math.PI*2); ctx.fill();
  });

  // Golem body
  ctx.save(); ctx.translate(golem.x + golem.bodyShake, golem.y);
  ctx.globalAlpha = fade;
  const f = golem.facing;

  // Legs
  ctx.fillStyle = '#7A7060'; ctx.fillRect(-18, -22, 14, 24); ctx.fillRect(4, -22, 14, 24);
  // Body (large stone mass)
  ctx.fillStyle = '#8A8070'; ctx.fillRect(-25, -75, 50, 58);
  // Moss patches
  ctx.fillStyle = '#5A8A4A'; ctx.fillRect(-20, -50, 8, 6); ctx.fillRect(12, -65, 7, 5);
  ctx.fillRect(-15, -35, 10, 4);
  // Flowers on body
  ctx.fillStyle = '#FFAA66'; ctx.beginPath(); ctx.arc(-18, -68, 3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#FF88AA'; ctx.beginPath(); ctx.arc(16, -42, 2.5, 0, Math.PI*2); ctx.fill();
  // Phase 2: Many more flowers bloom on body
  if (golem.phase === 2) {
    ctx.fillStyle = '#FF88AA'; ctx.beginPath(); ctx.arc(-10, -55, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FFEE55'; ctx.beginPath(); ctx.arc(8, -70, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#AADDFF'; ctx.beginPath(); ctx.arc(-22, -40, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FFAA66'; ctx.beginPath(); ctx.arc(20, -55, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FF88AA'; ctx.beginPath(); ctx.arc(0, -30, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#66DD66'; ctx.beginPath(); ctx.arc(-8, -72, 2, 0, Math.PI*2); ctx.fill();
    // Extra moss/vines
    ctx.fillStyle = '#4A8A3A'; ctx.fillRect(-22, -60, 5, 8); ctx.fillRect(18, -50, 4, 7);
    ctx.fillRect(-12, -42, 6, 4); ctx.fillRect(8, -35, 5, 5);
    // Pulsing glow on flowers
    ctx.globalAlpha = 0.3 + Math.sin(golem.animTimer * 3) * 0.2;
    ctx.fillStyle = '#88FF88';
    ctx.beginPath(); ctx.arc(0, -50, 20, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Arms
  ctx.save(); ctx.translate(f * 22, -55); ctx.rotate(golem.armAngle * f);
  ctx.fillStyle = '#7A7060'; ctx.fillRect(-6, 0, 12, 30);
  // Fist
  ctx.fillStyle = '#6A6050'; ctx.beginPath(); ctx.arc(0, 32, 10, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  // Back arm
  ctx.fillStyle = '#6A6050'; ctx.fillRect(-f * 20, -55, 10, 25);

  // Head
  ctx.fillStyle = '#8A8070'; ctx.beginPath(); ctx.arc(0, -82, 16, 0, Math.PI*2); ctx.fill();
  // Eyes (green glow)
  ctx.fillStyle = '#66DD66';
  ctx.fillRect(-7, -85, 5, 4); ctx.fillRect(2, -85, 5, 4);
  ctx.shadowColor = '#66DD66'; ctx.shadowBlur = 6;
  ctx.fillRect(-7, -85, 5, 4); ctx.fillRect(2, -85, 5, 4);
  ctx.shadowBlur = 0;
  // Small vine on head
  ctx.fillStyle = '#4A8A3A'; ctx.fillRect(-2, -96, 3, 12);
  ctx.fillStyle = '#66DD66'; ctx.beginPath(); ctx.ellipse(0, -98, 4, 3, 0, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

// --- DRAW SPIRIT ---
function drawSpirit() {
  if (spirit.state === 'dead' && spirit.stateTimer > 3) return;

  // Lightning warning circles on ground
  spirit.lightningTargets.forEach(lt => {
    if (!lt.fired) {
      const progress = lt.timer / (lt.delay + lt.warningTimer);
      ctx.strokeStyle = `rgba(102, 238, 255, ${0.3 + progress * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(lt.x, FLOOR_Y - 2, 20 + progress*10, 6, 0, 0, Math.PI*2); ctx.stroke();
      // Inner circle
      ctx.beginPath(); ctx.ellipse(lt.x, FLOOR_Y - 2, 10, 3, 0, 0, Math.PI*2); ctx.stroke();
    } else {
      // Lightning bolt visual
      ctx.strokeStyle = '#66EEFF'; ctx.lineWidth = 3; ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(lt.x, 0); ctx.lineTo(lt.x-8, 80); ctx.lineTo(lt.x+5, 150);
      ctx.lineTo(lt.x-3, 250); ctx.lineTo(lt.x, FLOOR_Y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });

  // Fireballs
  spirit.fireballs.forEach(fb => {
    if (fb.hasHit) return;
    ctx.fillStyle = '#FF6622';
    ctx.beginPath(); ctx.arc(fb.x, fb.y, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FFAA44';
    ctx.beginPath(); ctx.arc(fb.x, fb.y, 4, 0, Math.PI*2); ctx.fill();
  });

  // Blackout overlay
  if (spirit.blackoutTimer > 0) {
    const bAlpha = Math.min(spirit.blackoutTimer / 0.5, 1) * 0.85;
    ctx.fillStyle = `rgba(0, 0, 0, ${bAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Spirit body
  const fade = spirit.state === 'dead' ? Math.max(0, 1 - spirit.stateTimer/3) : 1;
  ctx.save();
  ctx.translate(spirit.x, spirit.y + spirit.bodyBob);
  ctx.globalAlpha = fade * 0.85; // Slightly transparent (ghostly)
  const f = spirit.facing;

  // Robes
  ctx.fillStyle = '#2A3A5C';
  ctx.beginPath();
  ctx.moveTo(-16, -10); ctx.lineTo(-20, 2); ctx.lineTo(20, 2); ctx.lineTo(16, -10);
  ctx.lineTo(14, -55); ctx.lineTo(-14, -55);
  ctx.closePath(); ctx.fill();
  // Robe shadow
  ctx.fillStyle = '#1A2440';
  ctx.fillRect(-10, -30, 8, 25);

  // Head (hooded)
  ctx.fillStyle = '#2A3A5C';
  ctx.beginPath(); ctx.arc(0, -60, 14, 0, Math.PI*2); ctx.fill();
  // Hood
  ctx.fillStyle = '#1A2440';
  ctx.beginPath(); ctx.arc(0, -63, 12, Math.PI, 0); ctx.fill();
  // Glowing eyes
  ctx.fillStyle = `rgba(102, 238, 255, ${spirit.glowPulse})`;
  ctx.fillRect(-6, -62, 4, 3);
  ctx.fillRect(2, -62, 4, 3);
  // Eye glow
  ctx.shadowColor = '#66EEFF'; ctx.shadowBlur = 8;
  ctx.fillRect(-6, -62, 4, 3); ctx.fillRect(2, -62, 4, 3);
  ctx.shadowBlur = 0;

  // Staff
  ctx.save(); ctx.translate(f * 12, -40); ctx.rotate(spirit.armAngle * f);
  ctx.fillStyle = '#4A3A2A';
  ctx.fillRect(-2, -30, 4, 50);
  // Crystal at top
  ctx.fillStyle = `rgba(102, 238, 255, ${spirit.glowPulse})`;
  ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(-5, -28); ctx.lineTo(0, -20); ctx.lineTo(5, -28); ctx.closePath(); ctx.fill();
  ctx.shadowColor = '#66EEFF'; ctx.shadowBlur = 6;
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();

  // Floating indicator
  if (spirit.isFloating) {
    ctx.strokeStyle = `rgba(102, 238, 255, ${0.3 + Math.sin(spirit.animTimer*5)*0.2})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, FLOOR_Y - spirit.y + 5, 18, 5, 0, 0, Math.PI*2); ctx.stroke();
  }

  // Ambient particles
  if (Math.random() < 0.15) {
    spawnParticles(spirit.x + (Math.random()-0.5)*30, spirit.y - 30, 1, '#88CCEE', 30);
  }

  ctx.restore();

  // Transition text
  if (enemyTransition) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#66EEFF'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
    ctx.fillText('The spirit fades...', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = COLORS.white; ctx.font = '12px monospace';
    ctx.fillText('A new presence approaches.', canvas.width/2, canvas.height/2 + 10);
    ctx.textAlign = 'left';
  }
}

// --- HUD ---
function drawHUD() {
  // Player HP
  ctx.fillStyle=COLORS.healthBg; ctx.fillRect(20,20,204,22);
  ctx.fillStyle=COLORS.healthRed; ctx.fillRect(22,22,(player.hp/player.maxHp)*200,18);
  ctx.strokeStyle=COLORS.white; ctx.lineWidth=1; ctx.strokeRect(20,20,204,22);
  ctx.fillStyle=COLORS.white; ctx.font='10px monospace'; ctx.fillText('BOB',22,16);

  // Equipped items display
  // Amulet icon
  ctx.fillStyle=equippedAmulet.color; ctx.beginPath(); ctx.arc(245,31,11,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#888'; ctx.stroke();
  ctx.fillStyle='#222'; ctx.font='7px monospace'; ctx.textAlign='center'; ctx.fillText('AMU',245,34); ctx.textAlign='left';

  // Tool icon + cooldown
  const toolX = 272;
  ctx.fillStyle = toolCooldown > 0 ? '#333' : equippedTool.color;
  ctx.beginPath(); ctx.arc(toolX,31,11,0,Math.PI*2); ctx.fill();
  if (toolCooldown > 0) {
    // Cooldown arc
    ctx.strokeStyle=COLORS.cooldownBlue; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(toolX,31,11,-Math.PI/2,-Math.PI/2+(1-toolCooldown/toolMaxCooldown)*Math.PI*2); ctx.stroke();
    ctx.lineWidth=1;
  }
  ctx.strokeStyle='#888'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(toolX,31,11,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='#222'; ctx.font='7px monospace'; ctx.textAlign='center'; ctx.fillText('K',toolX,34); ctx.textAlign='left';

  // Boss/Spirit HP — positioned below player HUD, thinner
  const enemyAlive = currentEnemy === 'golem' ? golem.state !== 'dead' : (currentEnemy === 'lady' ? lady.state !== 'dead' : (currentEnemy === 'lion' ? lion.state !== 'dead' : (currentEnemy === 'spirit' ? spirit.state !== 'dead' : (boss.state!=='death'||boss.stateTimer<2))));
  if (enemyAlive) {
    const bw=360, bx=(canvas.width-bw)/2-2;
    const eHp = currentEnemy==='golem'?golem.hp:(currentEnemy==='lady'?lady.hp:(currentEnemy==='lion'?lion.hp:(currentEnemy==='spirit'?spirit.hp:boss.hp)));
    const eMaxHp = currentEnemy==='golem'?golem.maxHp:(currentEnemy==='lady'?lady.maxHp:(currentEnemy==='lion'?lion.maxHp:(currentEnemy==='spirit'?spirit.maxHp:boss.maxHp)));
    const ePhase2 = currentEnemy==='golem'?golem.phase===2:(currentEnemy==='lady'?lady.phase===2:(currentEnemy==='lion'?lion.phase===2:(currentEnemy==='spirit'?spirit.phase===2:boss.phase===2)));
    const eName = currentEnemy==='golem'?`THE GARDEN GOLEM${golem.phase===2?' — PHASE 2':''}`:
                  (currentEnemy==='lady'?`LADY DEATH${lady.phase===2?' — PHASE 2':''}`:
                  (currentEnemy==='lion'?`THE WHITE LION${lion.phase===2?' — PHASE 2':''}`:
                  (currentEnemy==='spirit'?`THE LOST SPIRIT${spirit.phase===2?' — PHASE 2':''}`: `THE CAT KEEPER${boss.phase===2?' — PHASE 2':''}`)));
    const barColor = currentEnemy==='golem'?(ePhase2?'#44AA33':'#66DD66'):
                     (currentEnemy==='lady'?(ePhase2?'#661122':'#882233'):
                     (currentEnemy==='lion'?(ePhase2?'#AA7720':'#D4A030'):
                     (currentEnemy==='spirit'?(ePhase2?'#3388CC':'#66EEFF'):(ePhase2?'#CC2200':COLORS.healthRed))));

    ctx.fillStyle=COLORS.healthBg; ctx.fillRect(bx,52,bw+4,16);
    ctx.fillStyle=barColor; ctx.fillRect(bx+2,54,(eHp/eMaxHp)*bw,12);
    ctx.strokeStyle=COLORS.white; ctx.lineWidth=1; ctx.strokeRect(bx,52,bw+4,16);
    ctx.fillStyle=COLORS.white; ctx.font='10px monospace'; ctx.textAlign='center';
    ctx.fillText(eName,canvas.width/2,48); ctx.textAlign='left';
  }

  // Controls
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='9px monospace';
  ctx.fillText('A/D:Move | LClick:Attack | RClick:Jump | SPACE:Dodge | E/K:Tool',20,canvas.height-10);
}

// --- EQUIPMENT MENU ---
function drawEquipMenu() {
  ctx.fillStyle='rgba(0,0,0,0.9)'; ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle=COLORS.white; ctx.font='bold 22px monospace'; ctx.textAlign='center';
  if (gameState === 'midequip') {
    const defeatedName = currentEnemy === 'golem' ? 'GOLEM DEFEATED' : (currentEnemy === 'lady' ? 'LADY DEATH DEFEATED' : (currentEnemy === 'lion' ? 'WHITE LION DEFEATED' : 'SPIRIT DEFEATED'));
    const nextName = currentEnemy === 'golem' ? 'Lady Death' : (currentEnemy === 'lady' ? 'The White Lion' : (currentEnemy === 'lion' ? 'The Lost Spirit' : 'The Cat Keeper'));
    ctx.fillText(defeatedName + ' — RE-EQUIP',canvas.width/2,40);
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='12px monospace';
    ctx.fillText(`Prepare for ${nextName}. Your HP will be partially restored.`,canvas.width/2,60);
  } else {
    ctx.fillText('EQUIPMENT',canvas.width/2,50);
  }
  ctx.textAlign='left';

  // Tabs
  const tabY = 70;
  ctx.fillStyle = equipSelection===0?COLORS.tunicRed:'#444'; ctx.fillRect(200,tabY,160,30);
  ctx.fillStyle = equipSelection===1?COLORS.tunicRed:'#444'; ctx.fillRect(380,tabY,160,30);
  ctx.fillStyle=COLORS.white; ctx.font='12px monospace'; ctx.textAlign='center';
  ctx.fillText('AMULETS [1]',280,tabY+20); ctx.fillText('TOOLS [2]',460,tabY+20); ctx.textAlign='left';

  // Items list
  const items = equipSelection===0 ? AMULETS : TOOLS;
  const equipped = equipSelection===0 ? equippedAmulet : equippedTool;
  const startY = 120;

  items.forEach((item, i) => {
    const y = startY + i * 70;
    const isSelected = i === equipCursor;
    const isEquipped = item.id === equipped.id;

    // Box
    ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)';
    ctx.fillRect(180, y, 600, 58);
    if (isSelected) { ctx.strokeStyle=COLORS.buckle; ctx.lineWidth=2; ctx.strokeRect(180,y,600,58); ctx.lineWidth=1; }

    // Color swatch
    ctx.fillStyle = item.color;
    ctx.beginPath(); ctx.arc(210, y+29, 14, 0, Math.PI*2); ctx.fill();

    // Name
    ctx.fillStyle = COLORS.white; ctx.font = 'bold 13px monospace';
    ctx.fillText(item.name, 235, y+22);

    // Description
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px monospace';
    ctx.fillText(item.desc, 235, y+42);

    // Equipped badge
    if (isEquipped) {
      ctx.fillStyle = COLORS.leaf; ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right'; ctx.fillText('EQUIPPED', 770, y+30); ctx.textAlign = 'left';
    }
  });

  // Instructions
  ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='11px monospace'; ctx.textAlign='center';
  ctx.fillText('↑↓ Navigate | ←→ Switch Tab | ENTER Equip | SPACE Start Fight',canvas.width/2,canvas.height-30);
  ctx.textAlign='left';

  // Currently equipped summary
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='10px monospace';
  ctx.fillText(`Equipped: ${equippedAmulet.name} + ${equippedTool.name}`,20,canvas.height-10);
}

// --- MENU ---
function drawMenu() {
  ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=COLORS.white; ctx.font='bold 36px monospace'; ctx.textAlign='center';
  ctx.fillText('ASH & PURR',canvas.width/2,180);
  ctx.font='14px monospace'; ctx.fillStyle=COLORS.tunicRed; ctx.fillText('A Soulslike Boss Fight',canvas.width/2,215);
  ctx.fillStyle=COLORS.white; ctx.font='16px monospace'; ctx.fillText('[ Press ENTER to Start ]',canvas.width/2,320);
  ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='11px monospace';
  ctx.fillText('LClick:Attack | RClick:Jump | SPACE:Dodge | K:Tool | A/D:Move',canvas.width/2,420);
  ctx.textAlign='left';
}

// --- CINEMATIC ---
function drawCinematic() {
  ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
  const startLine = Math.max(0, cinematicIndex - 4);
  for (let i = startLine; i <= cinematicIndex && i < CINEMATIC_LINES.length; i++) {
    const line = CINEMATIC_LINES[i];
    if (!line.text) continue;
    const isCurrent = (i === cinematicIndex);
    const age = isCurrent ? cinematicAlpha : 1;
    const fadeOut = Math.max(0, 1 - (cinematicIndex - i) * 0.25);
    ctx.globalAlpha = age * fadeOut;
    ctx.fillStyle = COLORS.white;
    ctx.font = isCurrent ? '14px monospace' : '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(line.text, canvas.width/2, 180 + (i - startLine) * 35);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='10px monospace'; ctx.textAlign='center';
  ctx.fillText('Press ENTER or SPACE to skip', canvas.width/2, canvas.height - 30);
  ctx.textAlign='left';
}

// --- INTRO ---
function drawIntro() {
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,0,canvas.width,canvas.height);
  const boxH=100,boxY=canvas.height-boxH-30;
  ctx.fillStyle='rgba(20,18,30,0.92)'; ctx.strokeStyle='#5C4033'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.roundRect(60,boxY,canvas.width-120,boxH,8); ctx.fill(); ctx.stroke();
  ctx.fillStyle=currentEnemy==='spirit'?'#66EEFF':COLORS.bossGlowOrange; ctx.font='bold 12px monospace';
  ctx.fillText(introSpeaker,80,boxY+20);
  ctx.fillStyle=COLORS.white; ctx.font='13px monospace';
  ctx.fillText(introLines[introIndex].substring(0,Math.floor(introCharIndex)),80,boxY+50);
  ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='10px monospace'; ctx.textAlign='right'; ctx.fillText('Press E to continue',canvas.width-80,boxY+boxH-15); ctx.textAlign='left';
}

function drawDeathScreen() {
  const alpha=Math.min((player.stateTimer-2)/1,0.9); if(alpha<=0)return;
  ctx.fillStyle=`rgba(0,0,0,${alpha})`; ctx.fillRect(0,0,canvas.width,canvas.height);

  if(alpha>=0.5){
    // Bob fallen
    ctx.save(); ctx.translate(canvas.width/2, 220);
    ctx.rotate(1.3); // Fallen on side
    ctx.fillStyle=COLORS.tunicRed; ctx.fillRect(-12,-38,24,28);
    ctx.fillStyle=COLORS.armorLight; ctx.fillRect(-10,-48,20,14);
    ctx.fillStyle=COLORS.armorLight; ctx.beginPath(); ctx.arc(0,-55,14,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=COLORS.visor; ctx.fillRect(-9,-56,18,5);
    ctx.restore();

    ctx.fillStyle=COLORS.healthRed; ctx.font='bold 22px monospace'; ctx.textAlign='center';
    ctx.fillText('Stand once more.',canvas.width/2, 60);

    // Stats box
    const sx = canvas.width/2 - 180, sy = 270;
    ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(sx, sy, 360, 200);
    ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1; ctx.strokeRect(sx, sy, 360, 200);

    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='bold 12px monospace'; ctx.textAlign='center';
    ctx.fillText('— BATTLE STATISTICS —', canvas.width/2, sy + 22);

    ctx.font='11px monospace'; ctx.textAlign='left';
    const minutes = Math.floor(stats.timePlayed / 60);
    const seconds = Math.floor(stats.timePlayed % 60);
    const statLines = [
      ['Time', `${minutes}m ${seconds}s`],
      ['Damage Dealt', `${stats.damageDealt}`],
      ['Damage Taken', `${stats.damageTaken}`],
      ['Hits Landed', `${stats.hits}`],
      ['Dodges', `${stats.dodges}`],
      ['Tool Uses', `${stats.toolUses}`],
      ['Max Combo', `${stats.comboMax} hits`],
      ['Last Breath', stats.usedLastBreath ? 'YES' : 'No'],
    ];
    statLines.forEach((line, i) => {
      const ly = sy + 44 + i * 18;
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'left';
      ctx.fillText(line[0], sx + 20, ly);
      ctx.fillStyle = line[0] === 'Last Breath' && stats.usedLastBreath ? '#FFDDAA' : COLORS.white;
      ctx.textAlign = 'right';
      ctx.fillText(line[1], sx + 340, ly);
    });

    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='13px monospace'; ctx.textAlign='center';
    ctx.fillText('[ R ] Retry    [ M ] Main Menu',canvas.width/2, canvas.height - 30);
    ctx.textAlign='left';
  }
}

function drawVictoryScreen() {
  const alpha = Math.min(victoryAnimTimer / 1.5, 0.9);
  if(alpha <= 0) return;
  ctx.fillStyle=`rgba(0,0,0,${alpha})`;ctx.fillRect(0,0,canvas.width,canvas.height);

  if(alpha >= 0.5){
    // Title
    ctx.fillStyle=COLORS.buckle; ctx.font='bold 20px monospace'; ctx.textAlign='center';
    ctx.fillText('VICTORY — ALL ENEMIES DEFEATED',canvas.width/2, 35);
    ctx.fillStyle=COLORS.white; ctx.font='12px monospace';
    ctx.fillText('The cats are free once more.',canvas.width/2, 55);

    // Bob celebration
    const bobVX = canvas.width/2;
    const bobVY = 120 + Math.sin(victoryAnimTimer * 3) * 4;
    ctx.save(); ctx.translate(bobVX, bobVY);
    ctx.fillStyle=COLORS.tunicRed; ctx.fillRect(-10,-30,20,22);
    ctx.fillStyle=COLORS.armorLight; ctx.fillRect(-8,-38,16,10);
    ctx.fillStyle=COLORS.armorLight; ctx.beginPath(); ctx.arc(0,-44,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=COLORS.visor; ctx.fillRect(-7,-45,14,4);
    ctx.save(); ctx.translate(9,-28); ctx.rotate(-0.3);
    ctx.fillStyle=COLORS.branch; ctx.fillRect(-1,-24,3,26);
    ctx.fillStyle=COLORS.leaf; ctx.beginPath(); ctx.ellipse(0,-26,3,2,0,0,Math.PI*2); ctx.fill();
    ctx.restore(); ctx.restore();
    if (Math.random()<0.1) spawnParticles(bobVX+(Math.random()-0.5)*40,bobVY-40,1,COLORS.buckle,30);

    // Enemies defeated list
    ctx.fillStyle='#66DD66'; ctx.font='bold 11px monospace'; ctx.textAlign='left';
    ctx.fillText('✓ The Garden Golem', 80, 170);
    ctx.fillStyle='#882233';
    ctx.fillText('✓ Lady Death', 80, 186);
    ctx.fillStyle='#D4A030';
    ctx.fillText('✓ The White Lion', 80, 202);
    ctx.fillStyle='#66EEFF';
    ctx.fillText('✓ The Lost Spirit', 80, 218);
    ctx.fillStyle=COLORS.bossGlowOrange;
    ctx.fillText('✓ The Cat Keeper', 80, 234);

    ctx.fillStyle = (golemStats && golemStats.usedLastBreath) || (spiritStats && spiritStats.usedLastBreath) || (keeperStats && keeperStats.usedLastBreath) ? '#FFDDAA' : 'rgba(255,255,255,0.5)';
    ctx.font='10px monospace';
    ctx.fillText('Last Breath: ' + ((golemStats && golemStats.usedLastBreath) || (spiritStats && spiritStats.usedLastBreath) || (keeperStats && keeperStats.usedLastBreath) ? 'YES' : 'No'), 80, 226);

    // Three stat columns
    const drawStatCol = (title, color, st, sx, sy) => {
      if (!st) return;
      ctx.fillStyle=color; ctx.font='bold 11px monospace'; ctx.textAlign='center';
      ctx.fillText(title, sx + 155, sy);
      ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(sx, sy+5, 310, 150);
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.strokeRect(sx, sy+5, 310, 150);

      const m = Math.floor(st.timePlayed/60), s = Math.floor(st.timePlayed%60);
      const lines = [
        ['Time',`${m}m ${s}s`],['DMG Dealt',`${st.damageDealt}`],['DMG Taken',`${st.damageTaken}`],
        ['Hits',`${st.hits}`],['Dodges',`${st.dodges}`],['Tool Uses',`${st.toolUses}`],
        ['Max Combo',`${st.comboMax}`],
      ];
      ctx.font='10px monospace';
      lines.forEach((l,i)=>{
        const ly=sy+22+i*18;
        ctx.fillStyle='rgba(255,255,255,0.5)';ctx.textAlign='left';ctx.fillText(l[0],sx+10,ly);
        ctx.fillStyle=COLORS.white;ctx.textAlign='right';ctx.fillText(l[1],sx+300,ly);
      });
    };

    drawStatCol('GARDEN GOLEM', '#66DD66', golemStats, 10, 245);
    drawStatCol('LOST SPIRIT', '#66EEFF', spiritStats, 330, 245);
    drawStatCol('CAT KEEPER', COLORS.bossGlowOrange, keeperStats, 650, 245);

    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='11px monospace'; ctx.textAlign='center';
    ctx.fillText('[ ENTER ] Continue', canvas.width/2, canvas.height - 20);
    ctx.textAlign='left';
  }
}

// ============================================================
// GAME LOOP
// ============================================================
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  keysThisFrame = { ...keysJustPressed };
  for (let k in keysJustPressed) keysJustPressed[k] = false;
  mouseJustFrame = { ...mouseJust };
  mouseJust.left = false; mouseJust.right = false;

  switch (gameState) {
    case 'menu':
      if (justPressed('Enter')) { initAudio(); gameState = 'cinematic'; cinematicIndex = 0; cinematicTimer = 0; cinematicAlpha = 0; }
      break;

    case 'cinematic':
      cinematicTimer += dt;
      if (cinematicIndex < CINEMATIC_LINES.length) {
        const line = CINEMATIC_LINES[cinematicIndex];
        if (cinematicTimer >= line.delay) {
          cinematicTimer = 0;
          cinematicIndex++;
        }
        cinematicAlpha = Math.min(cinematicTimer / 0.5, 1); // Fade in each line
      }
      // Skip with Enter or Space
      if (justPressed('Enter') || justPressed('Space')) {
        gameState = 'equip'; equipCursor = 0; equipSelection = 0;
      }
      // Auto-advance after all lines
      if (cinematicIndex >= CINEMATIC_LINES.length && cinematicTimer >= 2.0) {
        gameState = 'equip'; equipCursor = 0; equipSelection = 0;
      }
      break;

    case 'equip':
      const items = equipSelection === 0 ? AMULETS : TOOLS;
      if (justPressed('ArrowUp') || justPressed('KeyW')) equipCursor = (equipCursor - 1 + items.length) % items.length;
      if (justPressed('ArrowDown') || justPressed('KeyS')) equipCursor = (equipCursor + 1) % items.length;
      if (justPressed('ArrowLeft') || justPressed('KeyA')) { equipSelection = 0; equipCursor = Math.min(equipCursor, AMULETS.length - 1); }
      if (justPressed('ArrowRight') || justPressed('KeyD')) { equipSelection = 1; equipCursor = Math.min(equipCursor, TOOLS.length - 1); }
      if (justPressed('Digit1')) { equipSelection = 0; equipCursor = 0; }
      if (justPressed('Digit2')) { equipSelection = 1; equipCursor = 0; }
      if (justPressed('Enter')) {
        if (equipSelection === 0) equippedAmulet = items[equipCursor];
        else equippedTool = items[equipCursor];
      }
      if (justPressed('Space')) {
        // Set up intro for current enemy
        if (currentEnemy === 'golem') { introLines = GOLEM_INTRO; introSpeaker = 'The Garden Golem'; }
        else if (currentEnemy === 'lady') { introLines = LADY_INTRO; introSpeaker = 'Lady Death'; }
        else if (currentEnemy === 'lion') { introLines = LION_INTRO; introSpeaker = 'The White Lion'; }
        else if (currentEnemy === 'spirit') { introLines = SPIRIT_INTRO; introSpeaker = 'The Lost Spirit'; }
        else { introLines = KEEPER_INTRO; introSpeaker = 'The Cat Keeper'; }
        gameState = 'intro'; introIndex = 0; introCharIndex = 0;
        player.maxHp = Math.round(player.baseMaxHp * equippedAmulet.hpMod);
        player.hp = player.maxHp;
      }
      break;

    case 'intro':
      introTimer += dt;
      introCharIndex += 40 * dt;
      if (introCharIndex > introLines[introIndex].length) introCharIndex = introLines[introIndex].length;
      if (justPressed('KeyE') || justPressed('Enter')) {
        if (introCharIndex < introLines[introIndex].length) introCharIndex = introLines[introIndex].length;
        else { introIndex++; introCharIndex = 0; if (introIndex >= introLines.length) {
          if (enemyTransition) {
            gameState = 'midequip'; equipCursor = 0; equipSelection = 0;
          } else if (currentEnemy === 'boss' || currentEnemy === 'spirit' || currentEnemy === 'lady' || currentEnemy === 'lion') {
            // Coming from midequip → start fight (don't reset!)
            gameState = 'playing'; startMusic();
          } else {
            // First fight — Golem
            gameState = 'playing'; resetGame(); startMusic();
          }
        } }
      }
      break;

    case 'playing':
      if (hitStopTimer > 0) hitStopTimer -= dt;
      else {
        updatePlayer(dt);
        if (currentEnemy === 'golem') { updateGolem(dt); }
        else if (currentEnemy === 'lady') { updateLady(dt); }
        else if (currentEnemy === 'lion') { updateLion(dt); }
        else if (currentEnemy === 'spirit') { updateSpirit(dt); }
        else { updateBoss(dt); updateShockwaves(dt); }
        updateProjectiles(dt);
      }
      updateParticles(dt);
      // Damage/heal flash decay
      if (playerDamageFlash > 0) playerDamageFlash = Math.max(0, playerDamageFlash - dt * 2.5);
      else if (playerDamageFlash < 0) playerDamageFlash = Math.min(0, playerDamageFlash + dt * 2.5);
      // Dash trail decay
      for (let i = dashTrail.length-1; i >= 0; i--) { dashTrail[i].life -= dt; if (dashTrail[i].life <= 0) dashTrail.splice(i, 1); }
      if (shakeDuration > 0) { shakeDuration -= dt; if (shakeDuration <= 0) { shakeIntensity=0; shakeOffsetX=0; shakeOffsetY=0; } }

      // LAST BREATH mechanic — Bob revives after 2 seconds with meow
      if (lastBreathActive) {
        lastBreathTimer += dt;
        if (lastBreathTimer >= 1.2 && !lastBreathMeowed) {
          lastBreathMeowed = true;
          sfxMeow();
          lastBreathDialogue = 2.5; // Show dialogue for 2.5 seconds
          spawnParticles(player.x, player.y - 50, 8, '#FFDDAA', 50);
        }
        if (lastBreathTimer >= 2.8) {
          // Bob gets back up with 1% HP, tool disabled
          lastBreathActive = false;
          player.hp = Math.max(1, Math.round(player.maxHp * 0.01));
          player.state = 'idle';
          player.stateTimer = 0;
          player.invulnerable = true;
          player.invulTimer = 1.0; // 1 second of invulnerability after revive
          toolCooldown = 999; // Disable tool permanently
          toolMaxCooldown = 999;
          sfxRevive();
          spawnParticles(player.x, player.y - 30, 15, '#FFDDAA', 100);
          screenShake(3, 0.2);
        }
      }

      if (player.state === 'death' && !lastBreathActive && player.stateTimer > 2.5) gameState = 'death';

      // Last Breath dialogue timer decay
      if (lastBreathDialogue > 0) lastBreathDialogue -= dt;
      if (boss.state === 'death' && currentEnemy === 'boss') {
        // Immobilize player during boss death
        player.vx = 0;
        player.state = 'idle';
        if (boss.stateTimer > 5) { keeperStats = { ...stats }; gameState = 'victory'; victoryAnimTimer = 0; sfxVictory(); stopPhase2Ambient(); stopMusic(); }
      }
      // Golem death → defeat dialogue then mid-equip → lady
      if (golem.state === 'dead' && currentEnemy === 'golem') {
        player.vx = 0;
        if (golem.stateTimer > 3 && !enemyTransition) {
          enemyTransition = true;
          golemStats = { ...stats };
          stats = { damageDealt:0, damageTaken:0, dodges:0, jumps:0, hits:0, toolUses:0, comboMax:0, timePlayed:0, usedLastBreath: stats.usedLastBreath };
          introLines = GOLEM_DEFEAT; introSpeaker = 'The Garden Golem';
          introIndex = 0; introCharIndex = 0; gameState = 'intro';
        }
      }
      // Lady death → defeat dialogue then mid-equip → lion
      if (lady.state === 'dead' && currentEnemy === 'lady') {
        player.vx = 0;
        if (lady.stateTimer > 3 && !enemyTransition) {
          enemyTransition = true;
          ladyStats = { ...stats };
          stats = { damageDealt:0, damageTaken:0, dodges:0, jumps:0, hits:0, toolUses:0, comboMax:0, timePlayed:0, usedLastBreath: stats.usedLastBreath };
          introLines = LADY_DEFEAT; introSpeaker = 'Lady Death';
          introIndex = 0; introCharIndex = 0; gameState = 'intro';
        }
      }
      // Lion death → defeat dialogue then mid-equip → spirit
      if (lion.state === 'dead' && currentEnemy === 'lion') {
        player.vx = 0;
        if (lion.stateTimer > 3 && !enemyTransition) {
          enemyTransition = true;
          lionStats = { ...stats };
          stats = { damageDealt:0, damageTaken:0, dodges:0, jumps:0, hits:0, toolUses:0, comboMax:0, timePlayed:0, usedLastBreath: stats.usedLastBreath };
          introLines = LION_DEFEAT; introSpeaker = 'The White Lion';
          introIndex = 0; introCharIndex = 0; gameState = 'intro';
        }
      }
      // Spirit death → defeat dialogue then mid-equip → boss
      if (spirit.state === 'dead' && currentEnemy === 'spirit') {
        player.vx = 0;
        if (spirit.stateTimer > 3 && !enemyTransition) {
          // Save spirit stats and show defeat dialogue + equip
          enemyTransition = true;
          transitionTimer = 0;
          spiritStats = { ...stats };
          // Reset stats for next fight
          stats = { damageDealt:0, damageTaken:0, dodges:0, jumps:0, hits:0, toolUses:0, comboMax:0, timePlayed:0, usedLastBreath: stats.usedLastBreath };
          // Set up defeat dialogue
          introLines = SPIRIT_DEFEAT;
          introSpeaker = 'The Lost Spirit';
          introIndex = 0; introCharIndex = 0;
          gameState = 'intro';
        }
      }
      // Track time
      stats.timePlayed += dt;
      break;

    case 'death':
      updateParticles(dt);
      if (justPressed('KeyR')) { gameState = 'playing'; resetGame(); startMusic(); }
      if (justPressed('KeyM')) { gameState = 'menu'; stopMusic(); stopPhase2Ambient(); }
      break;

    case 'midequip':
      // Mid-fight equipment change between Spirit and Cat Keeper
      const mitems = equipSelection === 0 ? AMULETS : TOOLS;
      if (justPressed('ArrowUp') || justPressed('KeyW')) equipCursor = (equipCursor - 1 + mitems.length) % mitems.length;
      if (justPressed('ArrowDown') || justPressed('KeyS')) equipCursor = (equipCursor + 1) % mitems.length;
      if (justPressed('ArrowLeft') || justPressed('KeyA')) { equipSelection = 0; equipCursor = Math.min(equipCursor, AMULETS.length - 1); }
      if (justPressed('ArrowRight') || justPressed('KeyD')) { equipSelection = 1; equipCursor = Math.min(equipCursor, TOOLS.length - 1); }
      if (justPressed('Enter')) {
        if (equipSelection === 0) equippedAmulet = mitems[equipCursor];
        else equippedTool = mitems[equipCursor];
      }
      if (justPressed('Space')) {
        if (currentEnemy === 'golem') {
          // Transition to Lady Death
          currentEnemy = 'lady'; enemyTransition = false;
          lady.state='idle'; lady.stateTimer=0; lady.hp=lady.maxHp; lady.phase=1;
          lady.x=700; lady.y=FLOOR_Y; lady.invulnerable=false; lady._phaseTransitioned=false;
          lady.daggers=[]; lady.comboCount=0; lady.castTimer=0;
          player.maxHp = Math.round(player.baseMaxHp * equippedAmulet.hpMod);
          player.hp = Math.min(player.hp + Math.round(player.maxHp*0.3), player.maxHp);
          player.x=200; player.state='idle'; player.stateTimer=0;
          toolCooldown=0; toolMaxCooldown=0;
          introLines=LADY_INTRO; introSpeaker='Lady Death';
          introIndex=0; introCharIndex=0; gameState='intro';
        } else if (currentEnemy === 'lady') {
          // Transition to White Lion
          currentEnemy = 'lion'; enemyTransition = false;
          resetLion();
          player.maxHp = Math.round(player.baseMaxHp * equippedAmulet.hpMod);
          player.hp = Math.min(player.hp + Math.round(player.maxHp*0.3), player.maxHp);
          player.x=200; player.state='idle'; player.stateTimer=0;
          toolCooldown=0; toolMaxCooldown=0;
          introLines=LION_INTRO; introSpeaker='The White Lion';
          introIndex=0; introCharIndex=0; gameState='intro';
        } else if (currentEnemy === 'lion') {
          // Transition to Lost Spirit
          currentEnemy = 'spirit'; enemyTransition = false;
          spirit.state='idle'; spirit.stateTimer=0; spirit.hp=spirit.maxHp; spirit.phase=1;
          spirit.x=700; spirit.y=FLOOR_Y; spirit.invulnerable=false; spirit._phaseTransitioned=false;
          spirit.fireballs=[]; spirit.lightningTargets=[]; spirit.blackoutTimer=0;
          spirit.floatCooldown=10; spirit.isFloating=false; spirit._teleportDamaged=false;
          player.maxHp = Math.round(player.baseMaxHp * equippedAmulet.hpMod);
          player.hp = Math.min(player.hp + Math.round(player.maxHp*0.3), player.maxHp);
          player.x=200; player.state='idle'; player.stateTimer=0;
          toolCooldown=0; toolMaxCooldown=0;
          introLines=SPIRIT_INTRO; introSpeaker='The Lost Spirit';
          introIndex=0; introCharIndex=0; gameState='intro';
        } else {
          // Transition to Cat Keeper
          currentEnemy = 'boss'; enemyTransition = false;
          boss.state='idle'; boss.stateTimer=0; boss.hp=boss.maxHp; boss.phase=1;
          boss.x=700; boss.y=FLOOR_Y; boss.invulnerable=false; boss.glowIntensity=0;
          boss._seismicFired=false; boss._swiftHit=false;
          player.maxHp = Math.round(player.baseMaxHp * equippedAmulet.hpMod);
          player.hp = Math.min(player.hp + Math.round(player.maxHp*0.3), player.maxHp);
          player.x=200; player.state='idle'; player.stateTimer=0;
          toolCooldown=0; toolMaxCooldown=0;
          introLines=KEEPER_INTRO; introSpeaker='The Cat Keeper';
          introIndex=0; introCharIndex=0; gameState='intro';
        }
        spawnParticles(player.x, player.y-30, 10, COLORS.healGreen, 80);
      }
      break;

    case 'victory':
      updateParticles(dt); victoryAnimTimer += dt;
      if (Math.random() < 0.1) spawnParticles(player.x + (Math.random()-0.5)*40, player.y - 60, 1, COLORS.buckle, 60);
      if (justPressed('Enter') && victoryAnimTimer > 1.5) { gameState = 'menu'; stopPhase2Ambient(); stopMusic(); }
      break;
  }

  render();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  player.x=200; player.y=FLOOR_Y; player.vx=0; player.vy=0;
  player.maxHp = Math.round(player.baseMaxHp * equippedAmulet.hpMod);
  player.hp=player.maxHp; player.state='idle'; player.stateTimer=0;
  player.comboStep=0; player.comboWindow=false; player.invulnerable=false;
  player.facing=1; player.attackHitbox=null; player.weaponAngle=0;  // 0 = vertical up
  player.onGround=true; player.jumpCount=0;

  boss.x=700; boss.y=FLOOR_Y; boss.vx=0; boss.vy=0; boss.hp=boss.maxHp;
  boss.state='idle'; boss.stateTimer=0; boss.phase=1; boss.facing=-1;
  boss.attackHitbox=null; boss.invulnerable=false; boss.staggerUsed=false;
  boss.hitsDuringRecover=0; boss.lastAttack=''; boss.aiTimer=0;
  boss.glowIntensity=0; boss.bodyShake=0; boss.armAngle=0;
  boss._seismicFired=false; boss._swiftHit=false;

  // Reset Spirit
  spirit.x=700; spirit.y=FLOOR_Y; spirit.vx=0; spirit.vy=0; spirit.hp=spirit.maxHp;
  spirit.state='idle'; spirit.stateTimer=0; spirit.phase=1; spirit.facing=-1;
  spirit.invulnerable=false; spirit.isFloating=false; spirit.floatTimer=0;
  spirit.floatCooldown=10; spirit.floatDuration=3; spirit.blackoutTimer=0;
  spirit.castTimer=0; spirit.spellInterval=1.2; spirit.fireballs=[];
  spirit.lightningTargets=[]; spirit._lightningFired=false; spirit._phaseTransitioned=false;
  spirit._teleportDamaged=false;
  spirit.animTimer=0; spirit.armAngle=0;

  // Game flow
  currentEnemy = 'golem';
  enemyTransition = false; transitionTimer = 0;

  // Reset Golem
  golem.x=700; golem.y=FLOOR_Y; golem.vx=0; golem.hp=golem.maxHp;
  golem.state='idle'; golem.stateTimer=0; golem.phase=1; golem.facing=-1;
  golem.invulnerable=false; golem._phaseTransitioned=false; golem._slamHit=false;
  golem.castTimer=0; golem.attackInterval=1.8; golem.armAngle=0; golem.bodyShake=0;
  golem.platforms=[]; golem.poisonClouds=[]; golem.roots=[]; golem.rocks=[]; golem.animTimer=0;
  golem._hitsReceived=0; golem._hitResetTimer=0;

  // Reset Lady Death
  lady.x=700; lady.y=FLOOR_Y; lady.vx=0; lady.hp=lady.maxHp;
  lady.state='idle'; lady.stateTimer=0; lady.phase=1; lady.facing=-1;
  lady.invulnerable=false; lady._phaseTransitioned=false;
  lady.castTimer=0; lady.comboCount=0; lady.daggers=[];
  lady.armAngle=0; lady.animTimer=0; lady.shadowChains=0;

  // Reset Lion
  resetLion();

  particles=[]; shockwaves=[]; projectiles=[]; dashTrail=[];
  shakeIntensity=0; shakeDuration=0; hitStopTimer=0;
  victoryTimer=0; deathTimer=0; toolCooldown=0;
  playerDamageFlash=0; victoryAnimTimer=0;
  stats = { damageDealt:0, damageTaken:0, dodges:0, jumps:0, hits:0, toolUses:0, comboMax:0, timePlayed:0, usedLastBreath: false };
  spiritStats = null; keeperStats = null; golemStats = null; ladyStats = null; lionStats = null;
  lastBreathAvailable = true; lastBreathActive = false; lastBreathTimer = 0; lastBreathMeowed = false; lastBreathDialogue = 0;
  stopPhase2Ambient(); stopMusic();
}

// Polyfill
if (!ctx.roundRect) { CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){this.moveTo(x+r,y);this.lineTo(x+w-r,y);this.quadraticCurveTo(x+w,y,x+w,y+r);this.lineTo(x+w,y+h-r);this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);this.lineTo(x+r,y+h);this.quadraticCurveTo(x,y+h,x,y+h-r);this.lineTo(x,y+r);this.quadraticCurveTo(x,y,x+r,y);this.closePath();}; }

requestAnimationFrame(gameLoop);