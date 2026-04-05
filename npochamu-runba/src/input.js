export function createInput({ canvas, state, audio, onKeyDown, onResetGame }) {
  const keys = {};
  const touch = {
    active: false,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0,
  };

  document.addEventListener("keydown", (event) => {
    keys[event.code] = true;
    onKeyDown(event.code);

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
  });

  document.addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });

  canvas.addEventListener("pointerdown", (event) => {
    audio.ensureAudio();

    if (state.gameState === "title") {
      state.gameState = "howto";
      return;
    }

    if (state.gameState === "howto" || state.gameState === "cleared" || state.gameState === "gameover") {
      onResetGame();
      return;
    }

    if (state.gameState === "paused") {
      state.gameState = "playing";
      return;
    }

    touch.active = true;
    touch.startX = event.clientX;
    touch.startY = event.clientY;
    touch.dx = 0;
    touch.dy = 0;
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!touch.active) return;
    touch.dx = event.clientX - touch.startX;
    touch.dy = event.clientY - touch.startY;
  });

  function resetTouch() {
    touch.active = false;
    touch.dx = 0;
    touch.dy = 0;
  }

  canvas.addEventListener("pointerup", resetTouch);
  canvas.addEventListener("pointercancel", resetTouch);

  return { keys, touch };
}
