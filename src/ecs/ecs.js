const entitiesByComponent = new Map();
export const Components = {};
const entities = new Map();

export function registerComponent(key, fn) {
  Components[key] = v => [key, fn(v)];
}

export function init(startingScene) {
  Object.entries(startingScene).forEach(args => {
    addEntity.apply(null, args);
  });
}

export function addEntity(id, components) {
  entities.set(id, new Map());
  components.forEach(args => addComponent.apply(null, [id, ...args]));
}

export function removeEntity(id) {
  const components = entity(id);
  entities.delete(id);
  [...components.keys()].map(c => entitiesByComponent.get(c).delete(id));
}

export function addComponent(id, key, values) {
  entitiesByComponent.set(
    key,
    (entitiesByComponent.get(key) || new Set()).add(id)
  );

  return entities.set(id, entities.get(id).set(key, values));
}

export function removeComponent(id, key) {
  entities.get(id).delete(key);
  entitiesByComponent.get(key).delete(id);
}

/**
 * Retrieves an entity's components

 * @param {string} id - entity id
 * @return {Map<string, any>} a Map of components
 */
export function entity(id) {
  return entities.get(id);
}

/**
 * Finds entity ids that have all specified components.

 * @param {[string, ...string[]]} query - List of component keys
 *
 * @return {string[]} List of matching entities
 */
export function query([first, ...rest]) {
  const matches = new Set(entitiesByComponent.get(first));
  for (const id of matches.values()) {
    const e = entity(id);
    if (!rest.map(c => e.has(c)).every(x => x)) matches.delete(id);
  }
  return [...matches];
}

/**
 * Replaces an entity's component's data with the new data provided

 * @param {string} id - the entity id to update
 * @param {string} componentId - the component id to update
 * @param {(data: any) => any} fn - a function that gets the current component data and returns new data
 */
export function update(id, component, fn) {
  const e = entity(id);
  const data = e.get(component);
  if (data) {
    e.set(component, fn(data));
  }
}

export function debug() {
  console.debug("entities", entities);
  console.debug("entitiesByComponent", entitiesByComponent);
}
