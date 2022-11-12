import * as ex from "excalibur";
import { SpellComponent } from "./ecs/components";

// type ComponentWithDescribe = ex.Component<string> & {
//   describe?: () => string | null;
// };

/**
 * Creates a map description of every entity from a spell
 */
export async function generateDescriptions(
  _worldDescription,
  entities: ex.Entity[]
) {
  const descriptionPromiseMap = entities
    .filter(composeHasComponents(["spell"]))
    .map(async (entity) => {
      console.log("spell entity", entity.name);
      const entityDescription = describeEntity(entity);
      // const components = entity.getComponents() as ComponentWithDescribe[]
      console.log("Entity description!", entityDescription);
      console.log("Entity spell", entity.get(SpellComponent).name);

      // Send off spell
      // Receive description
      // Add to map
    });

  return Promise.all(descriptionPromiseMap);
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

function hasComponents(entity: ex.Entity, componentNames): Boolean {
  return entity.getComponents().some((component) => {
    return componentNames.includes(component.type);
  });
}
