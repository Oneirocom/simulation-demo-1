import * as ECS from "./ecs.js";

ECS.registerComponent("Describe", v => v);
ECS.registerComponent("Parent", v => v);
ECS.registerComponent("Needs", v => v);
ECS.registerComponent("BehaviorTree", v => v);
ECS.registerComponent("Burnable", () => true);
