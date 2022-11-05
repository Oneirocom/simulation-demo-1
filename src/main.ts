import { game } from "./game";
import { MainScene } from "./scenes/mainScene";
import Constants from "./constants";
import * as Bridge from "./bridge";

const mainScene = new MainScene();
game.goToScene("mainScene");
game.add("mainScene", mainScene);

const describableQuery = mainScene.world.queryManager.createQuery([
  Constants.DESCRIBABLE,
]);

let isPaused = false;
document.querySelector("#describe-world").addEventListener("click", (e) => {
  if (isPaused) {
    (<HTMLElement>e.target).innerText = "Pause";
    isPaused = false;
    game.start();
  } else {
    isPaused = true;
    game.stop();
    const description = Bridge.describeWorld(describableQuery.getEntities());
    console.log(description);
    (<HTMLElement>e.target).innerText = "Continue";
  }
});

game.start();
