// --- 0. GAME CONFIGURATION ---
const GAME_CONFIG = {
    SOCIAL_ENCOUNTER_CHANCE: 0.25, 
    TIME_BLOCKS_PER_SEMESTER: 17,
    
    // THE CENTRALIZED GRADING ENGINE
    SPI_GRADING_SCALE: [
        { min: 112, spi: 10.00 }, // Requires 16 blocks (Complete academic sacrifice)
        { min: 98, spi: 9.00 },   // Requires 14 blocks 
        { min: 84, spi: 8.00 },   // Requires 12 blocks
        { min: 70, spi: 7.00 },   // Requires 10 blocks (The old 10.0 is now a 7.0!)
        { min: 56, spi: 6.00 },   // Requires 8 blocks
        { min: 42, spi: 5.00 },   // Requires 6 blocks
        { min: 0, spi: 4.00 }     // Baseline failure
    ]
};

// --- NARRATIVE EVENT CONFIGURATIONS ---
const SUMMER_CHOICES = [
    { 
        ID: 'SUM_INTERN', Type: 'INTERNSHIP', 'Card Name': 'Complete Internship', 
        Description: 'Execute your corporate or research role.', 
        Reward_Money: 2, Cost_Stress: 3, icon: '💼', color: 'var(--accent-gold)'
    },
    { 
        ID: 'SUM_PROJ', Type: 'PROJECT', 'Card Name': 'Summer Project', 
        Description: 'Stay in empty hostels and work with a Prof.', 
        Reward_Study: 15, Cost_Social: 2, Reward_Res: 2, icon: '🔬', color: 'var(--accent-blue)'
    },
    { 
        ID: 'SUM_HOME', Type: 'NEUTRAL', 'Card Name': 'Chill at Home', 
        Description: 'Mom\'s food and absolute rest.', 
        Reward_Health: 5, Reward_Stress: 5, icon: '🏠', color: 'var(--accent-green)'
    }
];

// --- 1. CORE DATABASE & PHASE CONSTANTS ---
const db = {
    timeline: [], friction: [], por: [], intern: [], proj: [], locations: [], placement: [], social: []
};

const PHASES = {
    NARRATIVE: 'narrative',
    FRICTION: 'friction',
    OPPORTUNITY: 'opportunity',
    ACTION: 'action',
    PLACEMENT: 'placement',
    INTERLUDE: 'interlude',
    SUMMER: 'summer'
};

// --- 2. GAME STATE ---
// --- 2. GAME STATE ---
const state = {
    stats: { Health: 10, Stress: 0, Social: 0, Money:5, Study: 0, CPI: 0.00, lockedCPI: null },
    resume: { Projects: 0, Internships: 0, Positions: 0, Research: 0, Product: 0, Algo: 0 },
    turn: 1,
    semester: 1,
    phase: PHASES.NARRATIVE,
    blocksRemaining: GAME_CONFIG.TIME_BLOCKS_PER_SEMESTER,
    history: [],
    logs: [],
    activeTab: 'projects',
    
    // --- ACADEMIC TRACKERS ---
    spiHistory: [], // <--- STORES PERMANENT SEMESTER SPIs
    locationVisits: {},
    
    // --- PASSIVE ENGINE TRACKERS ---
    network: [],
    activeNetwork: [],           
    passiveCooldowns: {},  
    mentorBonusesClaimed: [],
    placementStep: 1,
    hasSeenTimeTutorial: false
};

