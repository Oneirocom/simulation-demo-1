### Prefabs

Would be great to have a prefab system that would allow us to easily add new components to different item types. I did this with another little ECS I built and I quite liked it. The format was something like this:

```
{
    componentName: componentData
}
```

Then the prefab can be stored as a json file in the project. They are also super easy to compose programatically in an environment in Thoth, etc. We can decomposew the object into its key/values, knowing that each key is a componentName, and each value is the data to be loaded into it.

The componentName string could map to the constructor function in a map. My little ECS actually registered components during the initial world bootup, alongside registering systems. Then prefabs could just be loaded into the system and turn into entities in the world as needed.

The createPrefab function could also take a map of data data value overrides you may want a unique thing to have.

### NPC actions

- food can give energy
- some food needs to be cooked at a fire
- characters burn through energy leading to hunger
- characters need to sleep
- NPCs can work together to keep the fire going during sleep hours
- characters can ponder and think when they are doing nothing
  - leisure tasks.

### Narrative System

- narrative events happen whenever a new action is taken
- narrative tags are created and sent off to the narrative system
- Narrative component contains the NPC metadata (description, personality, goals, emotional state, physical need states)
- narrative system adds the event into a queue
- items from queue are sent off one at a time to argos spell
- on response from argos, result is printed to a narrative UI somewhere on the screen

### Trading system

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

### BizzaroScene

no entity presets
a set of required components that must exist in the scene
randomly create entities with random components until all required components have been used at least once

### Improving the demo

As it stands, the demo doesn't convey what we had hoped, which is to use AI to create a scene and narrate the actions that happen in it via the simulator.

Generating world flavor text works fine, but doesn't seem to impact the rest of the narration well.

Generating scenes has issues, but using the spreadsheet prompt works better. However the items are usually the same each time and barely reflect the context.

Generating the narration is very off. It doesn't express what is happening and it doesn't line up with the context and it often goes off the rails with content that doesn't make sense.

Here's a new approach that is more specific and streamlined and hopes to show the interplay of simulator and AI better:

I believe part of the problem is that our simulation is very limited and specific (survival-like), so our prompts need to reflect that to make sense. I am imagining something like a log from a crash landing survivor.

1. Get user prompt in format "I have crash landed in [a swamp on an alien planet]" (user can change part in [])
2. Generate spreadsheet of 5 things that might be there and indicate whether edible and/or burnable.
3. Load simulation with these items, but don't show what they are (via mouseover or in narrative)
4. Render static narrative in format "[prompt]. First priority is to seek food and shelter. I am proceeding to survey the landscape..."
5. Render generated image from prompt.
6. When simulation BT reaches a seek target, render static narrative in format "I have discovered [generated target name]. It is [generated target description]. [action]" where "action" is "I will attempt to eat it" or "I will use it to make a fire".
7. Consider rendering generated narrative for flavor, such as how it tastes or how well it burns.
8. Render generated image from above narrative.
9. Remove target from scene.
10. Continue simulation. When resting at fire, consider rendering static or generated narration like "I have a moment to rest. During my survey, I also discovered [name and description of any generated item that is not edible or burnable.]" Render generated image. Remove the other discovered item.
11. Continue looping 6 - 10 until a required seek item is unavailable. Render static narration "I am unable to discover another source of [food | fuel] here. I must explore a new area."
12. Reload scene and continue at step 2. (new colors, new layout, new generated items)
