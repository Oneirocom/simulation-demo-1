import { action, node } from "./bt";
import * as Components from "../ecs/components";
import * as Systems from "../ecs/systems";
import Constants from "../constants";

//
/////////// NPC BT //////////////
//

export const actions = {
  SEEK_FOOD: ({ entity, target }) => ({
    key: "SEEK_FOOD",
    description: "find something to eat",
    fn: seekActionFn(entity, target, Constants.EDIBLE),
  }),
  SEEK_WARMTH: ({ entity, target }) => ({
    key: "SEEK_WARMTH",
    description: "get warm",
    fn: seekActionFn(entity, target, null),
  }),
  SEEK_HEAT_SOURCE: ({ entity, target }) => ({
    key: "SEEk_HEAT_SOURCE",
    description: "find a place to make a fire",
    fn: seekActionFn(entity, target, null),
  }),
  SEEK_COMBUSTIBLE: ({ entity, target }) => ({
    key: "SEEK_COMBUSTIBLE",
    description: "find something to burn",
    fn: seekActionFn(entity, target, Constants.COMBUSTIBLE),
  }),
  BUILD_FIRE: (bb) => ({
    key: "BUILD_FIRE",
    description: "make a fire",
    fn: (done) => {
      // TODO super ugly, but works
      const foundHeatSource = [...(bb.entity as ex.Entity).get(Components.ProximityComponent).nearBy].find(
        (e: ex.Entity) => e.has(Components.HeatSourceComponent)
      );
      foundHeatSource.get(Components.HeatSourceComponent).addFuel(5)
      Systems.CollectorSystem.removeInventory(bb.entity, Constants.COMBUSTIBLE);
      return done();
    },
  }),
};

function seekActionFn(entity: ex.Entity, target, desired_resource) {
  return (done) => {
    entity.removeComponent("seek", true);
    entity.addComponent(
      // todo have the speed on the entity so the character can set at what speed it does things.
      // Maybe faster speed will burn through more energy faster leading to hunger more quickly?
      new Components.SeekComponent({
        speed: 200,
        target,
        desired_resource,
        onHit: () => done(),
      })
    );
  };
}

// NOTE these actions rely on queries being set in the game and made availble via the bb!

const doNothing = action(() => ({
  key: "DO_NOTHING",
  description: "relax",
  fn: () => console.log("no actions"),
}));

/**
 * Predicate for a Node, attempts to find an entity by supplied query,
 * setting it as target in the blackboard if successful
 */
const locate = (
  query: ex.Query,
  bb: any,
  pred: (e: ex.Entity) => boolean = () => true
): boolean => {
  // NOTE scope to "visible" or "near by" entities via spatial graph / collision box
  // TODO would be better to look through ResourceProviderComponents for one with desired resource (see todo where query is defined)
  const found = query.getEntities().filter(pred);
  if (found.length) {
    const closestFirst = found.sort((a: ex.Actor, b: ex.Actor) =>
      a.pos.distance(bb.entity.pos) > b.pos.distance(bb.entity.pos) ? 1 : -1
    );
    bb.target = closestFirst[0];
    return true;
  } else {
    return false;
  }
};

// TODO this would be nicer with a proper BT with select and sequence nodes
const getWarmTree = [
  // if at heat source, enjoy
  node(
    ({ entity }) =>
      Systems.ProximitySystem.isNear(
        entity,
        Constants.HEATSOURCE,
        (e: ex.Entity) => e.get(Components.HeatSourceComponent).fuelLevel > 0
      ),
    [doNothing]
  ),
  // if fire source, go to it
  node(
    (bb) =>
      locate(
        bb.queries.heatSources,
        bb,
        (e: ex.Entity) => e.get(Components.HeatSourceComponent).fuelLevel > 0
      ),
    [action(actions.SEEK_WARMTH)]
  ),
  // else make fire if possible
  node(
    ({ entity }) =>
      Systems.CollectorSystem.hasInventory(entity, Constants.COMBUSTIBLE),
    [
      node(
        ({ entity }) =>
          Systems.ProximitySystem.isNear(entity, Constants.HEATSOURCE),
        [action(actions.BUILD_FIRE)]
      ),
      node(
        (bb) => locate(bb.queries.heatSources, bb),
        [action(actions.SEEK_HEAT_SOURCE)]
      ),
    ]
  ),
  node(
    (bb) => locate(bb.queries.combustibleResource, bb),
    [action(actions.SEEK_COMBUSTIBLE)]
  ),
];

const eatTree = [
  // eat food if you have it
  node(
    ({ entity }) =>
      Systems.CollectorSystem.hasInventory(entity, Constants.EDIBLE),
    [
      action((bb) => ({
        key: "eatFood",
        fn: (done) => {
          Systems.CollectorSystem.removeInventory(bb.entity, Constants.EDIBLE);
          bb.entity.get(Components.NeedsComponent).hunger = 0;
          return done();
        },
      })),
    ]
  ),
  // find food
  node(
    (bb) => locate(bb.queries.edibleResource, bb),
    [action(actions.SEEK_FOOD)]
  ),
];

export default [
  node(
    ({ entity }) =>
      Systems.NeedsSystem.status(entity.get(Components.NeedsComponent)).need ===
      "exposure",
    getWarmTree
  ),
  node(
    ({ entity }) =>
      Systems.NeedsSystem.status(entity.get(Components.NeedsComponent)).need ===
      "hunger",
    eatTree
  ),
  doNothing,
];
