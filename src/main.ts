import { game } from "./game";
import { MainScene } from "./scenes/mainScene";
import Constants from "./constants";
import * as Bridge from "./bridge";
import { simulate } from "./config";
import * as ArgosSDK from "./argos-sdk";

// TODO this doesn't work, when simulating it goes away before getting set
const loadingEl: HTMLElement = document.querySelector("#loading");
if (simulate) {
  loadingEl.innerText = "Loading (Simulation)";
}

const onReady = () => {
  loadingEl.classList.add("hidden");
};

const mainScene = new MainScene(onReady);
game.add("mainScene", mainScene);
game.goToScene("mainScene");

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
    ArgosSDK.enhanceWorldDescription({
      description: Bridge.descriptionToString(description),
    });
    (<HTMLElement>e.target).innerText = "Continue";
  }
});

game.start();
