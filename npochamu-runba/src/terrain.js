import { config } from "./config.js";
import { rectsCollide, vecLen } from "./utils.js";

const { GH, GW, MACARON_DRAW_H, MACARON_IMAGE_NAMES, MACARON_SPEED, TOTAL_MACARONS } = config;

export const OBSTACLES = [];
export const EXIT_RECT = { x: GW - 110, y: GH - 110, w: 110, h: 110 };

export function generateMacarons() {
  const macarons = [];

  for (let i = 0; i < TOTAL_MACARONS; i += 1) {
    for (let tries = 0; tries < 300; tries += 1) {
      const mx = 40 + Math.random() * (GW - 80);
      const my = 40 + Math.random() * (GH - 80);
      const macaronRect = { x: mx - 20, y: my - 20, w: 40, h: 40 };

      let ok = !rectsCollide(macaronRect, EXIT_RECT);
      if (ok) {
        for (const obstacle of OBSTACLES) {
          if (obstacle.shape === "rect" && rectsCollide(macaronRect, obstacle.rect)) {
            ok = false;
            break;
          }

          if (obstacle.shape === "circle" && vecLen(mx - obstacle.pos[0], my - obstacle.pos[1]) < obstacle.radius + 30) {
            ok = false;
            break;
          }
        }
      }

      if (ok) {
        for (const existing of macarons) {
          if (vecLen(mx - existing.pos[0], my - existing.pos[1]) < 50) {
            ok = false;
            break;
          }
        }
      }

      if (!ok) continue;

      const angle = Math.random() * Math.PI * 2;
      macarons.push({
        pos: [mx, my],
        vx: Math.cos(angle) * MACARON_SPEED,
        vy: Math.sin(angle) * MACARON_SPEED,
        imgIdx: Math.floor(Math.random() * MACARON_IMAGE_NAMES.length),
      });
      break;
    }
  }

  return macarons;
}

export function macaronRadius(images, imgIdx) {
  const img = images[MACARON_IMAGE_NAMES[imgIdx]];
  if (!img) return 20;

  const scale = MACARON_DRAW_H / img.naturalHeight;
  return (img.naturalWidth * scale) / 2;
}
