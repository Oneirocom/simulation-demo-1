export default ComponentsKeys => {
  const Systems = {}
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

  return Systems;
};
