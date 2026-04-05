import { viewport, keys, state, configureCourse } from "./state.js";
import { sfx } from "./audio.js";
import { resetGame, loop, surrender } from "./game.js";

if (!window.Matter) {
  throw new Error("Matter.js is required");
}

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");

function resize() {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  viewport.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(viewport.width * viewport.dpr);
  canvas.height = Math.floor(viewport.height * viewport.dpr);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  configureCourse();
  if (state.mode === "ready") {
    resetGame(canvas);
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["q", "w", "o", "p"].includes(key) || event.code === "Space") {
    event.preventDefault();
  }

  if (event.code === "Space" && state.retryReady) {
    sfx("retry");
    resetGame(canvas);
    return;
  }

  if (event.code === "Escape" && state.retryReady) {
    window.location.href = "../";
    return;
  }

  keys[key] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

document.getElementById("surrender-btn").addEventListener("click", (e) => {
  e.target.blur();
  surrender();
});

window.addEventListener("resize", resize);

resize();
resetGame(canvas);
requestAnimationFrame((ts) => loop(ts, ctx, canvas, timerEl));
