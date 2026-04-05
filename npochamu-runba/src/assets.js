import { config } from "./config.js";

const { IMAGE_NAMES } = config;

export function createAssets() {
  const images = {};

  function loadImages(callback) {
    if (IMAGE_NAMES.length === 0) {
      callback();
      return;
    }

    let loadedCount = 0;
    function done() {
      loadedCount += 1;
      if (loadedCount >= IMAGE_NAMES.length) callback();
    }

    for (const name of IMAGE_NAMES) {
      const img = new Image();
      img.onload = () => {
        images[name] = img;
        done();
      };
      img.onerror = done;
      img.src = "images/" + encodeURIComponent(name);
    }
  }

  return { images, loadImages };
}
