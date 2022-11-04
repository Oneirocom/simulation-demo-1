import * as ex from "excalibur";
import * as Components from "./ecs/components";
import * as Systems from "./ecs/systems";
import Constants from "./constants";
import npcBT from "./npc-bt";

const game = new ex.Engine({
  displayMode: ex.DisplayMode.FillScreen,
  backgroundColor: ex.Color.Viridian
});

/**
 * Optimization to performantly query elements by tags/components
 * Statful and updated via observers as world changes
 * Currently relied on by the BTs
 */
const queries = {
  heatSources: game.currentScene.world.queryManager.createQuery([
    Constants.HEATSOURCE
  ]),
  fireZones: game.currentScene.world.queryManager.createQuery([
    Constants.FIRE_ZONE
  ]),
  combustibleResource: game.currentScene.world.queryManager.createQuery([
    Constants.COMBUSTIBLE_RESOURCE
  ]),
  edibleResource: game.currentScene.world.queryManager.createQuery([
    Constants.EDIBLE_RESOURCE
  ])
};

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
    collisionType: ex.CollisionType.Active
  });

  actor
    .addComponent(new Components.NeedsComponent(needs))
    .addComponent(new Components.CollectorComponent())
    .addComponent(new Components.BTComponent(npcBT))
    .addComponent(new Components.ProximityComponent());

  actor.on("precollision", function(ev) {
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
    font: new ex.Font({ size: 16, unit: ex.FontUnit.Px })
  });
  actor.addChild(label);

  return actor;
};

const forest = new ex.Actor({
  name: "forest",
  pos: ex.vec(game.drawWidth / 4 / 2, game.drawHeight / 2),
  width: game.drawWidth / 4,
  height: game.drawHeight,
  color: ex.Color.Green,
  collisionType: ex.CollisionType.Fixed
})
  .addComponent(
    new Components.ResourceComponent({
      name: "Wood",
      tags: [Constants.COMBUSTIBLE],
      color: ex.Color.fromRGB(139, 69, 19)
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
  collisionType: ex.CollisionType.Fixed
})
  .addComponent(
    new Components.ResourceComponent({
      name: "Food",
      tags: [Constants.EDIBLE],
      color: ex.Color.Green
    })
  )
  .addTag(Constants.EDIBLE_RESOURCE);

const firePit = new ex.Actor({
  name: "firePit",
  pos: ex.vec(game.drawWidth / 2, (game.drawHeight * 2) / 3),
  width: 50,
  height: 50,
  color: ex.Color.Gray,
  collisionType: ex.CollisionType.Fixed
});
firePit.addTag(Constants.FIRE_ZONE);

const fire = new ex.Actor({
  name: "campFire",
  pos: firePit.pos.clone(),
  width: 30,
  height: 30,
  color: ex.Color.Orange,
  collisionType: ex.CollisionType.Fixed,
  radius: 30
}).addTag(Constants.HEATSOURCE);

// TODO use LifeTime component instead of settimeout
const makeCampFire = () => {
  game.add(fire);
  setTimeout(() => fire.kill(), 4000);
};

const npc1 = makeNpc("npc1", ex.vec(-20, 20), { exposure: 5, hunger: 9 });
const npc2 = makeNpc("npc2", ex.vec(20, 20), { exposure: 2, hunger: 2 });
const npc3 = makeNpc("npc3", ex.vec(0, -20), { exposure: 0, hunger: 5 });

game.currentScene.world.add(new Systems.NeedsSystem());
game.currentScene.world.add(new Systems.CollectorSystem());
game.currentScene.world.add(new Systems.SeekSystem());
// These get put into each bt blackboard
// passing makeCampFire might be ugly
game.currentScene.world.add(new Systems.BTSystem({ makeCampFire, queries }));

game.add(forest);
game.add(field);
game.add(firePit);

game.add(npc1);
game.add(npc2);
game.add(npc3);

game.start();
