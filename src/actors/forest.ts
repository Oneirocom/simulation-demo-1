import * as ex from "excalibur";
import * as Components from "../ecs/components";
import Constants from "../constants";
import { game } from "../main";

export const forest = new ex.Actor({
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
