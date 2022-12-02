import { simulate } from "./config";

const completionEndpoint = "https://api.openai.com/v1/completions";
// Warning danger, only temporary
const key = new URLSearchParams(document.location.search).get("key");

export type GeneratedItem = {
  name: string;
  description: string;
  edible: boolean;
  combustible: boolean;
};

export async function generateSceneItems(
  setting: string
): Promise<GeneratedItem[]> {
  if (simulate) return mockScene;

  const sceneGenBody = {
    model: "text-davinci-003",
    prompt: [
      `I have crash landed in ${setting}.  I must seek food and shelter.`,
      "A spreadsheet of at least 5 things I might find:\n",
      "Name | Description | Can provide something to eat? | Can provide something to burn?",
      "-----------------------------------------------------------------------------------------\n",
    ].join("\n"),
    temperature: 1,
    max_tokens: 150,
    top_p: 0.73,
    frequency_penalty: 0.46,
    presence_penalty: 0.48,
  };

  return fetch(completionEndpoint, {
    method: "POST",
    body: JSON.stringify(sceneGenBody),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
  }).then((res) => {
    // TODO parse
    return mockScene;
  });
}

const mockScene = [
  {
    name: "Trees",
    description: "Tall, with large leaves and wide trunks",
    edible: false,
    combustible: true,
  },
  {
    name: "Mud Skippers",
    description: "Small fish that live in the mud of the swamp ",
    edible: true,
    combustible: false,
  },
  {
    name: "Mosses & Lichens",
    description: "Low-growing plants found on rocks and trees ",
    edible: false,
    combustible: false,
  },
  {
    name: "Fungi",
    description: "Various mushrooms and molds found in damp environments ",
    edible: true,
    combustible: false,
  },
  {
    name: "Insects & Arachnids",
    description: "Various bugs and spiders living in the swamp",
    edible: true,
    combustible: false,
  },
];

/*
I have crash landed in a swamp on an alien planet.  I must seek food and shelter.
A spreadsheet of at least 5 things I might find:

Name | Description | Can provide something to eat? | Can provide something to burn?
-----------------------------------------------------------------------------------------
Trees | Tall, with large leaves and wide trunks | No | Yes 
Mud Skippers | Small fish that live in the mud of the swamp | Yes | No 
Mosses & Lichens | Low-growing plants found on rocks and trees | No | No 
Fungi | Various mushrooms and molds found in damp environments | Yes (some species) | No 
Insects & Arachnids| Various bugs and spiders living in the swamp|Yes (some species)|No
*/
