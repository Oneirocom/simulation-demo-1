import BT from "./bt";
import * as ex from "excalibur";

const game = new ex.Engine({
  displayMode: ex.DisplayMode.FillScreen,
  backgroundColor: ex.Color.Viridian,
});

const Constants = {
  HEATSOURCE: "heatSource",
  COMBUSTIBLE: "combustible",
  COMBUSTIBLE_RESOURCE: "combustibleResource",
  EDIBLE_RESOURCE: "edibleResource",
  EDIBLE: "edible",
  FIRE_ZONE: "fireZone",
};

/**
 * Optimization to performantly query elements by tags/components
 * Statful and updated via observers as world changes
 */
const queries = {
  heatSources: game.currentScene.world.queryManager.createQuery([
    Constants.HEATSOURCE,
  ]),
  fireZones: game.currentScene.world.queryManager.createQuery([
    Constants.FIRE_ZONE,
  ]),
  combustibleResource: game.currentScene.world.queryManager.createQuery([
    Constants.COMBUSTIBLE_RESOURCE,
  ]),
  edibleResource: game.currentScene.world.queryManager.createQuery([
    Constants.EDIBLE_RESOURCE,
  ]),
};
//
/////////// COMPONENTS //////////////
//

/**
 * This component adds the concept of "inventory"
 * This inventory gets filled with the objects from bumping into ResourceComponent entities.
 * In this case they are just objects with a name and color to render and a list of tags.
 *
 * TODO consider having the reource be factory function so the inventory can contain
 * complete entities that can be inspected via their components rather than names.
 */
class CollectorComponent extends ex.Component {
  type = "collector";
  inventory: Set<unknown>;
  constructor() {
    super();
    this.inventory = new Set();
  }

  // TODO instead of event listeners, add a component that has collision data on it
  onAdd(e: ex.Entity) {
    e.on("collisionstart", (ev) => {
      if (ev.other.get(ResourceComponent))
        this.inventory.add(ev.other.get(ResourceComponent).resource);
    });
  }

  // TODO clean up with onRemove (no reason to remove it for now though)
}

/**
 * "Resources" are objects of any kind and can be used in any way
 */
class ResourceComponent extends ex.Component {
  type = "resource";
  resource: any;
  constructor(resource: any) {
    super();
    this.resource = resource;
  }
}

/**
 * Wip capturing "touching", should be better thought out
 */
class ProximityComponent extends ex.Component {
  public readonly type = "proximity";
  public touching: Set<ex.Entity> = new Set();
  constructor() {
    super();
    this.touching = new Set();
  }

  // BUG: when the fire goes away while you are near it and you still have wood, touching never gets unset
  onAdd(e: ex.Entity): void {
    e.on("collisionstart", function (ev) {
      ev.target.get(ProximityComponent).touching.add(ev.other);
    });
    e.on("collisionend", function (ev) {
      ev.target.get(ProximityComponent).touching.delete(ev.other);
    });
  }
}
class NeedsComponent extends ex.Component {
  type = "needs";
  constructor(init: { hunger: number; exposure: number }) {
    super();
    Object.assign(this, init);
  }
}

class BTComponent extends ex.Component {
  type = "BT";
  bt: any;
  currentAction: null;
  /**
   * BT action nodes should return type {key: string, fn: () => any}
   * The key should be unique across actions and is used as the current action
   */
  constructor(bt: (BT.Action | BT.Node)[]) {
    super();
    this.bt = bt;
    this.currentAction = null;
  }
}

/**
 * Makes an entity move towoards a target
 * onHit gets called on arrival
 */
class SeekComponent extends ex.Component {
  type = "seek";
  speed: number;
  target: ex.Actor;
  onHit: () => void;

  constructor({
    speed,
    target,
    onHit,
  }: {
    speed: number;
    target: ex.Actor;
    onHit: () => void;
  }) {
    super();
    this.speed = speed;
    this.target = target;
    this.onHit = onHit;
  }
}
//
/////////// SYSTEMS //////////////
//

/**
 * Constantly attempts to move entity towards target
 */
class SeekSystem extends ex.System {
  types = ["seek"];
  priority = 10;
  systemType = ex.SystemType.Update;

  elapsedTime = 0;

  update(entities: ex.Actor[], delta: number) {
    this.elapsedTime += delta;
    if (this.elapsedTime < 100) return;
    this.elapsedTime = 0;

    for (let entity of entities) {
      const seek = entity.get(SeekComponent);
      const found = isNear(entity, seek?.target);

      if (found) {
        entity.vel = ex.Vector.Zero;
        seek?.onHit();
        // NOTE force remove in case other system wants to add a new seek in same frame
        // Hopefully this shouldn't cause any issues since other systems don't use this component (currently)
        // Might still have an issue with ordering though if adding a seek happens before current seek is removed?
        entity.removeComponent("seek", true);
      } else {
        entity.vel =
          seek?.target.pos ||
          entity.vel
            .sub(entity.pos)
            .normalize()
            .scale(seek?.speed || 1);
      }
    }
  }
}

/**
 * Renders inventory items as colored discs near NPC "owner"
 */
class CollectorSystem extends ex.System {
  types = ["collector"];
  priority = 99;
  systemType = ex.SystemType.Draw;
  ctx!: ex.ExcaliburGraphicsContext;

  /**
   * Test if provided entity has an inventory item with a given tag
   * @param {entity} entity
   * @param {string} tag
   * @return {boolean}
   */
  static hasInventory(entity, tag) {
    return !![...entity.get(CollectorComponent).inventory.values()].find(
      (resource) => resource.tags.includes(tag)
    );
  }

  /**
   * Removes inventory item with tag, if any found, if multiple found removes first one
   */
  static removeInventory(entity, tag) {
    let found = [...entity.get(CollectorComponent).inventory.values()].find(
      (resource) => resource.tags.includes(tag)
    );
    if (found) entity.get(CollectorComponent).inventory.delete(found);
  }

  initialize(scene: ex.Scene) {
    this.ctx = scene.engine.graphicsContext;
  }

  update(entities, _delta) {
    for (const entity of entities) {
      this.ctx.save();
      let i = 0;
      entity.get(CollectorComponent).inventory.forEach((resource) => {
        this.ctx.drawCircle(
          entity.pos.add(ex.Vector.Right.scale(entity.width + 20 * i++)),
          8,
          resource.color
        );
      });
      this.ctx.restore();
    }
  }
}

/**
 * Hierarchy of needs that get ticked each frame based on context
 */
class NeedsSystem extends ex.System {
  types = ["needs"];
  priority = 99;
  systemType = ex.SystemType.Update;

  hungerRate = 0.5 / 1;
  exposureRate = 1 / 2;

  static threshold = 3;
  // TODO use enum instead of strings
  static needsHierarchy = ["exposure", "hunger"];
  ctx!: ex.ExcaliburGraphicsContext;

  /**
   * Finds the need that is above the threshold that has the highest priority
   */
  static status(needs) {
    return (
      [...NeedsSystem.needsHierarchy]
        .map((k) => ({ need: k, degree: needs[k] }))
        .find(({ degree }) => degree > this.threshold) || {
        need: "none",
        degree: 0,
      }
    );
  }

  descriptions = {
    exposure: "cold",
    hunger: "hungry",
    none: "fine",
  };

  statusToString = ({ need, degree }) =>
    "Feeling " + (degree >= 5 ? "very " : " ") + this.descriptions[need];

  initialize(scene: ex.Scene) {
    this.ctx = scene.engine.graphicsContext;
  }
  update(entities, delta) {
    for (let entity of entities) {
      entity.get(NeedsComponent).hunger += (this.hungerRate * delta) / 1000;
      let foundHeatsource = isNear(entity, Constants.HEATSOURCE);
      if (foundHeatsource) {
        entity.get(NeedsComponent).exposure = 0;
      } else {
        entity.get(NeedsComponent).exposure +=
          (this.exposureRate * delta) / 1000;
      }

      // TODO this is brittle, but works for now
      const label = entity.children[0];
      label.text = this.statusToString(
        NeedsSystem.status(entity.get(NeedsComponent))
      );
    }
  }
}

/**
 * Interruptable BT, won't trigger an action that is already running, but might replace it.
 *
 * Calls the action fn with a callback you _must_ call when the action finishes
 * to clear the current action
 *
 * Runs every second
 *
 * only works on "NPCs" (BT, needs, and collector components)
 */
class BTSystem extends ex.System {
  types = ["BT", "needs", "collector"];
  priority = 10;
  systemType = ex.SystemType.Update;

  onDone = (entity) => (entity.get(BTComponent).currentAction = null);

  elapsedTime = 0;

  update(entities, delta) {
    this.elapsedTime += delta;
    if (this.elapsedTime < 1000) return;
    this.elapsedTime = 0;

    entities.forEach((e) => {
      let { key, fn } = BT.run(e.get(BTComponent).bt, { entity: e, delta });
      if (key !== e.get(BTComponent).currentAction) {
        fn(this.onDone.bind(this, e));
        console.debug(e.name, "New action:", key);
        e.get(BTComponent).currentAction = key;
      }
    });
  }
}

game.currentScene.world.add(new NeedsSystem());
game.currentScene.world.add(new CollectorSystem());
game.currentScene.world.add(new BTSystem());
game.currentScene.world.add(new SeekSystem());

//
/////////// BT //////////////
//

const doNothing = BT.action(() => ({
  key: "doNothing",
  fn: () => console.log("no actions"),
}));

/**
 * Relies on a `target` getting set on the blackboard
 */
const goToAction = (key) =>
  BT.action(({ entity, target }) => ({
    key: "go to " + key,
    fn: (done) => {
      entity.addComponent(
        new SeekComponent({ speed: 100, target, onHit: () => done() })
      );
    },
  }));

/**
 * Predicate for a BT.Node, attempts to find an entity by supplied query,
 * setting it as target in the blackboard if successful
 *
 * @param {query} query
 * @returns {(blackboard: any) => boolean}
 */
const locate = (query) => (bb) => {
  // NOTE scope to "visible" or "near by" entities via spatial graph / collision box
  let found = query.getEntities();
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
  BT.node(({ entity }) => isNear(entity, Constants.HEATSOURCE), [doNothing]),
  // if heat source, go to it
  BT.node(locate(queries.heatSources), [goToAction("heatsource")]),
  // else make fire if possible
  BT.node(
    ({ entity }) => CollectorSystem.hasInventory(entity, Constants.COMBUSTIBLE),
    [
      BT.node(
        ({ entity }) => isNear(entity, Constants.FIRE_ZONE),
        [
          BT.action((bb) => ({
            key: "buildfire",
            fn: (done) => {
              CollectorSystem.removeInventory(bb.entity, Constants.COMBUSTIBLE);
              makeCampFire();
              return done();
            },
          })),
        ]
      ),
      BT.node(locate(queries.fireZones), [goToAction("heatzone")]),
    ]
  ),
  BT.node(locate(queries.combustibleResource), [
    goToAction("combustibleResource"),
  ]),
];

const eatTree = [
  // eat food if you have it
  BT.node(
    ({ entity }) => CollectorSystem.hasInventory(entity, Constants.EDIBLE),
    [
      BT.action((bb) => ({
        key: "eatFood",
        fn: (done) => {
          CollectorSystem.removeInventory(bb.entity, Constants.EDIBLE);
          bb.entity.get(NeedsComponent).hunger = 0;
          return done();
        },
      })),
    ]
  ),
  // find food
  BT.node(locate(queries.edibleResource), [goToAction("edibleResource")]),
];

const npcBT = [
  BT.node(
    ({ entity }) =>
      NeedsSystem.status(entity.get(NeedsComponent)).need === "exposure",
    getWarmTree
  ),
  BT.node(
    ({ entity }) =>
      NeedsSystem.status(entity.get(NeedsComponent)).need === "hunger",
    eatTree
  ),
  doNothing,
];

//
/////////// ENTITIES //////////////
//

const makeNpc = (name, offset, needs) => {
  const actor = new ex.Actor({
    name: name,
    pos: ex.vec(game.drawWidth / 2, 100).add(offset),
    vel: ex.Vector.Zero,
    width: 30,
    height: 30,
    color: ex.Color.Red,
    collisionType: ex.CollisionType.Active,
  });

  actor
    .addComponent(new NeedsComponent(needs))
    .addComponent(new CollectorComponent())
    .addComponent(new BTComponent(npcBT))
    .addComponent(new ProximityComponent());

  actor.on("precollision", function (ev) {
    // nudge to prevent "getting stuck"
    // TODO this doesn't work that great...
    if (ev.target.vel.equals(ex.Vector.Zero)) return;

    const nudge = ev.target.pos
      .sub(ev.other.pos)
      .normalize()
      .perpendicular()
      .scale(2);
    ev.target.pos.addEqual(nudge);
  });

  const label = new ex.Label({
    text: name,
    pos: ex.vec(-50, -30),
    font: new ex.Font({ size: 16, unit: ex.FontUnit.Px }),
  });
  actor.addChild(label);

  return actor;
};

const npc1 = makeNpc("npc1", ex.vec(-20, 20), { exposure: 5, hunger: 9 });
const npc2 = makeNpc("npc2", ex.vec(20, 20), { exposure: 2, hunger: 2 });
const npc3 = makeNpc("npc3", ex.vec(0, -20), { exposure: 0, hunger: 5 });

/**
 * Check if entity is at an entity or an entity with the given tag
 */
function isNear(entity, targetOrTag) {
  return !![...entity.get(ProximityComponent).touching.values()].find(
    (e) => e === targetOrTag || e.hasTag(targetOrTag)
  );
}

const forest = new ex.Actor({
  name: "forest",
  pos: ex.vec(game.drawWidth / 4 / 2, game.drawHeight / 2),
  width: game.drawWidth / 4,
  height: game.drawHeight,
  color: ex.Color.Green,
  collisionType: ex.CollisionType.Fixed,
})
  .addComponent(
    new ResourceComponent({
      name: "Wood",
      tags: [Constants.COMBUSTIBLE],
      color: ex.Color.fromRGB(139, 69, 19),
    })
  )
  // NOTE some duplication here to make the locate by query BT helper simpler
  .addTag(Constants.COMBUSTIBLE_RESOURCE);

const field = new ex.Actor({
  name: "field",
  pos: ex.vec(game.drawWidth - game.drawWidth / 4 / 2, game.drawHeight / 2),
  width: game.drawWidth / 4,
  height: game.drawHeight,
  color: ex.Color.Yellow,
  collisionType: ex.CollisionType.Fixed,
})
  .addComponent(
    new ResourceComponent({
      name: "Food",
      tags: [Constants.EDIBLE],
      color: ex.Color.Green,
    })
  )
  .addTag(Constants.EDIBLE_RESOURCE);

const firePit = new ex.Actor({
  name: "firePit",
  pos: ex.vec(game.drawWidth / 2, (game.drawHeight * 2) / 3),
  width: 50,
  height: 50,
  color: ex.Color.Gray,
  collisionType: ex.CollisionType.Fixed,
});
firePit.addTag(Constants.FIRE_ZONE);

const fire = new ex.Actor({
  name: "campFire",
  pos: firePit.pos.clone(),
  width: 30,
  height: 30,
  color: ex.Color.Orange,
  collisionType: ex.CollisionType.Fixed,
  radius: 30,
}).addTag(Constants.HEATSOURCE);

const makeCampFire = () => {
  game.add(fire);
  setTimeout(() => fire.kill(), 4000);
};

game.add(forest);
game.add(field);
game.add(firePit);
game.add(npc1);
game.add(npc2);
game.add(npc3);

game.start();
