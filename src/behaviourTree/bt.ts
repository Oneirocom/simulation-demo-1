/**
A logic module

This is actually a stateless Decision Tree for simplicity, but an actual
Behavior Tree could go here instead if the complexity is needed.
*/

export type Blackboard = Record<string, any>

export type NodeOrAction = Node | Action

export type Predicate = (blackboard: Blackboard) => Boolean

export type Node = {
  type: string,
  predicate: Predicate
  children: NodeOrAction[]
}

export type PerformReturn = {
  key: string,
  fn: (done: Function) => void
}

export type PerformAction = (bloacboard: Blackboard) => PerformReturn

export type Action = {
  type: string,
  perform: PerformAction
}

/**
 * Traverses a tree breadth first from left to right until reaching an action
 * node. Each node will receive the supplied blackboard and can read/write to it.

 * @param {list[node | action]} nodes - a layer of the tree to run
 * @param {any} blackboard - shared state available to all nodes
 *
 * @return {any} the result of the selected action
 */
export function run(nodes: NodeOrAction[], blackboard = {}) {
  let selectedNode = nodes.find(
    // todo clean this up a bit.  There is some type ambiguity and coercion going on.
    node => node.type === "action" || (node as Node).predicate(blackboard)
  );
  if (typeof selectedNode === "undefined")
    throw Error("reached end of tree but no action reached");
  if (selectedNode.type === "action") {
    return (selectedNode as Action).perform(blackboard);
  } else {
    return run((selectedNode as Node).children, blackboard);
  }
}
/**
 * A node with children (no decision yet reached).
 *
 * @param {fn} pred - A predicate function
 * @param {list[node | action]} children - next layer to run if predicate passes
 */
export function node(predicate: Predicate, children: NodeOrAction[]): Node {
  if (!Array.isArray(children)) throw "node children must be an array";

  return { type: "node", predicate, children };
}

/**
 * A terminal node (the reached decision).
 *
 * @param {fn} perform - An action to take
 */
export function action(perform: PerformAction): Action {
  return { type: "action", perform };
}
