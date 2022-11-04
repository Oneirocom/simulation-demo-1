import { run } from "../behaviourTree/bt";
import * as ex from "excalibur";
import * as Components from "./components";
import Constants from "../constants";
import { Entity } from "excalibur";

//
/////////// SYSTEMS //////////////
//

/**
 * Constantly attempts to move entity towards target
 */
export class SeekSystem extends ex.System {
  types = ["seek"];
  priority = 10;
  systemType = ex.SystemType.Update;

  elapsedTime = 0;
  /**
   * Check if entity is at an entity or an entity with the given tag
   */
  static isNear(entity: ex.Actor, targetOrTag: ex.Actor | string) {
    return !![
      ...entity.get(Components.ProximityComponent).touching.values(),
    ].find(
      (e) =>
        (e as ex.Actor) === (targetOrTag as ex.Actor) ||
        e.hasTag(targetOrTag as string)
    );
  }

  update(entities: ex.Actor[], delta: number) {
    this.elapsedTime += delta;
    if (this.elapsedTime < 100) return;
    this.elapsedTime = 0;

    for (const entity of entities) {
      const seek = entity.get(Components.SeekComponent);
      const found = SeekSystem.isNear(entity, seek?.target);

      if (found) {
        entity.vel = ex.Vector.Zero;
        seek?.onHit();
        // NOTE force remove in case other system wants to add a new seek in same frame
        // Hopefully this shouldn't cause any issues since other systems don't use this component (currently)
        // Might still have an issue with ordering though if adding a seek happens before current seek is removed?
        entity.removeComponent("seek", true);
      } else {
        // todo this scaling here doesnt make sense, but was needed to get the NPC to move at any kind of decent speed.  Not sure why.
        entity.vel = seek.target.pos
          .sub(entity.pos)
          .normalize()
          .scale(seek.speed);
      }
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
   * @param {entity} entity
   * @param {string} tag
   * @return {boolean}
   */
  static hasInventory(entity, tag) {
    return !![
      ...entity.get(Components.CollectorComponent).inventory.values(),
    ].find((resource) => resource.tags.includes(tag));
  }

  /**
   * Removes inventory item with tag, if any found, if multiple found removes first one
   */
  static removeInventory(entity, tag) {
    const found = [
      ...entity.get(Components.CollectorComponent).inventory.values(),
    ].find((resource) => resource.tags.includes(tag));
    if (found)
      entity.get(Components.CollectorComponent).inventory.delete(found);
  }

  initialize(scene: ex.Scene) {
    this.ctx = scene.engine.graphicsContext;
  }

  update(entities, _delta) {
    for (const entity of entities) {
      this.ctx.save();
      let i = 0;
      entity
        .get(Components.CollectorComponent)
        .inventory.forEach((resource) => {
          this.ctx.drawCircle(
            entity.pos.add(ex.Vector.Right.scale(entity.width + 20 * i++)),
            8,
            resource.color
          );
        });
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
  ctx!: ex.ExcaliburGraphicsContext;

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
  update(entities, delta) {
    for (const entity of entities) {
      entity.get(Components.NeedsComponent).hunger +=
        (this.hungerRate * delta) / 1000;
      const foundHeatsource = SeekSystem.isNear(entity, Constants.HEATSOURCE);
      if (foundHeatsource) {
        entity.get(Components.NeedsComponent).exposure = 0;
      } else {
        entity.get(Components.NeedsComponent).exposure +=
          (this.exposureRate * delta) / 1000;
      }

      // TODO this is brittle, but works for now
      const label = entity.children[0];
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
  onDone = (entity) =>
    (entity.get(Components.BTComponent).currentAction = null);

  elapsedTime = 0;

  update(entities: Entity[], delta) {
    this.elapsedTime += delta;
    if (this.elapsedTime < 1000) return;
    this.elapsedTime = 0;

    
    entities.forEach((e) => {
      console.log("BT entities", e.get(Components.BTComponent).bt)
      const { key, fn } = run(e.get(Components.BTComponent).bt, {
        ...this.context,
        entity: e,
        delta,
      });

      if (key !== e.get(Components.BTComponent).currentAction) {
        fn(this.onDone.bind(this, e));
        console.debug(e.name, "New action:", key);
        e.get(Components.BTComponent).currentAction = key;
      }
    });
  }
}
