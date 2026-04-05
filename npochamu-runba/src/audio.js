import { config } from "./config.js";

const { REATTACH_COOLDOWN_SEC, SLIP_DURATION_SEC } = config;

export function createAudioController(state) {
  let audioCtx = null;
  let cryingAudio = null;

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function playTone(freqStart, freqEnd, duration, volume = 0.3, type = "sine") {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(freqStart, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playSlip() {
    playTone(600, 300, 0.15, 0.15, "triangle");
  }

  function onCryingEnded() {
    if (!state.attached) return;

    state.attached = false;
    state.slipTimer = SLIP_DURATION_SEC;
    state.reattachCooldown = REATTACH_COOLDOWN_SEC;
    playSlip();
    state.screenShake = 0.12;
  }

  function initCryingAudio() {
    if (cryingAudio) return;

    cryingAudio = new Audio("images/crying.wav");
    cryingAudio.loop = false;
    cryingAudio.addEventListener("ended", onCryingEnded);
  }

  function startCrying() {
    initCryingAudio();
    if (!cryingAudio.paused) return;

    cryingAudio.currentTime = 0;
    cryingAudio.play().catch(() => {});

    if (state.cryingTimerActive) return;

    const duration = cryingAudio.duration;
    state.cryingTimer = Number.isFinite(duration) && duration > 0 ? duration : 3;
    state.cryingTimerActive = true;
  }

  function stopCrying() {
    if (cryingAudio && !cryingAudio.paused) {
      cryingAudio.pause();
      cryingAudio.currentTime = 0;
    }

    state.cryingTimer = 0;
    state.cryingTimerActive = false;
  }

  function playConnect() {
    playTone(400, 800, 0.1, 0.2);
  }

  function playCollect() {
    ensureAudio();
    playTone(523, 523, 0.1, 0.15);
    setTimeout(() => playTone(659, 659, 0.1, 0.15), 100);
  }

  function playClear() {
    ensureAudio();
    [523, 659, 784, 1047].forEach((freq, index) => {
      setTimeout(() => playTone(freq, freq, 0.15, 0.2), index * 130);
    });
  }

  return {
    ensureAudio,
    startCrying,
    stopCrying,
    playConnect,
    playSlip,
    playCollect,
    playClear,
  };
}
