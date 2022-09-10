import ECS from "./ecs.js";

const gameEl = document.querySelector("main");
const player = {
  stats: {
    exposure: 5,
    hunger: 1,
    companionship: 0
  }
};

const needsHierarchy = ["exposure", "hunger", "companionship"];

const entities = ECS.init({
  WORLD: {
    [ECS.Components.DESCRIBE]: { name: "An island" },
    [ECS.Components.CONTAINS]: new Set(["FOREST", "FIELD", "PLAYER"])
  },
  FOREST: { [ECS.Components.DESCRIBE]: { name: "A forest" } },
  FIELD: { [ECS.Components.DESCRIBE]: { name: "A field" } },
  PLAYER: { [ECS.Components.DESCRIBE]: { name: "You", silent: true } }
});

function loop() {
  describeWorld();
  describePlayer();
  assessPlan();
  takeAction();
}

function describeWorld() {
  let p = document.createElement("p");
  p.innerText = "You see:\n" + ECS.systems.describe(entities, "WORLD");
  gameEl.appendChild(p);
}

describeWorld();
