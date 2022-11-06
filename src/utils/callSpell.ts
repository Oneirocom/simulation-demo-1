const thothUrl = 'https://thoth.superreality.com:8001'

export const callSpell = async (
  spell: string,
  body: Record<string, unknown> = {},
  version: string = "latest"
) => {
  const spellEndpoint = `${thothUrl}/spells/${encodeURIComponent(
    spell
  )}/${version}`;

  const spellRequest = await fetch(spellEndpoint, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    },
  });
  const spellResponse = await spellRequest.json();
  return spellResponse;
};
