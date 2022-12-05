import * as ex from "excalibur";
import Constants from "../constants";
import * as Systems from "../ecs/systems";
import * as Components from "../ecs/components";
import npcBT from "../behaviourTree/npc-bt";
import { randomPosition, repeat, rand, colorScheme } from "../helpers";

/**
 * Optimization to performantly query elements by tags/components
 * Statful and updated via observers as world changes
 * Currently relied on by the BTs
 */

// todo unknown is not the proper typing for world.
const buildQueries = (
  world: ex.World<unknown>
): Record<string, ex.Query<ex.Component<string>>> => ({
  heatSources: world.queryManager.createQuery([Constants.HEATSOURCE]),
  // TODO instead of needing to resource type tags, would be better to just
  // query ResourceProviderComponent and have BT search them for one that has
  // the desired resource
  combustibleResource: world.queryManager.createQuery([
    Constants.COMBUSTIBLE_RESOURCE,
  ]),
  edibleResource: world.queryManager.createQuery([Constants.EDIBLE_RESOURCE]),
  describables: world.queryManager.createQuery([Constants.DESCRIBECOMPONENT]),
  narrator: world.queryManager.createQuery([Constants.NARRATOR]),
});

///////////// ENTITY PREFAB BUILDERS ////////////////

const makeNpc = (name, pos, needs, narrator = false) => {
  const actor = new ex.Actor({
    name: name,
    pos: pos,
    vel: ex.Vector.Zero,
    color: narrator
      ? ex.Color.White
      : ex.Color.fromHex(rand.pickOne(colorScheme)),
    radius: narrator ? 20 : 15,
    collisionType: ex.CollisionType.Active,
  });

  actor
    .addComponent(new Components.NeedsComponent(needs))
    .addComponent(new Components.CollectorComponent())
    .addComponent(new Components.BTComponent(npcBT))
    .addComponent(new Components.ProximityComponent())
    .addComponent(new Components.GeneratorComponent("character-generator"))
    .addTag(Constants.DESCRIBABLE);

  if (narrator) actor.addTag(Constants.NARRATOR);

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
    pos: ex.vec(-70, -50),
    color: ex.Color.White,
    font: new ex.Font({ size: 12, unit: ex.FontUnit.Px }),
  });
  actor.addChild(label);

  return actor;
};

// TODO remove when scene generator can generate heat sources
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
    .addComponent(new Components.GeneratorComponent("object-generator"))
    .addTag(Constants.DESCRIBABLE);

// /**
//  * Takes in a position, and a scene object type to generate a resource from.
//  */
// export const makeResourceProvider = (pos, sceneObject: SceneObject) => {
//   const actor = new ex.Actor({
//     name: "forest",
//     pos: pos,
//     radius: rand.integer(20, 70),
//     color: ex.Color.fromHex(rand.pickOne(colorScheme)),
//     collisionType: ex.CollisionType.Fixed,
//   }).addTag(Constants.DESCRIBABLE);
//
//   const resources = [];
//
//   sceneObject.properties.forEach((property) => {
//     const tag = Constants[property];
//
//     // ensure we only attach properties which exist in the engine.
//     if (!tag) return;
//
//     resources.push({
//       tag,
//       // this would be a great place to load in a SD generated asset
//       color: ex.Color.fromHex(rand.pickOne(colorScheme)),
//     });
//
//     actor.addTag(Constants[`${property}_RESOURCE`]);
//   });
// //
//   console.log("Adding resources", resources);
//
//   actor.addComponent(new Components.ResourceProviderComponent(resources));
//
//   actor.on("pointerdown", () => {
//     console.log("POINTER DOWN", sceneObject);
//     addNarrative(sceneObject.description);
//   });
//
//   return actor;
// };
//

export class GeneratedScene extends ex.Scene {
  name = "generatedScene";
  generateSceneItems: () => Promise<ex.Entity[]>;

  queries: Record<string, ex.Query<ex.Component<string>>>;

  constructor(generateSceneItems: () => Promise<ex.Entity[]>) {
    super();
    this.generateSceneItems = generateSceneItems;
  }

  public async onInitialize(game: ex.Engine) {
    this.queries = buildQueries(this.world);

    this.world.add(new Systems.NeedsSystem());
    this.world.add(new Systems.CollectorSystem());
    this.world.add(new Systems.SeekSystem());
    this.world.add(new Systems.ProximitySystem());
    this.world.add(new Systems.ResourceProviderSystem());
    this.world.add(new Systems.HeatSourceSystem());
    this.world.add(new Systems.BTSystem({ queries: this.queries }, this.generateSceneItems));

    const entitiesToAdd = await this.generateSceneItems();
    console.log("generated entities", ...entitiesToAdd);

    entitiesToAdd.map(this.add.bind(this));

    this.add(makeFirePit(randomPosition(game, 0.25)));

    repeat(1, (i) => {
      const isNarrator = i === 0;
      const npc = makeNpc(
        "Narrator",
        randomPosition(game, 0.4, 0.25),
        {
          exposure: rand.integer(0, 10),
          hunger: rand.integer(0, 10),
        },
        isNarrator
      );
      // TODO manually adding name and description so it will show up, but should come from generator
      npc.addComponent(
        new Components.DescriptionComponent({
          name: isNarrator ? "Narrator" : "Other NPC",
          description: "A sentient being",
        })
      );
      this.add(npc);
    });
  }
}
