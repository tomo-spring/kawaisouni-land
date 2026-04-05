Game.ctx = null;

Game.initDrawing = function(context) {
  Game.ctx = context;
};

Game.rect = function(x, y, w, h, color) {
  Game.ctx.fillStyle = color;
  Game.ctx.fillRect(x, y, w, h);
};

Game.strokeRect = function(x, y, w, h, color, lineWidth) {
  if (lineWidth === undefined) lineWidth = 1;
  Game.ctx.strokeStyle = color;
  Game.ctx.lineWidth = lineWidth;
  Game.ctx.strokeRect(x + 0.5, y + 0.5, w, h);
};

Game.roundRect = function(x, y, w, h, radius, fill, stroke, lineWidth) {
  if (lineWidth === undefined) lineWidth = 1;
  var ctx = Game.ctx;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

Game.text = function(content, x, y, options) {
  if (!options) options = {};
  var size = options.size || 12;
  var color = options.color || Game.palette.brown;
  var align = options.align || "left";
  var font = options.font || ('900 ' + size + 'px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif');
  var shadow = options.shadow || null;
  var shadowOffset = options.shadowOffset !== undefined ? options.shadowOffset : 4;
  var ctx = Game.ctx;
  ctx.font = font;
  ctx.textAlign = align;
  if (shadow) {
    ctx.fillStyle = shadow;
    ctx.fillText(content, x + shadowOffset, y + shadowOffset);
  }
  ctx.fillStyle = color;
  ctx.fillText(content, x, y);
};
