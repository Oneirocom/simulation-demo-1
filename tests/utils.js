import assert from "node:assert";
export function assertEqual(name, a, b) {
  console.log(name);
  assert.deepStrictEqual(b, a);
  console.log("Pass\n");
}
