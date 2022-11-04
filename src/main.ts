import * as ex from "excalibur";
import * as Systems from "./ecs/systems";
import Constants from "./constants";
import { forest } from "./actors/forest";
import { game } from "./game";
import { makeNpc } from "./actors/makeNpc";
import { field } from "./actors/field";
import { firePit } from "./actors/firePit";
import { fire } from "./actors/fire";

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
