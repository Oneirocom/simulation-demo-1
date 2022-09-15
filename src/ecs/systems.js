import * as ECS from "./ecs.js";
import BT from "../bt.js";
const Systems = {};
export default Systems;

Systems.describe = id => {
  let description = ECS.entity(id).get("Describe");
  if (description.silent) return "";

  let contents = Systems.placement
    .children(id)
    .map(Systems.describe)
    .filter(d => d !== "");
  if (contents.length) contents = ["which has", ...contents];
  return [description.name, ...contents].join("\n");
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

/**
 * Deals with one entity in another, like locations or inventory
 */
Systems.placement = {
  /**
   * Finds any entities with the provided query that are children of the
   * supplied entity.
   *
   * @param {string} owner - the containing entity id
   * @param {string[]} query - list of components
   * @return {string[]} matching entity ids
   */
  children(owner, query = []) {
    return ECS.query(["Parent", ...query]).filter(
      id => id && ECS.entity(id).get("Parent") === owner
    );
  }
};
