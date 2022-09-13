import * as ECS from "./ecs/ecs.js";
import BT from "./bt.js";
import "./ecs/components.js";
import Systems from "./ecs/systems.js";

const gameEl = document.querySelector("main");

ECS.init({
  WORLD: [ECS.Components.Describe({ name: "An island" })],
  FOREST: [
    ECS.Components.Describe({ name: "A forest" }),
    ECS.Components.Parent("WORLD")
  ],
  FIELD: [
    ECS.Components.Describe({ name: "A field" }),
    ECS.Components.Parent("WORLD")
  ],
  // TOURCH: [
  //   ECS.Components.Describe({ name: "A tourch" }),
  //   ECS.Components.Burnable(),
  //   ECS.Components.Parent("PLAYER")
  // ],
  PLAYER: [
    ECS.Components.Describe({ name: "You", silent: true }),
    ECS.Components.Parent("WORLD"),
    ECS.Components.Needs({
      exposure: 5,
      hunger: 1,
      companionship: 0
    }),
    ECS.Components.BehaviorTree([
      BT.node(({ need }) => need === "exposure", [
        BT.node(
          ({ steps }) => {
            let step = "warm up by fire...";
            const heatSource = ECS.query(["HeatSource"]).length;
            if (!heatSource) step += " there is no fire";
            steps.push(step);
            heatSource;
          },
          [BT.action(({ steps }) => [steps, Actions.relax])]
        ),
        BT.node(
          ({ steps }) => {
            let step = "build a fire...";
            const wood = Systems.placement.children("PLAYER", ["Burnable"]);
            if (!wood.length) step += " you have nothing to make fire with";
            steps.push(step);
            return wood.length;
          },
          [BT.action(({ steps }) => [steps, Actions.makeFire])]
        ),
        BT.action(({ steps }) => [
          [...steps, "find something to burn..."],
          Actions.getWood
        ])
      ]),
      BT.node(({ need }) => need == "hunger", []),
      BT.node(({ need }) => need == "companionship", []),
      BT.action(() => Actions.relax)
    ])
  ]
});

const Actions = { relax: "relax", getWood: "getWood", makeFire: "makeFire" };

function loop() {
  describeWorld();
  let need = describeYou();
  let plan = assessPlan(need);
  takeAction(plan);
}

function describeWorld() {
  let p = document.createElement("p");
  p.innerText = "You see\n" + Systems.describe("WORLD");
  gameEl.appendChild(p);
}

function describeYou() {
  const inventory = Systems.placement
    .children("PLAYER", ["Describe"])
    .map(Systems.describe)
    .join("\n");
  let p1 = document.createElement("p");
  p1.innerText = "You  have:\n" + (inventory || "nothing");
  gameEl.appendChild(p1);

  let [need, degree] = Systems.needs.status("PLAYER");
  let descriptions = {
    exposure: "cold",
    hunger: "hungry",
    companionship: "lonely",
    none: "fine"
  };
  let p2 = document.createElement("p");
  p2.innerText =
    "You feel " + (degree >= 5 ? "very " : " ") + descriptions[need];
  gameEl.appendChild(p2);
  return need;
}

function assessPlan(need) {
  let [steps, plan] = Systems.logic.run({ need: need, steps: [] }, "PLAYER");
  let p = document.createElement("p");
  p.innerText = "What should you do?\n\n" + steps.join("\n");
  gameEl.appendChild(p);
  return plan;
}

function takeAction(plan) {
  // TODO describe plan
  // TODO update world
  let p = document.createElement("p");
  p.innerText = "You " + plan;
  gameEl.appendChild(p);
}

describeWorld();
let need = describeYou();
let plan = assessPlan(need);
takeAction(plan);

Object.prototype.inspect = function() {
  console.log(this);
  return this;
};
