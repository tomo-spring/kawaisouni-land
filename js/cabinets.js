Game.drawUfoCatcher = function(machine, colors, time) {
  var hovered = Game.hoveredCabinet && Game.hoveredCabinet.id === machine.id;
  var selected = Game.selectedCabinet && Game.selectedCabinet.id === machine.id;

};

Game.drawStool = function(x, y, highlight) {
  var rect = Game.rect;
  rect(x, y, 36, 10, highlight ? "#ff6b58" : "#f1382d");
  rect(x + 4, y + 10, 28, 4, "#d4d4d4");
  rect(x + 8, y + 14, 4, 20, "#4f5459");
  rect(x + 24, y + 14, 4, 20, "#4f5459");
  rect(x + 4, y + 28, 28, 4, "#4f5459");
  rect(x + 2, y + 34, 4, 6, "#4f5459");
  rect(x + 30, y + 34, 4, 6, "#4f5459");
};

Game.drawBackCabinet = function(cabinet, index, time) {
  var rect = Game.rect;
  var ctx = Game.ctx;
  var hovered = Game.hoveredCabinet && Game.hoveredCabinet.id === cabinet.id;
  var selected = Game.selectedCabinet && Game.selectedCabinet.id === cabinet.id;
  var x = cabinet.x;
  var y = cabinet.y;
  var w = cabinet.w;

  // Outer body (dark charcoal)
  rect(x, y, w, 196, "#3a3c40");
  // Outer border (dark brown/black edge)
  Game.strokeRect(x, y, w, 196, "#2a1a10", 4);
  // Inner border accent
  Game.strokeRect(x + 4, y + 4, w - 8, 188, "#5a4a3a", 2);

  // Top header panel (very dark)
  rect(x + 8, y + 8, w - 16, 26, "#111116");
  // Header text
  Game.text("VIDEO GAME", x + w / 2, y + 26, {
    size: 16,
    color: "#f0f6ff",
    align: "center",
    font: '900 16px "Courier New", monospace'
  });

  // Gray separator strip
  rect(x + 8, y + 34, w - 16, 6, "#6c7385");

  // Screen outer frame (dark)
  rect(x + 10, y + 44, w - 20, 92, "#1a1e28");
  // Screen inner (dark navy blue)
  rect(x + 14, y + 48, w - 28, 84, "#2e3a50");

  // Screen animation (different per cabinet)
  var sx = x + 14;
  var sy = y + 48;
  var sw = w - 28;
  var sh = 84;
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, sy, sw, sh);
  ctx.clip();

  if (index === 0) {
    // Cabinet 1: スクロールする星空
    var starColors = ["#ffffff", "#ffee88", "#88ccff", "#ff88aa"];
    for (var si = 0; si < 20; si++) {
      var seed = si * 137.5;
      var starX = sx + ((seed * 3.7 + time * 0.02) % sw);
      var starY = sy + ((seed * 7.3 + time * 0.01) % sh);
      var sc = starColors[si % starColors.length];
      var blink = Math.sin(time * 0.005 + si) > 0 ? 4 : 2;
      rect(starX, starY, blink, blink, sc);
    }
    // "INSERT COIN" テキスト点滅
    if (Math.sin(time * 0.003) > -0.3) {
      Game.text("INSERT COIN", sx + sw / 2, sy + sh - 8, {
        size: 8, color: "#88ffaa", align: "center",
        font: '900 8px "Courier New", monospace'
      });
    }
  } else if (index === 1) {
    // Cabinet 2: カラフルなバーが上から下へスクロール
    var barColors = ["#ff4466", "#44aaff", "#44dd66", "#ffcc22", "#cc66ff"];
    var barH = 8;
    var totalH = barColors.length * barH * 2;
    for (var bi = 0; bi < barColors.length; bi++) {
      var barY = sy + ((bi * barH * 2 + time * 0.06) % (sh + barH)) - barH;
      rect(sx, barY, sw, barH, barColors[bi]);
    }
    // スコア表示
    var score = Math.floor(time * 0.05) % 99999;
    Game.text(("00000" + score).slice(-5), sx + sw / 2, sy + 16, {
      size: 12, color: "#ffffff", align: "center",
      font: '900 12px "Courier New", monospace'
    });
  } else {
    // Cabinet 3: バウンドするドット
    var dotSize = 8;
    var period = 3000;
    var t = (time % period) / period;
    var bx2 = sx + Math.abs(Math.sin(t * Math.PI * 3)) * (sw - dotSize);
    var by2 = sy + Math.abs(Math.sin(t * Math.PI * 2)) * (sh - dotSize);
    // 軌跡
    for (var ti = 5; ti >= 1; ti--) {
      var tt = ((time - ti * 60) % period) / period;
      var tx2 = sx + Math.abs(Math.sin(tt * Math.PI * 3)) * (sw - dotSize);
      var ty2 = sy + Math.abs(Math.sin(tt * Math.PI * 2)) * (sh - dotSize);
      var alpha = (6 - ti) / 8;
      rect(tx2, ty2, dotSize, dotSize, "rgba(255,100,200," + alpha + ")");
    }
    rect(bx2, by2, dotSize, dotSize, "#ff55cc");
    // "INSERT COIN" 点滅
    if (Math.sin(time * 0.003) > -0.3) {
      Game.text("INSERT COIN", sx + sw / 2, sy + sh - 8, {
        size: 8, color: "#88ffaa", align: "center",
        font: '900 8px "Courier New", monospace'
      });
    }
  }

  ctx.restore();

  // Control panel area (dark gray)
  rect(x + 8, y + 140, w - 16, 48, "#555558");
  Game.strokeRect(x + 8, y + 140, w - 16, 48, "#3a3a3a", 2);

  // 1. Joystick (left side) - animated, clipped to panel
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 8, y + 140, w - 16, 40);
  ctx.clip();

  // Base
  rect(x + 18, y + 160, 20, 20, "#333336");
  // クリック時にレバーが下がる（筐体別）
  var lastClick = Game.leverClickTimes && Game.leverClickTimes[cabinet.id];
  var clickElapsed = lastClick ? time - lastClick : 99999;
  var joyTiltY = 0;
  if (clickElapsed < 300) {
    joyTiltY = Math.sin((clickElapsed / 300) * Math.PI) * 16;
  }
  // Stick
  rect(x + 26, y + 158 + joyTiltY * 0.3, 6, 22, "#222222");
  // Ball
  var ballX = x + 29;
  var ballY = y + 154 + joyTiltY;
  ctx.beginPath();
  ctx.arc(ballX, ballY, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#cc2222";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ballX, ballY, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#dd3333";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ballX - 2, ballY - 3, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#ff6666";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ballX - 3, ballY - 4, 1.6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffaaaa";
  ctx.fill();

  ctx.restore();

  // Top row buttons (right of joystick): white x2, red, green, blue x2
  var topY = y + 148;
  var w1 = Math.sin(time * 0.008 + 0) > 0.3 ? "#ffffff" : "#e8e8e8";
  var w2 = Math.sin(time * 0.008 + 1) > 0.3 ? "#ffffff" : "#e8e8e8";
  var r1 = Math.sin(time * 0.007 + 2) > 0.2 ? "#ff4444" : "#dd2222";
  var g1 = Math.sin(time * 0.009 + 3) > 0.2 ? "#66ff66" : "#44cc44";
  var b1 = Math.sin(time * 0.006 + 4) > 0.2 ? "#5577ff" : "#3355ee";
  var b2 = Math.sin(time * 0.006 + 5) > 0.2 ? "#5577ff" : "#3355ee";
  rect(x + 46, topY, 6, 6, w1);
  rect(x + 46, topY + 2, 6, 2, "#b0b0b0");
  rect(x + 56, topY, 6, 6, w2);
  rect(x + 56, topY + 2, 6, 2, "#b0b0b0");
  rect(x + 68, topY, 6, 6, r1);
  rect(x + 68, topY + 3, 6, 2, "#aa1818");
  rect(x + 78, topY, 6, 6, g1);
  rect(x + 78, topY + 3, 6, 2, "#339933");
  rect(x + 90, topY, 6, 6, b1);
  rect(x + 90, topY + 3, 6, 2, "#2244bb");
  rect(x + 100, topY, 6, 6, b2);
  rect(x + 100, topY + 3, 6, 2, "#2244bb");

  // Bottom row buttons: green, yellow, pink ... gray
  var btmY = y + 168;
  var bg = Math.sin(time * 0.01 + 6) > 0.2 ? "#66ff66" : "#44cc44";
  var by2 = Math.sin(time * 0.008 + 7) > 0.2 ? "#ffee44" : "#ddcc22";
  var bp = Math.sin(time * 0.007 + 8) > 0.2 ? "#ee99ee" : "#cc88cc";
  rect(x + 46, btmY, 6, 6, bg);
  rect(x + 46, btmY + 3, 6, 2, "#339933");
  rect(x + 56, btmY, 6, 6, by2);
  rect(x + 56, btmY + 3, 6, 2, "#aa9918");
  rect(x + 68, btmY, 6, 6, bp);
  rect(x + 68, btmY + 3, 6, 2, "#996699");
  rect(x + 98, btmY + 1, 10, 5, "#666668");

  // Stool
  Game.drawStool(x + 32, y + 196, false);
};

Game.drawFrontCabinet = function(cabinet, theme, time) {
  var rect = Game.rect;
  var ctx = Game.ctx;
  var hovered = Game.hoveredCabinet && Game.hoveredCabinet.id === cabinet.id;
  var selected = Game.selectedCabinet && Game.selectedCabinet.id === cabinet.id;
  var cx = cabinet.x;
  var cy = cabinet.y;
  var cw = cabinet.w;
  var ch = cabinet.h;

  // 本体
  rect(cx, cy, cw, ch, theme.body);
  Game.strokeRect(cx, cy, cw, ch, theme.stroke, 4);

  // 上部マーキー（ゲーム名の看板）
  rect(cx + 8, cy + 6, cw - 16, 20, "#1a1a1a");
  Game.text(cabinet.label, cx + cw / 2, cy + 21, {
    size: 10, color: "#ffffff", align: "center",
    font: '900 10px "Courier New", monospace'
  });

  // 画面フレーム
  rect(cx + 12, cy + 30, cw - 24, 100, theme.screenFrame);
  // 画面
  rect(cx + 18, cy + 36, cw - 36, 88, theme.screenBg);
  // 画面のスキャンライン効果
  for (var sl = cy + 36; sl < cy + 124; sl += 4) {
    rect(cx + 18, sl, cw - 36, 1, "rgba(0,0,0,0.08)");
  }

  // 大股社員画面
  if (cabinet.id === "sad-run") {
    var sx = cx + 18;
    var sy = cy + 36;
    var sw = cw - 36;
    var sh = 88;
    var himg = Game.hotelThumbnail;
    if (himg && himg.complete && himg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, sy, sw, sh);
      ctx.clip();
      var scale = Math.max(sw / himg.naturalWidth, sh / himg.naturalHeight);
      var iw = himg.naturalWidth * scale;
      var ih = himg.naturalHeight * scale;
      ctx.drawImage(himg, sx + (sw - iw) / 2, sy + (sh - ih) / 2, iw, ih);
      // チカチカエフェクト（大股社員用：タイミング・パターン違い）
      if (Math.sin(time * 0.011 + 2) > 0.75) {
        rect(sx, sy, sw, sh, "rgba(255,200,255,0.1)");
      }
      if (Math.sin(time * 0.007 + 3) > 0.8) {
        var flickY2 = sy + (Math.floor(time * 0.13) % sh);
        rect(sx, flickY2, sw, 1, "rgba(255,255,255,0.15)");
        rect(sx, flickY2 + 4, sw, 1, "rgba(255,255,255,0.1)");
      }
      ctx.restore();
    }
  }

  // 黄緑キャビネット（maint）: たまにちらつくノイズ
  if (cabinet.id === "maint") {
    var nx = cx + 18;
    var ny = cy + 36;
    var nw = cw - 36;
    var nh = 88;
    // 弱めの砂嵐ノイズ
    var seed = Math.floor(time * 0.05);
    for (var niy = ny; niy < ny + nh; niy += 6) {
      for (var nix = nx; nix < nx + nw; nix += 6) {
        var hash = ((nix * 131 + niy * 317 + seed * 773) % 997);
        if (hash < 150) {
          var bright = (hash % 3 === 0) ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
          rect(nix, niy, 6, 6, bright);
        }
      }
    }
  }

  // んぽちゃむルンバ画面
  if (cabinet.id === "train") {
    var sx = cx + 18;
    var sy = cy + 36;
    var sw = cw - 36;
    var sh = 88;
    var timg = Game.runbaThumbnail;
    if (timg && timg.complete && timg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx, sy, sw, sh);
      ctx.clip();
      var scale = Math.max(sw / timg.naturalWidth, sh / timg.naturalHeight);
      var iw = timg.naturalWidth * scale;
      var ih = timg.naturalHeight * scale;
      ctx.drawImage(timg, sx + (sw - iw) / 2, sy + (sh - ih) / 2, iw, ih);
      // チカチカエフェクト
      if (Math.sin(time * 0.015) > 0.7) {
        rect(sx, sy, sw, sh, "rgba(255,255,255,0.12)");
      }
      if (Math.sin(time * 0.009) > 0.85) {
        var flickY = sy + (Math.floor(time * 0.2) % sh);
        rect(sx, flickY, sw, 2, "rgba(255,255,255,0.2)");
      }
      ctx.restore();
    }
  }

  // コントロールパネル（傾斜っぽく暗めのグラデ風）
  rect(cx + 8, cy + 134, cw - 16, 28, theme.panel);
  Game.strokeRect(cx + 8, cy + 134, cw - 16, 28, "rgba(0,0,0,0.2)", 2);

  // ジョイスティック
  rect(cx + 18, cy + 146, 4, 12, "#333");
  ctx.beginPath();
  ctx.arc(cx + 20, cy + 144, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#ee2222";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 19, cy + 143, 2, 0, Math.PI * 2);
  ctx.fillStyle = "#ff6666";
  ctx.fill();

  // ボタン（チカチカ）
  var fb1 = Math.sin(time * 0.007 + cx) > 0 ? "#44aaff" : "#0066ff";
  var fb2 = Math.sin(time * 0.009 + cx) > 0 ? "#ffee00" : "#ff8800";
  var fb3 = Math.sin(time * 0.006 + cx) > 0 ? "#ff44aa" : "#ff0066";
  rect(cx + 100, cy + 140, 10, 10, fb1);
  rect(cx + 116, cy + 140, 10, 10, fb2);
  rect(cx + 132, cy + 140, 10, 10, fb3);

  // コイン投入口パネル
  rect(cx + 14, cy + 168, cw - 28, 42, theme.base);
  Game.strokeRect(cx + 14, cy + 168, cw - 28, 42, "rgba(0,0,0,0.12)", 2);

  // コイン投入口
  rect(cx + cw / 2 - 10, cy + 178, 20, 4, "#333");
  rect(cx + cw / 2 - 8, cy + 179, 16, 2, "#111");

  // コインリターンボタン
  ctx.beginPath();
  ctx.arc(cx + cw / 2, cy + 196, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#888";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + cw / 2, cy + 196, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#aaa";
  ctx.fill();

  // スピーカーグリル（下部に横線）
  for (var gi = 0; gi < 3; gi++) {
    rect(cx + 30, cy + 174 + gi * 6, 20, 2, "rgba(0,0,0,0.15)");
  }

  // 脚
  rect(cx + 10, cy + ch, 8, 8, "#444");
  rect(cx + cw - 18, cy + ch, 8, 8, "#444");

  Game.drawStool(cx + 36, cy + ch + 12, false);
};

Game._bubbleState = { id: null, startTime: 0 };

Game.drawCabinetBubble = function(cabinet, time) {
  var pixelFont = function(s) { return s + 'px "Courier New", "MS Gothic", monospace'; };
  var ctx = Game.ctx;
  var rect = Game.rect;
  var msgSize = 12;
  var msg = cabinet.message;
  var msg1, msg2;
  if (msg.indexOf("\n") !== -1) {
    var parts = msg.split("\n");
    msg1 = parts[0];
    msg2 = parts[1];
  } else {
    var half = Math.ceil(msg.length / 2);
    msg1 = msg.substring(0, half);
    msg2 = msg.substring(half);
  }

  if (Game._bubbleState.id !== cabinet.id) {
    Game._bubbleState.id = cabinet.id;
    Game._bubbleState.startTime = time;
  }

  var elapsed = time - Game._bubbleState.startTime;

  ctx.font = pixelFont(msgSize);
  var msgW = Math.max(ctx.measureText(msg1).width, ctx.measureText(msg2).width);
  var pw = msgW + 32;
  var ph = msgSize * 2 + 28;
  var p = 4;

  var bx = cabinet.x + cabinet.w / 2;
  var by = cabinet.y - 16;
  var px = bx - pw / 2;
  var py = by - ph;

  var border = "#ffbfd1";
  var fill = "#ffffff";
  var corner = "#ffbfd1";

  var segments = [];
  var totalLen = 0;

  for (var tx = px + p; tx < px + pw - p; tx += p) {
    segments.push({x: tx, y: py, w: p, h: p});
  }
  segments.push({x: px + pw - p, y: py + p, w: p, h: p});
  for (var ry = py + p * 2; ry < py + ph - p; ry += p) {
    segments.push({x: px + pw - p, y: ry, w: p, h: p});
  }
  segments.push({x: px + pw - p * 2, y: py + ph - p, w: p, h: p});
  for (var bxe = px + pw - p * 2; bxe >= px + p; bxe -= p) {
    segments.push({x: bxe, y: py + ph - p, w: p, h: p});
  }
  segments.push({x: px, y: py + ph - p * 2, w: p, h: p});
  for (var ly = py + ph - p * 2; ly >= py + p; ly -= p) {
    segments.push({x: px, y: ly, w: p, h: p});
  }
  segments.push({x: px + p, y: py, w: p, h: p});

  totalLen = segments.length;

  var borderDuration = 200;
  var borderProgress = Math.min(elapsed / borderDuration, 1);
  var visibleSegments = Math.floor(borderProgress * totalLen);

  if (borderProgress >= 1) {
    rect(px + p, py + p, pw - p * 2, ph - p * 2, fill);
    rect(px + p, py, pw - p * 2, p, fill);
    rect(px + p, py + ph - p, pw - p * 2, p, fill);
    rect(px, py + p, p, ph - p * 2, fill);
    rect(px + pw - p, py + p, p, ph - p * 2, fill);
  }

  if (visibleSegments > 0) {
    rect(px, py, p, p, corner);
    rect(px + pw - p, py, p, p, corner);
    rect(px, py + ph - p, p, p, corner);
    rect(px + pw - p, py + ph - p, p, p, corner);
  }

  for (var i = 0; i < visibleSegments && i < totalLen; i++) {
    var s = segments[i];
    rect(s.x, s.y, s.w, s.h, border);
  }

  if (borderProgress >= 1) {
    // 突起（台形、本体下辺から滑らかに接続）
    // 段1: 本体下辺と同じ幅からスタート
    rect(bx - p * 3, py + ph, p * 6, p, fill);
    rect(bx - p * 3, py + ph, p, p, border);       // 左角
    rect(bx + p * 2, py + ph, p, p, border);        // 右角
    // 段2
    rect(bx - p * 2, py + ph + p, p * 4, p, fill);
    rect(bx - p * 2, py + ph + p, p, p, border);    // 左辺
    rect(bx + p, py + ph + p, p, p, border);         // 右辺
    // 段3: 先端
    rect(bx - p, py + ph + p * 2, p * 2, p, border);

    var charInterval = 50;
    var textElapsed = elapsed - borderDuration - 300;
    var visibleChars = Math.min(Math.floor(textElapsed / charInterval), msg.length);
    var msg1Visible = Math.min(visibleChars, msg1.length);
    var msg2Visible = Math.max(Math.min(visibleChars - msg1.length, msg2.length), 0);

    ctx.save();
    ctx.beginPath();
    ctx.rect(px + p, py + p, pw - p * 2, ph - p * 2);
    ctx.clip();

    if (msg1Visible > 0) {
      Game.text(msg1.substring(0, msg1Visible), bx, py + msgSize + 8, {
        size: msgSize,
        font: pixelFont(msgSize),
        color: "#5b4636",
        align: "center"
      });
    }
    if (msg2Visible > 0) {
      Game.text(msg2.substring(0, msg2Visible), bx, py + msgSize * 2 + 14, {
        size: msgSize,
        font: pixelFont(msgSize),
        color: "#5b4636",
        align: "center"
      });
    }

    ctx.restore();
  }
};
