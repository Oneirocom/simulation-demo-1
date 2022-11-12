import { game } from "./game";
import { RandomScene } from "./scenes/randomScene";
import * as Bridge from "./bridge";
import { simulate } from "./config";
import * as ArgosSDK from "./argos-sdk";
import { generateDescriptions } from "./bridge";
import "./style.css";

// game.showDebug(true)
if (simulate) console.debug("simulating ArgOS");

const statusEl = document.querySelector("#status");
const loadingEls = document.querySelectorAll("[data-lifecycle=loading]");
const describeButton = document.querySelector("#describe-world");
const beginButton = document.querySelector("#begin-game");
const narrativeEl = document.querySelector("#narrative");
const spinnerEl = document.querySelector("#spinner");

const onReady = async (_worldDescription) => {
  loadingEls.forEach((el: HTMLElement) => el.classList.add("hidden"));
  statusEl.innerHTML = "Simulation running";
  describeButton.classList.remove("hidden");
  spinnerEl.classList.add("hidden");

  // TODO could pass worldDescription or scene bluebrint in
  const scene = new RandomScene();
  console.log("running scene:", scene.name);
  game.add(scene.name, scene);
  game.goToScene(scene.name);
  game.start();
  // todo I dont like having to start the game here first, unless we want to show a loading screen until this is done.

  const entities = (
    game.currentScene as RandomScene
  ).queries.describables.getEntities();

  const descriptionMap = await generateDescriptions(
    _worldDescription,
    entities
  );
  console.log("description map", descriptionMap);
};

beginButton.addEventListener("click", async (e) => {
  (e.target as HTMLButtonElement).disabled = true;
  spinnerEl.classList.remove("hidden");

  // TODO disable prompt inputs
  const worldBody = {
    worldSummary:
      (document.querySelector("[name=world-summary]") as HTMLInputElement)
        .value || "Everything is a simulatiuon",
    genre:
      (document.querySelector("[name=genre]") as HTMLInputElement).value ||
      "fantasy",
    style:
      (document.querySelector("[name=style]") as HTMLInputElement).value ||
      "lovecraftian",
  };

  const worldResponse = await ArgosSDK.generateWorld(worldBody);
  const worldDescription = worldResponse.outputs.worldDescription.trim();

  addNarrative(worldDescription);

  await onReady(worldDescription);
});

function addNarrative(text: string) {
  const narrativeItem = document.createElement("div");
  narrativeItem.className = "border border-black-500 rounded p-4 mb-4";
  narrativeItem.innerText = text;
  narrativeEl.appendChild(narrativeItem).scrollIntoView(true);
}

let isPaused = false;
describeButton.addEventListener("click", (e) => {
  if (isPaused) {
    (<HTMLElement>e.target).innerText = "Pause";
    isPaused = false;
    game.start();
  } else {
    isPaused = true;
    game.stop();
    // TODO forcing this to RandomScene here is brittle...
    const description = Bridge.describeWorld(
      (game.currentScene as RandomScene).queries.describables.getEntities()
    );

    // todo this is the part we want to swap out with a new description format for the scene
    ArgosSDK.enhanceWorldDescription({
      description: Bridge.descriptionToString(description),
    }).then(addNarrative);

    (<HTMLElement>e.target).innerText = "Continue";
  }
});
