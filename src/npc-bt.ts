import {action, node } from "./bt";
import * as Components from "./ecs/components";
import * as Systems from "./ecs/systems";
import Constants from "./constants";

//
/////////// NPC BT //////////////
//

// NOTE these actions rely on queries being set in the game and made availble via the bb!

const doNothing = action(() => ({
  key: "doNothing",
  fn: () => console.log("no actions"),
}));

/**
 * Relies on a `target` getting set on the blackboard
 */
const goToAction = (key) =>
  action(({ entity, target }) => ({
    key: "go to " + key,
    fn: (done) => {
      entity.addComponent(
        // todo have the speed on the entity so the character can set at what speed it does things.
        // Maybe faster speed will burn through more energy faster leading to hunger more quickly?
        new Components.SeekComponent({
          speed: 200,
          target,
          onHit: () => done(),
        })
      );
    },
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
    [goToAction("heatsource")]
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
      node(
        (bb) => locate(bb.queries.fireZones, bb),
        [goToAction("heatzone")]
      ),
    ]
  ),
  node(
    (bb) => locate(bb.queries.combustibleResource, bb),
    [goToAction(Constants.COMBUSTIBLE_RESOURCE)]
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
    [goToAction("edibleResource")]
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
