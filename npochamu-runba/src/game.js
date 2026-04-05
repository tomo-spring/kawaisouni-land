import { config } from "./config.js";
import {
  clamp,
  circleCircleResolve,
  lerp,
  normalize,
  rectRectResolve,
  rectsCollide,
  resolveCharCircle,
  resolveCircleRect,
  vecLen,
} from "./utils.js";
import { spawnConfetti, updateParticles } from "./particles.js";
import { charSize, dragDrawRect } from "./player.js";
import { EXIT_RECT, OBSTACLES, generateMacarons, macaronRadius } from "./terrain.js";

const {
  ATTACH_RANGE,
  CHAR_FRICTION,
  DETACH_RANGE,
  DRAG_ANIM_DURATION,
  DRAG_SPEED_BASE,
  DRAG_SPEED_PENALTY,
  GH,
  GW,
  MACARON_ATTRACT_FORCE,
  REATTACH_COOLDOWN_SEC,
  RUMBA_ACCEL,
  RUMBA_FRICTION,
  RUMBA_MAX_SPEED,
  RUMBA_RADIUS,
  SLIP_DURATION_SEC,
  TOUCH_DEAD,
  TOUCH_MAX,
} = config;

export function createGame({ state, images, audio, input }) {
  function handleKeyDown(code) {
    audio.ensureAudio();

    if (state.gameState === "title") {
      if (code === "Space") state.gameState = "howto";
      return;
    }

    if (state.gameState === "howto") {
      if (code === "Space") resetGame();
      return;
    }

    if (state.gameState === "playing") {
      if (code === "KeyR") resetGame();
      else if (code === "Escape" || code === "KeyP") state.gameState = "paused";
      return;
    }

    if (state.gameState === "paused") {
      if (code === "Escape" || code === "KeyP") state.gameState = "playing";
      else if (code === "KeyR") resetGame();
      return;
    }

    if (state.gameState === "cleared" || state.gameState === "gameover") {
      if (code === "Space" || code === "KeyR") {
        resetGame();
      } else if (code === "Escape") {
        window.location.href = "../";
      }
    }
  }

  function resetGame() {
    state.rumbaX = 150;
    state.rumbaY = GH - 150;
    state.rumbaVX = 0;
    state.rumbaVY = 0;
    state.rumbaFacingX = 1;
    state.rumbaFacingY = 0;
    state.dragFlipped = false;
    state.charX = 100;
    state.charY = 100;
    state.charVX = 0;
    state.charVY = 0;
    state.attached = false;
    state.hasBeenAttached = false;
    state.slipTimer = 0;
    state.reattachCooldown = 0;
    state.elapsedTime = 0;
    state.macarons = generateMacarons();
    state.collectionEffects = [];
    state.particles = [];
    state.ropePoints = [];
    state.screenShake = 0;
    state.dragAnimTimer = 0;
    state.macaronsEaten = 0;
    state.cryingTimer = 0;
    state.cryingTimerActive = false;
    state.gameState = "playing";
  }

  function updateEffects(dt) {
    for (const effect of state.collectionEffects) effect.timer -= dt;
    state.collectionEffects = state.collectionEffects.filter((effect) => effect.timer > 0);
  }

  function update(dt) {
    if (state.gameState !== "playing") {
      audio.stopCrying();
      updateParticles(state, dt);
      updateEffects(dt);
      return;
    }

    state.elapsedTime += dt;
    if (state.slipTimer > 0) state.slipTimer = Math.max(0, state.slipTimer - dt);
    if (state.reattachCooldown > 0) state.reattachCooldown = Math.max(0, state.reattachCooldown - dt);
    if (state.screenShake > 0) state.screenShake = Math.max(0, state.screenShake - dt);
    if (state.dragAnimTimer > 0) state.dragAnimTimer = Math.max(0, state.dragAnimTimer - dt);

    let ax = 0;
    let ay = 0;
    if (input.keys["ArrowLeft"] || input.keys["KeyA"]) ax -= RUMBA_ACCEL;
    if (input.keys["ArrowRight"] || input.keys["KeyD"]) ax += RUMBA_ACCEL;
    if (input.keys["ArrowUp"] || input.keys["KeyW"]) ay -= RUMBA_ACCEL;
    if (input.keys["ArrowDown"] || input.keys["KeyS"]) ay += RUMBA_ACCEL;

    if (input.touch.active) {
      const magnitude = Math.hypot(input.touch.dx, input.touch.dy);
      if (magnitude > TOUCH_DEAD) {
        const ratio = Math.min(1, (magnitude - TOUCH_DEAD) / (TOUCH_MAX - TOUCH_DEAD));
        ax += (input.touch.dx / magnitude) * RUMBA_ACCEL * ratio;
        ay += (input.touch.dy / magnitude) * RUMBA_ACCEL * ratio;
      }
    }

    state.rumbaVX += ax;
    state.rumbaVY += ay;

    const rumbaSpeed = vecLen(state.rumbaVX, state.rumbaVY);
    if (rumbaSpeed > RUMBA_MAX_SPEED) {
      const [nx, ny] = normalize(state.rumbaVX, state.rumbaVY);
      state.rumbaVX = nx * RUMBA_MAX_SPEED;
      state.rumbaVY = ny * RUMBA_MAX_SPEED;
    }

    state.rumbaVX *= RUMBA_FRICTION;
    state.rumbaVY *= RUMBA_FRICTION;

    if (vecLen(state.rumbaVX, state.rumbaVY) > 0.3) {
      [state.rumbaFacingX, state.rumbaFacingY] = normalize(state.rumbaVX, state.rumbaVY);
      if (state.rumbaFacingX < -0.4) state.dragFlipped = true;
      else if (state.rumbaFacingX > 0.4) state.dragFlipped = false;
    }

    state.rumbaX += state.rumbaVX;
    state.rumbaY += state.rumbaVY;
    state.rumbaX = clamp(state.rumbaX, RUMBA_RADIUS, GW - RUMBA_RADIUS);
    state.rumbaY = clamp(state.rumbaY, RUMBA_RADIUS, GH - RUMBA_RADIUS);

    for (const obstacle of OBSTACLES) {
      const resolved = obstacle.shape === "rect"
        ? resolveCircleRect(state.rumbaX, state.rumbaY, RUMBA_RADIUS, state.rumbaVX, state.rumbaVY, obstacle.rect)
        : circleCircleResolve(state.rumbaX, state.rumbaY, RUMBA_RADIUS, state.rumbaVX, state.rumbaVY, obstacle.pos[0], obstacle.pos[1], obstacle.radius);
      state.rumbaX = resolved.cx;
      state.rumbaY = resolved.cy;
      state.rumbaVX = resolved.vx;
      state.rumbaVY = resolved.vy;
    }

    if (state.attached) {
      const cs = charSize(state);
      const targetX = state.rumbaX - cs * 1.33;
      const targetY = state.rumbaY - cs * 0.75;
      state.charVX = (targetX - state.charX) * 0.4 + state.rumbaVX * 0.6;
      state.charVY = (targetY - state.charY) * 0.4 + state.rumbaVY * 0.6;

      const dragMaxSpeed = DRAG_SPEED_BASE - state.macaronsEaten * DRAG_SPEED_PENALTY;
      const dragSpeed = vecLen(state.charVX, state.charVY);
      if (dragSpeed > dragMaxSpeed) {
        state.charVX = state.charVX / dragSpeed * dragMaxSpeed;
        state.charVY = state.charVY / dragSpeed * dragMaxSpeed;
      }
    } else {
      state.charVX *= CHAR_FRICTION;
      state.charVY *= CHAR_FRICTION;
    }

    state.charX += state.charVX;
    state.charY += state.charVY;
    const csNow = charSize(state);

    if (state.attached) {
      const dragRect = dragDrawRect(state, images, state.charX, state.charY);
      if (dragRect.x < 0) state.charX -= dragRect.x;
      if (dragRect.y < 0) state.charY -= dragRect.y;
      if (dragRect.x + dragRect.w > GW) state.charX -= dragRect.x + dragRect.w - GW;
      if (dragRect.y + dragRect.h > GH) state.charY -= dragRect.y + dragRect.h - GH;
    } else {
      state.charX = clamp(state.charX, 0, GW - csNow);
      state.charY = clamp(state.charY, 0, GH - csNow);
    }

    let charRect = { x: state.charX, y: state.charY, w: csNow, h: csNow };
    for (const obstacle of OBSTACLES) {
      if (obstacle.shape !== "rect") continue;

      if (state.attached) {
        const dragRect = dragDrawRect(state, images, state.charX, state.charY);
        const resolved = rectRectResolve(
          { x: dragRect.x, y: dragRect.y, w: dragRect.w, h: dragRect.h },
          state.charVX,
          state.charVY,
          obstacle.rect,
        );
        state.charX = resolved.r.x - dragRect.dx;
        state.charY = resolved.r.y - dragRect.dy;
        charRect = { x: state.charX, y: state.charY, w: csNow, h: csNow };
        state.charVX = resolved.vx;
        state.charVY = resolved.vy;
      } else {
        const resolved = rectRectResolve({ ...charRect }, state.charVX, state.charVY, obstacle.rect);
        charRect = resolved.r;
        state.charVX = resolved.vx;
        state.charVY = resolved.vy;
      }
    }

    state.charX = charRect.x;
    state.charY = charRect.y;

    for (const obstacle of OBSTACLES) {
      if (obstacle.shape !== "circle") continue;

      if (state.attached) {
        const dragRect = dragDrawRect(state, images, state.charX, state.charY);
        const resolved = resolveCharCircle(
          dragRect.x,
          dragRect.y,
          dragRect.w,
          dragRect.h,
          state.charVX,
          state.charVY,
          obstacle.pos[0],
          obstacle.pos[1],
          obstacle.radius,
        );
        state.charX = resolved.cx - dragRect.dx;
        state.charY = resolved.cy - dragRect.dy;
        state.charVX = resolved.vx;
        state.charVY = resolved.vy;
      } else {
        const resolved = resolveCharCircle(
          state.charX,
          state.charY,
          csNow,
          csNow,
          state.charVX,
          state.charVY,
          obstacle.pos[0],
          obstacle.pos[1],
          obstacle.radius,
        );
        state.charX = resolved.cx;
        state.charY = resolved.cy;
        state.charVX = resolved.vx;
        state.charVY = resolved.vy;
      }
    }

    for (const macaron of state.macarons) {
      macaron.pos[0] += macaron.vx;
      macaron.pos[1] += macaron.vy;
      if (macaron.pos[0] < 20 || macaron.pos[0] > GW - 20) {
        macaron.vx *= -1;
        macaron.pos[0] = clamp(macaron.pos[0], 20, GW - 20);
      }
      if (macaron.pos[1] < 20 || macaron.pos[1] > GH - 20) {
        macaron.vy *= -1;
        macaron.pos[1] = clamp(macaron.pos[1], 20, GH - 20);
      }
    }

    if (state.hasBeenAttached && !state.attached) {
      let closestDistance = 99999;
      let closestIndex = -1;
      const cx = state.charX + csNow / 2;
      const cy = state.charY + csNow / 2;

      for (let i = 0; i < state.macarons.length; i += 1) {
        const distance = vecLen(state.macarons[i].pos[0] - cx, state.macarons[i].pos[1] - cy);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      if (closestIndex !== -1) {
        const radius = macaronRadius(images, state.macarons[closestIndex].imgIdx);
        const attractRange = radius + csNow / 2;
        const eatRange = radius + csNow / 4;

        if (closestDistance < attractRange) {
          const target = state.macarons[closestIndex];
          const [nx, ny] = normalize(target.pos[0] - cx, target.pos[1] - cy);
          state.charVX += nx * MACARON_ATTRACT_FORCE;
          state.charVY += ny * MACARON_ATTRACT_FORCE;

          if (closestDistance < eatRange) {
            state.macarons.splice(closestIndex, 1);
            state.macaronsEaten += 1;
            audio.playCollect();

            if (state.macaronsEaten >= 3) {
              state.gameState = "gameover";
              state.attached = false;
              audio.stopCrying();
              state.screenShake = 0;
              state.gameOverTime = performance.now();
              return;
            }
          }
        }
      }
    }

    const charCenterX = state.charX + csNow / 2;
    const charCenterY = state.charY + csNow / 2;
    const rumbaDistance = vecLen(charCenterX - state.rumbaX, charCenterY - state.rumbaY);

    if (state.attached) {
      for (const macaron of state.macarons) {
        const radius = macaronRadius(images, macaron.imgIdx);
        if (vecLen(macaron.pos[0] - charCenterX, macaron.pos[1] - charCenterY) < radius + csNow / 2) {
          state.attached = false;
          state.slipTimer = SLIP_DURATION_SEC * 1.5;
          state.reattachCooldown = REATTACH_COOLDOWN_SEC;
          audio.playSlip();
          state.screenShake = 0.15;
          break;
        }
      }
    }

    if (state.slipTimer > 0) state.attached = false;

    if (!state.attached && state.slipTimer === 0 && state.reattachCooldown === 0 && rumbaDistance <= ATTACH_RANGE) {
      state.attached = true;
      state.hasBeenAttached = true;
      state.dragAnimTimer = DRAG_ANIM_DURATION;
      audio.playConnect();
    }

    if (state.attached && rumbaDistance >= DETACH_RANGE) {
      state.attached = false;
      audio.playSlip();
      state.screenShake = 0.1;
    }

    if (state.attached) {
      const ropeX = state.charX + csNow / 2;
      const ropeY = state.charY + csNow / 2;
      const segments = 6;
      state.ropePoints = [];

      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const rx = lerp(state.rumbaX, ropeX, t);
        const ry = lerp(state.rumbaY, ropeY, t);
        const sag = Math.sin(t * Math.PI) * 12;
        state.ropePoints.push([rx, ry + sag]);
      }
    } else {
      state.ropePoints = [];
    }

    if (state.attached && state.dragAnimTimer <= 0) audio.startCrying();
    else audio.stopCrying();

    if (state.cryingTimerActive && state.attached) {
      state.cryingTimer -= dt;
      if (state.cryingTimer <= 0) {
        state.attached = false;
        state.slipTimer = SLIP_DURATION_SEC;
        state.reattachCooldown = REATTACH_COOLDOWN_SEC;
        audio.stopCrying();
        audio.playSlip();
        state.screenShake = 0.12;
      }
    }

    if (rectsCollide({ x: state.charX, y: state.charY, w: csNow, h: csNow }, EXIT_RECT)) {
      state.gameState = "cleared";
      state.attached = false;
      state.slipTimer = 0;
      state.clearTime = performance.now();

      if (state.bestTime === 0 || state.elapsedTime < state.bestTime) {
        state.bestTime = state.elapsedTime;
        localStorage.setItem("npochamu_best", state.bestTime.toString());
      }

      audio.playClear();
      spawnConfetti(state, 60);
    }

    updateParticles(state, dt);
    updateEffects(dt);
  }

  return {
    handleKeyDown,
    resetGame,
    update,
  };
}
