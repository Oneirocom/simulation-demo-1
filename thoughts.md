- food can give energy
- some food needs to be cooked at a fire
- characters burn through energy leading to hunger
- characters need to sleep
- NPCs can work together to keep the fire going during sleep hours
- characters can ponder and think when they are doing nothing
  - leisure tasks.

Narrative System

- narrative events happen whenever a new action is taken
- narrative tags are created and sent off to the narrative system
- Narrative component contains the NPC metadata (description, personality, goals, emotional state, physical need states)
- narrative system adds the event into a queue
- items from queue are sent off one at a time to argos spell
- on response from argos, result is printed to a narrative UI somewhere on the screen

Trading system

Add ResourceComponent (with count) to Collector.
Add DominanceComponent as integer.

When Collectors collide with other Collectors run trading rules:

- A has what B wants and B has what A wants
  -- trade
- A has what B wants
  -- B has high dominance, A has low dominance
  --- B steals (aka A "offers" to commander)

Somehow only want to run in one direction (ie. A collides with B but not also B collides with A)
Consider representing rules in a trie for better effciency

Notes on naming things
- for the story narrator, I am going to need to know who a character is. They arent just a sentient being, but a specific sentient being in the story. Unless I ground the language model in specifics, it could generate new names for thingd off the bat.