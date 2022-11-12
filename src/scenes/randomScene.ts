import * as ex from "excalibur";
import Constants from "../constants";
import * as Systems from "../ecs/systems";
import * as Components from "../ecs/components";
import npcBT from "../behaviourTree/npc-bt";

/**
 * Optimization to performantly query elements by tags/components
 * Statful and updated via observers as world changes
 * Currently relied on by the BTs
 */
const buildQueries = (world) => ({
  heatSources: world.queryManager.createQuery([Constants.HEATSOURCE]),
  // TODO instead of needing to resource type tags, would be better to just
  // query ResourceProviderComponent and have BT search them for one that has
  // the desired resource
  combustibleResource: world.queryManager.createQuery([
    Constants.COMBUSTIBLE_RESOURCE,
  ]),
  edibleResource: world.queryManager.createQuery([Constants.EDIBLE_RESOURCE]),
  describables: world.queryManager.createQuery([Constants.DESCRIBABLE]),
});

///////////// ENTITY PREFAB BUILDERS ////////////////

const makeNpc = (name, pos, needs) => {
  const actor = new ex.Actor({
    name: name,
    pos: pos,
    vel: ex.Vector.Zero,
    color: ex.Color.fromHex(rand.pickOne(colorScheme)),
    radius: 20,
    collisionType: ex.CollisionType.Active,
  });

  actor
    .addComponent(new Components.NeedsComponent(needs))
    .addComponent(new Components.CollectorComponent())
    .addComponent(new Components.BTComponent(npcBT))
    .addComponent(new Components.ProximityComponent())
    .addComponent(new Components.SpellComponent('character-generator'))
    .addTag(Constants.DESCRIBABLE);

  actor.on("precollision", function (ev) {
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

const makeFirePit = (pos) =>
  new ex.Actor({
    name: "firePit",
    pos: pos,
    width: 50,
    height: 50,
    color: ex.Color.fromHex(rand.pickOne(colorScheme)),
    collisionType: ex.CollisionType.Fixed,
  })
    .addComponent(
      new Components.HeatSourceComponent(rand.pickOne([0, 0, 0, 3]))
    )
    .addComponent(new Components.SpellComponent('object-generator'))
    .addTag(Constants.DESCRIBABLE);

export const makeResourceProvider = (pos, i) => {
  const actor = new ex.Actor({
    name: "forest",
    pos: pos,
    radius: rand.integer(20, 70),
    color: ex.Color.fromHex(rand.pickOne(colorScheme)),
    collisionType: ex.CollisionType.Fixed,
  }).addTag(Constants.DESCRIBABLE);

  const resources = [];
  // ensure at least 1 resource provider has food and wood
  if (i === 0 || rand.bool(0.3)) {
    resources.push({
      name: "Food",
      tag: Constants.EDIBLE,
      color: ex.Color.fromHex(rand.pickOne(colorScheme)),
    });
    actor.addTag(Constants.EDIBLE_RESOURCE);
  }
  if (i === 0 || rand.bool(0.8)) {
    resources.push({
      name: "Wood",
      tag: Constants.COMBUSTIBLE,
      color: ex.Color.fromHex(rand.pickOne(colorScheme)),
    });
    actor.addTag(Constants.COMBUSTIBLE_RESOURCE);
  }
  actor.addComponent(new Components.ResourceProviderComponent(resources))
  .addComponent(new Components.SpellComponent('object-generator'))
  return actor;
};

////////// RAND HELPERS ///////////

// lock the seed if desired
// sparse seed 1667946673875
// fuller seed 1667947499766
// spread out seed 1667946609610
// good hunger first example 1668001137456
const seed = parseInt(Date.now().toString());
const rand = new ex.Random(seed);
console.log("Using random seed", seed);

/**
 * Randomly place an entity within the game bounds
 * coverageFromCenter of 0 will be at exact game center, 1 could be placed anywhere on screen, even at an edge
 */
function randomPosition(game: ex.Engine, coverageFromCenter = 1) {
  return ex.vec(
    game.halfDrawWidth +
      rand.integer(
        -game.halfDrawWidth * coverageFromCenter,
        game.halfDrawWidth * coverageFromCenter
      ),
    game.halfDrawHeight +
      rand.integer(
        -game.halfDrawHeight * coverageFromCenter,
        game.halfDrawHeight * coverageFromCenter
      )
  );
}

function repeat(number: number, fn: (i: number) => void): void {
  Array.from({ length: number }, (_k, v) => fn(v));
}

// from https://www.colourlovers.com/palettes
const colorScheme = rand.pickOne([
  ["#EBDBB2", "#FB4934", "#FE8019", "#B8BB26", "#282828"],
  ["#5C3723", "#D63A3E", "#E47F2D", "#EDDDAA", "#69B4B2"],
  ["#B9D886", "#C0ED9C", "#657709", "#524414", "#2B1C0F"],
  ["#8E4137", "#CF8B4A", "#EA9957", "#90953B", "#587650"],
]);

export class RandomScene extends ex.Scene {
  name = "randomScene";

  queries;

  public onInitialize(game: ex.Engine) {
    this.queries = buildQueries(this.world);
    this.world.add(new Systems.NeedsSystem());
    this.world.add(new Systems.CollectorSystem());
    this.world.add(new Systems.SeekSystem());
    this.world.add(new Systems.ProximitySystem());
    this.world.add(new Systems.ResourceProviderSystem());
    this.world.add(new Systems.HeatSourceSystem());
    this.world.add(new Systems.BTSystem({ queries: this.queries }));

    repeat(rand.integer(1, 3), () =>
      this.add(makeFirePit(randomPosition(game)))
    );

    repeat(rand.integer(1, 10), (i) => {
      this.add(makeResourceProvider(randomPosition(game), i));
    });

    repeat(3, (_i) => {
      const npc1 = makeNpc("npc1", randomPosition(game, 0.2), {
        exposure: rand.integer(0, 10),
        hunger: rand.integer(0, 10),
      });
      this.add(npc1);
    });
  }
}
