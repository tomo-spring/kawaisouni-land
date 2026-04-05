import { config } from "./config.js";

const {
  CHAR_SIZE,
  CHAR_SIZE_GROW,
  CHAR_STAND_H,
  DRAG_ANIM_DURATION,
  DRAG_ANIM_FRAMES,
  DRAG_ANIM_INTERVAL,
  DRAG_DRAW_SIZE,
} = config;

export function charSize(state) {
  return CHAR_SIZE + state.macaronsEaten * CHAR_SIZE_GROW;
}

export function charDrawSize(state) {
  return DRAG_DRAW_SIZE + state.macaronsEaten * CHAR_SIZE_GROW;
}

export function charStandH(state) {
  return CHAR_STAND_H + state.macaronsEaten * CHAR_SIZE_GROW;
}

export function charStandW(state) {
  return Math.floor(charStandH(state) * (1728 / 2466));
}

export function currentDragFrameName(state) {
  if (state.dragAnimTimer > 0) {
    const elapsed = DRAG_ANIM_DURATION - state.dragAnimTimer;
    const frameIdx = Math.min(DRAG_ANIM_FRAMES - 1, Math.floor(elapsed / DRAG_ANIM_INTERVAL));
    return `dragging-${frameIdx + 1}.png`;
  }

  return "dragging-7.png";
}

export function dragDrawRect(state, images, x = state.charX, y = state.charY) {
  const cs = charSize(state);
  const drawSize = charDrawSize(state);
  const frameName = currentDragFrameName(state);
  const img = images[frameName];
  let width = cs;
  let height = cs;

  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const aspect = img.naturalWidth / img.naturalHeight;
    if (aspect >= 1) {
      width = drawSize;
      height = Math.floor(drawSize / aspect);
    } else {
      height = drawSize;
      width = Math.floor(drawSize * aspect);
    }
  }

  const dx = (cs - width) / 2;
  const dy = cs - height;

  return {
    frameName,
    x: x + dx,
    y: y + dy,
    w: width,
    h: height,
    dx,
    dy,
  };
}
