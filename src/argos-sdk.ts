import { simulate } from "./config";

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

type Body = Record<string, unknown>;

export const generateWorld = async (body: {
  worldSummary: string;
  genre: string;
  style: string;
}) => (simulate ? mockWorldDescription : callSpell("world-creator", body));

export const generateScene = async (body: { mockWorldDescription: string }) =>
  simulate ? mockSceneDescription : callSpell("scene-creator", body);

// TODO not sure this is the right name or if you want the data struture or string
export const enhanceWorldDescription = (body: { description: string }) => {
  console.log("Sending to ArgOs\n", body.description);
  // TODO do something with this
};

const callSpell = async (spell: string, body: Body = {}) => {
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
