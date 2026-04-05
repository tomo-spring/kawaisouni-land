import { config } from "./config.js";

export function spawnParticles(state, x, y, color, count = 10, speed = 3.0, lifetime = 0.5) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * (0.5 + Math.random() * 0.5);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      color,
      life: lifetime,
      maxLife: lifetime,
      size: 2 + Math.random() * 4,
    });
  }
}

export function spawnConfetti(state, count = 50) {
  const colors = ["#ff6b6b", "#51cf66", "#339af0", "#fcc419", "#cc5de8", "#22b8cf", "#ff922b"];

  for (let i = 0; i < count; i += 1) {
    const angle = Math.PI * 0.25 + Math.random() * Math.PI * 0.5;
    const speed = 2 + Math.random() * 4;
    state.particles.push({
      x: Math.random() * config.GW,
      y: -20 + Math.random() * (config.GH / 3 + 20),
      vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1),
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 2.0,
      maxLife: 2.0,
      size: 3 + Math.random() * 5,
    });
  }
}

export function updateParticles(state, dt) {
  for (const particle of state.particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 1.5;
    particle.life -= dt;
  }

  state.particles = state.particles.filter((particle) => particle.life > 0);
}

export function drawParticles(state, ctx) {
  for (const particle of state.particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    const size = Math.max(1, particle.size * alpha);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
