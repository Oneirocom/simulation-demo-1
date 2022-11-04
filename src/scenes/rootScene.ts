import { Engine, Scene } from "excalibur";
import Constants from "../constants";
import { fire } from "../actors/fire";
import * as Systems from "../ecs/systems";
import { game } from "../game";

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


export class RootScene extends Scene {
  public onInitialize(_engine: Engine): void {
    console.log("initializing")
    this.world.add(new Systems.NeedsSystem());
    this.world.add(new Systems.CollectorSystem());
    this.world.add(new Systems.SeekSystem());
    // These get put into each bt blackboard
    // passing makeCampFire might be ugly
    console.log("Initializing BT system")
    this.world.add(new Systems.BTSystem({ makeCampFire, queries }));
  }
}