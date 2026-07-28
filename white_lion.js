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

  // Update lioness if active
  if (lioness.active) updateLioness(dt);
}

function lionIdle(dt) {
  lion.vx = 0; lion.castTimer += dt;
  const interval = lion.phase === 2 ? 0.9 : 1.4;
  // Quick swipe if player is very close
  if (Math.abs(player.x - lion.x) < 70 && lion.castTimer > 0.3) {
    lion.castTimer = 0;
    lion.castType = 'heavy_claw'; lion.state = 'attack'; lion.stateTimer = 0; lion.comboCount = 0;
    return;
  }
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
      screenShake(10, 0.2);
      spawnParticles(lion.x, FLOOR_Y, 12, '#C8C0B0', 180);
      const landHitbox = {x: lion.x - 70, y: FLOOR_Y - 60, w: 140, h: 60}; // +40% area
      if (rectOverlap(landHitbox, {x:player.x-player.w/2, y:player.y-player.h, w:player.w, h:player.h})) {
        damagePlayer(22, lion.facing); // +20% (was 18)
      }
      sfxGolemSlam(); // Heavy landing sound
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
    // Roar shockwave — 40% larger area, 20% more damage
    sfxLionRoar();
    screenShake(6, 0.15);
    const roarRadius = lion.phase === 2 ? 168 : 126; // +40% (was 120/90)
    const dist = Math.abs(player.x - lion.x);
    if (dist < roarRadius && player.y >= FLOOR_Y - 50) {
      damagePlayer(10, player.x < lion.x ? -1 : 1); // +20% (was 8)
      player.vx = (player.x < lion.x ? -1 : 1) * 350;
    }
    spawnParticles(lion.x, lion.y - 40, 15, '#EDE5D5', 200);
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
    // Activate the lioness mate
    lioness.active = true;
    lioness.x = lion.x > canvas.width/2 ? 150 : canvas.width - 150;
    lioness.state = 'idle'; lioness.stateTimer = 0; lioness.castTimer = 0.5;
    spawnParticles(lioness.x, FLOOR_Y - 30, 10, '#C8B8A0', 120);
    sfxLionRoar();
  }
}

// --- DAMAGE CHECK ---
function checkLionHit() {
  if (!player.attackHitbox || lion.invulnerable || lion.state === 'dead') return;
  let hit = false;

  // Check hit on lion
  const lRect = {x: lion.x - lion.w/2, y: lion.y - lion.h, w: lion.w, h: lion.h};
  if (rectOverlap(player.attackHitbox, lRect)) { hit = true; }

  // Check hit on lioness (shares HP bar)
  if (!hit && lioness.active) {
    const lnRect = {x: lioness.x - lioness.w/2, y: FLOOR_Y - lioness.h, w: lioness.w, h: lioness.h};
    if (rectOverlap(player.attackHitbox, lnRect)) { hit = true; }
  }

  if (hit) {
    const baseDmg = player.comboStep === 3 ? 14 : 8;
    const dmg = Math.round(baseDmg * equippedAmulet.dmgMod);
    lion.hp -= dmg; // Shared HP bar
    if (lion.hp < 0) lion.hp = 0;
    stats.damageDealt += dmg; stats.hits++;
    player._hitConnected = true;
    spawnParticles(player.attackHitbox.x + player.attackHitbox.w/2, player.attackHitbox.y + player.attackHitbox.h/2, 5, '#F5F0E8', 100);
    screenShake(2, 0.06); sfxHit();
    if (lion.hp <= 0) {
      lion.hp = 0; lion.state = 'dead'; lion.stateTimer = 0;
      lioness.active = false;
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

  // Draw lioness if active
  drawLioness();
}

// --- LION ARENA ---
function drawLionArena() {
  // Royal Palace Garden — polished, elegant, fine architecture
  const grad = ctx.createLinearGradient(0,0,0,FLOOR_Y);
  grad.addColorStop(0, '#6699BB'); grad.addColorStop(0.4, '#88BBCC'); grad.addColorStop(1, '#AABBAA');
  ctx.fillStyle = grad; ctx.fillRect(0,0,canvas.width,FLOOR_Y);

  // Elegant palace columns
  ctx.fillStyle = '#E8E0D8';
  ctx.fillRect(60, FLOOR_Y-180, 16, 180); ctx.fillRect(canvas.width-76, FLOOR_Y-180, 16, 180);
  ctx.fillRect(200, FLOOR_Y-150, 12, 150); ctx.fillRect(canvas.width-212, FLOOR_Y-150, 12, 150);
  // Column capitals
  ctx.fillStyle = '#D4C8B8';
  ctx.fillRect(54, FLOOR_Y-185, 28, 8); ctx.fillRect(canvas.width-82, FLOOR_Y-185, 28, 8);
  ctx.fillRect(195, FLOOR_Y-155, 22, 6); ctx.fillRect(canvas.width-217, FLOOR_Y-155, 22, 6);
  // Golden trim on columns
  ctx.fillStyle = '#D4A030';
  ctx.fillRect(54, FLOOR_Y-178, 28, 3); ctx.fillRect(canvas.width-82, FLOOR_Y-178, 28, 3);

  // Elegant arch
  ctx.strokeStyle = '#E8E0D8'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(canvas.width/2, FLOOR_Y-160, 160, Math.PI, 0); ctx.stroke();
  // Gold trim on arch
  ctx.strokeStyle = '#D4A030'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(canvas.width/2, FLOOR_Y-160, 155, Math.PI, 0); ctx.stroke();

  // Ornamental hedges (trimmed perfectly)
  ctx.fillStyle = '#4A8855';
  ctx.fillRect(80, FLOOR_Y-30, 80, 30); ctx.fillRect(canvas.width-160, FLOOR_Y-30, 80, 30);
  ctx.fillStyle = '#3A7044';
  ctx.beginPath(); ctx.ellipse(120, FLOOR_Y-30, 40, 15, 0, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.ellipse(canvas.width-120, FLOOR_Y-30, 40, 15, 0, Math.PI, 0); ctx.fill();

  // Rose bushes
  const t = lion.animTimer;
  for (let i = 0; i < 8; i++) {
    const fx = 90 + (i < 4 ? i*20 : (canvas.width-170+(i-4)*20));
    const fy = FLOOR_Y - 32 - Math.sin(t*0.3+i)*1;
    ctx.fillStyle = i%2===0 ? '#CC4455' : '#FFAACC';
    ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI*2); ctx.fill();
  }

  // Polished marble floor
  ctx.fillStyle = '#D8D0C8'; ctx.fillRect(0, FLOOR_Y, canvas.width, 80);
  ctx.fillStyle = '#C8C0B8'; for (let x=0;x<canvas.width;x+=64) ctx.fillRect(x, FLOOR_Y, 60, 2);
  ctx.fillStyle = '#E8E4E0'; for (let x=32;x<canvas.width;x+=64) ctx.fillRect(x, FLOOR_Y+3, 28, 1);

  // Central ornamental fountain (intact, elegant)
  ctx.fillStyle = '#E0D8D0'; ctx.fillRect(canvas.width/2-20, FLOOR_Y-45, 40, 45);
  ctx.fillStyle = '#D4CCC4'; ctx.beginPath(); ctx.ellipse(canvas.width/2, FLOOR_Y-45, 25, 7, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#88BBDD'; ctx.beginPath(); ctx.ellipse(canvas.width/2, FLOOR_Y-43, 15, 4, 0, 0, Math.PI*2); ctx.fill(); // Water

  // Sleeping Almohadita on velvet cushion
  ctx.fillStyle = '#882244'; ctx.beginPath(); ctx.ellipse(canvas.width/2, FLOOR_Y-52, 12, 5, 0, 0, Math.PI*2); ctx.fill(); // Cushion
  ctx.fillStyle = '#CCCCCC'; ctx.beginPath(); ctx.ellipse(canvas.width/2, FLOOR_Y-55, 7, 4, 0, 0, Math.PI*2); ctx.fill(); // Cat
  ctx.fillStyle = '#999999'; ctx.beginPath(); ctx.ellipse(canvas.width/2-4, FLOOR_Y-57, 3, 2.5, 0, 0, Math.PI*2); ctx.fill(); // Head
}

// --- RESET ---
function resetLion() {
  lion.x=700; lion.y=FLOOR_Y; lion.vx=0; lion.vy=0; lion.hp=lion.maxHp;
  lion.state='idle'; lion.stateTimer=0; lion.phase=1; lion.facing=-1;
  lion.invulnerable=false; lion._phaseTransitioned=false;
  lion.castTimer=0; lion.comboCount=0; lion.pounceCount=0;
  lion.maneShake=0; lion.animTimer=0; lion.roarFollowUp=false;
  lion._pounced=false; lion._landed=false;
  resetLioness();
}

// ============================================================
// THE LIONESS (Phase 2 companion) — darker, more furious
// ============================================================
const lioness = {
  x: 200, y: FLOOR_Y, w: 50, h: 65,
  vx: 0, facing: 1, active: false,
  state: 'idle', stateTimer: 0, castTimer: 0,
  animTimer: 0, comboCount: 0,
};

function updateLioness(dt) {
  if (!lioness.active || lion.state === 'dead') return;
  lioness.stateTimer += dt; lioness.animTimer += dt;
  lioness.facing = player.x < lioness.x ? -1 : 1;

  switch (lioness.state) {
    case 'idle':
      lioness.vx = 0; lioness.castTimer += dt;
      if (lioness.castTimer >= 1.5) { lioness.castTimer = 0; lionessChooseAction(); }
      break;
    case 'approach':
      lioness.vx = lioness.facing * 180;
      if (Math.abs(player.x - lioness.x) < 100 || lioness.stateTimer > 1.2) { lioness.vx = 0; lioness.state = 'idle'; lioness.stateTimer = 0; }
      break;
    case 'attack':
      lioness.vx = 0;
      if (lioness.stateTimer >= 0.2) {
        lioness.stateTimer = 0; lioness.comboCount++;
        sfxLadySlash();
        const hx = lioness.x + lioness.facing * 45;
        const hitbox = {x: hx-30, y: FLOOR_Y-55, w: 60, h: 55};
        if (rectOverlap(hitbox, {x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
          damagePlayer(9, lioness.facing);
        }
        spawnParticles(hx, FLOOR_Y-30, 3, '#B0A898', 80);
        if (lioness.comboCount >= 2) { lioness.state = 'idle'; lioness.stateTimer = 0; lioness.comboCount = 0; lioness.castTimer = 0.8; }
      }
      break;
    case 'pounce':
      if (lioness.stateTimer < 0.4) { lioness.vx = 0; }
      else if (lioness.stateTimer >= 0.4 && lioness.stateTimer < 0.45) {
        lioness.vx = lioness.facing * 500; sfxBossStrike();
      }
      if (lioness.stateTimer >= 0.8) {
        lioness.vx = 0;
        const hitbox = {x: lioness.x-40, y:FLOOR_Y-45, w:80, h:45};
        if (rectOverlap(hitbox, {x:player.x-player.w/2,y:player.y-player.h,w:player.w,h:player.h})) {
          damagePlayer(14, lioness.facing);
        }
        spawnParticles(lioness.x, FLOOR_Y, 6, '#B0A898', 120);
        screenShake(4, 0.1);
        lioness.state = 'idle'; lioness.stateTimer = 0; lioness.castTimer = 1.0;
      }
      break;
  }
  lioness.x += lioness.vx * dt;
  lioness.x = clamp(lioness.x, 50, canvas.width - 50);
}

function lionessChooseAction() {
  const dist = Math.abs(player.x - lioness.x);
  if (dist > 200) { lioness.state = 'pounce'; lioness.stateTimer = 0; }
  else if (dist > 100) { lioness.state = 'approach'; lioness.stateTimer = 0; }
  else { lioness.state = 'attack'; lioness.stateTimer = 0; lioness.comboCount = 0; }
}

function drawLioness() {
  if (!lioness.active || lion.state === 'dead') return;
  ctx.save(); ctx.translate(lioness.x, FLOOR_Y + Math.sin(lioness.animTimer*3)*1.5);
  ctx.globalAlpha = 0.95;
  const f = lioness.facing;
  // Darker lion — the furious mate
  ctx.strokeStyle='#C8B8A0'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(-f*20,-20); ctx.quadraticCurveTo(-f*35,-40,-f*30,-52); ctx.stroke();
  ctx.fillStyle='#D0C8B8'; ctx.beginPath(); ctx.ellipse(0,-35,26,18,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#A09888'; ctx.beginPath(); ctx.ellipse(0,-28,22,8,0,0,Math.PI); ctx.fill();
  ctx.fillStyle='#D0C8B8'; ctx.fillRect(f*10-4,-16,8,18); ctx.fillRect(f*18-4,-16,8,18);
  ctx.fillStyle='#4A4A4A'; ctx.fillRect(f*10-3,-1,6,3); ctx.fillRect(f*18-3,-1,6,3);
  // Head (no mane, sleeker)
  ctx.fillStyle='#D0C8B8'; ctx.beginPath(); ctx.ellipse(f*8,-48,11,10,0,0,Math.PI*2); ctx.fill();
  // Angry eyes — red tint
  ctx.fillStyle='#CC6620'; ctx.fillRect(f*5,-50,3,3); ctx.fillRect(f*11,-50,3,3);
  ctx.shadowColor='#CC6620'; ctx.shadowBlur=5;
  ctx.fillRect(f*5,-50,3,3); ctx.fillRect(f*11,-50,3,3);
  ctx.shadowBlur=0;
  ctx.fillStyle='#4A4A4A'; ctx.beginPath(); ctx.ellipse(f*8,-44,2.5,1.5,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function resetLioness() {
  lioness.x = 200; lioness.vx = 0; lioness.active = false;
  lioness.state = 'idle'; lioness.stateTimer = 0; lioness.castTimer = 0;
  lioness.comboCount = 0; lioness.animTimer = 0;
}
