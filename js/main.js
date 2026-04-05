(function() {
  var canvas = document.getElementById("screen");
  var ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  Game.initDrawing(ctx);

  function getCabinetAt(clientX, clientY) {
    var rectBox = canvas.getBoundingClientRect();
    var x = ((clientX - rectBox.left) / rectBox.width) * Game.SCENE_WIDTH - (Game.OFFSET_X || 0);
    var y = ((clientY - rectBox.top) / rectBox.height) * Game.SCENE_HEIGHT - Game.OFFSET_Y;
    var hoverableUfos = Game.ufoCatchers.filter(function(u) { return u.id === "ufo-2"; });
    var allMachines = Game.cabinets.concat(hoverableUfos);
    return allMachines.find(function(cabinet) {
      return (
        x >= cabinet.x &&
        x <= cabinet.x + cabinet.w &&
        y >= cabinet.y &&
        y <= cabinet.y + cabinet.h
      );
    }) || null;
  }

  Game.charFallTime = 0;
  Game.mouseSceneX = -9999;
  Game.mouseSceneY = -9999;
  Game.mouseVelX = 0;
  Game.mouseVelY = 0;
  Game.mouseSpeed = 0;
  var _prevMouseX = -9999;
  var _prevMouseY = -9999;
  var _prevMouseTime = 0;

  canvas.addEventListener("mousemove", function(event) {
    Game.hoveredCabinet = getCabinetAt(event.clientX, event.clientY);
    var isClickable = Game.hoveredCabinet && (Game.hoveredCabinet.id === "sad-run" || Game.hoveredCabinet.id === "train");
    canvas.style.cursor = isClickable ? "pointer" : "default";

    // マウスのシーン座標を記録
    var rectBox = canvas.getBoundingClientRect();
    var newX = ((event.clientX - rectBox.left) / rectBox.width) * Game.SCENE_WIDTH - (Game.OFFSET_X || 0);
    var newY = ((event.clientY - rectBox.top) / rectBox.height) * Game.SCENE_HEIGHT - Game.OFFSET_Y;
    var now = performance.now();
    var dt = now - _prevMouseTime;
    if (dt > 0 && _prevMouseX > -9000) {
      Game.mouseVelX = (newX - _prevMouseX) / dt;
      Game.mouseVelY = (newY - _prevMouseY) / dt;
      Game.mouseSpeed = Math.sqrt(Game.mouseVelX * Game.mouseVelX + Game.mouseVelY * Game.mouseVelY);
    }
    _prevMouseX = newX;
    _prevMouseY = newY;
    _prevMouseTime = now;
    Game.mouseSceneX = newX;
    Game.mouseSceneY = newY;
  });

  canvas.addEventListener("mouseleave", function() {
    Game.hoveredCabinet = null;
    canvas.style.cursor = "default";
  });

  Game.leverClickTimes = {};
  Game._charClicked = false;
  Game._charClickX = 0;

  // ポップアップデータ
  var popupData = {
    "sad-run": {
      title: "大股の社員.exe",
      subtitle: "～ホテルダンゲロウスの大股の社員で出社しよう～",
      thumb: "assets/hotel-dangerous-thumbnail.png",
      thumb2: "assets/hotel-dangerous-thumbnail2.png",
      desc: "いつも有給をとっているくせに、\n今日はあの大股の社員が出社するみたい...！\n小股のアルバイトの女の子を踏まないようにがんばって！",
    },
    "train": {
      title: "んぽちゃむルンバ.exe",
      subtitle: "～んぽちゃむをルンバで連れて行こう～",
      thumb: "assets/npochamurunba-thumbnail.png",
      thumb2: "assets/npochamurunba-thumbnail2.png",
      desc: "んぽちゃむったら旅行なのにまだ部屋にいるみたい！\nルンバで引きずり出してきみまろの元へ連れて行こう！\nマカロンに近づくと食べちゃうから気をつけて...！"
    }
  };

  var popupOverlay = document.getElementById("game-popup-overlay");
  var popupTitle = document.getElementById("popup-title");
  var popupThumb = document.getElementById("popup-thumb");
  var popupDesc = document.getElementById("popup-desc");
  var popupClose = document.getElementById("popup-close");

  var popupSubtitle = document.getElementById("popup-subtitle");
  var popupCounter = document.getElementById("popup-counter");

  function showPopup(id) {
    var data = popupData[id];
    if (!data) return;
    popupTitle.textContent = data.title;
    popupSubtitle.textContent = data.subtitle;
    popupThumb.style.height = "";
    popupThumb.src = data.thumb;
    popupDesc.innerHTML = data.desc.replace(/\n/g, "<br>");
    popupCounter.textContent = "ACCESS: " + ("000000" + Math.floor(Math.random() * 999999)).slice(-6);
    clearTimeout(popupThumbTimer);
    popupThumbTimer = null;
    if (data.thumb2) {
      popupThumb.onload = function() {
        popupThumb.style.height = popupThumb.offsetHeight + "px";
        popupThumb.onload = null;
        startIdleNoise();
        popupThumbTimer = setTimeout(function() {
          playCrtNoise(300, function() {
            popupThumb.src = data.thumb2;
          });
        }, 2000);
      };
    } else {
      popupThumb.onload = function() {
        popupThumb.style.height = popupThumb.offsetHeight + "px";
        popupThumb.onload = null;
        startIdleNoise();
      };
    }
    popupOverlay.classList.add("active");
  }

  var popupThumbTimer = null;
  var noiseCanvas = document.getElementById("popup-noise");
  var noiseCtx = noiseCanvas.getContext("2d");
  var noiseAnimId = null;

  var idleNoiseId = null;
  var isBurstPlaying = false;

  function startIdleNoise() {
    if (idleNoiseId) return;
    var w = popupThumb.offsetWidth;
    var h = popupThumb.offsetHeight;
    if (!w || !h) return;
    noiseCanvas.width = w;
    noiseCanvas.height = h;
    noiseCanvas.style.height = h + "px";
    noiseCanvas.style.opacity = "1";
    var imgData = noiseCtx.createImageData(w, h);
    var pixels = imgData.data;

    function drawIdle() {
      if (isBurstPlaying) { idleNoiseId = requestAnimationFrame(drawIdle); return; }
      // まばらなノイズ: ほとんど透明、ランダムにちらつく
      for (var i = 0; i < pixels.length; i += 4) {
        if (Math.random() < 0.03) {
          var v = Math.random() * 255 | 0;
          pixels[i] = v;
          pixels[i + 1] = v;
          pixels[i + 2] = v;
          pixels[i + 3] = (Math.random() * 40 + 10) | 0;
        } else {
          pixels[i + 3] = 0;
        }
      }
      // たまに薄い走査線
      if (Math.random() < 0.3) {
        var scanY = (Math.random() * h) | 0;
        for (var sx = 0; sx < w; sx++) {
          var idx = (scanY * w + sx) * 4;
          pixels[idx] = 255;
          pixels[idx + 1] = 255;
          pixels[idx + 2] = 255;
          pixels[idx + 3] = (Math.random() * 25 + 5) | 0;
        }
      }
      noiseCtx.putImageData(imgData, 0, 0);
      idleNoiseId = requestAnimationFrame(drawIdle);
    }
    idleNoiseId = requestAnimationFrame(drawIdle);
  }

  function stopIdleNoise() {
    if (idleNoiseId) { cancelAnimationFrame(idleNoiseId); idleNoiseId = null; }
  }

  function playCrtNoise(duration, onDone) {
    isBurstPlaying = true;
    var w = popupThumb.offsetWidth;
    var h = popupThumb.offsetHeight;
    noiseCanvas.width = w;
    noiseCanvas.height = h;
    noiseCanvas.style.height = h + "px";
    noiseCanvas.style.opacity = "1";
    var imgData = noiseCtx.createImageData(w, h);
    var pixels = imgData.data;
    var start = performance.now();

    function drawNoise(now) {
      var elapsed = now - start;
      if (elapsed >= duration) {
        isBurstPlaying = false;
        noiseAnimId = null;
        if (onDone) onDone();
        return;
      }
      // フェードアウト: 後半で透明度を下げる
      var progress = elapsed / duration;
      var alpha = progress < 0.5 ? 1 : 1 - (progress - 0.5) * 2;
      noiseCanvas.style.opacity = alpha;

      // ランダムノイズ + 走査線
      for (var i = 0; i < pixels.length; i += 4) {
        var v = Math.random() * 255 | 0;
        pixels[i] = v;
        pixels[i + 1] = v;
        pixels[i + 2] = v;
        pixels[i + 3] = (Math.random() * 200 + 55) | 0;
      }
      // 水平の明るいライン（走査線風）
      var scanY = (Math.random() * h) | 0;
      var scanH = (Math.random() * 8 + 2) | 0;
      for (var sy = scanY; sy < Math.min(scanY + scanH, h); sy++) {
        for (var sx = 0; sx < w; sx++) {
          var idx = (sy * w + sx) * 4;
          pixels[idx] = 255;
          pixels[idx + 1] = 255;
          pixels[idx + 2] = 255;
          pixels[idx + 3] = 220;
        }
      }
      noiseCtx.putImageData(imgData, 0, 0);
      noiseAnimId = requestAnimationFrame(drawNoise);
    }
    if (noiseAnimId) cancelAnimationFrame(noiseAnimId);
    noiseAnimId = requestAnimationFrame(drawNoise);
  }

  function hidePopup() {
    clearTimeout(popupThumbTimer);
    popupThumbTimer = null;
    if (noiseAnimId) { cancelAnimationFrame(noiseAnimId); noiseAnimId = null; }
    isBurstPlaying = false;
    stopIdleNoise();
    noiseCanvas.style.opacity = "0";
    popupOverlay.classList.remove("active");
    Game.selectedCabinet = null;
  }

  popupClose.addEventListener("click", hidePopup);
  document.getElementById("popup-cancel").addEventListener("click", hidePopup);
  document.getElementById("popup-header-close").addEventListener("click", hidePopup);
  popupOverlay.addEventListener("click", function(event) {
    if (event.target === popupOverlay) hidePopup();
  });

  canvas.addEventListener("click", function(event) {
    Game.selectedCabinet = getCabinetAt(event.clientX, event.clientY);
    if (Game.selectedCabinet) {
      Game.leverClickTimes[Game.selectedCabinet.id] = performance.now();
      // ポップアップ対象のゲーム機ならポップアップ表示
      if (popupData[Game.selectedCabinet.id]) {
        showPopup(Game.selectedCabinet.id);
      }
    }
    // キャラクタークリック判定用にシーン座標を記録
    Game._charClicked = true;
    Game._charClickX = Game.mouseSceneX;
  });

  // 背景オーバーレイの位置同期
  var bgGreenEl = document.getElementById("bg-green");
  var bgWallEl = document.getElementById("bg-wall");

  function syncBgOverlays() {
    var rect = canvas.getBoundingClientRect();

    // 緑背景：Canvas全体に合わせる
    bgGreenEl.style.left = rect.left + "px";
    bgGreenEl.style.top = rect.top + "px";
    bgGreenEl.style.width = rect.width + "px";
    bgGreenEl.style.height = rect.height + "px";
    bgGreenEl.style.visibility = "visible";

    // 壁画像：画面幅いっぱい、下端に揃える
    var wallW = rect.width;
    var img = bgWallEl;
    if (img.naturalWidth > 0) {
      var wallAspect = img.naturalHeight / img.naturalWidth;
      var wallH = wallW * wallAspect;
      bgWallEl.style.left = rect.left + "px";
      bgWallEl.style.top = (rect.bottom - wallH) + "px";
      bgWallEl.style.width = wallW + "px";
      bgWallEl.style.height = wallH + "px";
      bgWallEl.style.visibility = "visible";
    }
  }

  // UFO GIFオーバーレイの位置同期 & ホバーで再生制御
  var ufoOverlayData = [
    { still: "assets/ufo1.gif", gif: "assets/ufo1.gif", end: null },
    { still: "assets/ufo2.png", gif: "assets/ufo2.gif", end: "assets/ufo2-end.gif" },
    { still: "assets/ufo1.gif", gif: "assets/ufo1.gif", end: null }
  ];
  var ufoOverlays = [];
  for (var i = 0; i < Game.ufoCatchers.length; i++) {
    ufoOverlays.push(document.getElementById("ufo-overlay-" + i));
  }

  function syncUfoOverlays() {
    var rect = canvas.getBoundingClientRect();
    var scaleX = rect.width / Game.SCENE_WIDTH;
    var scaleY = rect.height / Game.SCENE_HEIGHT;
    for (var i = 0; i < Game.ufoCatchers.length; i++) {
      var m = Game.ufoCatchers[i];
      var el = ufoOverlays[i];
      if (!el) continue;
      var px = (m.x + Game.OFFSET_X) * scaleX + rect.left;
      var py = (m.y + Game.OFFSET_Y) * scaleY + rect.top;
      var pw = m.w * scaleX;
      var ph = m.h * scaleY;
      el.style.left = px + "px";
      el.style.top = py + "px";
      el.style.width = pw + "px";
      el.style.height = ph + "px";
      el.style.visibility = "visible";

      // ホバー中はGIF、解除時はend GIF、通常は静止画
      var isHovered = Game.hoveredCabinet && Game.hoveredCabinet.id === m.id;
      var data = ufoOverlayData[i];
      if (isHovered) {
        if (!el._wasHovered) {
          el._wasHovered = true;
          el.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
          el.offsetHeight; // 強制再描画
          el.src = data.gif + "?" + Date.now();
        }
      } else if (el._wasHovered) {
        el._wasHovered = false;
        if (data.end) {
          el.src = data.end + "?" + Date.now();
        } else {
          el.src = data.still;
        }
      }
    }
  }

  window.addEventListener("resize", syncUfoOverlays);

  function frame(time) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(Game.RENDER_SCALE, 0, 0, Game.RENDER_SCALE, 0, 0);
    Game.drawScene(time);
    syncBgOverlays();
    syncUfoOverlays();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
