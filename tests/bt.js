import BT from "../src/bt.js";
import { assertEqual } from "./utils.js";

const state = { mode: "toString", value: 3 };

const root = BT.decisionNode(
  () => state.mode === "toString",
  BT.actionNode(() => state.value.toString()),
  BT.decisionNode(
    () => state.mode === "evenOrOdd",
    BT.decisionNode(
      () => state.value % 2 === 0,
      BT.actionNode(() => "value is even"),
      BT.actionNode(() => "value is odd")
    ),
    BT.actionNode(() => "don't know what to do")
  )
);

assertEqual("with toString", "3", BT.run(root));

state.mode = "evenOrOdd";
state.value = 3;
assertEqual("with find", "value is odd", BT.run(root));
