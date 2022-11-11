import { run } from "../behaviourTree/bt";
import * as ex from "excalibur";
import * as Components from "./components";
import Constants from "../constants";
import { Entity } from "excalibur";

//
/////////// SYSTEMS //////////////
//

/**
 * Tracks what an entity is near
 *
 * Note, requires the onAdd oncollision event listener in the ProximityComponent which is unfortunate
 */
export class ProximitySystem extends ex.System {
  types = ["proximity"];
  priority = 10;
  systemType = ex.SystemType.Update;

  elapsedTime = 0;
  /**
   * Check if entity is at an entity or an entity with the given tag or component
   * Can also pass a predicate to test the found entity against
   */
  static isNear(
    entity: ex.Actor,
    targetOrTag: ex.Actor | string,
    pred: (found: ex.Entity) => boolean = () => true
  ) {
    return !![
      ...entity.get(Components.ProximityComponent).nearBy.values(),
    ].find(
      (e) =>
        ((e as ex.Actor) === (targetOrTag as ex.Actor) ||
          e.hasTag(targetOrTag as string) ||
          e.has(targetOrTag as string)) &&
        pred(e)
    );
  }

  update(entities: ex.Actor[], delta: number) {
    this.elapsedTime += delta;
    if (this.elapsedTime < 100) return;
    this.elapsedTime = 0;

    for (const entity of entities) {
      const nearBy = entity.get(Components.ProximityComponent).nearBy;
      nearBy.forEach((other: ex.Actor) => {
        if (
          other.width / 2 + entity.width / 2 + 10 <
          entity.pos.distance(other.pos)
        )
          nearBy.delete(other);
      });
    }
  }
}

/**
 * Manages heat sources
 */
export class HeatSourceSystem extends ex.System {
  types = [Constants.HEATSOURCE];
  priority = 80;
  systemType = ex.SystemType.Draw;
  ctx: ex.ExcaliburGraphicsContext;

  elapsedTime = 0;

  initialize(scene: ex.Scene) {
    this.ctx = scene.engine.graphicsContext;
  }

  update(entities: ex.Actor[], delta: number) {
    for (const entity of entities) {
      // burn fuel
      const c = entity.get(Components.HeatSourceComponent);
      c.fuelLevel = Math.max(0, c.fuelLevel - (c.burnRate * delta) / 1000);

      // draw fire
      const size = (entity.width * 0.9 * c.fuelLevel) / c.capacity;
      this.ctx.drawRectangle(
        entity.pos.sub(ex.vec(size / 2, size / 2)),
        size,
        size,
        ex.Color.Orange
      );
    }
  }
}

/**
 * Constantly attempts to move entity towards target
 */
export class SeekSystem extends ex.System {
  types = ["seek"];
  priority = 20;
  systemType = ex.SystemType.Update;

  elapsedTime = 0;

  update(entities: ex.Actor[], delta: number) {
    this.elapsedTime += delta;
    if (this.elapsedTime < 100) return;
    this.elapsedTime = 0;

    // TODO might want to re-query from time to time in case target gets removed or closer optoin becomes available

    for (const entity of entities) {
      const seek = entity.get(Components.SeekComponent);
      const found = ProximitySystem.isNear(entity, seek.target);

      if (found) {
        entity.vel = ex.Vector.Zero;
        seek.onHit();

        // if seeking was to get a resource, now is the time to claim it
        const desired_resource = entity.get(
          Components.SeekComponent
        ).desired_resource;
        if (
          desired_resource &&
          entity.has(Components.CollectorComponent) &&
          seek.target.has(Components.ResourceProviderComponent) &&
          seek.target
            .get(Components.ResourceProviderComponent)
            .resources.has(desired_resource)
        ) {
          // TODO ask resource providor for resource instead of take (so it can validate and update count when/if implemented)
          const resource = seek.target
            .get(Components.ResourceProviderComponent)
            .resources.get(desired_resource);
          entity
            .get(Components.CollectorComponent)
            .inventory.set(resource.tag, resource);
        }

        // NOTE force remove in case other system wants to add a new seek in same frame
        // Hopefully this shouldn't cause any issues since other systems don't use this component (currently)
        // Might still have an issue with ordering though if adding a seek happens before current seek is removed?
        entity.removeComponent("seek", true);
      } else {
        entity.vel = seek.target.pos
          .sub(entity.pos)
          .normalize()
          .scale(seek.speed);
      }
    }
  }
}

/**
 * Renders resources in a resource provider
 */
export class ResourceProviderSystem extends ex.System {
  types = ["resource"];
  priority = 99;
  systemType = ex.SystemType.Draw;
  ctx!: ex.ExcaliburGraphicsContext;

  initialize(scene: ex.Scene) {
    this.ctx = scene.engine.graphicsContext;
  }

  update(entities: ex.Actor[], _delta) {
    for (const entity of entities) {
      this.ctx.save();
      let i = 0;
      const resources = entity.get(
        Components.ResourceProviderComponent
      ).resources;
      resources.forEach(
        (resource: Components.Resource & { color: ex.Color }) => {
          this.ctx.drawCircle(
            entity.pos.add(
              ex.Vector.Right.scale(10 * i++ - (5 * resources.size) / 2)
            ),
            8,
            resource.color
          );
        }
      );
      this.ctx.restore();
    }
  }
}

/**
 * Renders inventory items as colored discs near NPC "owner"
 */
export class CollectorSystem extends ex.System {
  types = ["collector"];
  priority = 99;
  systemType = ex.SystemType.Draw;
  ctx!: ex.ExcaliburGraphicsContext;

  /**
   * Test if provided entity has an inventory item with a given tag
   */
  static hasInventory(entity: ex.Entity, tag: string) {
    return entity.get(Components.CollectorComponent).inventory.has(tag);
  }

  /**
   * Removes inventory item with tag, if any found, if multiple found removes first one
   */
  static removeInventory(entity: ex.Entity, tag: string) {
    entity.get(Components.CollectorComponent).inventory.delete(tag);
  }

  initialize(scene: ex.Scene) {
    this.ctx = scene.engine.graphicsContext;
  }

  update(entities: ex.Actor[], _delta) {
    for (const entity of entities) {
      this.ctx.save();
      let i = 0;
      entity
        .get(Components.CollectorComponent)
        .inventory.forEach(
          (resource: Components.Resource & { color: ex.Color }) => {
            this.ctx.drawCircle(
              entity.pos.add(ex.Vector.Right.scale(entity.width + 20 * i++)),
              8,
              resource.color
            );
          }
        );
      this.ctx.restore();
    }
  }
}

/**
 * Hierarchy of needs that get ticked each frame based on context
 */
export class NeedsSystem extends ex.System {
  types = ["needs"];
  priority = 99;
  systemType = ex.SystemType.Update;

  hungerRate = 0.5 / 1;
  exposureRate = 1 / 2;

  static threshold = 3;
  // TODO use enum instead of strings
  static needsHierarchy = ["exposure", "hunger"];
  ctx: ex.ExcaliburGraphicsContext;

  /**
   * Finds the need that is above the threshold that has the highest priority
   */
  static status(needs) {
    return (
      [...NeedsSystem.needsHierarchy]
        .map((k) => ({ need: k, degree: needs[k] }))
        .find(({ degree }) => degree > this.threshold) || {
        need: "none",
        degree: 0,
      }
    );
  }

  descriptions = {
    exposure: "cold",
    hunger: "hungry",
    none: "fine",
  };

  statusToString = ({ need, degree }) =>
    "Feeling " + (degree >= 5 ? "very " : " ") + this.descriptions[need];

  initialize(scene: ex.Scene) {
    this.ctx = scene.engine.graphicsContext;
  }
  update(entities: ex.Actor[], delta) {
    for (const entity of entities) {
      entity.get(Components.NeedsComponent).hunger +=
        (this.hungerRate * delta) / 1000;
      const foundHeatsource = ProximitySystem.isNear(
        entity,
        Constants.HEATSOURCE,
        (e: ex.Entity) => e.get(Components.HeatSourceComponent).fuelLevel > 0
      );
      if (foundHeatsource) {
        entity.get(Components.NeedsComponent).exposure -= (this.exposureRate * delta * 2) / 1000
      } else {
        entity.get(Components.NeedsComponent).exposure +=
          (this.exposureRate * delta) / 1000;
      }

      // TODO this is brittle, but works for now
      const label = <ex.Label>entity.children[0];
      label.text = this.statusToString(
        NeedsSystem.status(entity.get(Components.NeedsComponent))
      );
    }
  }
}

/**
 * Interruptable BT, won't trigger an action that is already running, but might replace it.
 *
 * Calls the action fn with a callback you _must_ call when the action finishes
 * to clear the current action
 *
 * Runs every second
 *
 * only works on "NPCs" (BT, needs, and collector components)
 */
export class BTSystem extends ex.System {
  types = ["BT", "needs", "collector"];
  priority = 10;
  systemType = ex.SystemType.Update;
  context = {};

  constructor(context: Record<string, unknown>) {
    super();
    this.context = context;
  }

  // reset entity action when action is finished.
  // and store previous action for descriptions
  onDone = (entity: ex.Entity) => {
    entity.get(Components.BTComponent).previousActionDescription = entity.get(
      Components.BTComponent
    ).currentActionDescription;
    entity.get(Components.BTComponent).currentActionDescription = null;
  };

  elapsedTime = 0;

  update(entities: Entity[], delta) {
    this.elapsedTime += delta;
    if (this.elapsedTime < 1000) return;
    this.elapsedTime = 0;

    entities.forEach((e) => {
      const { key, fn, description } = run(e.get(Components.BTComponent).bt, {
        ...this.context,
        entity: e,
        delta,
      });

      if (key !== e.get(Components.BTComponent).currentAction) {
        fn(this.onDone.bind(this, e));
        console.debug(e.name, "New action:", key);
        e.get(Components.BTComponent).currentAction = key;
        e.get(Components.BTComponent).currentActionDescription = description;
      }
    });
  }
}
