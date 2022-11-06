import { game } from "./game";
import { MainScene } from "./scenes/mainScene";
import { RandomScene } from "./scenes/randomScene";
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

// Pick scene (TODO maybe pull from url?)

// const scene = new MainScene(onReady);

const scene = new RandomScene();
// call onReady immediatly on random scene
onReady();

console.log("running scene:", scene.name);
game.add(scene.name, scene);
game.goToScene(scene.name);

const describableQuery = scene.world.queryManager.createQuery([
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

// game.showDebug(true)
game.start();
