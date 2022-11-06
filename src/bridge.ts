import * as ex from "excalibur";

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
      return entity
        .getComponents()
        .map((component) => describeComponent(component))
        .filter((x) => x);
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

function describeComponent(
  component: ex.Component<string> & { describe?: () => string | null }
): string | null {
  if (component.describe) {
    return component.describe();
  } else {
    return null;
  }
}
