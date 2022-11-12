import * as ex from "excalibur";
import { runGenerator } from "./argos-sdk";
import { GeneratorComponent } from "./ecs/components";

const reduceDescriptionResponses = (acc, response) => {
  return (acc[response.entityId] = response.data);
};

/**
 * Creates a map description of every entity from a spell
 */
export async function generateDescriptions(
  worldDescription,
  entities: ex.Entity[]
) {
  const descriptionPromiseMap = entities
    .filter(composeHasComponents(["generator"]))
    .map(async (entity) => {
      const spellKey = entity.get(GeneratorComponent).spellName;
      const entityDescription = describeEntity(entity);
      console.log("entityDescription", entityDescription);
      const spellResult = runGenerator(
        spellKey,
        worldDescription,
        entityDescription
      );

      // doing this to maintain the promise return for promise.all, but to also format the data for a further reduce
      return spellResult.then((result) => {
        console.log("result", result);
        return {
          entityId: entity.id,
          data: result.outputs,
        };
      });
    });

  // format responses into a map before returning
  return (await Promise.all(descriptionPromiseMap)).reduce(
    reduceDescriptionResponses,
    {}
  );
}

/**
 * Pure function that converts a list of entities into a description
 */
export function describeWorld(entities: ex.Entity[]) {
  // TODO maybe provide a "perspective" entity?
  const description = entities
    .map((entity) => {
      // Maybe describe the size?
      // Maybe describe the location (ie. "to the West")?
      // Maybe describe how near or far from perspective entity?
      return describeEntity(entity);
    })
    .filter((x) => x.length > 0);

  return description;
}

export function descriptionToString(description) {
  return (
    "The world has " +
    description
      .map((e) => "something that " + e.join(" and "))
      .join(".\nIt also has ") +
    "."
  );
}

function describeEntity(entity): string[] {
  return entity
    .getComponents()
    .map((component) => describeComponent(component))
    .filter((x) => x);
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

const composeHasComponents = (componentNames) => (entity) =>
  hasComponents(entity, componentNames);

function hasComponents(entity: ex.Entity, componentNames): boolean {
  return entity.getComponents().some((component) => {
    return componentNames.includes(component.type);
  });
}
