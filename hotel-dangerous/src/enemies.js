import { scene, state, enemyTemplates, groundHeightAt } from "./state.js";

const { Bodies, Body, Composite } = window.Matter;

export function createEnemies(engine) {
  const minX = 310;
  const maxX = Math.max(minX + 240, scene.goalX - 170);
  const patrolMinX = minX + (maxX - minX) * 0.25;
  const patrolMaxX = minX + (maxX - minX) * 0.75;

  scene.enemies = enemyTemplates.map((entry, index) => {
    const x = patrolMaxX;
    const collisionRadius = entry.radius * 1.7;
    const body = Bodies.circle(x, groundHeightAt(x) - collisionRadius, collisionRadius, {
      isStatic: true,
      isSensor: true,
      label: `enemy/${index}`,
      render: { visible: false },
    });

    Composite.add(engine.world, body);

    return {
      ...entry,
      x,
      body,
      collapsed: false,
      patrolMinX,
      patrolMaxX,
      patrolDir: -1,
      flip: false,
    };
  });
}

export function collapseEnemy(enemy, playerBody) {
  if (enemy.collapsed) {
    return;
  }

  enemy.collapsed = true;
  // Note: the body is removed from the world by the caller or here
  // We keep it simple and just mark as collapsed
  const vel = playerBody.velocity;
  const speed = Math.hypot(vel.x, vel.y);
  const kickStrength = Math.max(speed * 80, 300);
  const dx = enemy.body.position.x - playerBody.position.x;
  const dist = Math.abs(dx) || 1;

  enemy.flyX = enemy.body.position.x;
  enemy.flyY = enemy.body.position.y;
  enemy.flyVx = (dx / dist) * kickStrength * 0.5 + vel.x * 20;
  enemy.flyVy = -kickStrength;
  enemy.flyRotation = 0;
  enemy.flyAngularVel = (Math.random() - 0.5) * 0.15;
  enemy.flewAt = state.worldTime;
}

export function updateFlyingEnemies(dtMs) {
  const dt = dtMs / 1000;
  const gravity = 800;
  for (const enemy of scene.enemies) {
    if (!enemy.collapsed || enemy.flyX === undefined) continue;
    enemy.flyVy += gravity * dt;
    enemy.flyX += enemy.flyVx * dt;
    enemy.flyY += enemy.flyVy * dt;
    enemy.flyRotation += enemy.flyAngularVel;
  }
}

export function updateEnemyPatrol(dtMs) {
  const dt = dtMs / 1000;
  for (const enemy of scene.enemies) {
    if (enemy.collapsed || !enemy.patrolSpeed) continue;
    const speed = enemy.patrolSpeed * enemy.patrolDir;
    const newX = enemy.body.position.x + speed * dt;
    if (newX >= enemy.patrolMaxX) {
      enemy.patrolDir = -1;
    } else if (newX <= enemy.patrolMinX) {
      enemy.patrolDir = 1;
    }
    enemy.flip = enemy.patrolDir > 0;
    const groundY = groundHeightAt(newX);
    const collisionRadius = enemy.radius * 1.7;
    Body.setPosition(enemy.body, { x: newX, y: groundY - collisionRadius });
  }
}
