import * as ex from "excalibur";
import * as Components from "../ecs/components";
import Constants from "../constants";
import { game } from "../game";

export const field = new ex.Actor({
  name: "field",
  pos: ex.vec(game.drawWidth - game.drawWidth / 4 / 2, game.drawHeight / 2),
  width: game.drawWidth / 4,
  height: game.drawHeight,
  color: ex.Color.Yellow,
  collisionType: ex.CollisionType.Fixed,
})
  .addComponent(
    new Components.ResourceComponent({
      name: "Food",
      tags: [Constants.EDIBLE],
      color: ex.Color.Green,
    })
  )
  .addTag(Constants.EDIBLE_RESOURCE)
  .addTag(Constants.DESCRIBABLE);
