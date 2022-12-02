import { game } from "./game";
import { simulate } from "./config";
import * as Bridge from "./bridge";
import "./style.css";
import { GeneratedScene } from "./scenes/generatedScene";
import { generateSceneItems } from "./generator";
import { addNarrative } from "./helpers";

// game.showDebug(true)
if (simulate) console.debug("simulating");

const loadingEls = document.querySelectorAll("[data-lifecycle=loading]");
const generateButtonEl = document.querySelector("#begin-game");
const spinnerEl = document.querySelector("#spinner");

const onReady = (entitiesToAdd: ex.Entity[]) => {
  loadingEls.forEach((el: HTMLElement) => el.classList.add("hidden"));
  spinnerEl.classList.add("hidden");

  console.log("generated entities", ...entitiesToAdd);
  const scene = new GeneratedScene(entitiesToAdd);
  console.log("running scene:", scene.name);
  game.add(scene.name, scene);
  game.goToScene(scene.name);
  game.start();
};

generateButtonEl.addEventListener("click", async (e) => {
  e.preventDefault();
  (e.target as HTMLButtonElement).disabled = true;
  spinnerEl.classList.remove("hidden");

  const promptInputEl = document.querySelector(
    "[name=prompt]"
  ) as HTMLInputElement;
  const prompt = promptInputEl.value || promptInputEl.placeholder;
  // note, promot is the user provided setting, not the full prompt

  const sceneItems = await generateSceneItems(prompt);
  console.log("gennerated scene", sceneItems);

  onReady(Bridge.parseGeneratedItems(game, sceneItems));

  addNarrative(
    `I have crash landed in ${prompt}. First priority is to seek food and shelter. I am proceeding to survey the landscape...`
  );
  // TODO
  // const image = await generateSceneImage(prompt);
  // addNarrativeImage(image)
});
