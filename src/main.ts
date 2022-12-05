import { game } from "./game";
import { simulate } from "./config";
import * as Bridge from "./bridge";
import "./style.css";
import { GeneratedScene } from "./scenes/generatedScene";
import * as Generator from "./generator";
import { addNarrative } from "./helpers";

// game.showDebug(true)
if (simulate) console.debug("simulating");

const initEls = document.querySelectorAll("[data-lifecycle=init]");
const generateButtonEl = document.querySelector("#begin-game");
const spinnerEl = document.querySelector("#spinner");

const promptInputEl = document.querySelector(
  "[name=prompt]"
) as HTMLInputElement;
const prompt = promptInputEl.value || promptInputEl.placeholder;
// note, promot is the user provided setting, not the full prompt

const showSpinner = () => spinnerEl.classList.remove("hidden");
const hideSpinner = () => spinnerEl.classList.add("hidden");

const generateSceneItems = async () => {
  showSpinner();
  const sceneItems = await Generator.generateSceneItems(prompt);
  console.log("gennerated scene", sceneItems);
  hideSpinner();
  return Bridge.parseGeneratedItems(game, sceneItems);
};

generateButtonEl.addEventListener("click", async (e) => {
  e.preventDefault();
  (e.target as HTMLButtonElement).disabled = true;
  promptInputEl.disabled = true;

  addNarrative(
    `I have crash landed in ${prompt}. First priority is to seek food and shelter. I am proceeding to survey the landscape...`
  );
  // TODO
  // const image = await generateSceneImage(prompt);
  // addNarrativeImage(image)

  initEls.forEach((el: HTMLElement) => el.classList.add("hidden"));

  const scene = new GeneratedScene(generateSceneItems);
  game.add(scene.name, scene);
  console.log("running scene:", scene.name);
  game.goToScene(scene.name);
  game.start();
});
