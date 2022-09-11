/**
A logic module

This is actually a stateless binary Decision Tree for simplicity, but an
actual Behavior Tree could go here instead if the complexity is needed.

Each run of a tree will start at the top and traverse down until reaching an
action, which is returned.
*/

function run(node) {
  if (node.type === "action") return node.perform();
  if (node.type === "decision")
    return run(node.predicate() ? node.aNode : node.bNode);
  throw Error(`Node (${JSON.stringify(node)}) is not recognized`);
}
/**
 * A node with children (no decision yet reached).
 *
 * @pred {fn} A predicate function
 * @aNode {node | action} node to run if predicate passes
 * @bNode {node | action} node to run if predicate fails
 */
function decisionNode(predicate, aNode, bNode) {
  return { type: "decision", predicate, aNode, bNode };
}

/**
 * A terminal node (the reached decision).
 *
 * @perform {fn} An action to take
 */
function actionNode(perform) {
  return { type: "action", perform };
}

export default { actionNode, decisionNode, run };
