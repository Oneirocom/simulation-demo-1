import * as ECS from "./ecs.js";
import BT from "../bt.js";
const Systems = {};
export default Systems;

Systems.describe = id => {
  let description = ECS.entity(id).get("Describe");
  if (description.silent) return "";

  let contents = [...Systems.contents(id).keys()].map(Systems.describe);
  if (contents.length) contents = ["which has", ...contents];
  return [description.name, ...contents].join("\n");
};

Systems.contents = id => {
  return ECS.entity(id).get("Contains") || new Set();
};

Systems.needs = {
  needsHierarchy: ["exposure", "hunger", "companionship"],
  threshold: 3,
  status: function(id) {
    let c = ECS.entity(id).get("Needs");
    let currentSituation = [...this.needsHierarchy]
      .map(k => [k, c[k]])
      .find(([k, v]) => v > this.threshold);
    return currentSituation || ["none", 0];
  }
};

Systems.logic = {
  run(blackboard, id) {
    const bt = ECS.entity(id).get("BehaviorTree");
    return BT.run(bt, blackboard);
  }
};
