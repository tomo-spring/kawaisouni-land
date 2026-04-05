import { ASSETS } from "./assets.js";
import { clamp, normalizeAngle } from "./utils.js";
import { game, state, keys, groundHeightAt, legGroundState } from "./state.js";
import { sfx } from "./audio.js";

const { Bodies, Body, Composite, Constraint, Engine } = window.Matter;

export function markDrawable(body, key, width, height) {
  body.plugin.draw = { key, width, height };
  return body;
}

export function createPlayer() {
  const { engine } = game;
  const collisionGroup = Body.nextGroup(true);
  const baseX = 220;
  const legWidth = 34;
  const legHeight = 304;
  const torsoWidth = 126;
  const torsoHeight = 164;
  const headRadius = 30;
  const hipOffsetX = 26;
  const legHalfHeight = legHeight * 0.5;
  const leftFootX = baseX - hipOffsetX;
  const rightFootX = baseX + hipOffsetX;
  const leftFootY = groundHeightAt(leftFootX);
  const rightFootY = groundHeightAt(rightFootX);
  const torsoJointY = torsoHeight * 0.5 - torsoHeight / 5;
  const legJointY = -legHalfHeight;
  const torsoY = Math.min(leftFootY, rightFootY) - legHeight - torsoJointY;

  const common = {
    collisionFilter: { group: collisionGroup },
    restitution: 0,
  };

  const torsoCore = Bodies.rectangle(baseX, torsoY, torsoWidth, torsoHeight, {
    ...common,
    label: "player/torso",
    chamfer: { radius: 20 },
    density: 0.0017,
    inertia: Infinity,
    frictionAir: 0.02,
  });

  const torso = markDrawable(
    torsoCore,
    "torso",
    ASSETS.torso.drawWidth || torsoWidth,
    ASSETS.torso.drawHeight || torsoHeight
  );
  Body.setInertia(torso, Infinity);
  Body.setAngle(torso, 0);
  Body.setAngularVelocity(torso, 0);

  const leftLeg = markDrawable(
    Bodies.rectangle(leftFootX, leftFootY - legHalfHeight, legWidth, legHeight, {
      ...common,
      label: "player/left-leg",
      chamfer: { radius: 16 },
      density: 0.00132,
      friction: 1.55,
      frictionStatic: 3.1,
      frictionAir: 0.028,
    }),
    "legRear",
    ASSETS.legRear.drawWidth || legWidth,
    ASSETS.legRear.drawHeight || legHeight
  );

  const rightLeg = markDrawable(
    Bodies.rectangle(rightFootX, rightFootY - legHalfHeight, legWidth, legHeight, {
      ...common,
      label: "player/right-leg",
      chamfer: { radius: 16 },
      density: 0.00132,
      friction: 1.55,
      frictionStatic: 3.1,
      frictionAir: 0.028,
    }),
    "legFront",
    ASSETS.legFront.drawWidth || legWidth,
    ASSETS.legFront.drawHeight || legHeight
  );

  const constraints = [
    Constraint.create({
      bodyA: torso,
      pointA: { x: -hipOffsetX, y: torsoJointY },
      bodyB: leftLeg,
      pointB: { x: 0, y: legJointY },
      stiffness: 0.985,
      damping: 0.2,
      length: 0,
    }),
    Constraint.create({
      bodyA: torso,
      pointA: { x: hipOffsetX, y: torsoJointY },
      bodyB: rightLeg,
      pointB: { x: 0, y: legJointY },
      stiffness: 0.985,
      damping: 0.2,
      length: 0,
    }),
  ];

  Composite.add(engine.world, [
    torso,
    leftLeg,
    rightLeg,
    ...constraints,
  ]);

  return {
    torso,
    head: {
      radius: headRadius,
      localX: 0,
      localY: -145,
    },
    bodies: [torso, leftLeg, rightLeg],
    legs: [
      {
        side: "rear",
        leg: leftLeg,
        controlSign: 1,
        motorAngle: 0,
        idleAngle: 0,
        unwrappedAngle: 0,
        lastWrappedAngle: 0,
        rotationSpeed: 0.052,
      },
      {
        side: "front",
        leg: rightLeg,
        controlSign: -1,
        motorAngle: 0,
        idleAngle: 0,
        unwrappedAngle: 0,
        lastWrappedAngle: 0,
        rotationSpeed: 0.052,
      },
    ],
  };
}

export function getLegTip(body) {
  const halfHeight = body.plugin.draw.height * 0.5 - 4;
  return {
    x: body.position.x - Math.sin(body.angle) * halfHeight,
    y: body.position.y + Math.cos(body.angle) * halfHeight,
  };
}

export function getHeadPose() {
  const { player } = game;
  const cos = Math.cos(player.torso.angle);
  const sin = Math.sin(player.torso.angle);
  const { localX, localY, radius } = player.head;
  return {
    x: player.torso.position.x + localX * cos - localY * sin,
    y: player.torso.position.y + localX * sin + localY * cos,
    angle: player.torso.angle,
    radius,
  };
}

export function isLegGrounded(legBody) {
  const tip = getLegTip(legBody);
  const floor = groundHeightAt(tip.x);
  return tip.y >= floor - 8 && Math.abs(legBody.velocity.y) < 3.2;
}

function applyRelativeAngleMotor(parent, child, currentAngle, targetAngle, stiffness, damping, maxDelta) {
  const relativeVelocity = child.angularVelocity - parent.angularVelocity;
  const correction = clamp(
    (targetAngle - currentAngle) * stiffness - relativeVelocity * damping,
    -maxDelta,
    maxDelta
  );

  Body.setAngularVelocity(child, child.angularVelocity + correction);
  if (Number.isFinite(parent.inertia)) {
    Body.setAngularVelocity(parent, parent.angularVelocity - correction * 0.25);
  }
}

function syncLegMotorState(leg, resetTarget = false) {
  const { player } = game;
  const wrappedAngle = normalizeAngle(leg.leg.angle - player.torso.angle);

  if (!Number.isFinite(leg.unwrappedAngle)) {
    leg.unwrappedAngle = wrappedAngle;
    leg.lastWrappedAngle = wrappedAngle;
    leg.motorAngle = wrappedAngle;
    leg.idleAngle = wrappedAngle;
    return;
  }

  leg.unwrappedAngle += normalizeAngle(wrappedAngle - leg.lastWrappedAngle);
  leg.lastWrappedAngle = wrappedAngle;

  if (resetTarget) {
    leg.motorAngle = leg.unwrappedAngle;
    leg.idleAngle = leg.unwrappedAngle;
  }
}

function controlLeg(leg, input) {
  const { player } = game;
  syncLegMotorState(leg);
  const grounded = isLegGrounded(leg.leg);
  const active = Math.abs(input) > 0.05;
  const motorBoost = grounded ? 1.04 : 0.9;

  if (state.mode === "ready") {
    leg.motorAngle += (leg.idleAngle - leg.motorAngle) * 0.18;
  } else if (active) {
    leg.motorAngle += input * leg.controlSign * leg.rotationSpeed;
  }

  if (active || state.mode === "ready") {
    applyRelativeAngleMotor(
      player.torso,
      leg.leg,
      leg.unwrappedAngle,
      leg.motorAngle,
      0.095 * motorBoost,
      0.16,
      0.08
    );
  }

  if (state.mode === "playing" && active) {
    const tip = getLegTip(leg.leg);
    if (grounded) {
      const driveForce = input * 0.00042;
      Body.applyForce(leg.leg, tip, { x: driveForce, y: 0 });
      Body.applyForce(player.torso, player.torso.position, {
        x: -driveForce * 0.45,
        y: 0,
      });
    } else {
      Body.applyForce(leg.leg, tip, {
        x: input * 0.0001,
        y: -0.00006,
      });
    }
  }
}

export function controlPlayer() {
  const { player } = game;
  if (state.mode === "lost" || state.mode === "won") {
    return;
  }

  const rearInput = keys.w ? 1 : keys.q ? -1 : 0;
  const frontInput = keys.p ? 1 : keys.o ? -1 : 0;

  if ((rearInput || frontInput) && state.mode === "ready") {
    state.mode = "playing";
    sfx("start");
  }

  // Footstep detection
  for (let i = 0; i < player.legs.length; i++) {
    const grounded = isLegGrounded(player.legs[i].leg);
    if (grounded && !legGroundState[i] && state.mode === "playing") {
      sfx("footstep");
    }
    legGroundState[i] = grounded;
  }

  for (const leg of player.legs) {
    const input = leg.side === "rear" ? rearInput : frontInput;
    controlLeg(leg, input);
  }

  Body.applyForce(player.torso, player.torso.position, {
    x: state.windForce * 0.00024,
    y: 0,
  });
}

export function lockTorsoRotation() {
  const { player } = game;
  Body.setAngle(player.torso, 0);
  Body.setAngularVelocity(player.torso, 0);
}

export function settleInitialPose() {
  const { engine, player } = game;
  for (let i = 0; i < 60; i += 1) {
    Engine.update(engine, 1000 / 60);
    lockTorsoRotation();
  }

  for (const leg of player.legs) {
    leg.unwrappedAngle = NaN;
    syncLegMotorState(leg, true);
  }

  for (const body of player.bodies) {
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
  }
  lockTorsoRotation();
}
