import { ASSETS } from "./assets.js";
import { sfx } from "./audio.js";
import { formatTimer } from "./utils.js";
import { scene, state, game, keys, groundHeightAt } from "./state.js";
import { createTerrainBodies } from "./terrain.js";
import { createEnemies, collapseEnemy, updateFlyingEnemies, updateEnemyPatrol } from "./enemies.js";
import { createPlayer, controlPlayer, lockTorsoRotation, settleInitialPose } from "./player.js";
import { render, createConfetti } from "./render.js";

const { Engine, Bodies, Composite, Events } = window.Matter;

function updateWind(dt) {
  if (state.mode !== "playing") {
    state.windForce *= 0.9;
    return;
  }

  state.windTime += dt;
  const base =
    Math.sin(state.windTime * 0.7) * 0.18 +
    Math.sin(state.windTime * 1.6 + 0.4) * 0.08;
  const burst = Math.max(0, Math.sin(state.windTime * 0.22 - 0.5)) ** 5 * 0.55;
  state.windForce = base + burst;
}

function lose() {
  if (state.mode === "lost" || state.mode === "won") {
    return;
  }
  state.mode = "lost";
  state.lostAt = state.worldTime;
  sfx("lose");
}

export function surrender() {
  if (state.mode !== "playing" && state.mode !== "ready") {
    return;
  }
  state.surrendered = true;
  state.mode = "lost";
  state.lostAt = state.worldTime;
  sfx("lose");
}

function win() {
  if (state.mode === "lost" || state.mode === "won") {
    return;
  }
  state.mode = "won";
  state.wonAt = state.worldTime;
  state.winRecord = formatTimer(state.timer);
  sfx("win");
  state.winConfetti = createConfetti(200);
  state.winScreenShake = 1.0;
}

function handleCollisions(event) {
  if (state.mode === "won") {
    return;
  }

  for (const pair of event.pairs) {
    const { bodyA, bodyB } = pair;
    const labels = [bodyA.label, bodyB.label];
    const touchesEnemy =
      (labels[0].startsWith("player/") && labels[1].startsWith("enemy/")) ||
      (labels[1].startsWith("player/") && labels[0].startsWith("enemy/"));

    if (touchesEnemy) {
      const enemyBody = labels[0].startsWith("enemy/") ? bodyA : bodyB;
      const playerBodyHit = labels[0].startsWith("player/") ? bodyA : bodyB;
      const enemy = scene.enemies.find((entry) => entry.body === enemyBody);
      if (enemy && !enemy.collapsed) {
        Composite.remove(game.engine.world, enemy.body);
        collapseEnemy(enemy, playerBodyHit);
        sfx("hit");
        lose();
      }
      return;
    }

    const touchesGoal =
      (labels[0].startsWith("player/") && labels[1] === "goal") ||
      (labels[1].startsWith("player/") && labels[0] === "goal");
    if (touchesGoal) {
      win();
      return;
    }
  }
}

function update(deltaMs) {
  const deltaSeconds = deltaMs / 1000;
  state.worldTime += deltaSeconds;

  if (state.mode === "won") {
    return;
  }

  updateWind(deltaSeconds);
  updateFlyingEnemies(deltaMs);
  updateEnemyPatrol(deltaMs);
  controlPlayer();
  Engine.update(game.engine, deltaMs);
  lockTorsoRotation();

  if (state.mode === "playing") {
    state.timer += deltaSeconds;
  }
}

export function resetGame(canvas) {
  canvas.style.filter = "";
  const endOverlay = document.getElementById("end-img-overlay");
  endOverlay.style.transition = "none";
  endOverlay.style.opacity = "0";
  void endOverlay.offsetHeight;
  endOverlay.style.transition = "opacity 4s ease";
  for (const key of Object.keys(keys)) {
    delete keys[key];
  }

  game.engine = Engine.create();
  game.engine.gravity.y = 1;
  game.engine.gravity.scale = 0.00145;
  game.engine.positionIterations = 10;
  game.engine.velocityIterations = 8;
  game.engine.constraintIterations = 6;

  Composite.add(game.engine.world, createTerrainBodies());
  createEnemies(game.engine);

  const goalSize = 180 * (ASSETS.goal.scale || 1);
  const goalOffsetY = ASSETS.goal.offsetY || 0;
  const goalTop = groundHeightAt(scene.goalX) - goalSize * ASSETS.goal.anchorY + goalOffsetY;
  const goalBody = Bodies.rectangle(
    scene.goalX,
    goalTop + goalSize / 2,
    goalSize * 0.8,
    goalSize,
    {
      isStatic: true,
      isSensor: true,
      label: "goal",
      render: { visible: false },
    }
  );
  Composite.add(game.engine.world, goalBody);

  game.player = createPlayer();
  Events.on(game.engine, "collisionStart", handleCollisions);

  state.mode = "ready";
  state.timer = 0;
  state.worldTime = 0;
  state.cameraX = 0;
  state.windTime = 0.35;
  state.windForce = 0;
  state.surrendered = false;
  state.lostAt = 0;
  state.wonAt = 0;
  state.winRecord = "";
  state.winConfetti = null;
  state.winScreenShake = 0;
  state.retryReady = false;

  game.lastFrame = 0;

  settleInitialPose();
  game.engine.timing.lastDelta = 1000 / 60;
}

export function loop(timestamp, ctx, canvas, timerEl) {
  if (!game.lastFrame) {
    game.lastFrame = timestamp;
  }

  const delta = Math.min(33, timestamp - game.lastFrame);
  game.lastFrame = timestamp;
  state.lastDelta = delta;
  if (delta > 0) update(delta);
  render(ctx, canvas, timerEl);
  requestAnimationFrame((ts) => loop(ts, ctx, canvas, timerEl));
}
