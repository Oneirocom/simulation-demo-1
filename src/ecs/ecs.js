import { ComponentsKeys, Components } from "./components.js";
import sys from "./systems.js";
const Systems = sys(ComponentsKeys);

const entitiesWithComponent = new Map();

function init(startingScene) {
  const scene = new Map();
  Object.entries(startingScene).forEach(([id, components]) => {
    scene.set(id, new Map());
    components.forEach(addComponent.bind(null, scene, id));
  });
  return scene;
}
function addComponent(scene, id, [key, values]) {
  entitiesWithComponent.set(
    key,
    (entitiesWithComponent.get(key) || new Set()).add(id)
  );

  return scene.set(id, scene.get(id).set(key, values));
}

export default { Systems, Components, init };

Object.prototype.inspect = function() {
  console.log(this);
  return this;
};
