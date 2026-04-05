export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function vecLen(x, y) {
  return Math.hypot(x, y);
}

export function normalize(x, y) {
  const length = vecLen(x, y);
  return length === 0 ? [0, 0] : [x / length, y / length];
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function rectsCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleRectCollide(cx, cy, cr, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nx;
  const dy = cy - ny;

  return { hit: dx * dx + dy * dy <= cr * cr, dx, dy };
}

export function resolveCircleRect(cx, cy, cr, vx, vy, rect) {
  const { hit, dx, dy } = circleRectCollide(cx, cy, cr, rect);
  if (!hit) return { cx, cy, vx, vy };

  const distance = Math.hypot(dx, dy);
  let nxDir;
  let nyDir;

  if (distance === 0) {
    const left = Math.abs(cx - rect.x);
    const right = Math.abs(rect.x + rect.w - cx);
    const top = Math.abs(cy - rect.y);
    const bottom = Math.abs(rect.y + rect.h - cy);
    const minSide = Math.min(left, right, top, bottom);

    if (minSide === left) {
      nxDir = -1;
      nyDir = 0;
    } else if (minSide === right) {
      nxDir = 1;
      nyDir = 0;
    } else if (minSide === top) {
      nxDir = 0;
      nyDir = -1;
    } else {
      nxDir = 0;
      nyDir = 1;
    }

    cx += nxDir * cr;
    cy += nyDir * cr;

    if (nxDir !== 0) vx *= -0.3;
    if (nyDir !== 0) vy *= -0.3;
    return { cx, cy, vx, vy };
  }

  nxDir = dx / distance;
  nyDir = dy / distance;
  cx += nxDir * (cr - distance);
  cy += nyDir * (cr - distance);

  const vn = vx * nxDir + vy * nyDir;
  if (vn < 0) {
    vx -= 1.3 * vn * nxDir;
    vy -= 1.3 * vn * nyDir;
    vx *= 0.75;
    vy *= 0.75;
  }

  return { cx, cy, vx, vy };
}

export function rectRectResolve(moving, vx, vy, solid) {
  if (!rectsCollide(moving, solid)) return { r: moving, vx, vy };

  if (vx > 0) {
    moving.x = solid.x - moving.w;
    vx *= -0.2;
  } else if (vx < 0) {
    moving.x = solid.x + solid.w;
    vx *= -0.2;
  }

  if (rectsCollide(moving, solid)) {
    if (vy > 0) {
      moving.y = solid.y - moving.h;
      vy *= -0.2;
    } else if (vy < 0) {
      moving.y = solid.y + solid.h;
      vy *= -0.2;
    }
  }

  return { r: moving, vx, vy };
}

export function circleCircleResolve(cx, cy, cr, vx, vy, ox, oy, orad) {
  const dx = cx - ox;
  const dy = cy - oy;
  const distance = Math.hypot(dx, dy);

  if (distance < cr + orad) {
    const [nx, ny] = distance === 0 ? [1, 0] : [dx / distance, dy / distance];
    cx += nx * (cr + orad - distance);
    cy += ny * (cr + orad - distance);

    const vn = vx * nx + vy * ny;
    if (vn < 0) {
      vx -= 1.3 * vn * nx;
      vy -= 1.3 * vn * ny;
      vx *= 0.75;
      vy *= 0.75;
    }
  }

  return { cx, cy, vx, vy };
}

export function resolveCharCircle(cx, cy, cw, ch, vx, vy, ox, oy, orad) {
  const closestX = clamp(ox, cx, cx + cw);
  const closestY = clamp(oy, cy, cy + ch);
  const dx = closestX - ox;
  const dy = closestY - oy;
  const distance = Math.hypot(dx, dy);

  if (distance < orad) {
    const [nx, ny] = distance === 0 ? [1, 0] : [dx / distance, dy / distance];
    cx += nx * (orad - distance);
    cy += ny * (orad - distance);

    const vn = vx * nx + vy * ny;
    if (vn < 0) {
      vx -= 1.3 * vn * nx;
      vy -= 1.3 * vn * ny;
      vx *= 0.75;
      vy *= 0.75;
    }
  }

  return { cx, cy, vx, vy };
}
