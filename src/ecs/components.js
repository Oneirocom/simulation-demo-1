import * as ECS from "./ecs.js";

ECS.registerComponent("Describe", v => v);
ECS.registerComponent("Contains", v => new Set(v));
ECS.registerComponent("Needs", v => v);
ECS.registerComponent("BehaviorTree", v => v);
