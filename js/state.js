// --- 0. GAME CONFIGURATION ---
const GAME_CONFIG = {
    SOCIAL_ENCOUNTER_CHANCE: 0.25, 
    TIME_BLOCKS_PER_SEMESTER: 17,
    
    // THE CENTRALIZED GRADING ENGINE
    SPI_GRADING_SCALE: [
        { min: 70, spi: 10.00 },
        { min: 66, spi: 9.67 },
        { min: 62, spi: 9.33 },
        { min: 58, spi: 9.00 },
        { min: 54, spi: 8.67 },
        { min: 50, spi: 8.33 },
        { min: 46, spi: 8.00 },
        { min: 42, spi: 7.67 },
        { min: 38, spi: 7.33 },
        { min: 34, spi: 7.00 },
        { min: 30, spi: 6.67 },
        { min: 26, spi: 6.33 },
        { min: 22, spi: 6.00 },
        { min: 0,  spi: 5.00 }
    ]
};

// --- NARRATIVE EVENT CONFIGURATIONS ---
const SUMMER_CHOICES = [
    { 
        ID: 'SUM_INTERN', Type: 'INTERNSHIP', 'Card Name': 'Complete Internship', 
        Description: 'Execute your corporate or research role.', 
        Reward_Money: 2000, Cost_Stress: 30, icon: '💼', color: 'var(--accent-gold)' 
    },
    { 
        ID: 'SUM_PROJ', Type: 'PROJECT', 'Card Name': 'Summer Project', 
        Description: 'Stay in empty hostels and work with a Prof.', 
        Reward_Study: 15, Cost_Social: 20, Reward_Res: 2, icon: '🔬', color: 'var(--accent-blue)' 
    },
    { 
        ID: 'SUM_HOME', Type: 'NEUTRAL', 'Card Name': 'Chill at Home', 
        Description: 'Mom\'s food and absolute rest.', 
        Reward_Health: 100, Reward_Stress: 100, icon: '🏠', color: 'var(--accent-green)'
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
    stats: { Health: 100, Stress: 0, Social: 50, Money: 1000, Study: 0, CPI: 0.00, lockedCPI: null },
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
    
    // --- PASSIVE ENGINE TRACKERS ---
    network: [],           
    passiveCooldowns: {},  
    placementStep: 1,
    hasSeenTimeTutorial: false
};

