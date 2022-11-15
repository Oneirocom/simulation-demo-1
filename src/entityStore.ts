type EntityId = string;
type EntityStore = Map<string, unknown>;

export const store = new Map<EntityId, EntityStore>();

export const clearStore = () => {
  store.clear();
};

const _createOrGetEntityStore = (entityId: number) => {
  if (store.get(entityId.toString())) return store.get(entityId.toString());
  const entityStore = new Map<string, unknown>();
  store.set(entityId.toString(), entityStore);
  return store.get(entityId.toString());
};

export const getEntityStore = (entityId: number) => {
  const entityStore = _createOrGetEntityStore(entityId);

  return entityStore;
};
