import * as ex from "excalibur";
import Constants from "../constants";
import { game } from "../game";
import * as Components from "../ecs/components";

export const firePit = new ex.Actor({
  name: "firePit",
  pos: ex.vec(game.drawWidth / 2, (game.drawHeight * 2) / 3),
  width: 50,
  height: 50,
  color: ex.Color.Gray,
  collisionType: ex.CollisionType.Fixed,
})
  .addComponent(new Components.HeatSourceComponent(0))
  .addTag(Constants.DESCRIBABLE);
