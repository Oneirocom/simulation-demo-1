import ECS from "./ecs/ecs.js";
import BT from "./bt.js";

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
    // ECS.Components.behaviorTree(BT.decisionNode())
  ]
});

function loop() {
  describeWorld();
  let need = describeYou();
  assessPlan(need);
  takeAction();
}

function describeWorld() {
  let p = document.createElement("p");
  p.innerText = "You see\n" + ECS.Systems.describe(entities, "WORLD");
  gameEl.appendChild(p);
}

function describeYou() {
  let p = document.createElement("p");
  let [need, degree] = ECS.Systems.needs.status(entities, "PLAYER");
  let descriptions = {
    exposure: "cold",
    hunger: "hungry",
    companionship: "lonely",
    none: "fine"
  };
  p.innerText =
    "You feel " + (degree >= 5 ? "very " : " ") + descriptions[need];
  gameEl.appendChild(p);
  return need;
}

function assessPlan(need) {
  // cold -> make fire
}

describeWorld();
let need = describeYou();
assessPlan(need);

Object.prototype.inspect = function() {
  console.log(this);
  return this;
};
