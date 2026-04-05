Game.drawMascot = function(x, y, options) {
  if (!options) options = {};
  var scale = options.scale || 1;
  var facing = options.facing || 1;
  var lean = options.lean || false;
  var body = options.body || "#ffd4de";
  var shorts = options.shorts || "#7d95ff";
  var ctx = Game.ctx;
  var rect = Game.rect;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);
  if (lean) {
    ctx.rotate(-0.22);
  }
  rect(-14, -2, 28, 36, shorts);
  rect(-4, 34, 6, 12, "#6a70c8");
  rect(4, 34, 6, 12, "#6a70c8");
  rect(-18, -38, 36, 36, body);
  rect(-24, -56, 10, 24, body);
  rect(14, -56, 10, 24, body);
  rect(-22, -60, 8, 8, body);
  rect(16, -60, 8, 8, body);
  rect(-4, -20, 4, 4, "#2a1c25");
  rect(6, -20, 4, 4, "#2a1c25");
  rect(-8, -14, 8, 4, "#7aa6ff");
  rect(10, -14, 8, 4, "#7aa6ff");
  rect(-4, -10, 8, 2, "#7aa6ff");
  rect(0, -4, 4, 2, "#ac3b55");
  rect(-26, 2, 8, 6, body);
  rect(18, 2, 8, 6, body);
  ctx.restore();
};

Game.drawBlueFriend = function(x, y, scale) {
  if (scale === undefined) scale = 1;
  var rect = Game.rect;
  var w = 20 * scale;
  var h = 24 * scale;
  rect(x, y, w, h, "#4969c2");
  rect(x + 2 * scale, y - 4 * scale, w - 4 * scale, 10 * scale, "#4f70cf");
  rect(x + 4 * scale, y + 6 * scale, 2 * scale, 2 * scale, "#ecf7ff");
  rect(x + 14 * scale, y + 6 * scale, 2 * scale, 2 * scale, "#ecf7ff");
  rect(x + 8 * scale, y + 12 * scale, 4 * scale, 2 * scale, "#2b3040");
  rect(x - 4 * scale, y + 16 * scale, 8 * scale, 4 * scale, "#4969c2");
  rect(x + 16 * scale, y + 16 * scale, 8 * scale, 4 * scale, "#4969c2");
};

Game.drawDeskCat = function(x, y) {
  var rect = Game.rect;
  rect(x, y, 20, 22, "#ffffff");
  rect(x - 4, y - 16, 28, 20, "#ffffff");
  rect(x + 2, y - 20, 8, 8, "#ffffff");
  rect(x + 14, y - 20, 8, 8, "#ffffff");
  rect(x + 6, y - 8, 2, 2, "#1f2024");
  rect(x + 16, y - 8, 2, 2, "#1f2024");
  rect(x + 12, y - 2, 4, 2, "#f493a2");
  rect(x + 22, y + 8, 8, 4, "#34343b");
};

Game.drawPictureFrame = function(x, y) {
  var rect = Game.rect;
  rect(x, y, 104, 68, "#f8efe0");
  Game.strokeRect(x, y, 104, 68, "#4f3a2d", 4);
  rect(x + 4, y + 4, 96, 60, "#162454");
  rect(x + 6, y + 30, 92, 30, "#0f2747");
  rect(x + 12, y + 40, 16, 16, "#1d4d2b");
  rect(x + 28, y + 36, 18, 20, "#254f31");
  rect(x + 50, y + 26, 20, 30, "#22384f");
  rect(x + 80, y + 18, 14, 38, "#1b2f4b");
  rect(x + 8, y + 14, 92, 16, "#2d3983");
};

Game.drawBucket = function(x, y) {
  var ctx = Game.ctx;
  Game.rect(x, y, 16, 26, "#9b6b35");
  Game.rect(x + 2, y + 4, 12, 16, "#6d4d2d");
  ctx.beginPath();
  ctx.arc(x + 8, y, 8, Math.PI, 0);
  ctx.strokeStyle = "#a67b47";
  ctx.lineWidth = 2;
  ctx.stroke();
};

Game.drawTissue = function(x, y, scale) {
  var rect = Game.rect;
  rect(x, y, 24 * scale, 18 * scale, "#a0b2ff");
  rect(x + 2 * scale, y + 2 * scale, 20 * scale, 14 * scale, "#f7ed8d");
  rect(x + 8 * scale, y - 6 * scale, 8 * scale, 8 * scale, "#f4f4ff");
};
