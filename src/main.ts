import { game } from "./game";
import { RandomScene } from "./scenes/randomScene";
import * as Bridge from "./bridge";
import { simulate } from "./config";
import * as ArgosSDK from "./argos-sdk";
// import { generateDescriptions } from "./bridge";
import "./style.css";
import { GeneratedScene } from "./scenes/generatedScene";
import { ArgosScene } from "./argos-sdk";
import { addNarrative } from "./helpers";

// game.showDebug(true)
if (simulate) console.debug("simulating ArgOS");

const statusEl = document.querySelector("#status");
const loadingEls = document.querySelectorAll("[data-lifecycle=loading]");
const describeButton = document.querySelector("#describe-world");
const beginButton = document.querySelector("#begin-game");
const spinnerEl = document.querySelector("#spinner");

/**
 * Called after async actions to set up initial scene are done
 */
const onReady = async (entitiesToAdd: ex.Entity[]) => {
  loadingEls.forEach((el: HTMLElement) => el.classList.add("hidden"));
  statusEl.innerHTML = "Simulation running";
  describeButton.classList.remove("hidden");
  spinnerEl.classList.add("hidden");

  console.log("generated editires", ...entitiesToAdd);
  const scene = new GeneratedScene(entitiesToAdd);
  console.log("running scene:", scene.name);
  game.add(scene.name, scene);
  game.goToScene(scene.name);
  game.start();
};

/**
 * Starts the came when the begin simulation button is pressed
 */
beginButton.addEventListener("click", async (e) => {
  e.preventDefault();
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
    numberOfObjects: 5,
  };

  const argosScene = await generateContent(worldBody)
  const sceneEntities = Bridge.parseGeneratedScene(game, argosScene)
  // TODO could do validation here, like regenerate if error returned or something
  
  // question: do we need to store this somewhere?
  const worldDescription = argosScene.worldDescription.trim();
  addNarrative(worldDescription);

  await onReady(sceneEntities);
});

async function generateContent(worldBody): Promise<ArgosScene> {
  const worldResponse = await ArgosSDK.generateWorld(worldBody);
  return worldResponse.outputs;
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
    const descriptionAsString = Bridge.descriptionToString(description);

    // todo this is the part we want to swap out with a new description format for the scene
    ArgosSDK.enhanceWorldDescription({
      description: descriptionAsString,
    }).then(addNarrative);

    (<HTMLElement>e.target).innerText = "Continue";
  }
});
