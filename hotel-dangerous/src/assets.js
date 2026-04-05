/*
 * 素材を差し替えるときは src に相対パスを入れてください。
 * 剛体の中心基準で描画するので、anchorX/anchorY と drawWidth/drawHeight で
 * 見た目の合わせ込みを行います。必要なら scale / offsetX / offsetY も調整してください。
 */
export const ASSETS = {
  background: { src: "./assets/background.png" },
  torso: {
    src: "./assets/player-body.png",
    anchorX: 0.39,
    anchorY: 0.8,
    scale: 1,
    offsetX: 10,
    offsetY: 28,
    drawHeight: 360,
    fit: "height",
    trimAlpha: true,
    flipX: true,
  },
  head: { src: null, anchorX: 0.5, anchorY: 0.5, scale: 1 },
  leg: { src: null, anchorX: 0.5, anchorY: 0.5, scale: 1 },
  legRear: {
    src: "./assets/player-leg-rear.png",
    anchorX: 0.5,
    anchorY: 0,
    scale: 1,
    offsetY: -152,
    drawHeight: 304,
    fit: "height",
    trimAlpha: true,
    flipX: true,
  },
  legFront: {
    src: "./assets/player-leg-front.png",
    anchorX: 0.5,
    anchorY: 0,
    scale: 1,
    offsetY: -152,
    drawHeight: 304,
    fit: "height",
    trimAlpha: true,
    flipX: true,
  },
  thigh: { src: null, anchorX: 0.5, anchorY: 0.5, scale: 1 },
  shin: { src: null, anchorX: 0.5, anchorY: 0.5, scale: 1 },
  foot: { src: null, anchorX: 0.5, anchorY: 0.5, scale: 1 },
  enemy: { src: "./assets/moribito-1.png", anchorX: 0.5, anchorY: 1, scale: 1.7 },
  goal: { src: "./assets/goal.png", anchorX: 0.5, anchorY: 1, scale: 1.5, offsetY: 20 },
  ground: { src: null },
  playerBodyEnd: { src: "./assets/player-body-end.png" },
};

function removeBrightEdgeBackdrop(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const surface = document.createElement("canvas");
  surface.width = width;
  surface.height = height;
  const surfaceCtx = surface.getContext("2d", { willReadFrequently: true });
  surfaceCtx.drawImage(image, 0, 0);

  const imageData = surfaceCtx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const visited = new Uint8Array(width * height);
  const stack = [];

  function push(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }
    const index = y * width + x;
    if (visited[index]) {
      return;
    }
    visited[index] = 1;
    stack.push(x, y);
  }

  function isBackdrop(pixelIndex) {
    const alpha = data[pixelIndex + 3];
    if (alpha === 0) {
      return true;
    }
    const red = data[pixelIndex];
    const green = data[pixelIndex + 1];
    const blue = data[pixelIndex + 2];
    const min = Math.min(red, green, blue);
    const max = Math.max(red, green, blue);
    return min >= 224 && max - min <= 24;
  }

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    const pixelOffset = (y * width + x) * 4;
    if (!isBackdrop(pixelOffset)) {
      continue;
    }
    data[pixelOffset + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  surfaceCtx.putImageData(imageData, 0, 0);
  return surface;
}

function trimTransparentBounds(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const surface = document.createElement("canvas");
  surface.width = width;
  surface.height = height;
  const surfaceCtx = surface.getContext("2d", { willReadFrequently: true });
  surfaceCtx.drawImage(image, 0, 0);

  const imageData = surfaceCtx.getImageData(0, 0, width, height);
  const { data } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelOffset = (y * width + x) * 4;
      if (data[pixelOffset + 3] === 0) {
        continue;
      }
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) {
    return surface;
  }

  const trimmed = document.createElement("canvas");
  trimmed.width = maxX - minX + 1;
  trimmed.height = maxY - minY + 1;
  const trimmedCtx = trimmed.getContext("2d");
  trimmedCtx.drawImage(
    surface,
    minX,
    minY,
    trimmed.width,
    trimmed.height,
    0,
    0,
    trimmed.width,
    trimmed.height
  );
  return trimmed;
}

export function loadImages(assetMap) {
  const images = {};
  for (const [key, config] of Object.entries(assetMap)) {
    if (!config.src) {
      continue;
    }
    const image = new Image();
    if (config.removeBackground || config.trimAlpha) {
      image.addEventListener(
        "load",
        () => {
          let processed = image;
          if (config.removeBackground) {
            processed = removeBrightEdgeBackdrop(processed);
          }
          if (config.trimAlpha) {
            processed = trimTransparentBounds(processed);
          }
          images[key] = processed;
        },
        { once: true }
      );
    }
    image.src = config.src;
    images[key] = image;
  }
  return images;
}

// Enemy animation frames (moribito-1 ~ moribito-5, ping-pong loop)
const enemyFrameImages = [1, 2, 3, 4, 5].map((i) => {
  const img = new Image();
  img.src = `./assets/moribito-${i}.png`;
  return img;
});

// 1→2→3→4→5→4→3→2→ (ping-pong loop)
export const enemyFrames = [0, 1, 2, 3, 4, 3, 2, 1].map((i) => enemyFrameImages[i]);
export const ENEMY_FRAME_INTERVAL = 1 / 10; // 10 FPS

export const loadedImages = loadImages(ASSETS);
