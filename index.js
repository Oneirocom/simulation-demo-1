import ECS from "./ecs.js";

const gameEl = document.querySelector("main");

const entities = ECS.init({
  WORLD: [
    ECS.Components.describe({ name: "An island" }),
    ECS.Components.contains(["FOREST", "FIELD", "PLAYER"])
  ],
  FOREST: [ECS.Components.describe({ name: "A forest" })],
  FIELD: [ECS.Components.describe({ name: "A field" })],
  PLAYER: [
    ECS.Components.describe({ name: "You", silent: true }),
    ECS.Components.needs({
      exposure: 5,
      hunger: 1,
      companionship: 0
    })
  ]
});

function loop() {
  describeWorld();
  describeYou();
  assessPlan();
  takeAction();
}

function describeWorld() {
  let p = document.createElement("p");
  p.innerText = "You see\n" + ECS.Systems.describe(entities, "WORLD");
  gameEl.appendChild(p);
}

function describeYou() {
  let p = document.createElement("p");
  let [affliction, degree] = ECS.Systems.needs.status(entities, "PLAYER");
  let descriptions = {
    exposure: "cold",
    hunger: "hungry",
    companionship: "lonely",
    none: "fine"
  };
  p.innerText =
    "You feel " + (degree >= 5 ? "very " : " ") + descriptions[affliction];
  gameEl.appendChild(p);
}

describeWorld();
describeYou();
