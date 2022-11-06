import {
  Actor,
  CollisionType,
  Color,
  Font,
  FontUnit,
  Label,
  vec,
  Vector,
} from "excalibur";
import * as Components from "../ecs/components";
import npcBT from "../behaviourTree/npc-bt";
import { game } from "../game";
import Constants from "../constants";
// import * as ArgosSDK from "../argos-sdk";

interface NpcActor extends Actor {
  metadata: Record<string, string>;
}

//
/////////// ENTITIES //////////////
//
export const makeNpc = async (name, offset, needs, _worldDescription) => {
  const actor = new Actor({
    name: name,
    pos: vec(game.drawWidth / 2, 100).add(offset),
    vel: Vector.Zero,
    width: 30,
    height: 30,
    color: Color.Red,
    collisionType: CollisionType.Active,
  }) as NpcActor;

  // const characterResponse = await ArgosSDK.generateCharacter(worldDescription)

  actor
    .addComponent(new Components.NeedsComponent(needs))
    .addComponent(new Components.CollectorComponent())
    .addComponent(new Components.BTComponent(npcBT))
    .addComponent(new Components.ProximityComponent())
    .addTag(Constants.DESCRIBABLE);

  actor.on("precollision", function (ev) {
    // nudge to prevent "getting stuck"
    // TODO this doesn't work that great...
    if (ev.target.vel.equals(Vector.Zero)) return;

    const nudge = ev.target.pos
      .sub(ev.other.pos)
      .normalize()
      .perpendicular()
      .scale(2);
    ev.target.pos.addEqual(nudge);
  });

  const label = new Label({
    text: name,
    pos: vec(-50, -30),
    font: new Font({ size: 16, unit: FontUnit.Px }),
  });
  actor.addChild(label);

  return actor;
};
