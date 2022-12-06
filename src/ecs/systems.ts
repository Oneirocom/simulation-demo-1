import { run } from "../behaviourTree/bt";
import * as ex from "excalibur";
import * as Components from "./components";
import Constants from "../constants";
import { Entity } from "excalibur";
import * as Generator from "../generator";
import { addNarrative, addNarrativeImage } from "../helpers";
import { GeneratedScene } from "../scenes/generatedScene";

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

      // draw fire (I don't know the right math to position the triangle, so this is messy!)
      const size = (((entity.width * 0.9) / 2) * c.fuelLevel) / c.capacity;
      const { x, y } = entity.pos.sub(ex.vec(size, size));
      const triangle = new ex.Polygon({
        points: [
          ex.vec(-size, -size / 2),
          ex.vec(size, -size / 2),
          ex.vec(0, -2 * size),
        ],
        color: ex.Color.White,
      });
      triangle.draw(this.ctx, x, 1.03 * y);
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

  prompt: string;

  constructor(
    // passing this in is gross
    prompt: string
  ) {
    super();
    this.prompt = prompt;
  }
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
        const desiredResource = entity.get(
          Components.SeekComponent
        ).desiredResource;

        if (
          desiredResource &&
          entity.has(Components.CollectorComponent) &&
          seek.target.has(Components.ResourceProviderComponent) &&
          seek.target
            .get(Components.ResourceProviderComponent)
            .resources.has(desiredResource)
        ) {
          // TODO ask resource providor for resource instead of take (so it can validate and update count when/if implemented)
          const resource = seek.target
            .get(Components.ResourceProviderComponent)
            .resources.get(desiredResource);
          entity
            .get(Components.CollectorComponent)
            .inventory.set(resource.tag, resource);

          entity.get(Components.BTComponent).previousObject = seek.target;

          // NOTE changing how resources work, using it uses it up
          seek.target.kill();

          const { name, description } = seek.target.get(
            Components.DescriptionComponent
          );
          let action = "";
          if (desiredResource === Constants.EDIBLE)
            action = "I will attempt to eat it.";
          if (desiredResource === Constants.COMBUSTIBLE)
            action = "I will use it to make a fire.";

          addNarrative(`I have discovered ${name}. ${description}. ${action}`);
          const imagePrompt = `${name} in ${this.prompt}. ${description}. Concept art`;
          console.log(imagePrompt);
          Generator.generateImage(imagePrompt).then((url) =>
            addNarrativeImage(url)
          );
        }

        // NOTE force remove in case other system wants to add a new seek in same frame
        // Hopefully this shouldn't cause any issues since other systems don't use this component (currently)
        // Might still have an issue with ordering though if adding a seek happens before current seek is removed?
        entity.removeComponent("seek", true);

        // flash target for visual effect
        const color = seek.target.color;
        seek.target.actions
          .callMethod(() => (seek.target.color = color.lighten(0.2)))
          .delay(100)
          .callMethod(() => (seek.target.color = color));
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

  update(entities: ex.Actor[]) {
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

  update(entities: ex.Actor[]) {
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
    "Feeling " + (degree >= 5 ? "very " : "") + this.descriptions[need];

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
        entity.get(Components.NeedsComponent).exposure -=
          (this.exposureRate * delta * 2) / 1000;
      } else {
        entity.get(Components.NeedsComponent).exposure +=
          (this.exposureRate * delta) / 1000;
      }

      // TODO this is brittle, but works for now
      const label = <ex.Label>entity.children[0];
      let text = this.statusToString(
        NeedsSystem.status(entity.get(Components.NeedsComponent))
      );
      const btDescription = entity.get(
        Components.BTComponent
      ).currentActionDescription;
      if (btDescription) text += ",\ngoing to " + btDescription;
      label.text = text;
    }
  }
}

/**
 * Interruptable BT, won't trigger an action that is already running, but might replace it.
 *
 * Calls the action fn with a callback you _must_ call when the action finishes
 * to clear the current action
 *
 * Runs at an interval
 *
 * only works on "NPCs" (BT, needs, and collector components)
 */
export class BTSystem extends ex.System {
  types = ["BT", "needs", "collector"];
  priority = 10;
  systemType = ex.SystemType.Update;
  context = {};
  game: ex.Engine;
  generateSceneItems: () => Promise<ex.Entity[]>;

  // TODO takes the generator to use if BT is out of options, but feels like the wrong place to put it
  constructor(
    context: Record<string, unknown>,
    generateSceneItems: () => Promise<ex.Entity[]>
  ) {
    super();
    this.context = context;
    this.generateSceneItems = generateSceneItems;
  }
  initialize(scene: ex.Scene) {
    this.game = scene.engine;
  }

  // reset entity action when action is finished.
  // and store previous action for descriptions
  onDone = (entity: ex.Entity) => {
    entity.get(Components.BTComponent).previousActionDescription = entity.get(
      Components.BTComponent
    ).currentActionDescription;
    entity.get(Components.BTComponent).currentActionDescription = null;
  };

  interval = 2000;
  elapsedTime = 0;

  update(entities: Entity[], delta) {
    this.elapsedTime += delta;
    if (this.elapsedTime < this.interval) return;
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
        const btComponent = e.get(Components.BTComponent);
        btComponent.previousAction = btComponent.currentAction;
        btComponent.currentAction = key;
        btComponent.currentActionDescription = description;
      }
      // TODO this should be locked down to only narrating entities
      if (key === "FIND_NEW_AREA") {
        addNarrative(
          "The near by resources have been depleted.  I must explore a new area."
        );
        // TODO reset scene
        this.game.removeScene(this.game.currentScene);
        this.game.stop();
        const scene = new GeneratedScene(this.generateSceneItems);
        this.game.addScene(scene.name, scene);
        console.log("running scene:", scene.name);
        this.game.goToScene(scene.name);
        this.game.start();
      }
    });
  }
}
