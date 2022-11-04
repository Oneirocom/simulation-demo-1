import { game } from "./game";
import { MainScene } from "./scenes/mainScene";

game.add('mainScene', new MainScene())
game.goToScene('mainScene')

game.start();
