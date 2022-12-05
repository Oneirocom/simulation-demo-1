import { Action, Node } from "../behaviourTree/bt";
import * as ex from "excalibur";
import Constants from "../constants";
import { NeedsSystem } from "./systems";
import { addNarrative } from "../helpers";

//
/////////// COMPONENTS //////////////
//

export type Resource = Record<string, unknown> & { tag: string };

/**
 * This component adds the concept of "inventory" which is filled with resources
 * This inventory gets filled by seeking resource providers via the SeekSysstem.
 * Resource `tag`s will be used to describe them (TODO which isn't a great solution...)
 */
export class CollectorComponent extends ex.Component {
  type = "collector";
  // NOTE collectors can only carry 1 of each resource kind currently
  inventory: Map<string, Resource> = new Map();

  // TODO instead of event listeners, add a component that has collision data on it

  describe() {
    return [...this.inventory]
      .map(([i, _]) => "has something " + i)
      .join(" and also ");
  }
}

/**
 * Allows an entity to provide one or more kinds of resources.
 * Resource tags are referenced in SeekComponent's.
 * Resource tags will be used to describe them (TODO which isn't a great solution...)
 */
export class ResourceProviderComponent extends ex.Component {
  type = "resource";
  resources: Map<string, Resource> = new Map();
  constructor(resources: Resource[]) {
    super();
    resources.forEach((r) => this.resources.set(r.tag, r));
  }

  // TODO consider way to add/remove resources at runtime
  // TODO Consider adding `count`, `spawnRate` and `onEmpty`.

  describe() {
    return [...this.resources.keys()]
      .map((tag) => `provides something ${tag}`)
      .join(" and ");
  }
}

/**
 * Wip capturing "nearBy", should be better thought out
 */
export class ProximityComponent extends ex.Component {
  public readonly type = "proximity";
  public nearBy: Set<ex.Entity> = new Set();
  constructor() {
    super();
    this.nearBy = new Set();
  }

  onAdd(e: ex.Entity): void {
    e.on("collisionstart", function (ev: ex.CollisionStartEvent) {
      const nearBy = ev.target.get(ProximityComponent).nearBy;
      nearBy.add(ev.other);
      ev.other.on("kill", () => nearBy.delete(ev.other));
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
    // switched to feelign here.  Though we may want to consider a tense transformer for descriptions
    return afflictions.length > 0
      ? "feeling " + afflictions.join(" and ")
      : null;
  }
}

// todo not sure I like calling this spell component.  Maybe to generaic given that it is specifically a spell which desribes something.
export class GeneratorComponent extends ex.Component {
  type = "generator";
  spellName: string;
  constructor(spellName: string) {
    super();
    this.spellName = spellName;
  }
}

export class DescriptionComponent extends ex.Component {
  type = Constants.DESCRIBECOMPONENT;
  name: string;
  description: string;
  constructor({ name: name, description: description }) {
    super();
    this.name = name;
    this.description = description;
  }

  onAdd(e: ex.Actor): void {
    e.on("pointerenter", () => e.actions.scaleTo(ex.vec(1.1, 1.1), ex.vec(1, 1)))
    e.on("pointerleave", () => e.actions.scaleTo(ex.vec(1, 1), ex.vec(1, 1)))
    e.on("pointerdown", () => {
      addNarrative(e.get(DescriptionComponent).description);
    });
  }
}

export class BTComponent extends ex.Component {
  type = "BT";
  bt: (Action | Node)[];
  currentAction: null;
  currentActionDescription: string | null;
  previousAction: string | null;
  previousObject: ex.Actor | null;
  previousActionDescription: string | null;
  /**
   * BT action nodes should return type {key: string, fn: () => any}
   * The key should be unique across actions and is used as the current action
   */
  constructor(bt: (Action | Node)[]) {
    super();
    this.bt = bt;
  }

  describe() {
    let description = "is sentient";
    if (this.currentActionDescription)
      description +=
        " and is currently trying to " + this.currentActionDescription;
    return description;
  }
}

/**
 * Makes an entity move towoards a target
 * onHit gets called on arrival
 * May or may not include a specific desired resource
 */
export class SeekComponent extends ex.Component {
  type = "seek";
  speed: number;
  target: ex.Actor;
  desiredResource?: string;
  onHit: () => void;

  constructor({
    speed,
    target,
    onHit,
    desired_resource,
  }: {
    speed: number;
    target: ex.Actor;
    onHit: () => void;
    desired_resource?: string;
  }) {
    super();
    this.speed = speed;
    this.target = target;
    this.onHit = onHit;
    if (desired_resource) this.desiredResource = desired_resource;
  }
}

/**
 * Makes an entity move towoards a target
 * onHit gets called on arrival
 * May or may not include a specific desired resource
 */
export class HeatSourceComponent extends ex.Component {
  type = Constants.HEATSOURCE;
  fuelLevel: number;
  burnRate: number;
  capacity: number;

  constructor(fuelLevel: number, burnRate = 0.2, capacity = 5) {
    super();
    this.fuelLevel = fuelLevel;
    this.burnRate = burnRate;
    this.capacity = capacity;
  }

  addFuel(amount: number) {
    this.fuelLevel = Math.min(this.capacity, this.fuelLevel + amount);
  }

  describe() {
    let d = "is providing heat";
    if (this.fuelLevel > this.capacity * 0.75) d = "is providing lots of heat";
    if (this.fuelLevel < this.capacity * 0.25)
      d = "is providing a small amount of heat";
    if (this.fuelLevel === 0) d = "could provide heat";
    return d;
  }
}
