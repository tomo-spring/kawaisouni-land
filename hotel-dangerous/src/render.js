import { ASSETS, loadedImages, enemyFrames, ENEMY_FRAME_INTERVAL } from "./assets.js";
import { clamp, roundRectPath, isDrawableReady, formatTimer } from "./utils.js";
import { scene, state, viewport, game, groundBase, groundHeightAt } from "./state.js";
import { getLegTip, getHeadPose } from "./player.js";

export function createConfetti(count) {
  const particles = [];
  const colors = [
    "#ff3e3e", "#ff9f1c", "#ffdc00", "#2ecc40",
    "#0074d9", "#b10dc9", "#ff69b4", "#f012be",
    "#fffa65", "#01ff70", "#7fdbff", "#ff851b",
  ];
  const shapes = ["rect", "circle", "triangle"];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 200 + Math.random() * 600;
    particles.push({
      x: viewport.width / 2 + (Math.random() - 0.5) * 100,
      y: viewport.height / 2 + (Math.random() - 0.5) * 100,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 300,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: 4 + Math.random() * 8,
      life: 3 + Math.random() * 3,
      born: 0,
    });
  }
  return particles;
}

function updateConfetti(particles, dt) {
  for (const p of particles) {
    p.born += dt;
    p.vy += 400 * dt;
    p.vx *= 0.995;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.rotSpeed * dt;
  }
}

function drawConfetti(ctx, particles) {
  for (const p of particles) {
    const fade = clamp(1 - p.born / p.life, 0, 1);
    if (fade <= 0) continue;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    if (p.shape === "rect") {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -p.size / 2);
      ctx.lineTo(p.size / 2, p.size / 2);
      ctx.lineTo(-p.size / 2, p.size / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBackground(ctx) {
  const backgroundImage = loadedImages.background;
  ctx.fillStyle = "#dff5ff";
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  if (isDrawableReady(backgroundImage)) {
    const imgW = backgroundImage.naturalWidth || backgroundImage.width;
    const imgH = backgroundImage.naturalHeight || backgroundImage.height;
    const scale = viewport.width / imgW;
    const dw = viewport.width;
    const dh = imgH * scale;
    const dy = viewport.height - dh;
    ctx.drawImage(backgroundImage, 0, dy, dw, dh);
  }
}

function drawGround(ctx) {
  const startX = state.cameraX;
  const endX = startX + viewport.width;
  const step = 4;
  const bottom = viewport.height;

  ctx.fillStyle = "#B8956A";
  ctx.beginPath();
  ctx.moveTo(startX, bottom);
  for (let x = startX; x <= endX; x += step) {
    ctx.lineTo(x, groundHeightAt(x));
  }
  ctx.lineTo(endX, groundHeightAt(endX));
  ctx.lineTo(endX, bottom);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#4A2E14";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, groundHeightAt(startX));
  for (let x = startX + step; x <= endX; x += step) {
    ctx.lineTo(x, groundHeightAt(x));
  }
  ctx.lineTo(endX, groundHeightAt(endX));
  ctx.stroke();
}

function drawGoal(ctx) {
  const x = scene.goalX;
  const baseY = groundHeightAt(x);
  const goalImage = loadedImages.goal;

  if (!isDrawableReady(goalImage)) return;

  const width = 180 * (ASSETS.goal.scale || 1);
  const height = 180 * (ASSETS.goal.scale || 1);
  ctx.drawImage(
    goalImage,
    x - width * ASSETS.goal.anchorX + (ASSETS.goal.offsetX || 0),
    baseY - height * ASSETS.goal.anchorY + (ASSETS.goal.offsetY || 0),
    width,
    height
  );
}

function drawShadow(ctx, x, y, width, alpha) {
  ctx.save();
  ctx.fillStyle = `rgba(17, 33, 45, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, width, width * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBodySprite(ctx, body, key) {
  const image = loadedImages[key];
  if (!isDrawableReady(image)) {
    return false;
  }

  const config = ASSETS[key];
  const drawInfo = body.plugin.draw;
  const sourceWidth = image.naturalWidth || image.width || drawInfo.width || drawInfo.radius * 2;
  const sourceHeight = image.naturalHeight || image.height || drawInfo.height || drawInfo.radius * 2;
  let width = (config.drawWidth || drawInfo.width || drawInfo.radius * 2) * (config.scale || 1);
  let height = (config.drawHeight || drawInfo.height || drawInfo.radius * 2) * (config.scale || 1);

  if (config.fit === "height" && sourceWidth && sourceHeight) {
    width = height * (sourceWidth / sourceHeight);
  } else if (config.fit === "width" && sourceWidth && sourceHeight) {
    height = width * (sourceHeight / sourceWidth);
  }

  const anchorX = config.flipX ? 1 - config.anchorX : config.anchorX;

  ctx.save();
  ctx.translate(body.position.x, body.position.y);
  ctx.rotate(body.angle);
  ctx.translate(config.offsetX || 0, config.offsetY || 0);
  if (config.flipX) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    image,
    -width * anchorX,
    -height * config.anchorY,
    width,
    height
  );
  ctx.restore();
  return true;
}

function drawHead(ctx) {
  const headPose = getHeadPose();
  const image = loadedImages.head;

  if (isDrawableReady(image)) {
    const size = headPose.radius * 2 * (ASSETS.head.scale || 1.15);
    ctx.save();
    ctx.translate(
      headPose.x + (ASSETS.head.offsetX || 0),
      headPose.y + (ASSETS.head.offsetY || 0)
    );
    ctx.rotate(headPose.angle);
    ctx.drawImage(
      image,
      -size * ASSETS.head.anchorX,
      -size * ASSETS.head.anchorY,
      size,
      size
    );
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(headPose.x, headPose.y);
  ctx.rotate(headPose.angle);
  ctx.fillStyle = "#f7d0ba";
  ctx.strokeStyle = "#5b4740";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0b0f16";
  ctx.beginPath();
  ctx.moveTo(-20, -20);
  ctx.quadraticCurveTo(8, -46, 30, -8);
  ctx.lineTo(12, -6);
  ctx.quadraticCurveTo(-2, -24, -20, -20);
  ctx.fill();

  ctx.fillStyle = "#1f2633";
  ctx.beginPath();
  ctx.arc(-8, -2, 3.6, 0, Math.PI * 2);
  ctx.arc(8, -2, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx) {
  const { player } = game;
  const rearLeg = player.legs[0];
  const frontLeg = player.legs[1];
  const rearTip = getLegTip(rearLeg.leg);
  const frontTip = getLegTip(frontLeg.leg);

  drawShadow(ctx, rearTip.x, groundHeightAt(rearTip.x) + 4, 28, 0.16);
  drawShadow(ctx, frontTip.x, groundHeightAt(frontTip.x) + 4, 28, 0.18);

  drawBodySprite(ctx, rearLeg.leg, rearLeg.leg.plugin.draw.key);
  drawBodySprite(ctx, frontLeg.leg, frontLeg.leg.plugin.draw.key);
  drawBodySprite(ctx, player.torso, "torso");
}

function drawEnemy(ctx, enemy) {
  const frameIndex = Math.floor(state.worldTime / ENEMY_FRAME_INTERVAL) % enemyFrames.length;
  const image = enemyFrames[frameIndex];
  const x = enemy.body.position.x;

  if (!isDrawableReady(image)) return;

  const imgW = image.naturalWidth || image.width;
  const imgH = image.naturalHeight || image.height;
  const aspect = imgW / imgH;
  const h = enemy.radius * 2.8 * (ASSETS.enemy.scale || 1);
  const w = h * aspect;
  ctx.save();
  if (enemy.collapsed) {
    ctx.translate(enemy.flyX, enemy.flyY);
    ctx.rotate(enemy.flyRotation || 0);
    if (enemy.flip) ctx.scale(-1, 1);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
  } else {
    const groundY = groundHeightAt(x);
    if (enemy.flip) {
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
    }
    ctx.drawImage(
      image,
      x - w * ASSETS.enemy.anchorX + (ASSETS.enemy.offsetX || 0),
      groundY - h,
      w,
      h
    );
  }
  ctx.restore();
}

function drawLoseScreen(ctx) {
  const elapsed = state.worldTime - state.lostAt;

  const blackAlpha = Math.min(elapsed / 1.2, 1);
  ctx.save();
  ctx.globalAlpha = blackAlpha;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  ctx.restore();

  const cy = viewport.height / 2;
  const leftX = viewport.width * 0.35;

  const endOverlay = document.getElementById("end-img-overlay");
  if (elapsed > 1.7) {
    endOverlay.style.opacity = "1";
  }

  const msgAlpha = Math.min(Math.max((elapsed - 1.7) / 4.0, 0), 1);
  if (msgAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = msgAlpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#cccccc";
    ctx.font = `bold ${Math.floor(viewport.width * 0.022)}px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;

    if (state.surrendered) {
      ctx.fillText("ホテルの出勤に遅刻してしまった…", leftX, cy - 30);

      const subAlpha = Math.min(Math.max((elapsed - 3.2) / 4.0, 0), 1);
      ctx.globalAlpha = subAlpha;
      ctx.fillText("フロントに誰もいない…", leftX, cy + 20);

      const dotsAlpha = Math.min(Math.max((elapsed - 5.2) / 4.0, 0), 1);
      ctx.globalAlpha = dotsAlpha;
      ctx.fillText("お客様が怒っている…", leftX, cy + 70);
    } else {
      ctx.fillText("あなたのせいで", leftX, cy - 30);

      const subAlpha = Math.min(Math.max((elapsed - 3.2) / 4.0, 0), 1);
      ctx.globalAlpha = subAlpha;
      ctx.fillText("アルバイト社員の命が失われました", leftX, cy + 20);

      const dotsAlpha = Math.min(Math.max((elapsed - 5.2) / 4.0, 0), 1);
      ctx.globalAlpha = dotsAlpha;
      ctx.fillText("彼女にも家族がいたのに...", leftX, cy + 70);
    }

    ctx.restore();
  }

  const retryFadeIn = Math.min(Math.max((elapsed - 7.0) / 3.0, 0), 1);
  state.retryReady = retryFadeIn > 0;
  if (retryFadeIn > 0) {
    ctx.save();
    const blink = retryFadeIn < 1 ? retryFadeIn : 0.3 + 0.3 * Math.sin(elapsed * 3);
    ctx.globalAlpha = blink;
    ctx.fillStyle = "#cccccc";
    ctx.font = `22px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("スペースキーで最初に戻る", leftX, cy + 220);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = blink;
    ctx.fillStyle = "#888888";
    ctx.font = `18px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Escキーでトップに戻る", leftX, cy + 260);
    ctx.restore();
  }
}

function drawWinScreen(ctx) {
  const elapsed = state.worldTime - state.wonAt;
  const dt = (state.lastDelta || 16) / 1000;

  if (state.winConfetti) updateConfetti(state.winConfetti, dt);

  ctx.save();
  if (state.winScreenShake > 0) {
    state.winScreenShake = Math.max(0, state.winScreenShake - dt * 1.5);
    const shakeAmt = state.winScreenShake * 15;
    ctx.translate(
      (Math.random() - 0.5) * shakeAmt,
      (Math.random() - 0.5) * shakeAmt
    );
  }

  if (elapsed < 0.5) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - elapsed / 0.5);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    ctx.restore();
  }

  const overlayAlpha = Math.min(elapsed / 1.5, 0.75);
  ctx.save();
  ctx.globalAlpha = overlayAlpha;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  ctx.restore();

  if (elapsed > 0.2 && elapsed < 4.0) {
    const rayAlpha = Math.min((elapsed - 0.2) / 0.5, 1) * 0.15;
    ctx.save();
    ctx.globalAlpha = rayAlpha;
    ctx.translate(viewport.width / 2, viewport.height / 2 - 30);
    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + elapsed * 0.3;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const rayLen = viewport.width * 0.8;
      ctx.lineTo(-30, rayLen);
      ctx.lineTo(30, rayLen);
      ctx.closePath();
      ctx.fillStyle = "#ffd700";
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  if (state.winConfetti) {
    drawConfetti(ctx, state.winConfetti);
  }

  const titleStart = 0.3;
  const titleAlpha = Math.min(Math.max((elapsed - titleStart) / 0.4, 0), 1);
  if (titleAlpha > 0) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fontSize = Math.floor(viewport.width * 0.09);
    ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`;

    const titleAge = elapsed - titleStart;
    let scale = 1;
    if (titleAge < 0.3) {
      scale = 1.5 - 0.5 * (titleAge / 0.3);
    } else if (titleAge < 0.5) {
      scale = 1 + 0.05 * Math.sin((titleAge - 0.3) / 0.2 * Math.PI);
    }

    const cx = viewport.width / 2;
    const cy = viewport.height / 2 - 70;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.globalAlpha = titleAlpha;
    ctx.fillStyle = "#f0c040";
    ctx.fillText("CLEAR!", 0, 0);

    ctx.restore();
  }

  if (elapsed > 0.5 && elapsed < 5.0) {
    ctx.save();
    const sparkleCount = 8;
    for (let i = 0; i < sparkleCount; i++) {
      const t = elapsed * 2 + i * 1.3;
      const sx = viewport.width / 2 + Math.sin(t * 1.7 + i) * viewport.width * 0.2;
      const sy = viewport.height / 2 - 70 + Math.cos(t * 1.3 + i * 2) * 50;
      const sparkleSize = (3 + Math.sin(t * 5) * 3) * (1 + Math.sin(elapsed * 3) * 0.3);
      const sparkleAlpha = 0.5 + Math.sin(t * 4) * 0.5;
      ctx.globalAlpha = sparkleAlpha;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let j = 0; j < 4; j++) {
        const angle = (j / 4) * Math.PI * 2 + elapsed * 3;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle) * sparkleSize, sy + Math.sin(angle) * sparkleSize);
        ctx.lineTo(sx + Math.cos(angle + 0.3) * sparkleSize * 0.3, sy + Math.sin(angle + 0.3) * sparkleSize * 0.3);
      }
      ctx.fill();
    }
    ctx.restore();
  }

  const recordAlpha = Math.min(Math.max((elapsed - 1.2) / 0.6, 0), 1);
  if (recordAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = recordAlpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.floor(viewport.width * 0.025)}px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
    ctx.fillStyle = "#2a2a2a";
    ctx.fillText(`記録: ${state.winRecord}`, viewport.width / 2, viewport.height / 2 + 20);
    ctx.restore();
  }

  const retryAlpha = Math.min(Math.max((elapsed - 2.2) / 0.8, 0), 1);
  state.retryReady = retryAlpha > 0;
  if (retryAlpha > 0) {
    ctx.save();
    const pulse = 0.6 + Math.sin(elapsed * 3) * 0.15;
    ctx.globalAlpha = retryAlpha * pulse;
    ctx.fillStyle = "#666";
    ctx.font = `22px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("スペースキーで最初に戻る", viewport.width / 2, viewport.height / 2 + 90);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = retryAlpha * pulse;
    ctx.fillStyle = "#888";
    ctx.font = `18px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Escキーでトップに戻る", viewport.width / 2, viewport.height / 2 + 125);
    ctx.restore();
  }

  // End screen shake
  ctx.restore();
}

export function render(ctx, canvas, timerEl) {
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  drawBackground(ctx);

  ctx.save();
  ctx.translate(-state.cameraX, 0);
  for (const enemy of scene.enemies) {
    if (!enemy.collapsed) {
      drawShadow(ctx, enemy.body.position.x, groundHeightAt(enemy.body.position.x) + 3, enemy.radius * 1.25, 0.16);
    }
    drawEnemy(ctx, enemy);
  }
  drawPlayer(ctx);
  drawGround(ctx);
  drawGoal(ctx);
  ctx.restore();

  timerEl.textContent = formatTimer(state.timer);

  const hudEl = document.querySelector(".hud");
  hudEl.style.display = (state.mode === "won" || state.mode === "lost") ? "none" : "";

  if (state.mode === "lost") {
    drawLoseScreen(ctx);
  }

  if (state.mode === "won") {
    drawWinScreen(ctx);
  }
}
