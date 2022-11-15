import { game } from "./game";
import { RandomScene } from "./scenes/randomScene";
import * as Bridge from "./bridge";
import { simulate } from "./config";
import * as ArgosSDK from "./argos-sdk";
// import { generateDescriptions } from "./bridge";
import "./style.css";
import { GeneratedScene } from "./scenes/generatedScene";
import { ArgosScene } from "./argos-sdk";

// game.showDebug(true)
if (simulate) console.debug("simulating ArgOS");

const statusEl = document.querySelector("#status");
const loadingEls = document.querySelectorAll("[data-lifecycle=loading]");
const describeButton = document.querySelector("#describe-world");
const beginButton = document.querySelector("#begin-game");
const narrativeEl = document.querySelector("#narrative");
const spinnerEl = document.querySelector("#spinner");

/**
 * Called after async actions to set up initial scene are done
 */
const onReady = async (argosScene: ArgosScene) => {
  loadingEls.forEach((el: HTMLElement) => el.classList.add("hidden"));
  statusEl.innerHTML = "Simulation running";
  describeButton.classList.remove("hidden");
  spinnerEl.classList.add("hidden");

  // Passing in scene blueprint for the scene to be generated
  const scene = new GeneratedScene(argosScene);
  console.log("running scene:", scene.name);
  game.add(scene.name, scene);
  game.goToScene(scene.name);
  game.start();
  // todo I dont like having to start the game here first, unless we want to show a loading screen until this is done.

  // const entities = (
  //   game.currentScene as RandomScene
  // ).queries.describables.getEntities();

  // const descriptionMap = await generateDescriptions(
  //   _worldDescription,
  //   entities
  // );
  // console.log("description map", descriptionMap);
};

/**
 * Starts the came when the begin simulation button is pressed
 */
beginButton.addEventListener("click", async (e) => {
  (e.target as HTMLButtonElement).disabled = true;
  spinnerEl.classList.remove("hidden");

  // TODO disable prompt inputs
  const worldBodyinputs = {
    worldSummary:
      (document.querySelector("[name=world-summary]") as HTMLInputElement)
        .value || "The veil of unreality hides an unspeakable truth",
    genre:
      (document.querySelector("[name=genre]") as HTMLInputElement).value ||
      "science fiction",
    style:
      (document.querySelector("[name=style]") as HTMLInputElement).value ||
      "lovecraftian",
  };

  const worldBody = {
    ...worldBodyinputs,
    numberOfObjects: 10,
  };

  const worldResponse = await ArgosSDK.generateWorld(worldBody);
  const argosScene = worldResponse.outputs;
  const worldDescription = argosScene.worldDescription.trim();

  addNarrative(worldDescription);

  await onReady(argosScene);
});

/**
 * Adds a bit of narrative output to the text rendering view
 */
export function addNarrative(text: string) {
  const narrativeItem = document.createElement("div");
  narrativeItem.className = "border border-black-500 rounded p-4 mb-4";
  narrativeItem.innerText = text;
  narrativeEl.appendChild(narrativeItem).scrollIntoView(true);
}

/**
 * Pauses and plays the simulation.  On pause, sends a request to argos to narrate the story
 */
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
