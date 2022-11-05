import { Action, Node } from "../behaviourTree/bt";
import * as ex from "excalibur";
import Constants from "../constants";
import { NeedsSystem } from "./systems";

//
/////////// COMPONENTS //////////////
//

/**
 * This component adds the concept of "inventory"
 * This inventory gets filled with the objects from bumping into ResourceComponent entities.
 * In this case they are just objects with a name and color to render and a list of tags.
 * Their `tag`s will be used to describe them (TODO which isn't a great solution...)
 *
 * TODO consider having the reource be factory function so the inventory can contain
 * complete entities that can be inspected via their components rather than names.
 */
export class CollectorComponent extends ex.Component {
  type = "collector";
  inventory: Set<{ tags: string[] }>;
  constructor() {
    super();
    this.inventory = new Set();
  }

  // TODO instead of event listeners, add a component that has collision data on it
  onAdd(e: ex.Entity) {
    e.on("collisionstart", (ev) => {
      if (ev.other.get(ResourceComponent))
        this.inventory.add(ev.other.get(ResourceComponent).resource);
    });
  }

  // TODO clean up with onRemove (no reason to remove it for now though)
  describe() {
    return [...this.inventory]
      .map((i) => "has something " + i.tags.join(" and "))
      .join(" and also ");
  }
}

/**
 * Allows an entity to provide a type of resource.
 * "Resources" are objects that can used in any way
 * Their `tag`s will be used to describe them (TODO which isn't a great solution...)
 * Consider adding `count`, `spawnRate` and `onEmpty`.
 */
export class ResourceComponent extends ex.Component {
  type = "resource";
  resource: { tags: string[] };
  constructor(resource) {
    super();
    this.resource = resource;
  }

  describe() {
    return this.resource.tags
      .map((tag) => `provides something ${tag}`)
      .join(" and ");
  }
}

/**
 * Wip capturing "touching", should be better thought out
 */
export class ProximityComponent extends ex.Component {
  public readonly type = "proximity";
  public touching: Set<ex.Entity> = new Set();
  constructor() {
    super();
    this.touching = new Set();
  }

  // BUG: when the fire goes away while you are near it and you still have wood, touching never gets unset
  onAdd(e: ex.Entity): void {
    e.on("collisionstart", function (ev) {
      ev.target.get(ProximityComponent).touching.add(ev.other);
    });
    e.on("collisionend", function (ev) {
      ev.target.get(ProximityComponent).touching.delete(ev.other);
    });
  }
}
export class NeedsComponent extends ex.Component {
  type = "needs";
  hunger: number;
  exposure: number;
  constructor({ hunger, exposure }) {
    super();
    this.hunger = hunger;
    this.exposure = exposure;
  }

  describe() {
    // TODO maybe only describe if this is the perspective entity?
    const afflictions = Object.entries({
      hungry: this.hunger,
      cold: this.exposure,
    })
      .filter(([_k, v]) => v > NeedsSystem.threshold)
      .map(([k, _v]) => k);
    return afflictions.length > 0 ? "feels " + afflictions.join(" and ") : null;
  }
}

export class BTComponent extends ex.Component {
  type = "BT";
  bt: (Action | Node)[];
  currentAction: null;
  previousAction: null;
  /**
   * BT action nodes should return type {key: string, fn: () => any}
   * The key should be unique across actions and is used as the current action
   */
  constructor(bt: (Action | Node)[]) {
    super();
    this.bt = bt;
  }

  describe() {
    return "is sentient";
  }
}

/**
 * Makes an entity move towoards a target
 * onHit gets called on arrival
 */
export class SeekComponent extends ex.Component {
  type = "seek";
  speed: number;
  target: ex.Actor;
  onHit: () => void;

  constructor({
    speed,
    target,
    onHit,
  }: {
    speed: number;
    target: ex.Actor;
    onHit: () => void;
  }) {
    super();
    this.speed = speed;
    this.target = target;
    this.onHit = onHit;
  }

  // TODO might be nice, but not sure how to describe the target
  // might be better to use the BT action instead
  // describe() {
  //   return "is looking for something " + ???;
  // }
}

/**
 * Descriptions for tags
 *
 * Components know how to describe themselves, but we don't own TagComponent
 * Rather than monkeypatch it, use this function
 * QUESTION: I tried following this to add to the Component interface, but it didn't work
 * https://medium.com/ringcentral-developers/how-to-extend-an-existing-typescript-class-ef2bfe4b6690
 */
export function describeTagComponent(
  c: ex.TagComponent<string, string>
): string {
  switch (c.type) {
    case Constants.HEATSOURCE:
      return "provides heat";
      break;

    default:
      return null;
      break;
  }
}
