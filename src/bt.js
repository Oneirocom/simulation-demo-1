/**
A logic module

This is actually a stateless Decision Tree for simplicity, but an actual
Behavior Tree could go here instead if the complexity is needed.
*/

/**
 * Traverses a tree breadth first from left to right until reaching an action
 * node. Each node will receive the supplied blackboard and can read/write to it.

 * @param {list[node | action]} nodes - a layer of the tree to run
 * @param {any} blackboard - shared state available to all nodes
 *
 * @return {any} the result of the selected action
 */
function run(nodes, blackboard = {}) {
  let selectedNode = nodes.find(
    node => node.type === "action" || node.predicate(blackboard)
  );
  if (typeof selectedNode === "undefined")
    throw Error("reached end of tree but no action reached");
  if (selectedNode.type === "action") {
    return selectedNode.perform(blackboard);
  } else {
    return run(selectedNode.children, blackboard);
  }
}
/**
 * A node with children (no decision yet reached).
 *
 * @param {fn} pred - A predicate function
 * @param {list[node | action]} children - next layer to run if predicate passes
 */
function node(predicate, children) {
  if (!Array.isArray(children)) throw "node children must be an array";

  return { type: "node", predicate, children };
}

/**
 * A terminal node (the reached decision).
 *
 * @param {fn} perform - An action to take
 */
function action(perform) {
  return { type: "action", perform };
}

export default { action, node, run };
