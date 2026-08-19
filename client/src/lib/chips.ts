// Acts on the raw input in the textarea before it becomes a plan
export const PRESET_CHIPS = [
    { label: '📊 Enhance Task ', instruction: 'Break this down into more detailed, granular steps.' },
    // { label: '✂️ Just the Essentials', instruction: 'Keep only the essential, must-do steps — skip anything optional.' },
    // { label: '⏳ Add Deadlines', instruction: 'Add a rough timeframe or target date next to each step.' },
]

// Acts on a specific AI reply that's already on screen
export const REPLY_CHIPS = [
    { label: 'More Detail', instruction: 'Break down the key steps into more detailed, actionable sub-steps.' },
    { label: "What's Missing?", instruction: 'Point out anything important that might be missing from this plan.' },
    { label: 'Simplify', instruction: 'Simplify this into fewer, clearer steps.' },
]