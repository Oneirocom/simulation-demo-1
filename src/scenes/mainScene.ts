import { Engine, Scene, SceneActivationContext, vec } from "excalibur";
import Constants from "../constants";
import { fire } from "../actors/fire";
import * as Systems from "../ecs/systems";
import { game } from "../game";
import { makeNpc } from "../actors/makeNpc";
import { forest } from "../actors/forest";
import { field } from "../actors/field";
import { firePit } from "../actors/firePit";
import { callSpell } from "../utils/callSpell";
import { simulate } from "../config";


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

const worldSummary = 'Everything is a simulatiuon'
const genre = 'fantasy'
const style = 'lovecraftian'

const worldBody = { worldSummary, genre, style }
const worldDescription = "Everything in this world is a simulation. Even our own thoughts and emotions are just constructs of information. We can never truly know what's real and what's not. But that doesn't mean that life is meaningless. On the contrary, I believe that this knowledge can give us a greater appreciation for what we have. We can enjoy the beauty of the world without getting caught up in the illusion of reality."

export class MainScene extends Scene {
  worldDescription: string
  sceneDescription: string
  
  public async onInitialize(_engine: Engine): Promise<void> {
    // todo show a loading icon here...
    if (simulate) {
      const worldResponse = await callSpell('world-creator', worldBody)
      this.worldDescription = worldResponse.outputs.worldDescription
    } else {
      this.worldDescription = worldDescription
    }

    // Not going to use the scene describer for now
    // const sceneBody = {
    //   worldDescription: this.worldDescription
    // }

    // const sceneResponse = await callSpell('scene-creator', sceneBody)

    const queries = buildQueries(this.world)
    this.world.add(new Systems.NeedsSystem());
    this.world.add(new Systems.CollectorSystem());
    this.world.add(new Systems.SeekSystem());
    // These get put into each bt blackboard
    // passing makeCampFire might be ugly
    console.log("Initializing BT system", this)
    this.world.add(new Systems.BTSystem({ makeCampFire, queries }));
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