import * as ECS from "./ecs/ecs.js";
import BT from "./bt.js";
import "./ecs/components.js";
import Systems from "./ecs/systems.js";

const gameEl = document.querySelector("main");

ECS.init({
  WORLD: [
    ECS.Components.Describe({ name: "An island" }),
    ECS.Components.Contains(["FOREST", "FIELD", "PLAYER"])
  ],
  FOREST: [ECS.Components.Describe({ name: "A forest" })],
  FIELD: [ECS.Components.Describe({ name: "A field" })],
  PLAYER: [
    ECS.Components.Describe({ name: "You", silent: true }),
    ECS.Components.Needs({
      exposure: 5,
      hunger: 1,
      companionship: 0
    }),
    ECS.Components.BehaviorTree([
      BT.node(({ need }) => need === "exposure", [
        // TODO print each step, ie: "warm up by fire, there is no fire; build a fire, you have no wood; find wood"
        // requires threading intermediary state through bt
        BT.node(() => ECS.query(["HeatSource"]).length, [
          BT.action(() => "go to fire")
        ]),
        BT.node(() => {
          // TODO player_has_burnable?()
          false;
        }, [BT.action(() => "make a fire")]),
        BT.action(() => "find some wood")
      ]),
      BT.node(({ need }) => need == "hunger", []),
      BT.node(({ need }) => need == "companionship", []),
      BT.action(({ need }) => console.log("feeling", need))
    ])
  ]
});

function loop() {
  describeWorld();
  let need = describeYou();
  let plan = assessPlan(need);
  takeAction();
}

function describeWorld() {
  let p = document.createElement("p");
  p.innerText = "You see\n" + Systems.describe("WORLD");
  gameEl.appendChild(p);
}

function describeYou() {
  let p = document.createElement("p");
  let [need, degree] = Systems.needs.status("PLAYER");
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
  let plan = Systems.logic.run({ need: need }, "PLAYER");
  let p = document.createElement("p");
  p.innerText = plan;
  gameEl.appendChild(p);
  return plan;
}

describeWorld();
let need = describeYou();
assessPlan(need);

Object.prototype.inspect = function() {
  console.log(this);
  return this;
};
