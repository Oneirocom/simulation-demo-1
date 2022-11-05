import * as ex from "excalibur";
import { describeTagComponent } from "./ecs/components";

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
function describeComponent(
  component: ex.Component<string> & { describe?: () => string }
): string | null {
  // NOTE components should know how to describe themselves, but for builtin ex components (like TagComponent) we have to do something different
  if (component.constructor === ex.TagComponent) {
    return describeTagComponent(component);
  } else if (component.describe) {
    return component.describe();
  } else {
    return null;
  }
}
