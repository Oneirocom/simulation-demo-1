import { simulate } from "./config";

const completionEndpoint = "http://localhost:8080/api/generate";

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

  const body = {
    model: "text-davinci-003",
    prompt: [
      `I have crash landed in ${setting}.  I must seek food and shelter.`,
      "A spreadsheet of at least 5 things I might find:\n",
      "|Name | Description | Can provide something to eat? | Can provide something to burn?|",
      "-----------------------------------------------------------------------------------------\n",
    ].join("\n"),
    temperature: 1,
    max_tokens: 150,
    top_p: 0.73,
    frequency_penalty: 0.46,
    presence_penalty: 0.48,
  };

  const response = await fetch(completionEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  console.log("raw response", data.result);
  const parsed = parse(data.result);
  console.log("parsed", parsed);
  return parsed;
}

function parse(data: string) {
  const lines = data.split("\n");
  const parsed = [];
  for (const line of lines) {
    const fields = line.split("|").filter((x) => x !== "");
    console.log(fields);
    if (fields[0].includes("---")) continue;
    if (fields.length < 4) continue;
    const obj = {
      name: fields[0].trim().replace(/^\d\.\s*/, ""),
      description: fields[1].trim(),
      edible: fields[2].toLowerCase().includes("yes"),
      combustible: fields[3].toLowerCase().includes("yes"),
    };
    parsed.push(obj);
  }
  return parsed;
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
