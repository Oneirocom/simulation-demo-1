import { Engine, Scene, SceneActivationContext, vec } from "excalibur";
import Constants from "../constants";
import { fire } from "../actors/fire";
import * as Systems from "../ecs/systems";
import { game } from "../game";
import { makeNpc } from "../actors/makeNpc";
import { forest } from "../actors/forest";
import { field } from "../actors/field";
import { firePit } from "../actors/firePit";


// TODO use LifeTime component instead of settimeout
const makeCampFire = () => {
  game.add(fire);
  setTimeout(() => fire.kill(), 4000);
};

/**
 * Optimization to performantly query elements by tags/components
 * Statful and updated via observers as world changes
 * Currently relied on by the BTs
 */
const buildQueries = (world) => ({
  heatSources: world.queryManager.createQuery([
    Constants.HEATSOURCE
  ]),
  fireZones: world.queryManager.createQuery([
    Constants.FIRE_ZONE
  ]),
  combustibleResource: world.queryManager.createQuery([
    Constants.COMBUSTIBLE_RESOURCE
  ]),
  edibleResource: world.queryManager.createQuery([
    Constants.EDIBLE_RESOURCE
  ])
})

export class MainScene extends Scene {
  public onInitialize(_engine: Engine): void {
    const queries = buildQueries(this.world)
    this.world.add(new Systems.NeedsSystem());
    this.world.add(new Systems.CollectorSystem());
    this.world.add(new Systems.SeekSystem());
    // These get put into each bt blackboard
    // passing makeCampFire might be ugly
    console.log("Initializing BT system", this)
    this.world.add(new Systems.BTSystem({ makeCampFire, queries }));
  }

  onActivate(_context: SceneActivationContext<unknown>): void {
    // todo call the thoth spell here to generate a character.
    const npc1 = makeNpc("npc1", vec(-20, 20), { exposure: 5, hunger: 9 });
    const npc2 = makeNpc("npc2", vec(20, 20), { exposure: 2, hunger: 2 });
    const npc3 = makeNpc("npc3", vec(0, -20), { exposure: 0, hunger: 5 });
  
    this.add(forest);
    this.add(field);
    this.add(firePit);
  
    this.add(npc1);
    this.add(npc2);
    this.add(npc3);
  }
}