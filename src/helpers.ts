import * as ex from "excalibur";

const narrativeEl = document.querySelector("#narrative");
export function addNarrativeImage(url: string) {
  const narrativeItem = document.createElement("img");
  narrativeItem.className = "mb-4";
  narrativeItem.src = url;
  narrativeEl.appendChild(narrativeItem).scrollIntoView(true);
}
/**
 * Adds a bit of narrative output to the text rendering view
 */
export function addNarrative(text: string) {
  const narrativeItem = document.createElement("div");
  narrativeItem.className = "mb-4";
  narrativeItem.innerText = text;
  narrativeEl.appendChild(narrativeItem).scrollIntoView(true);
}
////////// RAND HELPERS ///////////

// lock the seed if desired
// sparse seed 1667946673875
// fuller seed 1667947499766
// spread out seed 1667946609610
// good hunger first example 1668001137456
const seed = parseInt(Date.now().toString());
export const rand = new ex.Random(seed);
console.log("Using random seed", seed);

/**
 * Randomly place an entity within the game bounds
 * maxDistanceFromCenter of 0 will be at exact game center, 1 could be placed anywhere on screen, even at an edge
 * minDistanceFromCenter of 0 will equal maxDistanceFromCenter, 1 will be at screen border
 */
export function randomPosition(
  game: ex.Engine,
  maxDistanceFromCenter = 1,
  minDistanceFromCenter = 0
) {
  const hRange = rand.integer(
    game.halfDrawWidth * minDistanceFromCenter,
    game.halfDrawWidth * maxDistanceFromCenter
  );
  const vRange = rand.integer(
    game.halfDrawHeight * minDistanceFromCenter,
    game.halfDrawHeight * maxDistanceFromCenter
  );
  return ex.vec(
    game.halfDrawWidth + hRange * rand.pickOne([-1, 1]),
    game.halfDrawHeight + vRange * rand.pickOne([-1, 1])
  );
}

export function repeat(number: number, fn: (i: number) => void): void {
  Array.from({ length: number }, (_k, v) => fn(v));
}

export const colorScheme = rand.pickOne([
  [
    "#4C4C59",
    "#815BD9",
    "#6E8AFA",
    "#30BEFF",
    "#5EFFF4",
    "#4C4C59",
    "#815BD9",
    "#6E8AFA",
  ],
  [
    "#6643E6",
    "#967DF0",
    "#B3A4EB",
    "#D2CCEB",
    "#EEEAF2",
    "#6643E6",
    "#967DF0",
    "#B3A4EB",
  ],
  [
    "#A700FC",
    "#8703C9",
    "#660099",
    "#4E0076",
    "#300148",
    "#A700FC",
    "#8703C9",
    "#660099",
  ],
  [
    "#2D223C",
    "#493A62",
    "#756191",
    "#987DC0",
    "#BEAFD4",
    "#2D223C",
    "#493A62",
    "#756191",
  ],
]);
// from https://www.colourlovers.com/palettes
