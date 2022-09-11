export function assertEqual(name, a, b) {
  console.log(name);
  if (a !== b)
    throw new Error(`Expected ${JSON.stringify(a)}, got ${JSON.stringify(b)}`);
  console.log("Pass");
}
