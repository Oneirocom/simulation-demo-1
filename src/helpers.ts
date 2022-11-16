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
