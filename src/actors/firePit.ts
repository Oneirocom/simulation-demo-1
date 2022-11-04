import * as ex from "excalibur";
import Constants from "../constants";
import { game } from "../game";

export const firePit = new ex.Actor({
  name: "firePit",
  pos: ex.vec(game.drawWidth / 2, (game.drawHeight * 2) / 3),
  width: 50,
  height: 50,
  color: ex.Color.Gray,
  collisionType: ex.CollisionType.Fixed
});
firePit.addTag(Constants.FIRE_ZONE);
