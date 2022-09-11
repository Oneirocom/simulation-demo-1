export const ComponentsKeys = {
  DESCRIBE: "DESCRIBE",
  CONTAINS: "CONTAINS",
  NEEDS: "NEEDS",
  BT: "BT"
};
export const Components = {};

Components.describe = v => [ComponentsKeys.DESCRIBE, v];

Components.contains = v => [ComponentsKeys.CONTAINS, new Set(v)];

Components.needs = v => [ComponentsKeys.NEEDS, v];

Components.behaviorTree = v => [ComponentsKeys.BT, v];
