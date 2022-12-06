import { game } from "./game";
import { simulate } from "./config";
import * as Bridge from "./bridge";
import "./style.css";
import { GeneratedScene } from "./scenes/generatedScene";
import * as Generator from "./generator";
import { addNarrative, addNarrativeImage } from "./helpers";

// game.showDebug(true)
if (simulate) console.debug("simulating");

const initEls = document.querySelectorAll("[data-lifecycle=init]");
const generateButtonEl = document.querySelector("#begin-game");
const spinnerEl = document.querySelector("#spinner");
const describeButton = document.querySelector("#describe-world");
let paused = false;
describeButton.addEventListener("click", () => {
  if (paused) {
    game.start();
    paused = false;
  } else {
    game.stop();
    paused = true;
  }
});

const promptInputEl = document.querySelector(
  "[name=prompt]"
) as HTMLInputElement;
// note, promot is the user provided setting, not the full prompt

const showSpinner = () => spinnerEl.classList.remove("hidden");
const hideSpinner = () => spinnerEl.classList.add("hidden");

const generateSceneItems = async () => {
  showSpinner();
  const prompt = promptInputEl.value || promptInputEl.placeholder;
  const sceneItems = await Generator.generateSceneItems(prompt);
  console.log("gennerated scene", sceneItems);
  hideSpinner();
  return Bridge.parseGeneratedItems(game, sceneItems);
};

generateButtonEl.addEventListener("click", async (e) => {
  e.preventDefault();
  (e.target as HTMLButtonElement).disabled = true;
  promptInputEl.disabled = true;

  const prompt = promptInputEl.value || promptInputEl.placeholder;
  addNarrative(
    `I have crash landed in ${prompt}. First priority is to seek food and shelter. I am proceeding to survey the landscape...`
  );
  // TODO
  const imagePrompt = `Concept art for the following story: I have crash landed in ${prompt}. First priority is to seek food and shelter.`;
  const url = await Generator.generateImage(imagePrompt);
  addNarrativeImage(url);

  initEls.forEach((el: HTMLElement) => el.classList.add("hidden"));

  const scene = new GeneratedScene(generateSceneItems, prompt);
  game.add(scene.name, scene);
  console.log("running scene:", scene.name);
  game.goToScene(scene.name);
  game.start();
});
