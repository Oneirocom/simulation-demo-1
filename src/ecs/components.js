import * as ECS from "./ecs.js";

ECS.registerComponent("Describe", v => v);
ECS.registerComponent("Parent", v => v);
ECS.registerComponent("Needs", v => v);
ECS.registerComponent("BehaviorTree", v => v);
ECS.registerComponent("Burnable", () => true);
ECS.registerComponent("HeatSource", () => true);
ECS.registerComponent("Edible", () => true);
ECS.registerComponent("Aging", (max, onMax) => ({
  age: 0,
  max,
  onMax
}));
