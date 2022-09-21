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
            const heatSource = ECS.query(["HeatSource"]).length;
            let step = "warm up by fire...";
            if (!heatSource) step += " there is no fire";
            steps.push(step);
            return heatSource;
          },
          [BT.action(({ steps }) => [steps, Actions.warmUp])]
        ),
        BT.node(
          ({ steps }) => {
            const wood = Systems.placement.children("PLAYER", ["Burnable"]);
            let step = "build a fire...";
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
      BT.node(({ need }) => need == "hunger", [
        BT.node(
          ({ steps }) => {
            if (Systems.food.available()) {
              steps.push("eat some food...");
              return true;
            } else {
              steps.push("you have nothing to eat");
              return false;
            }
          },
          [BT.action(({ steps }) => [steps, Actions.eatFood])]
        ),
        BT.action(({ steps }) => [
          [...steps, "find something to eat"],
          Actions.findFood
        ])
      ]),
      // TODO complete other needs
      // BT.node(({ need }) => need == "companionship", []),
      BT.action(() => [["Nothing more to do"], Actions.relax])
    ])
  ]
});

const Actions = {
  relax: { describe: "just hang out", updates: () => {} },
  getWood: {
    describe: "gather wood from the forest",
    updates: () => {
      ECS.addEntity("WOOD", [
        ECS.Components.Describe({ name: "Some chopped wood" }),
        ECS.Components.Burnable(),
        ECS.Components.Parent("PLAYER")
      ]);
    }
  },
  makeFire: {
    describe: "build a fire with the wood",
    updates: () => {
      ECS.removeEntity("WOOD");
      ECS.addEntity("CAMPFIRE", [
        ECS.Components.Describe({ name: "A burning campfire" }),
        ECS.Components.HeatSource(),
        ECS.Components.Parent("WORLD")
      ]);
    }
  },
  warmUp: {
    describe: "warm up by the fire",
    updates: () => {
      ECS.update("PLAYER", "Needs", needs => ({ ...needs, exposure: 0 }));
    }
  },
  eatFood: {
    describe: "eat your food",
    updates: () => {
      Systems.food.eat();
    }
  },
  findFood: {
    describe: "get some grains from the field",
    updates: () => {
      ECS.addEntity("GRAINS", [
        ECS.Components.Describe({ name: "Some simple grains" }),
        ECS.Components.Edible(),
        ECS.Components.Parent("PLAYER")
      ]);
    }
  }
  // TODO add more action handlers
};

function loop(action) {
  gameEl.innerHTML = "";

  if (action) takeAction(action);

  describeWorld();

  let need = describeYou();

  let nextAction = assessPlan(need);
  timePasses();

  let p = document.createElement("p");
  p.innerText = "Press any key for next tick";
  gameEl.appendChild(p);
  ECS.debug();
  return nextAction;
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

function takeAction(action) {
  action.updates();

  let p = document.createElement("p");
  p.innerText = "You " + action.describe;
  gameEl.appendChild(p);
}

function timePasses() {
  // TODO "age" needs (based on context) and fire (removeEntity when epired)
}

let nextAction = loop();
window.addEventListener("keydown", () => {
  nextAction = loop(nextAction);
});
