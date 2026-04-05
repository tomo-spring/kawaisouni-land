export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeAngle(angle) {
  return ((angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

export function roundRectPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

export function formatTimer(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  const millis = Math.floor((totalSeconds * 1000) % 1000)
    .toString()
    .padStart(3, "0");
  return `${minutes}:${seconds}.${millis}`;
}

export function isDrawableReady(image) {
  if (!image) {
    return false;
  }
  return typeof image.complete === "boolean" ? image.complete : true;
}
