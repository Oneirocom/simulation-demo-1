const Systems = {};
const Components = {};
const ComponentsKeys = {
  DESCRIBE: "DESCRIBE",
  CONTAINS: "CONTAINS",
  NEEDS: "NEEDS"
};
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

Systems.describe = (entities, id) => {
  let description = entities.get(id).get(ComponentsKeys.DESCRIBE);
  if (description.silent) return "";

  let contents = [...Systems.contents(entities, id).keys()].map(
    Systems.describe.bind(null, entities)
  );
  if (contents.length) contents = ["which has", ...contents];
  return [description.name, ...contents].join("\n");
};

Systems.contents = (entities, id) => {
  return entities.get(id).get(ComponentsKeys.CONTAINS) || new Set();
};

Systems.needs = {
  needsHierarchy: ["exposure", "hunger", "companionship"],
  threshold: 3,
  status: function(entities, id) {
    let c = entities.get(id).get(ComponentsKeys.NEEDS);
    let currentSituation = [...this.needsHierarchy]
      .map(k => [k, c[k]])
      .find(([k, v]) => v > this.threshold);
    return currentSituation || ["none", 0];
  }
};

Components.describe = v => [ComponentsKeys.DESCRIBE, v];
Components.contains = v => [ComponentsKeys.CONTAINS, new Set(v)];
Components.needs = v => [ComponentsKeys.NEEDS, v];

export default { Systems, Components, init };

Object.prototype.inspect = function() {
  console.log(this);
  return this;
};
