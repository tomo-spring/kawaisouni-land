import { createAssets } from "./assets.js";
import { createAudioController } from "./audio.js";
import { createGame } from "./game.js";
import { createInput } from "./input.js";
import { createRenderer } from "./render.js";
import { createState } from "./state.js";

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const state = createState();
const assets = createAssets();
const audio = createAudioController(state);
let game = null;

const input = createInput({
  canvas,
  state,
  audio,
  onKeyDown: (code) => {
    if (game) game.handleKeyDown(code);
  },
  onResetGame: () => {
    if (game) game.resetGame();
  },
});

game = createGame({
  state,
  images: assets.images,
  audio,
  input,
});

const renderer = createRenderer({
  canvas,
  ctx,
  state,
  images: assets.images,
});

window.addEventListener("resize", renderer.resize);
renderer.resize();

function loop(timestamp) {
  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
  state.lastTime = timestamp;
  game.update(dt);
  renderer.draw(timestamp);
  requestAnimationFrame(loop);
}

assets.loadImages(() => {
  state.lastTime = performance.now();
  requestAnimationFrame(loop);
});
