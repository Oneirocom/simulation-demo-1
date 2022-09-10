const systems = {};
const Components = {
  DESCRIBE: "DESCRIBE",
  CONTAINS: "CONTAINS"
};
const entitiesWithComponent = new Map();

function init(startingScene) {
  const scene = new Map();
  Object.entries(startingScene).forEach(([id, components]) => {
    scene.set(id, new Map());
    Object.entries(components).forEach(([k, v]) =>
      addComponent(scene, id, k, v)
    );
  });
  return scene;
}
function addComponent(scene, id, key, values) {
  entitiesWithComponent.set(
    key,
    (entitiesWithComponent.get(key) || new Set()).add(id)
  );

  return scene.set(id, scene.get(id).set(key, values));
}

systems.describe = (entities, id) => {
  let description = entities.get(id).get(Components.DESCRIBE);
  if (description.silent) return "";

  let contents = [...systems.contents(entities, id).keys()].map(
    systems.describe.bind(null, entities)
  );
  if (contents.length) contents = ["which has", ...contents];
  return [description.name, ...contents].join("\n");
};

systems.contents = (entities, id) => {
  return entities.get(id).get(Components.CONTAINS) || new Set();
};

export default { systems, Components, init };

Object.prototype.inspect = function() {
  console.log(this);
  return this;
};
