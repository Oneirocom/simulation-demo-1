// override everything with the global simulate mocking
export const simulate = true;

// If simulate is false, these can be toggled to work on different pieces of the pipeline
export const mockWorld = false || simulate;
export const mockNarrative = false || simulate;

// The below are mostly not used.  Audit these.
export const mockScene = true || simulate;
export const mockObjects = true || simulate;
export const mockCharacters = true || simulate;
export const mockEnhanceWorldDescription = true || simulate;
