import { action, node } from "./bt";
import * as Components from "../ecs/components";
import * as Systems from "../ecs/systems";
import Constants from "../constants";

//
/////////// NPC BT //////////////
//

export const actions = {
  LOCATE_FOOD: ({entity, target}) => ({
    key: "LOCATE_FOOD",
    description: "find something to eat",
    fn: seekActionFn(entity, target),
  }),
  LOCATE_HEAT: ({entity, target}) => ({
    key: "LOCATE_HEAT",
    description: "get warm",
    fn: seekActionFn(entity, target),
  }),
  LOCATE_HEAT_ZONE: ({entity, target}) => ({
    key: "LOCATE_HEAT_ZONE",
    description: "find a place to make a fire",
    fn: seekActionFn(entity, target),
  }),
  LOCATE_COMBUSTIBLE: ({entity, target}) => ({
    key: "LOCATE_COMBUSTIBLE",
    description: "find something to burn",
    fn: seekActionFn(entity, target),
  }),
};

function seekActionFn(entity, target) {
  return (done) => {
    entity.addComponent(
      // todo have the speed on the entity so the character can set at what speed it does things.
      // Maybe faster speed will burn through more energy faster leading to hunger more quickly?
      new Components.SeekComponent({
        speed: 200,
        target,
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
const locate = (query: ex.Query, bb: any): boolean => {
  // NOTE scope to "visible" or "near by" entities via spatial graph / collision box
  const found = query.getEntities();
  if (found.length) {
    // TODO could choose randomly or closest, etc
    bb.target = found[0];
    return true;
  } else {
    return false;
  }
};

// TODO this would be nicer with a proper BT with select and sequence nodes
const getWarmTree = [
  // if at heat source, enjoy
  node(
    ({ entity }) => Systems.SeekSystem.isNear(entity, Constants.HEATSOURCE),
    [doNothing]
  ),
  // if heat source, go to it
  node(
    (bb) => locate(bb.queries.heatSources, bb),
    [action(actions.LOCATE_HEAT)]
  ),
  // else make fire if possible
  node(
    ({ entity }) =>
      Systems.CollectorSystem.hasInventory(entity, Constants.COMBUSTIBLE),
    [
      node(
        ({ entity }) => Systems.SeekSystem.isNear(entity, Constants.FIRE_ZONE),
        [
          action((bb) => ({
            key: "buildfire",
            fn: (done) => {
              Systems.CollectorSystem.removeInventory(
                bb.entity,
                Constants.COMBUSTIBLE
              );
              // TODO this is ugly, separate out actions, and return data commands to run those actions
              bb.makeCampFire();
              return done();
            },
          })),
        ]
      ),
      node((bb) => locate(bb.queries.fireZones, bb), [action(actions.LOCATE_HEAT_ZONE)]),
    ]
  ),
  node(
    (bb) => locate(bb.queries.combustibleResource, bb),
    [action(actions.LOCATE_COMBUSTIBLE)]
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
    [action(actions.LOCATE_FOOD)]
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
