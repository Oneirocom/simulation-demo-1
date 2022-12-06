import * as ex from "excalibur";
import { DescriptionComponent } from "./ecs/components";
import { randomPosition, rand, colorScheme } from "./helpers";
import * as Components from "./ecs/components";
import Constants from "./constants";
import { ArgosScene } from "./argos-sdk";
import { GeneratedItem } from "./generator";

const SESSION_ID = rand.floating(0, 100000000);

/**
 * Pure function that converts a list of entities into a description
 */
export function describeWorld(entities: ex.Entity[]) {
  // TODO maybe provide a "perspective" entity?
  const description = entities.map((entity) => {
    // Maybe describe the size?
    // Maybe describe the location (ie. "to the West")?
    // Maybe describe how near or far from perspective entity?
    return describeEntity(entity);
  });

  return description;
}

export type CharacterScript = {
  speaker: string;
  agent: string;
  client: string;
  channel: string;
  name: string;
  world: string;
  scene: string;
  currentState: string;
  inventory: string;
  nextAction: string;
  characterDescription: string;
};

export function createCharacterScript(
  entity: ex.Entity,
  currentScene: ArgosScene
): CharacterScript {
  const { currentActionDescription, previousObject } = entity.get(
    Components.BTComponent
  );

  // todo handle undefined items here better. When the simulation first starts, these are undefined.
  // in theory the spell should take care of this, but we will need to handle it.
  if (!previousObject) return null;

  return {
    // these are for the agent params for the spell
    speaker: SESSION_ID.toString(),
    agent: describeEntity(entity).name,
    client: "sim-demo",
    channel: "0",
    // Begin normal params
    name: describeEntity(entity).name,
    world: currentScene.worldDescription,
    scene: currentScene.sceneDescription,
    currentState:
      describeComponent(entity.get(Components.NeedsComponent)) ||
      "feeling fine",
    inventory:
      describeComponent(entity.get(Components.CollectorComponent)) ||
      "not carrying anything",
    nextAction: currentActionDescription,
    // todo change this, as hard coding it is temporary.  Need to create character generation for character properties.
    characterDescription: `${name} is resolute and firm.  They are stubborn but kind and persistant in trying to survive.`,
  };
}

export function descriptionToString(
  description: { name: string; description: string; properties: string[] }[]
) {
  return description
    .map((e) => `${e.name}: ${e.description}  It ` + e.properties.join(" and "))
    .join(".\n");
}

function describeEntity(entity: ex.Entity): {
  name: string;
  description: string;
  properties: string[];
} {
  const { name, description } = entity.get(Components.DescriptionComponent);
  return {
    name: name,
    description: description,
    properties: entity
      .getComponents()
      .map((component) => describeComponent(component))
      .filter((x) => x),
  };
}

function describeComponent(
  component: ex.Component<string> & { describe?: () => string | null }
): string | null {
  if (component.describe) {
    return component.describe();
  } else {
    return null;
  }
}

/**
 * Turns generated items into Excalibur entities for use in a scene
 * Note this doesn't cover the firepit or npc, but covers everything else
 *
 * Requires the `game` for things like random positioning
 */
export function parseGeneratedItems(
  game: ex.Engine,
  sceneData: GeneratedItem[]
): ex.Entity[] {
  return sceneData.map(({ name, description, edible, combustible, imageUrl }) => {
    const basicProps = {
      // for our own debugging, not externally used
      name: name,
      pos: randomPosition(game, 1, 0.5),
      radius: rand.integer(20, 70),
      color: ex.Color.fromHex(rand.pickOne(colorScheme)),
      collisionType: ex.CollisionType.Fixed,
    };
    const actor = new ex.Actor(basicProps);
    actor.addComponent(new DescriptionComponent({ name, description, imageUrl }));
    const { tags, components } = componentsFromProperties({
      edible,
      combustible,
    });
    components.forEach((c) => actor.addComponent(c));
    tags.forEach((t) => actor.addTag(t));

    return actor;
  });
}

function componentsFromProperties(properties: {
  edible: boolean;
  combustible: boolean;
}): {
  components: ex.Component[];
  tags: string[];
} {
  const discoveredComponents: ex.Component[] = [];
  const discoveredTags: string[] = [];

  // First, let's figure out ResourceProviderComponent
  const resources = [];

  if (properties.combustible) {
    resources.push({
      name: "something combustible",
      tag: Constants.COMBUSTIBLE,
      color: ex.Color.fromHex(rand.pickOne(colorScheme)),
    });
    discoveredTags.push(Constants.COMBUSTIBLE_RESOURCE);
  }
  if (properties.edible) {
    resources.push({
      name: "something edible",
      tag: Constants.EDIBLE,
      color: ex.Color.fromHex(rand.pickOne(colorScheme)),
    });
    discoveredTags.push(Constants.EDIBLE_RESOURCE);
  }
  if (resources.length > 0)
    discoveredComponents.push(
      new Components.ResourceProviderComponent(resources)
    );

  return { components: discoveredComponents, tags: discoveredTags };
}
