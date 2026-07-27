// ============================================================
// THE WHITE LION — Boss #3 (between Lady Death and Lost Spirit)
// ============================================================

const lion = {
  x: 700, y: FLOOR_Y, w: 64, h: 80,
  vx: 0, vy: 0, facing: -1,
  hp: 380, maxHp: 380,
  state: 'idle', stateTimer: 0, phase: 1,
  castType: '', castTimer: 0,
  invulnerable: false, _phaseTransitioned: false,
  animTimer: 0, bodyBob: 0, maneShake: 0,
  pounceTarget: 0, pounceCount: 0,
  comboCount: 0, roarFollowUp: false,
};

const LION_INTRO = [
  "A deep growl echoes through the garden.",
  "A massive white lion stands between you and Almohadita.",
  "He looks back at the sleeping cat... then at you.",
  "His eyes hold no hatred. Only determination."
];
const LION_DEFEAT = [
  "The lion slowly rises one final time.",
  "He looks at Almohadita... then at you.",
  "For the first time, he steps aside.",
  "He trusts you to do what he no longer can."
];

let lionStats = null;

// --- AI ---
function updateLion(dt) {
  if (lion.state === 'dead') { lion.stateTimer += dt; lion.maneShake = Math.max(0, 3-lion.stateTimer); return; }
  lion.stateTimer += dt; lion.animTimer += dt;
  lion.facing = player.x < lion.x ? -1 : 1;
  lion.bodyBob = Math.sin(lion.animTimer * 2) * 2;

  if (!lion._phaseTransitioned && lion.hp <= lion.maxHp * 0.5) {
    lion._phaseTransitioned = true; lion.state = 'phase_transition'; lion.stateTimer = 0;
    lion.invulnerable = true; lion.phase = 2; sfxPhaseTransition(); screenShake(8, 0.3);
    return;
  }

  switch (lion.state) {
    case 'idle': lionIdle(dt); break;
    case 'approach': lionApproach(dt); break;
    case 'attack': lionAttack(dt); break;
    case 'pounce': lionPounce(dt); break;
    case 'roar': lionRoar(dt); break;
    case 'recover': lionRecover(dt); break;
    case 'phase_transition': lionPhaseTransition(dt); break;
  }

  lion.vy += GRAVITY * dt;
  lion.x += lion.vx * dt; lion.y += lion.vy * dt;
  if (lion.y >= FLOOR_Y) { lion.y = FLOOR_Y; lion.vy = 0; }
  lion.x = clamp(lion.x, 50, canvas.width - 50);
}

function lionIdle(dt) {
  lion.vx = 0; lion.castTimer += dt;
  const interval = lion.phase === 2 ? 0.9 : 1.4;
  if (lion.castTimer >= interval) { lion.castTimer = 0; lionChooseAction(); }
}

function lionChooseAction() {
  const dist = Math.abs(player.x - lion.x);
  if (dist > 250) {
    lion.state = 'pounce'; lion.stateTimer = 0; lion.pounceCount = 0;
    lion.pounceTarget = player.x; return;
  }
  const attacks = ['heavy_claw', 'claw_combo', 'pounce', 'roar'];
  if (lion.phase === 2) attacks.push('pounce', 'claw_combo');
  if (dist < 120) attacks.push('heavy_claw', 'roar');
  lion.castType = attacks[Math.floor(Math.random() * attacks.length)];
  if (lion.castType === 'pounce') { lion.state = 'pounce'; lion.stateTimer = 0; lion.pounceCount = 0; lion.pounceTarget = player.x; }
  else if (lion.castType === 'roar') { lion.state = 'roar'; lion.stateTimer = 0; lion.roarFollowUp = lion.phase === 2; }
  else { lion.state = 'attack'; lion.stateTimer = 0; lion.comboCount = 0; }
}

function lionApproach(dt) {
  lion.vx = lion.facing * 140;
  if (Math.abs(player.x - lion.x) < 120 || lion.stateTimer > 1.5) {
    lion.vx = 0; lion.state = 'idle'; lion.stateTimer = 0; lion.castTimer = 0.5;
  }
}

function lionAttack(dt) {
  lion.vx = 0;
  const maxHits = lion.castType === 'claw_combo' ? (lion.phase === 2 ? 4 : 3) : 1;
  const slashDur = 0.25;
  if (lion.stateTimer >= slashDur) {
    lion.stateTimer = 0; lion.comboCount++;
    sfxBossStrike();
    const hx = lion.x + lion.facing * 55;
    const hw = lion.comboCount >= maxHits ? 80 : 65; // Last hit wider
    const hitbox = {x: hx - hw/2, y: lion.y - 60, w: hw, h: 65};
    if (rectOverlap(hitbox, {x:player.x-player.w/2, y:player.y-player.h, w:player.w, h:player.h})) {
      const dmg = lion.castType === 'heavy_claw' ? (lion.phase===2?17:14) : 10;
      damagePlayer(dmg, lion.facing);
    }
    spawnParticles(hx, lion.y - 30, 4, '#C8C0B0', 100);
    screenShake(4, 0.08);
    lion.maneShake = 3;

    if (lion.comboCount >= maxHits) {
      lion.state = 'recover'; lion.stateTimer = 0;
    }
  }
  lion.maneShake *= 0.9;
}

function lionPounce(dt) {
  if (lion.stateTimer < 0.5) {
    // Telegraph: crouching
    lion.vx = 0; lion.bodyBob = -5;
  } else if (lion.stateTimer >= 0.5 && !lion._pounced) {
    // Launch (once)
    lion._pounced = true;
    lion.vx = lion.facing * 600;
    lion.vy = -300;
    sfxBossSlam();
  } else if (lion._pounced && lion.y >= FLOOR_Y && lion.stateTimer > 0.7) {
    // Landed (only trigger once)
    if (!lion._landed) {
      lion._landed = true;
      lion.vx = 0;
      screenShake(8, 0.15);
      spawnParticles(lion.x, FLOOR_Y, 10, '#C8C0B0', 150);
      const landHitbox = {x: lion.x - 50, y: FLOOR_Y - 50, w: 100, h: 50};
      if (rectOverlap(landHitbox, {x:player.x-player.w/2, y:player.y-player.h, w:player.w, h:player.h})) {
        damagePlayer(18, lion.facing);
      }
      lion.pounceCount++;
      if (lion.phase === 2 && lion.pounceCount < 2 && Math.abs(player.x - lion.x) > 100) {
        lion.stateTimer = 0; lion._pounced = false; lion._landed = false; // Reset for chain
        lion.pounceTarget = player.x;
      } else {
        lion.state = 'recover'; lion.stateTimer = 0;
        lion._pounced = false; lion._landed = false;
      }
    }
  }
}

function lionRoar(dt) {
  lion.vx = 0;
  if (lion.stateTimer < 0.6) {
    // Telegraph: planting paws
    lion.maneShake = Math.sin(lion.stateTimer * 20) * 3;
  } else if (lion.stateTimer >= 0.6 && lion.stateTimer < 0.65) {
    // Roar shockwave
    sfxLionRoar();
    screenShake(6, 0.15);
    const roarRadius = lion.phase === 2 ? 120 : 90;
    const dist = Math.abs(player.x - lion.x);
    if (dist < roarRadius && player.y >= FLOOR_Y - 50) {
      damagePlayer(8, player.x < lion.x ? -1 : 1);
      player.vx = (player.x < lion.x ? -1 : 1) * 300;
    }
    spawnParticles(lion.x, lion.y - 40, 12, '#EDE5D5', 180);
  } else if (lion.stateTimer >= 1.0) {
    // P2: Follow-up charge after roar
    if (lion.roarFollowUp) {
      lion.roarFollowUp = false;
      lion.state = 'pounce'; lion.stateTimer = 0.3; lion.pounceCount = 0; lion.pounceTarget = player.x;
    } else {
      lion.state = 'recover'; lion.stateTimer = 0;
    }
  }
  lion.maneShake *= 0.95;
}

function lionRecover(dt) {
  lion.vx = 0; lion.bodyBob = Math.sin(lion.animTimer * 3) * 1;
  const dur = lion.phase === 2 ? 0.6 : 0.9;
  if (lion.stateTimer >= dur) { lion.state = 'idle'; lion.stateTimer = 0; lion.castTimer = 0; }
}

function lionPhaseTransition(dt) {
  lion.vx = 0; lion.maneShake = Math.sin(lion.stateTimer * 12) * 4;
  if (Math.random() < 0.2) spawnParticles(lion.x + (Math.random()-0.5)*40, lion.y-40, 1, '#D4A030', 60);
  if (lion.stateTimer >= 2.0) {
    lion.invulnerable = false; lion.state = 'idle'; lion.stateTimer = 0; lion.maneShake = 0;
    screenShake(10, 0.3); spawnParticles(lion.x, lion.y-40, 20, '#D4A030', 200);
    sfxBossSlam(); stopMusic(); startMusic();
  }
}

// --- DAMAGE CHECK ---
function checkLionHit() {
  if (!player.attackHitbox || lion.invulnerable || lion.state === 'dead') return;
  const lRect = {x: lion.x - lion.w/2, y: lion.y - lion.h, w: lion.w, h: lion.h};
  if (rectOverlap(player.attackHitbox, lRect)) {
    const baseDmg = player.comboStep === 3 ? 14 : 8;
    const dmg = Math.round(baseDmg * equippedAmulet.dmgMod);
    lion.hp -= dmg;
    stats.damageDealt += dmg; stats.hits++;
    player._hitConnected = true;
    spawnParticles(lion.x, lion.y - 40, 5, '#F5F0E8', 100);
    screenShake(2, 0.06); sfxHit();
    if (lion.hp <= 0) {
      lion.hp = 0; lion.state = 'dead'; lion.stateTimer = 0;
      screenShake(12, 0.4); spawnParticles(lion.x, lion.y-40, 25, '#EDE5D5', 250);
    }
  }
}

// --- DRAW ---
function drawLion() {
  if (lion.state === 'dead' && lion.stateTimer > 4) return;
  const fade = lion.state === 'dead' ? Math.max(0, 1-lion.stateTimer/4) : 1;
  ctx.save(); ctx.translate(lion.x + lion.maneShake, lion.y + lion.bodyBob);
  ctx.globalAlpha = fade;
  const f = lion.facing;
  const crouching = (lion.state === 'pounce' && lion.stateTimer < 0.5) ? 8 : 0;

  // Tail
  ctx.strokeStyle = '#F5F0E8'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-f*25, -25); ctx.quadraticCurveTo(-f*45, -50, -f*40, -65); ctx.stroke();
  ctx.fillStyle = '#EDE5D5'; ctx.beginPath(); ctx.arc(-f*40, -67, 5, 0, Math.PI*2); ctx.fill(); // Tail tuft

  // Back legs
  ctx.fillStyle = '#E8E0D5'; ctx.fillRect(-f*15-8, -15+crouching, 12, 18);
  ctx.fillRect(-f*5-6, -15+crouching, 12, 18);

  // Body
  ctx.fillStyle = '#F5F0E8';
  ctx.beginPath(); ctx.ellipse(0, -40+crouching, 32, 22, 0, 0, Math.PI*2); ctx.fill();
  // Body shadow
  ctx.fillStyle = '#C8C0B0'; ctx.beginPath(); ctx.ellipse(0, -30+crouching, 28, 10, 0, 0, Math.PI); ctx.fill();

  // Front legs
  ctx.fillStyle = '#F5F0E8'; ctx.fillRect(f*12-5, -20+crouching, 10, 22); ctx.fillRect(f*22-5, -20+crouching, 10, 22);
  // Paws
  ctx.fillStyle = '#4A4A4A'; ctx.fillRect(f*12-4, -1+crouching, 8, 4); ctx.fillRect(f*22-4, -1+crouching, 8, 4);
  // Claws
  ctx.fillStyle = '#8A8070';
  ctx.fillRect(f*12-2, 2+crouching, 2, 3); ctx.fillRect(f*12+2, 2+crouching, 2, 3);
  ctx.fillRect(f*22-2, 2+crouching, 2, 3); ctx.fillRect(f*22+2, 2+crouching, 2, 3);

  // Mane
  ctx.fillStyle = '#EDE5D5';
  ctx.beginPath(); ctx.ellipse(f*5, -55+crouching, 22, 20, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#F5F0E8';
  ctx.beginPath(); ctx.ellipse(f*5, -58+crouching, 16, 14, 0, 0, Math.PI*2); ctx.fill();

  // Head
  ctx.fillStyle = '#F5F0E8';
  ctx.beginPath(); ctx.ellipse(f*10, -60+crouching, 14, 12, 0, 0, Math.PI*2); ctx.fill();
  // Ears
  ctx.fillStyle = '#F5F0E8'; ctx.beginPath(); ctx.arc(f*4, -72+crouching, 5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(f*16, -72+crouching, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#DDAAAA'; ctx.beginPath(); ctx.arc(f*4, -72+crouching, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(f*16, -72+crouching, 2.5, 0, Math.PI*2); ctx.fill();
  // Eyes
  ctx.fillStyle = '#D4A030';
  ctx.fillRect(f*6, -62+crouching, 4, 3); ctx.fillRect(f*13, -62+crouching, 4, 3);
  // Nose
  ctx.fillStyle = '#4A4A4A'; ctx.beginPath(); ctx.ellipse(f*10, -55+crouching, 3, 2, 0, 0, Math.PI*2); ctx.fill();

  // Phase 2: glowing eyes, more intense mane
  if (lion.phase === 2) {
    ctx.shadowColor = '#D4A030'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#D4A030'; ctx.fillRect(f*6, -62+crouching, 4, 3); ctx.fillRect(f*13, -62+crouching, 4, 3);
    ctx.shadowBlur = 0;
  }

  // Scars on shoulder
  ctx.strokeStyle = '#C0B8A8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(f*15,-45+crouching); ctx.lineTo(f*20,-38+crouching); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(f*18,-43+crouching); ctx.lineTo(f*22,-35+crouching); ctx.stroke();

  ctx.restore();
}

// --- LION ARENA ---
function drawLionArena() {
  // Royal Garden — overgrown, beautiful, melancholic
  const grad = ctx.createLinearGradient(0,0,0,FLOOR_Y);
  grad.addColorStop(0, '#5588AA'); grad.addColorStop(0.5, '#7BAABB'); grad.addColorStop(1, '#557755');
  ctx.fillStyle = grad; ctx.fillRect(0,0,canvas.width,FLOOR_Y);

  // Large trees
  ctx.fillStyle = '#3A6040';
  for (let i = 0; i < 5; i++) { const tx = 60+i*200; ctx.beginPath(); ctx.ellipse(tx, FLOOR_Y-140, 35, 60, 0, 0, Math.PI*2); ctx.fill(); }
  ctx.fillStyle = '#4A3020';
  for (let i = 0; i < 5; i++) { const tx = 60+i*200; ctx.fillRect(tx-5, FLOOR_Y-80, 10, 80); }

  // Broken marble fountain (center)
  ctx.fillStyle = '#AAAAAA'; ctx.fillRect(canvas.width/2-25, FLOOR_Y-40, 50, 40);
  ctx.fillStyle = '#999999'; ctx.beginPath(); ctx.ellipse(canvas.width/2, FLOOR_Y-40, 30, 8, 0, 0, Math.PI*2); ctx.fill();
  // Cracked
  ctx.strokeStyle = '#777'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(canvas.width/2-10,FLOOR_Y-35); ctx.lineTo(canvas.width/2-5,FLOOR_Y-20); ctx.stroke();

  // Flowers blooming
  const t = lion.animTimer;
  for (let i = 0; i < 12; i++) {
    const fx = (i*83+30) % canvas.width, fy = FLOOR_Y - 4 - Math.sin(t*0.4+i)*2;
    ctx.fillStyle = ['#FF8899','#FFBB55','#AADDFF','#FFEE66'][i%4];
    ctx.beginPath(); ctx.arc(fx, fy, 2.5, 0, Math.PI*2); ctx.fill();
  }

  // Overgrown stone path
  ctx.fillStyle = '#6A6A5A'; ctx.fillRect(0, FLOOR_Y, canvas.width, 80);
  ctx.fillStyle = '#7A7A6A'; for (let x=0;x<canvas.width;x+=55) ctx.fillRect(x+2,FLOOR_Y,50,3);
  // Grass between stones
  ctx.fillStyle = '#5A8A4A'; for (let x=0;x<canvas.width;x+=40) { ctx.fillRect(x+48,FLOOR_Y-2,3,5); }

  // Sleeping Almohadita on platform (background element)
  ctx.fillStyle = '#888888'; ctx.fillRect(canvas.width/2-20, FLOOR_Y-55, 40, 8);
  ctx.fillStyle = '#CCCCCC'; ctx.beginPath(); ctx.ellipse(canvas.width/2, FLOOR_Y-60, 8, 5, 0, 0, Math.PI*2); ctx.fill(); // Cat body
  ctx.fillStyle = '#888888'; ctx.beginPath(); ctx.ellipse(canvas.width/2-5, FLOOR_Y-62, 3, 3, 0, 0, Math.PI*2); ctx.fill(); // Head
}

// --- RESET ---
function resetLion() {
  lion.x=700; lion.y=FLOOR_Y; lion.vx=0; lion.vy=0; lion.hp=lion.maxHp;
  lion.state='idle'; lion.stateTimer=0; lion.phase=1; lion.facing=-1;
  lion.invulnerable=false; lion._phaseTransitioned=false;
  lion.castTimer=0; lion.comboCount=0; lion.pounceCount=0;
  lion.maneShake=0; lion.animTimer=0; lion.roarFollowUp=false;
  lion._pounced=false; lion._landed=false;
}
