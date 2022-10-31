import BT from "../src/bt.js";
import { assertEqual } from "./utils.js";

const root = [
  BT.node(blackboard => blackboard.mode === "toString", [
    BT.action(blackboard => blackboard.value.toString())
  ]),
  BT.node(blackboard => blackboard.mode === "evenOrOdd", [
    BT.node(blackboard => blackboard.value % 2 === 0, [
      BT.action(_blackboard => "value is even")
    ]),
    BT.action(_blackboard => "value is odd")
  ]),
  BT.action(_blackboard => "don't know what to do")
];

const state = { mode: "toString", value: 3 };

assertEqual("with toString", "3", BT.run(root, state));

state.mode = "evenOrOdd";
state.value = 3;
assertEqual("with find", "value is odd", BT.run(root, state));

const passthrough = [
  BT.node(blackboard => {
    blackboard.remember = "remember me";
    return false;
  }, []),
  BT.action(blackboard => blackboard.remember)
];

assertEqual(
  "passing data throug the blackboard",
  "remember me",
  BT.run(passthrough)
);
