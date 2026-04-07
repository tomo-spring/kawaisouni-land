Game.drawStatusBanner = function() {
  var cabinets = Game.cabinets;
  for (var i = 0; i < 3; i++) {
    var c = cabinets[i];
    var bx = c.x - 4;
    var by = c.y - 32;
    Game.roundRect(bx, by, 60, 24, 4, "#d94d35", null);
    Game.text("新作!", bx + 30, by + 18, { size: 16, color: "#ffffff", align: "center" });
  }
};

Game.drawScreenScanlines = function() {
  var ctx = Game.ctx;
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  for (var y = 0; y < 792; y += 6) {
    ctx.fillRect(0, y, 1140, 2);
  }
};

Game.drawSelectionCursor = function(time) {
  var ctx = Game.ctx;
  var cabinet = Game.cabinets[Game.cursorIndex];
  if (!cabinet) return;

  var cx = cabinet.x + cabinet.w / 2;
  var cy = cabinet.y;
  var bounce = Math.sin(time / 200) * 6;

  // 緑の枠線（グロー）
  ctx.save();
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 6;
  ctx.shadowColor = "#00ff00";
  ctx.shadowBlur = 16;
  ctx.strokeRect(cabinet.x - 8, cabinet.y - 8, cabinet.w + 16, cabinet.h + 16);
  ctx.restore();

  // "SELECT" テキスト（赤に緑の縁取り風）
  var textY = cy - 50 + bounce;
  var fontSize = 36;
  var font = '900 ' + fontSize + 'px "Courier New", monospace';
  ctx.save();
  ctx.font = font;
  ctx.textAlign = "center";
  // 緑のアウトライン
  ctx.strokeStyle = "#00cc00";
  ctx.lineWidth = 6;
  ctx.strokeText("SELECT", cx, textY);
  // 赤の塗り
  ctx.fillStyle = "#ff0000";
  ctx.fillText("SELECT", cx, textY);
  ctx.restore();

  // 下向き矢印（緑）
  var arrowY = cy - 34 + bounce;
  var arrowW = 30;
  var arrowH = 20;
  ctx.save();
  ctx.fillStyle = "#00dd00";
  ctx.shadowColor = "#00ff00";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(cx - arrowW, arrowY);
  ctx.lineTo(cx + arrowW, arrowY);
  ctx.lineTo(cx, arrowY + arrowH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

Game.ufoImage = new Image();
Game.ufoImage.src = "assets/ufo-game.png";

Game.flagImage = new Image();
Game.flagImage.src = "assets/flag.png";

Game.pixelartconImage = new Image();
Game.pixelartconImage.src = "assets/pixelartcon.png";

Game.chara1Image = new Image();
Game.chara1Image.src = "assets/chara-1.png";

Game.baerImage = new Image();
Game.baerImage.src = "assets/bear.png";

Game.gateImage = new Image();
Game.gateImage.src = "assets/gate.png";
Game.gateBitmap = null;
Game.gateImage.onload = function() {
  createImageBitmap(Game.gateImage, { imageOrientation: "none" }).then(function(bmp) {
    Game.gateBitmap = bmp;
  });
};

Game.bgWallImage = new Image();
Game.bgWallImage.src = "assets/background-wall.png";

Game.characterImage = new Image();
Game.characterImage.src = "assets/character.png";

Game.runbaThumbnail = new Image();
Game.runbaThumbnail.src = "assets/npochamurunba-thumb.png";

Game.hotelThumbnail = new Image();
Game.hotelThumbnail.src = "assets/hotel-dangerous-thumb.png";

Game.opantyuThumbnail = new Image();
Game.opantyuThumbnail.src = "assets/opantyu-thumb.png";

Game.OFFSET_X = 160;
Game.OFFSET_Y = -80;

Game.drawScene = function(time) {
  var ctx = Game.ctx;
  var cabinets = Game.cabinets;
  var themes = Game.frontCabinetThemes;

  // 背景はHTMLオーバーレイで表示（Canvasはクリアのみ）

  ctx.save();
  ctx.translate(Game.OFFSET_X, Game.OFFSET_Y);


  for (var u = 0; u < Game.ufoCatchers.length; u++) {
    Game.drawUfoCatcher(Game.ufoCatchers[u], Game.ufoCatcherColors[u], time);
  }

  Game.drawBackCabinet(cabinets[3], 0, time);
  Game.drawBackCabinet(cabinets[4], 1, time);
  Game.drawBackCabinet(cabinets[5], 2, time);

  Game.drawFrontCabinet(cabinets[0], themes[0], time);
  Game.drawFrontCabinet(cabinets[1], themes[1], time);
  Game.drawFrontCabinet(cabinets[2], themes[2], time);

  // 選択カーソル表示
  Game.drawSelectionCursor(time);

  // キャラクターがウロウロ歩く
  var charImg = Game.characterImage;
  if (charImg.complete && charImg.naturalWidth > 0) {
    var charH = 80;
    var charW = charH * (charImg.naturalWidth / charImg.naturalHeight);
    // 往復 + ufo2の前で立ち止まってぴょんぴょん
    // フェーズ: 右へ歩く → ufo2前で停止+ぴょんぴょん → 左へ戻る → 左端で折り返し
    var walkStart = -40;
    var walkEnd = 360;
    var ufo2X = 150; // ufo2の前あたり
    var walkSpeed = 0.06; // px per ms的な速度
    var stopDuration = 1000; // 停止待ち時間
    var jumpDuration = 2000; // ぴょんぴょん時間

    // 1サイクルの時間を計算
    var distToUfo2 = ufo2X - walkStart;
    var distFromUfo2 = walkEnd - ufo2X;
    var distReturn = walkEnd - walkStart;
    var walkTime1 = distToUfo2 / walkSpeed;       // 左端→ufo2
    var walkTime2 = distFromUfo2 / walkSpeed;      // ufo2→右端（戻り用に右端まで行かず折り返す）
    var walkTime3 = distReturn / walkSpeed;         // 右端→左端
    // シンプルに: 右へ → ufo2で停止+ジャンプ → 右端まで → 左へ戻る
    var phase1 = distToUfo2 / walkSpeed;            // 左端→ufo2前
    var phase2 = stopDuration;                       // 停止待ち
    var phase3 = jumpDuration;                       // ぴょんぴょん
    var phase4 = (walkEnd - ufo2X) / walkSpeed;     // ufo2→右端
    var phase5 = stopDuration;                       // 右端で停止
    var phase6 = (walkEnd - ufo2X) / walkSpeed;     // 右端→ufo2
    var phase7 = stopDuration;                       // ufo2前で停止
    var phase8 = jumpDuration;                       // ぴょんぴょん
    var phase9 = distToUfo2 / walkSpeed;             // ufo2→左端
    var phase10 = stopDuration;                      // 左端で停止
    var totalCycle = phase1 + phase2 + phase3 + phase4 + phase5 + phase6 + phase7 + phase8 + phase9 + phase10;

    // こけている間は時間を止める
    if (!Game._charPauseOffset) Game._charPauseOffset = 0;
    if (Game.charFallTime) {
      if (!Game._charPausedAt) Game._charPausedAt = time;
    } else if (Game._charPausedAt) {
      Game._charPauseOffset += time - Game._charPausedAt;
      Game._charPausedAt = 0;
    }
    var adjustedTime = time - Game._charPauseOffset;
    var cycleT = adjustedTime % totalCycle;
    var walkX, facingRight, bobY = 0;

    Game._charAtUfo2 = false;

    if (cycleT < phase1) {
      walkX = walkStart + (cycleT / phase1) * distToUfo2;
      facingRight = true;
      bobY = 0;
    } else if (cycleT < phase1 + phase2) {
      walkX = ufo2X;
      facingRight = true;
      bobY = 0;
      Game._charAtUfo2 = true;
    } else if (cycleT < phase1 + phase2 + phase3) {
      walkX = ufo2X;
      facingRight = true;
      var jumpT = cycleT - phase1 - phase2;
      bobY = Math.abs(Math.sin(jumpT * 0.008)) * 4;
      Game._charAtUfo2 = true;
    } else if (cycleT < phase1 + phase2 + phase3 + phase4) {
      var t4 = cycleT - phase1 - phase2 - phase3;
      walkX = ufo2X + (t4 / phase4) * (walkEnd - ufo2X);
      facingRight = true;
      bobY = 0;
    } else if (cycleT < phase1 + phase2 + phase3 + phase4 + phase5) {
      // 右端で停止
      walkX = walkEnd;
      facingRight = true;
      bobY = 0;
    } else if (cycleT < phase1 + phase2 + phase3 + phase4 + phase5 + phase6) {
      // 右端→ufo2
      var t6 = cycleT - phase1 - phase2 - phase3 - phase4 - phase5;
      walkX = walkEnd - (t6 / phase6) * (walkEnd - ufo2X);
      facingRight = false;
      bobY = 0;
    } else if (cycleT < phase1 + phase2 + phase3 + phase4 + phase5 + phase6 + phase7) {
      // ufo2前で停止
      walkX = ufo2X;
      facingRight = false;
      bobY = 0;
      Game._charAtUfo2 = true;
    } else if (cycleT < phase1 + phase2 + phase3 + phase4 + phase5 + phase6 + phase7 + phase8) {
      // ぴょんぴょん
      walkX = ufo2X;
      facingRight = false;
      Game._charAtUfo2 = true;
      var jumpT2 = cycleT - phase1 - phase2 - phase3 - phase4 - phase5 - phase6 - phase7;
      bobY = Math.abs(Math.sin(jumpT2 * 0.008)) * 4;
    } else if (cycleT < phase1 + phase2 + phase3 + phase4 + phase5 + phase6 + phase7 + phase8 + phase9) {
      // ufo2→左端
      var t9 = cycleT - phase1 - phase2 - phase3 - phase4 - phase5 - phase6 - phase7 - phase8;
      walkX = ufo2X - (t9 / phase9) * distToUfo2;
      facingRight = false;
      bobY = 0;
    } else {
      // 左端で停止
      walkX = walkStart;
      facingRight = false;
      bobY = 0;
    }

    var walkY = 560;

    // こけている間は移動を止める
    if (Game.charFallTime) {
      walkX = Game._charFallX || walkX;
      facingRight = Game._charFallFacing !== undefined ? Game._charFallFacing : facingRight;
      bobY = 0;
    }

    // 物理状態の初期化
    if (!Game._charPhys) {
      Game._charPhys = { angle: 0, angVel: 0, state: "walk", bounced: 0, fallDir: 0, stateTime: 0 };
    }
    var phys = Game._charPhys;

    // マウスとの衝突判定
    var mx = Game.mouseSceneX;
    var my = Game.mouseSceneY;
    var charCenterX = walkX + charW / 2;
    var touching = mx > walkX && mx < walkX + charW && my > walkY - charH && my < walkY + charH;
    var speed = Game.mouseSpeed || 0;
    var fallThreshold = 3.5; // この速度以上でこける

    // クリックでこける（キャラの上をクリックした時のみ）
    var charClicked = Game._charClicked;
    Game._charClicked = false;
    if (charClicked && phys.state === "walk" && touching) {
      var clickDir = Math.random() < 0.5 ? 1 : -1;
      phys.state = "falling";
      phys.swaying = false;
      phys.fallDir = clickDir;
      phys.stateTime = time;
      Game.charFallTime = time;
      Game._charFallX = walkX;
      Game._charFallFacing = facingRight;
    }

    // マウスが触れたら揺れる（こけ中・クールダウン中でなければ）
    var swayCooldown = phys.swayCooldownEnd ? time < phys.swayCooldownEnd : false;
    if (touching && phys.state === "walk" && !phys.swaying && !swayCooldown) {
      var rawDir = (mx < charCenterX) ? 1 : -1;
      var vertRatio = (my - (walkY - charH)) / charH;
      var dir = vertRatio > 0.5 ? -rawDir : rawDir;
      phys.swaying = true;
      phys.swayDir = dir;
      phys.swayStart = time;
    }

    var fallAngle = 0;

    if (phys.state === "walk") {
      if (phys.swaying) {
        var swayElapsed = time - phys.swayStart;
        var swayDuration = 800;
        if (swayElapsed < swayDuration) {
          var decay = 1 - swayElapsed / swayDuration;
          fallAngle = phys.swayDir * Math.sin(swayElapsed * 0.03) * 0.15 * decay;
        } else {
          phys.swaying = false;
          phys.swayCooldownEnd = time + 3000;
          fallAngle = 0;
        }
      }
    } else if (phys.state === "falling") {
      var fallElapsed = time - phys.stateTime;
      var maxAngle = Math.PI / 2 * 0.95;

      if (fallElapsed < 300) {
        // 倒れる
        fallAngle = phys.fallDir * (fallElapsed / 300) * maxAngle;
      } else if (fallElapsed < 1000) {
        // 倒れたまま
        fallAngle = phys.fallDir * maxAngle;
      } else if (fallElapsed < 1600) {
        // 起き上がる
        var upT = (fallElapsed - 1000) / 600;
        fallAngle = phys.fallDir * maxAngle * (1 - upT);
      } else {
        phys.state = "walk";
        Game.charFallTime = 0;
        fallAngle = 0;
      }
    }

    ctx.save();
    var pivotX, pivotY;
    pivotY = walkY - bobY + charH / 2; // キャラクターの中心

    if (!facingRight) {
      ctx.translate(walkX + charW / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-charW / 2, 0);
      pivotX = charW / 2;
      if (fallAngle !== 0) {
        ctx.translate(pivotX, pivotY);
        ctx.rotate(fallAngle);
        ctx.translate(-pivotX, -pivotY);
      }
      ctx.drawImage(charImg, 0, walkY - bobY, charW, charH);
    } else {
      pivotX = walkX + charW / 2;
      if (fallAngle !== 0) {
        ctx.translate(pivotX, pivotY);
        ctx.rotate(fallAngle);
        ctx.translate(-pivotX, -pivotY);
      }
      ctx.drawImage(charImg, walkX, walkY - bobY, charW, charH);
    }
    ctx.restore();
  }

  Game.drawScreenScanlines();


  ctx.restore();


  {
    var titleSize = 32;
    var subSize = 18;
    var popFont = function(s) { return '900 ' + s + 'px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif'; };

    var boxX = (Game.SCENE_WIDTH - 1000) / 2;
    var boxY = 16;
    var boxH = titleSize + 72;
    var boxW = 1000;
    Game.roundRect(boxX, boxY, boxW, boxH, 12, "rgba(255,255,255,0.55)", "#ffbfd1", 4);

    var titleY = boxY + titleSize + (boxH - titleSize) / 2 - 4;

    Game.text("可哀想に！ランド", boxX + boxW / 2, titleY, {
      size: titleSize,
      font: popFont(titleSize),
      color: "#ffd700",
      shadow: "#cc8800",
      shadowOffset: 2,
      align: "center"
    });
  }


  // 背景壁はHTMLオーバーレイで表示
};
