import * as ex from "excalibur";
import Constants from "../constants";
import { firePit } from "./firePit";

export const fire = new ex.Actor({
  name: "campFire",
  pos: firePit.pos.clone(),
  width: 30,
  height: 30,
  color: ex.Color.Orange,
  collisionType: ex.CollisionType.Fixed,
  radius: 30
}).addTag(Constants.HEATSOURCE);
