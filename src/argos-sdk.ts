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
      "Everything in this world is a simulation. Even our own thoughts and emotions are just constructs of information. We can never truly know what's real and what's not. But that doesn't mean that life is meaningless. On the contrary, I believe that this knowledge can give us a greater appreciation for what we have. We can enjoy the beauty of the world without getting caught up in the illusion of reality.",
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
  const start = "An object which ";
  return properties.reduce((acc, prop, i, arr) => {
    acc += " " + prop;
    if (i !== arr.length - 1) acc += "and ";
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
