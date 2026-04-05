import { config } from "./config.js";
import { clamp } from "./utils.js";
import { drawParticles, spawnConfetti } from "./particles.js";
import { charSize, charStandH, charStandW, dragDrawRect } from "./player.js";
import { EXIT_RECT, OBSTACLES } from "./terrain.js";

const { GH, GW, MACARON_IMAGE_NAMES, WALL_BORDER, WALL_COLOR } = config;

export function createRenderer({ canvas, ctx, state, images }) {
  function resize() {
    state.viewport.dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    state.viewport.scale = Math.min(width / GW, height / GH);
    canvas.width = width * state.viewport.dpr;
    canvas.height = height * state.viewport.dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    state.viewport.offsetX = (width - GW * state.viewport.scale) / 2;
    state.viewport.offsetY = (height - GH * state.viewport.scale) / 2;
  }

  function drawImg(name, x, y, w, h, flipH = false) {
    const img = images[name];
    if (!img) return false;

    ctx.save();
    if (flipH) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }
    ctx.restore();
    return true;
  }

  function roundRect(x, y, w, h, radius, fill, stroke, strokeWidth) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth || 2;
      ctx.stroke();
    }
  }

  function drawTitleScreen(now) {
    const grad = ctx.createLinearGradient(0, 0, 0, GH);
    grad.addColorStop(0, "#f8e8d8");
    grad.addColorStop(1, "#fff5ee");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GW, GH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.save();
    ctx.shadowColor = "rgba(200,120,80,0.3)";
    ctx.shadowBlur = 15;
    ctx.font = `900 ${Math.floor(GW * 0.065)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
    ctx.fillStyle = "#d4726a";
    ctx.fillText("んぽちゃむルンバ", GW / 2, GH * 0.18);
    ctx.restore();

    ctx.font = `700 ${Math.floor(GW * 0.02)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
    ctx.fillStyle = "#8a7060";
    ctx.fillText("ルンバでんぽちゃむをきみまろの元まで連れて行こう！", GW / 2, GH * 0.27);

    const imgY = GH * 0.33;
    if (images["main.png"]) {
      const height = 180;
      const width = Math.floor(height * (1728 / 2466));
      ctx.drawImage(images["main.png"], GW / 2 - width - 20, imgY, width, height);
    }
    if (images["ルンバ.png"]) {
      ctx.drawImage(images["ルンバ.png"], GW / 2 + 20, imgY + 30, 120, 120);
    }

    if (state.bestTime > 0) {
      const minutes = String(Math.floor(state.bestTime / 60)).padStart(2, "0");
      const seconds = String(Math.floor(state.bestTime) % 60).padStart(2, "0");
      ctx.font = `700 ${Math.floor(GW * 0.02)}px "M PLUS Rounded 1c", monospace`;
      ctx.fillStyle = "#c47a5a";
      ctx.fillText(`BEST  ${minutes}:${seconds}`, GW / 2, GH * 0.82);
    }

    const blink = Math.floor(now / 500) % 2 === 0;
    if (blink) {
      ctx.font = `700 ${Math.floor(GW * 0.03)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#c47a5a";
      ctx.fillText("SPACE / タップ でスタート", GW / 2, GH - 40);
    }
  }

  function drawHowtoScreen(now) {
    const grad = ctx.createLinearGradient(0, 0, 0, GH);
    grad.addColorStop(0, "#f8e8d8");
    grad.addColorStop(1, "#fff5ee");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GW, GH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = `400 ${Math.floor(GW * 0.04)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
    ctx.fillStyle = "#d4726a";
    ctx.fillText("ゲーム説明", GW / 2, 55);

    const cards = [
      {
        title: "1. ルンバでんぽちゃむに近づこう",
        desc: "近づくと自動でくっつくよ！",
        img: "ルンバ.png",
      },
      {
        title: "2. きみまろを目指して進もう！",
        desc: "きみまろは右下で待ってるよ\nルンバできみまろの元まで引きずろう！",
        img: "goal.png",
      },
      {
        title: "3. マカロンに注意！",
        desc: "マカロンを3個食べるとGAME OVER！\n食べるたびに重くなるよ...",
        img: "makaron.png",
      },
    ];

    const cardW = 280;
    const cardH = 130;
    const cardGap = 16;
    const totalW = cards.length * cardW + (cards.length - 1) * cardGap;
    let cardX = (GW - totalW) / 2;
    const cardY = 95;

    for (const card of cards) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 12);
      ctx.fill();
      ctx.restore();

      const img = images[card.img];
      if (img) {
        const isMacaron = card.img.startsWith("makaron");
        const isGoal = card.img === "goal.png";
        const iconSize = isMacaron ? 70 : isGoal ? 40 : 56;
        const iconY = isMacaron ? 14 : 8;
        const aspect = img.naturalWidth / img.naturalHeight;
        const width = aspect >= 1 ? iconSize : iconSize * aspect;
        const height = aspect >= 1 ? iconSize / aspect : iconSize;
        ctx.drawImage(img, cardX + (cardW - width) / 2, cardY + iconY, width, height);
      }

      ctx.font = `700 15px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#333";
      ctx.fillText(card.title, cardX + cardW / 2, cardY + 72);

      ctx.font = `500 13px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#666";
      const lines = card.desc.split("\n");
      let lineY = cardY + 93;
      for (const line of lines) {
        ctx.fillText(line, cardX + cardW / 2, lineY);
        lineY += 17;
      }

      cardX += cardW + cardGap;
    }

    const tipsY = cardY + cardH + 30;
    ctx.font = `700 ${Math.floor(GW * 0.025)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
    ctx.fillStyle = "#d4726a";
    ctx.fillText("～注意～", GW / 2, tipsY);

    const tips = [
      "んぽちゃむを引っ張れるのは泣いている間だけ！ 泣き止む前に安全なところへ移動しよう！",
      "マカロンを食べるとんぽちゃむが大きくなって引きずりにくくなるから気をつけて！",
    ];
    ctx.font = `500 14px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
    ctx.fillStyle = "#555";
    let tipY = tipsY + 34;
    for (const tip of tips) {
      ctx.fillText(tip, GW / 2, tipY);
      tipY += 22;
    }

    const ctrlY = tipY + 28;
    ctx.font = `700 ${Math.floor(GW * 0.025)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
    ctx.fillStyle = "#d4726a";
    ctx.fillText("操作", GW / 2, ctrlY);

    const controls = [{ key: "↑↓←→ / WASD", label: "移動" }];
    let controlY = ctrlY + 34;
    for (const control of controls) {
      ctx.font = `700 14px "M PLUS Rounded 1c", monospace`;
      const keyWidth = ctx.measureText(control.key).width + 14;
      const keyHeight = 26;
      const keyX = GW / 2 - keyWidth / 2 - 30;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.roundRect(keyX, controlY - keyHeight / 2, keyWidth, keyHeight, 5);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#333";
      ctx.font = `700 14px "M PLUS Rounded 1c", monospace`;
      ctx.textAlign = "center";
      ctx.fillText(control.key, keyX + keyWidth / 2, controlY);

      ctx.font = `700 14px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#333";
      ctx.textAlign = "left";
      ctx.fillText(control.label, keyX + keyWidth + 8, controlY);
      ctx.textAlign = "center";
      controlY += 34;
    }

    const blink = Math.floor(now / 500) % 2 === 0;
    if (blink) {
      ctx.font = `700 26px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#c47a5a";
      ctx.fillText("SPACE / タップ でゲーム開始！", GW / 2, GH - 30);
    }
  }

  function drawHUD() {
    const minutes = String(Math.floor(state.elapsedTime / 60)).padStart(2, "0");
    const seconds = String(Math.floor(state.elapsedTime) % 60).padStart(2, "0");
    const millis = String(Math.floor((state.elapsedTime % 1) * 1000)).padStart(3, "0");
    const timerStr = `${minutes}:${seconds}.${millis}`;
    const timerFontSize = Math.floor(clamp(GW * 0.05, 40, 80));
    ctx.font = `400 ${timerFontSize}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000";
    ctx.fillText(timerStr, 22, 16);

    if (state.macaronsEaten > 0) {
      const macaronImg = images["makaron.png"];
      const macaronY = 90;
      if (macaronImg) {
        const scale = 26 / macaronImg.naturalHeight;
        const width = macaronImg.naturalWidth * scale;
        const height = 26;
        ctx.font = `700 22px "M PLUS Rounded 1c", sans-serif`;
        const textWidth = ctx.measureText("x" + state.macaronsEaten).width;
        const sectionWidth = width + 4 + textWidth + 16;
        const sectionHeight = height + 10;
        roundRect(18, macaronY - 5, sectionWidth, sectionHeight, 8, "#fff");
        ctx.drawImage(macaronImg, 24, macaronY, width, height);
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000";
        ctx.fillText("x" + state.macaronsEaten, 24 + width + 4, macaronY + height / 2);
      }
    }

    const keyRows = [
      { key: "↑↓←→", label: "移動" },
      { key: "R", label: "リセット" },
    ];
    const keyFontSize = Math.floor(clamp(GW * 0.024, 16, 29));
    const keyCapSize = Math.floor(keyFontSize * 1.6);
    const rowGap = Math.floor(keyFontSize * 0.375);
    const itemGap = Math.floor(keyFontSize * 0.4);
    const rightEdge = GW - 20;
    let keyY = 16;
    ctx.textBaseline = "middle";

    for (const row of keyRows) {
      ctx.font = `800 ${keyFontSize}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      const labelWidth = ctx.measureText(row.label).width;
      ctx.font = `700 ${keyFontSize}px "M PLUS Rounded 1c", sans-serif`;
      const keyTextWidth = ctx.measureText(row.key).width;
      const keyCapWidth = Math.max(keyCapSize, keyTextWidth + Math.floor(keyFontSize * 0.6));
      const totalWidth = keyCapWidth + itemGap + labelWidth;
      const startX = rightEdge - totalWidth;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.roundRect(startX, keyY, keyCapWidth, keyCapSize, 6);
      ctx.fill();
      ctx.restore();

      ctx.font = `700 ${keyFontSize}px "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#333";
      ctx.textAlign = "center";
      ctx.fillText(row.key, startX + keyCapWidth / 2, keyY + keyCapSize / 2);

      ctx.font = `800 ${keyFontSize}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#333";
      ctx.textAlign = "left";
      ctx.fillText(row.label, startX + keyCapWidth + itemGap, keyY + keyCapSize / 2);

      keyY += keyCapSize + rowGap;
    }
  }

  function drawPauseOverlay() {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, GW, GH);
    roundRect(GW / 2 - 180, GH / 2 - 70, 360, 140, 20, "rgba(30,30,50,0.85)", "rgba(255,255,255,0.15)", 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `400 48px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.fillText("PAUSED", GW / 2, GH / 2 - 15);
    ctx.font = `700 20px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
    ctx.fillStyle = "rgb(180,200,220)";
    ctx.fillText("ESC/P: 再開　R: リセット", GW / 2, GH / 2 + 35);
  }

  function drawClearOverlay(now) {
    const elapsed = (now - state.clearTime) / 1000;
    const cs = charSize(state);
    const standHeight = charStandH(state);
    const standWidth = charStandW(state);

    const charFadeAlpha = clamp(1.0 - elapsed / 1.0, 0, 1);
    if (charFadeAlpha > 0) {
      ctx.globalAlpha = charFadeAlpha;
      const dx = (cs - standWidth) / 2;
      const dy = cs - standHeight;
      drawImg("main.png", state.charX + dx, state.charY + dy, standWidth, standHeight);
      ctx.globalAlpha = 1;
    }

    const whiteAlpha = clamp(elapsed / 1.0, 0, 0.7);
    ctx.fillStyle = `rgba(255,248,240,${whiteAlpha})`;
    ctx.fillRect(0, 0, GW, GH);

    if (elapsed < 3.0 && Math.random() < 0.3) spawnConfetti(state, 3);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const clearAlpha = clamp((elapsed - 1.0) / 0.8, 0, 1);
    if (clearAlpha > 0) {
      const bounceT = clamp((elapsed - 1.0) / 0.8, 0, 1);
      const bounce = bounceT < 0.6
        ? (bounceT / 0.6) * 1.15
        : bounceT < 0.8
          ? 1.15 - (bounceT - 0.6) / 0.2 * 0.15
          : 1.0;
      const fontSize = Math.floor(GW * 0.08 * bounce);
      ctx.globalAlpha = clearAlpha;
      ctx.font = `900 ${fontSize}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "rgba(200,120,60,0.2)";
      ctx.fillText("CLEAR!", GW / 2 + 3, GH * 0.22 + 3);
      ctx.fillStyle = "#e88a60";
      ctx.fillText("CLEAR!", GW / 2, GH * 0.22);
      ctx.globalAlpha = 1;
    }

    const imageAlpha = clamp((elapsed - 1.5) / 1.0, 0, 1);
    if (imageAlpha > 0 && images["main.png"]) {
      ctx.globalAlpha = imageAlpha;
      const height = GH * 0.4;
      const width = Math.floor(height * (1728 / 2466));
      ctx.drawImage(images["main.png"], GW / 2 - width / 2, GH * 0.32, width, height);
      ctx.globalAlpha = 1;
    }

    const goalAlpha = clamp((elapsed - 2.5) / 0.8, 0, 1);
    const goalImg = images["goal.png"];
    if (goalAlpha > 0 && goalImg) {
      ctx.globalAlpha = goalAlpha;
      ctx.drawImage(goalImg, EXIT_RECT.x, EXIT_RECT.y, EXIT_RECT.w, EXIT_RECT.h);
      const textAlpha = clamp((elapsed - 3.5) / 0.8, 0, 1);
      if (textAlpha > 0) {
        ctx.globalAlpha = textAlpha;
        ctx.font = `700 ${Math.floor(GW * 0.022)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
        ctx.fillStyle = "#e88a60";
        ctx.fillText("ったく、早くいくぞ", EXIT_RECT.x + EXIT_RECT.w / 2 - 60, EXIT_RECT.y - 20);
      }
      ctx.globalAlpha = 1;
    }

    const timeAlpha = clamp((elapsed - 3.0) / 1.0, 0, 1);
    if (timeAlpha > 0) {
      ctx.globalAlpha = timeAlpha;
      const minutes = String(Math.floor(state.elapsedTime / 60)).padStart(2, "0");
      const seconds = String(Math.floor(state.elapsedTime) % 60).padStart(2, "0");
      ctx.font = `700 26px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#8a6050";
      ctx.fillText(`クリアタイム: ${minutes}:${seconds}`, GW / 2, GH * 0.78);

      if (state.bestTime > 0) {
        const bestMinutes = String(Math.floor(state.bestTime / 60)).padStart(2, "0");
        const bestSeconds = String(Math.floor(state.bestTime) % 60).padStart(2, "0");
        ctx.font = `700 18px "M PLUS Rounded 1c", sans-serif`;
        ctx.fillStyle = "#c4956a";
        ctx.fillText(`ベスト: ${bestMinutes}:${bestSeconds}`, GW / 2, GH * 0.78 + 35);
      }

      ctx.globalAlpha = 1;
    }

    const retryAlpha = clamp((elapsed - 5.0) / 1.0, 0, 1);
    if (retryAlpha > 0) {
      ctx.globalAlpha = retryAlpha * 0.7;
      ctx.font = `700 ${Math.floor(GW * 0.02)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#a08070";
      ctx.fillText("SPACE / タップ: もう一度　R: リセット", GW / 2, GH - 35);

      ctx.font = `700 ${Math.floor(GW * 0.016)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#888";
      ctx.fillText("ESC: トップに戻る", GW / 2, GH - 10);
      ctx.globalAlpha = 1;
    }
  }

  function drawGameOverOverlay(now) {
    const elapsed = (now - state.gameOverTime) / 1000;
    const cs = charSize(state);
    const standHeight = charStandH(state);
    const standWidth = charStandW(state);

    const charFadeAlpha = clamp(1.0 - elapsed / 1.5, 0, 1);
    if (charFadeAlpha > 0) {
      ctx.globalAlpha = charFadeAlpha;
      const dx = (cs - standWidth) / 2;
      const dy = cs - standHeight;
      drawImg("main.png", state.charX + dx, state.charY + dy, standWidth, standHeight);
      ctx.globalAlpha = 1;
    }

    const darkAlpha = clamp(elapsed / 1.5, 0, 0.85);
    ctx.fillStyle = `rgba(0,0,0,${darkAlpha})`;
    ctx.fillRect(0, 0, GW, GH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const goAlpha = clamp((elapsed - 2.0) / 1.0, 0, 1);
    const goImg = images["gameover-image.png"];
    if (goAlpha > 0 && goImg) {
      ctx.globalAlpha = goAlpha;
      const aspect = goImg.naturalWidth / goImg.naturalHeight;
      const height = GH * 0.5;
      const width = height * aspect;
      ctx.drawImage(goImg, GW / 2 - width / 2, GH / 2 - height / 2 - 20, width, height);

      const textAlpha = clamp((elapsed - 3.5) / 1.0, 0, 1);
      if (textAlpha > 0) {
        ctx.globalAlpha = textAlpha;
        ctx.font = `900 ${Math.floor(GW * 0.033)}px "Zen Maru Gothic", "M PLUS Rounded 1c", "Hiragino Kaku Gothic ProN", sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText("食べすぎたちゃむ〜", GW / 2, GH / 2 - height / 2 - 55);
      }
      ctx.globalAlpha = 1;
    }

    const goalImg = images["goal.png"];
    const goalAlpha = clamp((elapsed - 5.0) / 0.8, 0, 1);
    if (goalAlpha > 0 && goalImg) {
      ctx.globalAlpha = goalAlpha;
      ctx.drawImage(goalImg, EXIT_RECT.x, EXIT_RECT.y, EXIT_RECT.w, EXIT_RECT.h);

      const messageAlpha = clamp((elapsed - 6.0) / 1.0, 0, 1);
      if (messageAlpha > 0) {
        ctx.globalAlpha = messageAlpha;
        ctx.font = `400 ${Math.floor(GW * 0.022)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText("・・・たく。おまえなあ", EXIT_RECT.x + EXIT_RECT.w / 2 - 70, EXIT_RECT.y - 20);
      }

      ctx.globalAlpha = 1;
    }

    const retryAlpha = clamp((elapsed - 7.5) / 1.0, 0, 1);
    if (retryAlpha > 0) {
      ctx.globalAlpha = retryAlpha * 0.7;
      ctx.font = `700 ${Math.floor(GW * 0.02)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#ccc";
      ctx.fillText("SPACE / タップ / Rキーでリトライ", GW / 2, GH - 35);

      ctx.font = `700 ${Math.floor(GW * 0.016)}px "Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif`;
      ctx.fillStyle = "#888";
      ctx.fillText("ESC: トップに戻る", GW / 2, GH - 10);
      ctx.globalAlpha = 1;
    }
  }

  function draw(now) {
    ctx.setTransform(state.viewport.dpr, 0, 0, state.viewport.dpr, 0, 0);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let shakeX = 0;
    let shakeY = 0;
    if (state.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * 8 * (state.screenShake / 0.15);
      shakeY = (Math.random() - 0.5) * 8 * (state.screenShake / 0.15);
    }

    ctx.setTransform(
      state.viewport.scale * state.viewport.dpr,
      0,
      0,
      state.viewport.scale * state.viewport.dpr,
      (state.viewport.offsetX + shakeX * state.viewport.scale) * state.viewport.dpr,
      (state.viewport.offsetY + shakeY * state.viewport.scale) * state.viewport.dpr,
    );

    if (state.gameState === "title") {
      drawTitleScreen(now);
      return;
    }

    if (state.gameState === "howto") {
      drawHowtoScreen(now);
      return;
    }

    const grad = ctx.createLinearGradient(0, 0, 0, GH);
    grad.addColorStop(0, "#f8e8d8");
    grad.addColorStop(1, "#fff5ee");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GW, GH);

    for (const macaron of state.macarons) {
      const imgName = MACARON_IMAGE_NAMES[macaron.imgIdx];
      const img = images[imgName];
      if (img) {
        const scale = 40 / img.naturalHeight;
        const width = img.naturalWidth * scale;
        const height = 40;
        ctx.drawImage(img, macaron.pos[0] - width / 2, macaron.pos[1] - height / 2, width, height);
      } else {
        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath();
        ctx.arc(macaron.pos[0], macaron.pos[1], 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const goalImg = images["goal.png"];
    if (goalImg) {
      ctx.drawImage(goalImg, EXIT_RECT.x, EXIT_RECT.y, EXIT_RECT.w, EXIT_RECT.h);
    } else {
      roundRect(EXIT_RECT.x, EXIT_RECT.y, EXIT_RECT.w, EXIT_RECT.h, 14, "rgb(60,200,120)");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 34px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText("GOAL", EXIT_RECT.x + EXIT_RECT.w / 2, EXIT_RECT.y + EXIT_RECT.h / 2);
    }

    for (const obstacle of OBSTACLES) {
      if (obstacle.shape !== "rect") continue;
      const rect = obstacle.rect;
      ctx.fillStyle = WALL_COLOR;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = WALL_BORDER;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    const cs = charSize(state);
    const standHeight = charStandH(state);
    const standWidth = charStandW(state);
    if (state.gameState === "gameover" || state.gameState === "cleared") {
      // キャラ本体はオーバーレイ側で描画する
    } else if (state.attached) {
      const dragRect = dragDrawRect(state, images);
      if (images[dragRect.frameName]) {
        drawImg(dragRect.frameName, dragRect.x, dragRect.y, dragRect.w, dragRect.h, false);
      } else {
        roundRect(state.charX, state.charY, cs, cs, 10, "rgb(255,170,80)");
      }
    } else {
      const dx = (cs - standWidth) / 2;
      const dy = cs - standHeight;
      if (!drawImg("main.png", state.charX + dx, state.charY + dy, standWidth, standHeight)) {
        roundRect(state.charX, state.charY, cs, cs, 10, "rgb(255,170,80)");
      }
    }

    if (!drawImg("ルンバ.png", state.rumbaX - config.RUMBA_RADIUS, state.rumbaY - config.RUMBA_RADIUS, config.RUMBA_RADIUS * 2, config.RUMBA_RADIUS * 2)) {
      ctx.fillStyle = "rgb(240,240,255)";
      ctx.beginPath();
      ctx.arc(state.rumbaX, state.rumbaY, config.RUMBA_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    drawParticles(state, ctx);

    if (state.gameState !== "gameover") drawHUD();

    if (state.gameState === "paused") drawPauseOverlay();
    else if (state.gameState === "cleared") drawClearOverlay(now);
    else if (state.gameState === "gameover") drawGameOverOverlay(now);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  return {
    resize,
    draw,
  };
}
