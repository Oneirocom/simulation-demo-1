import { SceneActivationContext, vec } from "excalibur";
import { field } from "../actors/field";
import { firePit } from "../actors/firePit";
import { forest } from "../actors/forest";
import { makeNpc } from "../actors/makeNpc";
import { RootScene } from "./rootScene";

export class MainScene extends RootScene {
  public onActivate(_context: SceneActivationContext<unknown>): void {
    const npc1 = makeNpc("npc1", vec(-20, 20), { exposure: 5, hunger: 9 });
    const npc2 = makeNpc("npc2", vec(20, 20), { exposure: 2, hunger: 2 });
    const npc3 = makeNpc("npc3", vec(0, -20), { exposure: 0, hunger: 5 });
  
    this.add(forest);
    this.add(field);
    this.add(firePit);
  
    console.log("Adding NPCs")
    this.add(npc1);
    this.add(npc2);
    this.add(npc3);

    console.log("current scene world", this.world)
  }
}