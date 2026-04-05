import { scene, viewport, groundHeightAt } from "./state.js";

const { Bodies } = window.Matter;

export function createTerrainBodies() {
  const terrainBodies = [];
  let previousX = -160;
  let previousY = groundHeightAt(0);

  for (let x = 0; x <= scene.width + 180; x += 68) {
    const y = groundHeightAt(x);
    const centerX = (previousX + x) * 0.5;
    const centerY = (previousY + y) * 0.5;
    const length = Math.hypot(x - previousX, y - previousY);
    const angle = Math.atan2(y - previousY, x - previousX);

    terrainBodies.push(
      Bodies.rectangle(centerX, centerY + 20, length + 8, 40, {
        isStatic: true,
        angle,
        label: "ground",
        friction: 1.3,
        frictionStatic: 2.8,
        render: { visible: false },
      })
    );

    previousX = x;
    previousY = y;
  }

  terrainBodies.push(
    Bodies.rectangle(scene.width * 0.5, viewport.height + 180, scene.width + 900, 280, {
      isStatic: true,
      label: "ground",
      render: { visible: false },
    }),
    Bodies.rectangle(-120, viewport.height * 0.5, 240, viewport.height * 2, {
      isStatic: true,
      label: "wall",
      render: { visible: false },
    }),
    Bodies.rectangle(scene.width + 120, viewport.height * 0.5, 240, viewport.height * 2, {
      isStatic: true,
      label: "wall",
      render: { visible: false },
    })
  );

  return terrainBodies;
}
