import { Engine, Scene, SceneActivationContext, vec } from "excalibur";
import Constants from "../constants";
import * as Systems from "../ecs/systems";
import { game } from "../game";
import { makeNpc } from "../actors/makeNpc";
import { forest } from "../actors/forest";
import { field } from "../actors/field";
import { firePit } from "../actors/firePit";
import * as ArgosSDK from "../argos-sdk";


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
  combustibleResource: world.queryManager.createQuery([
    Constants.COMBUSTIBLE_RESOURCE
  ]),
  edibleResource: world.queryManager.createQuery([
    Constants.EDIBLE_RESOURCE
  ])
})

// TODO get these from a user prompt?  Or randomize?
const worldSummary = 'Everything is a simulatiuon'
const genre = 'fantasy'
const style = 'lovecraftian'

const worldBody = { worldSummary, genre, style }

export class MainScene extends Scene {
  worldDescription: string
  sceneDescription: string
  onReady: () => null;

  name = "mainScene";

  constructor(onReady) {
    super()
    this.onReady = onReady;
  }
  
  public async onInitialize(_engine: Engine): Promise<void> {
    // todo show a loading icon here...
      const worldResponse = await ArgosSDK.generateWorld(worldBody)
      this.worldDescription = worldResponse.outputs.worldDescription

    // Not going to use the scene describer for now
    // const sceneBody = {
    //   worldDescription: this.worldDescription
    // }

    // const sceneResponse = await ArgosSDK.generateScene(sceneBody)

    const queries = buildQueries(this.world)
    this.world.add(new Systems.NeedsSystem());
    this.world.add(new Systems.CollectorSystem());
    this.world.add(new Systems.SeekSystem());
    // These get put into each bt blackboard
    // passing makeCampFire might be ugly
    console.log("Initializing BT system", this)
    this.world.add(new Systems.BTSystem({ makeCampFire, queries }));

    // TODO putting this at end of onActivate fires too soon, not sure this is the right lifecycle
    // also the initialize and activate events fire too soon too
    this.onReady()
  }

  async onActivate(_context: SceneActivationContext<unknown>): Promise<void> {
    // todo call the thoth spell here to generate a character.
    // keeping to one NPC for now.
    const npc1 = await makeNpc("npc1", vec(-20, 20), { exposure: 5, hunger: 9 }, this.worldDescription)
    // const npc2 = makeNpc("npc2", vec(20, 20), { exposure: 2, hunger: 2 });
    // const npc3 = makeNpc("npc3", vec(0, -20), { exposure: 0, hunger: 5 });
  
    this.add(forest);
    this.add(field);
    this.add(firePit);
  
    this.add(npc1);
    // this.add(npc2);
    // this.add(npc3);

  }
}
