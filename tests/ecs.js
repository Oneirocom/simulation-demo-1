import { assertEqual } from "./utils.js";
import * as ECS from "../src/ecs/ecs.js";

ECS.registerComponent("One", () => "one");
ECS.registerComponent("Two", () => "two");
ECS.registerComponent("Echo", text => text);

ECS.init({
  A: [ECS.Components.One(), ECS.Components.Two()],
  B: [
    ECS.Components.One(),
    ECS.Components.Two(),
    ECS.Components.Echo({ value: "hi" })
  ],
  C: [ECS.Components.One()],
  D: [ECS.Components.Two()]
});

assertEqual("basic entity", { value: "hi" }, ECS.entity("B").get("Echo"));

assertEqual("simple query", ["B"], ECS.query(["Echo"]));
assertEqual("compound query", ["A", "B"], ECS.query(["One", "Two"]));
assertEqual("failed query", [], ECS.query(["Nothing"]));
