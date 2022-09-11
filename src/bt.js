/**
A logic module

This is actually a stateless Decision Tree for simplicity, but an actual
Behavior Tree could go here instead if the complexity is needed.
*/

/**
 * Traverses a tree breadth first from left to right until reaching an action
 * node.

 * @param {list[node | action]} a layer of the tree to run
 *
 * @return  {any} the result of the selected action
 */
function run(nodes) {
  let selectedNode = nodes.find(
    node => node.type === "action" || node.predicate()
  );
  if (typeof selectedNode === "undefined")
    throw Error("reached end of tree but no action reached");
  if (selectedNode.type === "action") {
    return selectedNode.perform();
  } else {
    return run(selectedNode.children);
  }
}
/**
 * A node with children (no decision yet reached).
 *
 * @pred {fn} A predicate function
 * @children {list[node | action]} node to run if predicate passes
 */
function node(predicate, children) {
  if (!Array.isArray(children)) throw "node children must be an array";

  return { type: "node", predicate, children };
}

/**
 * A terminal node (the reached decision).
 *
 * @perform {fn} An action to take
 */
function action(perform) {
  return { type: "action", perform };
}

export default { action, node, run };
