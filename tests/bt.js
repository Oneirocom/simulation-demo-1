import BT from "../src/bt.js";
import { assertEqual } from "./utils.js";

const state = { mode: "toString", value: 3 };

const root = [
  BT.node(() => state.mode === "toString", [
    BT.action(() => state.value.toString())
  ]),
  BT.node(() => state.mode === "evenOrOdd", [
    BT.node(() => state.value % 2 === 0, [BT.action(() => "value is even")]),
    BT.action(() => "value is odd")
  ]),
  BT.action(() => "don't know what to do")
];

// state.mode = "missin";
// BT.run(root);

assertEqual("with toString", "3", BT.run(root));

state.mode = "evenOrOdd";
state.value = 3;
assertEqual("with find", "value is odd", BT.run(root));
