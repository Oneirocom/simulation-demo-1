import { assertEqual } from "./utils.js";
import * as ECS from "../src/ecs/ecs.js";

ECS.registerComponent("One", () => "one");
ECS.registerComponent("Two", () => "two");
ECS.registerComponent("Echo", text => text);

// adding entities & components
ECS.addEntity("A", [ECS.Components.One()]);
assertEqual("addEntity", "one", ECS.entity("A").get("One"));

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

// queries
assertEqual("simple query", ["B"], ECS.query(["Echo"]));
assertEqual("compound query", ["A", "B"], ECS.query(["One", "Two"]));
assertEqual("failed query", [], ECS.query(["Nothing"]));

// updates
ECS.init({
  A: [ECS.Components.Echo(1)],
  B: [ECS.Components.Echo(1)]
});
const initialB = ECS.entity("B");
ECS.update("A", "Echo", x => x + 1);
assertEqual("updating an entite", 2, ECS.entity("A").get("Echo"));
assertEqual(
  "other entities don't change when updating",
  1,
  ECS.entity("B").get("Echo")
);
ECS.update("B", "NonExistant", x => x + 1);
assertEqual(
  "updating non existing component is no op",
  initialB,
  ECS.entity("B")
);
