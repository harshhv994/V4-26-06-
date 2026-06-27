// --- 1. CORE DATABASE & PHASE CONSTANTS ---
const db = {
    timeline: [], friction: [], por: [], intern: [], proj: [], locations: [], placement: [], social: []
};

const PHASES = {
    NARRATIVE: 'narrative',
    FRICTION: 'friction',
    OPPORTUNITY: 'opportunity',
    ACTION: 'action'
};

// --- 2. GAME STATE ---
const state = {
    stats: { Health: 100, Stress: 0, Social: 50, Money: 1000, Study: 0, CPI: 0 },
    resume: { Projects: 0, Internships: 0, Positions: 0 },
    turn: 1,
    semester: 1,
    phase: PHASES.NARRATIVE,
    blocksRemaining: 12,
    history: [],
    logs: [],
    activeTab: 'projects'
};