import * as ex from "excalibur";

const narrativeEl = document.querySelector("#narrative");
/**
 * Adds a bit of narrative output to the text rendering view
 */
export function addNarrative(text: string) {
  const narrativeItem = document.createElement("div");
  narrativeItem.className = "border border-black-500 rounded p-4 mb-4";
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
    game.halfDrawHeight + vRange * rand.pickOne([-1, 1]),
  );
}

export function repeat(number: number, fn: (i: number) => void): void {
  Array.from({ length: number }, (_k, v) => fn(v));
}

// from https://www.colourlovers.com/palettes
export const colorScheme = rand.pickOne([
  ["#EBDBB2", "#FB4934", "#FE8019", "#B8BB26", "#282828"],
  ["#5C3723", "#D63A3E", "#E47F2D", "#EDDDAA", "#69B4B2"],
  ["#B9D886", "#C0ED9C", "#657709", "#524414", "#2B1C0F"],
  ["#8E4137", "#CF8B4A", "#EA9957", "#90953B", "#587650"],
]);
