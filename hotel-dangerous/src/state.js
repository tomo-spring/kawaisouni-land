import { clamp } from "./utils.js";

export const terrainBumps = [];

export const enemyTemplates = [
  { radius: 20, patrolSpeed: 30 },
];

export const scene = {
  width: 1400,
  goalX: 920,
  enemies: [],
  clouds: [
    { x: 220, y: 132, radius: 82, stretch: 1.8 },
    { x: 760, y: 182, radius: 64, stretch: 1.5 },
    { x: 1420, y: 146, radius: 88, stretch: 2.1 },
    { x: 2150, y: 120, radius: 72, stretch: 1.7 },
    { x: 3040, y: 198, radius: 90, stretch: 1.95 },
  ],
};

export const state = {
  mode: "ready",
  timer: 0,
  worldTime: 0,
  cameraX: 0,
  windTime: 0,
  windForce: 0,
  surrendered: false,
};

export const viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
};

export const keys = Object.create(null);

export const game = {
  engine: null,
  player: null,
  lastFrame: 0,
};

export const legGroundState = [false, false];

export function groundBase() {
  return viewport.height - 72;
}

export function groundHeightAt(x) {
  let y = groundBase();
  for (const bump of terrainBumps) {
    const halfW = bump.width * 0.5;
    const dist = Math.abs(x - bump.x);
    if (dist < halfW) {
      const t = 1 - dist / halfW;
      y -= bump.height * t * t * (3 - 2 * t);
    }
  }
  return y;
}

export function configureCourse() {
  scene.goalX = viewport.width - 150;
  scene.width = Math.max(scene.goalX + 260, viewport.width + 140);
}
