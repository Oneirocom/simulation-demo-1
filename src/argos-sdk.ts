import {
  mockEnhanceWorldDescription,
  mockScene,
  mockWorld,
  simulate,
} from "./config";

const thothUrl = "https://thoth.superreality.com:8001";
const version = "latest";
const mockWorldDescription = {
  outputs: {
    worldDescription:
      "The year is 1920, and steam-powered automata have enslaved humanity. The rich rule over the poor, and technology has taken the place of emotion. But one man has had enough. He has a plan to overthrow the machines and free humanity from their grip.",
  },
};

const mockSceneDescription = {
  outputs: {
    sceneDescription:
      "A lonely man in an empty meadow at night with a box of possibilities on the horizong.",
  },
};

const mockObjectDescription = {
  outputs: {
    description:
      "This is a really cool object in the environment that sounds awesome.",
  },
};

const mockCharacterDescription = {
  outputs: {},
};

const mockGeneratorMap = {
  "object-generator": mockObjectDescription,
  "character-generator": mockCharacterDescription,
};

type Body = Record<string, unknown>;

export const generateWorld = async (body: {
  worldSummary: string;
  genre: string;
  style: string;
}) =>
  mockWorld
    ? Promise.resolve(mockWorldDescription)
    : callSpell("world-creator", body);

export const generateScene = async (body: { mockWorldDescription: string }) =>
  mockScene
    ? Promise.resolve(mockSceneDescription)
    : callSpell("scene-creator", body);

const formatProperties = (properties: string[]) => {
  const start = "An object which";
  return properties.reduce((acc, prop, i, arr) => {
    acc += " " + prop;
    if (i !== arr.length - 1) acc += " and ";
    if (i === arr.length) acc += ".";
    return acc;
  }, start);
};

const mockSpell = async (spellName: string) => {
  return Promise.resolve(mockGeneratorMap[spellName]);
};

export async function runGenerator(
  spellName: string,
  worldDescription: string,
  properties: string[]
) {
  const objectProperties = formatProperties(properties);
  const body = {
    worldDescription,
    objectProperties,
  };

  // todo might need to make a custom spell formatter here to process different spell responses.

  return simulate ? mockSpell(spellName) : callSpell(spellName, body);
}

// TODO not sure this is the right name or if you want the data struture or string
export async function enhanceWorldDescription(body: {
  description: string;
}): Promise<string> {
  return mockEnhanceWorldDescription
    ? Promise.resolve(body.description)
    : callSpell("enhance", body);
}

export const callSpell = async (spell: string, body: Body = {}) => {
  const spellEndpoint = `${thothUrl}/spells/${encodeURIComponent(
    spell
  )}/${version}`;

  const spellRequest = await fetch(spellEndpoint, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const spellResponse = await spellRequest.json();
  return spellResponse;
};
