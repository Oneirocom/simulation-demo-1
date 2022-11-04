import * as ex from "excalibur";
import * as Components from "../ecs/components";
import npcBT from "../behaviourTree/npc-bt";
import { game } from "../game";

//
/////////// ENTITIES //////////////
//
export const makeNpc = (name, offset, needs) => {
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

  actor.on("precollision", function (ev) {
    // nudge to prevent "getting stuck"
    // TODO this doesn't work that great...
    if (ev.target.vel.equals(ex.Vector.Zero))
      return;

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
