// override everything with the global simulate mocking
export const simulate = true;

// If simulate is false, these can be toggled to work on different pieces of the pipeline
export const mockWorld = simulate || true;
export const mockScene = simulate || true;
export const mockObjects = simulate || false;
export const mockCharacters = simulate || false;
export const mockEnhanceWorldDescription = simulate || true;
