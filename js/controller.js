            const Controller = {
                syncHUD: function() {
                    UI.updateHUD(state.stats, state.resume, state.turn, state.semester, state.blocksRemaining);
                    UI.updateEventLog(state.logs);
                    UI.updateNetworkPanel(state.network); // <--- ADD THIS LINE
                },

                startNarrative: function() {
                    const currentData = db.timeline.find(t => t.Turn === state.turn);
                    if (!currentData) {
                        UI.updateBoard(`<h2>Game Over</h2><p>Proceed to Placement Evaluation.</p>`);
                        return;
                    }
                    UI.updateNarrativeSidePanel(`${currentData.Semester}: ${currentData.Phase}`, currentData['the vibe']);
                    UI.updateBoard(UI.renderNarrative(currentData.Phase, currentData['the psychology '], currentData.Poetic));
                },
                startInterlude: function() {
                    UI.updateNarrativeSidePanel("The Intern Selection", "The SPO portal is live. Evaluate your options based on the resume you have built.");
                    // Send all available internships to the UI
                    UI.updateBoard(UI.renderInterlude(db.intern));
                },

                handleInterludeSelection: function(cardId) {
                    if (cardId === 'SKIP') {
                        state.stats.Health = Math.min(200, state.stats.Health + 50);
                        state.stats.Stress = Math.max(0, state.stats.Stress - 50);
                        Logic.clampStats();
                        Logic.addLog({
                            type: 'neutral', icon: '🏠', title: 'Summer at Home',
                            desc: 'You took a break, recovered your health, and lowered your stress.',
                            effects: { Health: 50, Stress: -50 },
                            semester: state.semester, turn: state.turn
                        });
                    } else {
                        const card = db.intern.find(c => c.ID === cardId);
                        if (!card) return;
                        const result = Logic.processCardEffect(card, 'opportunity');
                        Logic.addLog(result);
                        state.history.push(card.ID);
                    }
                    
                    // Fast forward directly to Turn 6 (Semester 5)
                    state.turn = 6;
                    state.semester = 5;
                    state.blocksRemaining = 12;
                    state.phase = PHASES.NARRATIVE;
                    
                    this.startNarrative();
                    this.syncHUD();
                },
                startSummer: function() {
                    UI.updateNarrativeSidePanel("The Summer Divide", "Empty hostels, quiet campus roads, or a new city skyline.");
                    UI.updateBoard(UI.renderSummer());
                },

                handleSummerSelection: function(choice) {
                    if (choice === 'INTERN') {
                        state.stats.Money += 2000;
                        state.stats.Stress = Math.min(200, state.stats.Stress + 30);
                        state.resume.Internships += 1;
                        Logic.addLog({ type: 'neutral', icon: '💼', title: 'Summer Internship', desc: 'Gained work experience.', effects: { Money: 2000, Stress: 30 }, semester: state.semester, turn: state.turn });
                    } else if (choice === 'PROJECT') {
                        state.stats.Study += 15;
                        state.stats.Social = Math.max(0, state.stats.Social - 20);
                        state.resume.Research += 2;
                        Logic.addLog({ type: 'neutral', icon: '🔬', title: 'Summer Project', desc: 'Built your research profile.', effects: { Study: 15, Social: -20 }, semester: state.semester, turn: state.turn });
                    } else if (choice === 'HOME') {
                        state.stats.Health = Math.min(200, state.stats.Health + 100);
                        state.stats.Stress = 0;
                        Logic.addLog({ type: 'neutral', icon: '🏠', title: 'Chilled at Home', desc: 'Recovered from burnout.', effects: { Health: 100, Stress: -100 }, semester: state.semester, turn: state.turn });
                    }
                    Logic.clampStats();
                    
                    // SNAPSHOT THE CPI FOR PLACEMENTS
                    state.stats.lockedCPI = state.stats.CPI; 
                    
                    // Fast forward directly to Turn 9 (Semester 7)
                    state.turn = 9;
                    state.semester = 7;
                    state.blocksRemaining = 12;
                    
                    // Drop them into the Sem 7 Narrative (The Final Sprint)
                    state.phase = PHASES.NARRATIVE;
                    this.startNarrative();
                    this.syncHUD();

                    // Trigger the SPO System Pop-up to warn the player
                    setTimeout(() => {
                        alert(`🏢 SPO OFFICIAL NOTICE:\n\nYour Placement CPI has been formally locked at ${state.stats.lockedCPI.toFixed(2)} based on your 6th-semester transcript.\n\nYou have exactly 12 blocks (Semester 7) left to aggressively acquire final PORs, Projects, and hidden skills before the Placement Drive begins!`);
                    }, 100);
                },


                startFriction: function() {
                    const eventCard = Logic.drawRandomFriction();
                    if (eventCard) {
                        const result = Logic.processCardEffect(eventCard, 'friction');
                        Logic.addLog(result);
                    }
                    UI.updateBoard(UI.renderFriction(eventCard));
                },

                // PHASE 3: Completely rewritten startOpportunity
                startOpportunity: function() {
                    // 1. Pick the correct database based on the active tab
                    let rawData = [];
                    if (state.activeTab === 'projects') rawData = db.proj;
                    if (state.activeTab === 'interns') rawData = db.intern;
                    if (state.activeTab === 'pors') rawData = db.por;

                    // 2. Filter for current semester (Internships might be 'summer')
                    const availableCards = rawData.filter(c => {
                        if (c.Sem_Start === 'summer') return state.semester % 2 === 0; // Show summers after even sems
                        return state.semester >= (parseInt(c.Sem_Start) || 1);
                    });

                    // 3. Process requirements and build UI data objects
                    const tabData = availableCards.map(card => {
                        const reqEval = Logic.evaluateRequirements(card.Req_Prerequisite);
                        const cost = Logic.getSafeInt(card.Cost_Time);
                        const isAffordable = state.blocksRemaining >= cost;
                        
                        return {
                            id: card.ID,
                            html: UI.components.oppCard(card, reqEval.locked, isAffordable, reqEval.html)
                        };
                    });

                    UI.updateBoard(UI.renderOpportunity(tabData, state.activeTab));
                },

                startAction: function() {
                    // Send UI only the data it needs
                    const validLocs = db.locations.filter(l => (parseInt(l.Sem_Unlocked) || 1) <= state.semester);
                    UI.updateBoard(UI.renderAction(validLocs, state.blocksRemaining));
                },

                startPlacement: function() {
                    // FIX: Force the left narrative panel to say "SPO Placement Drive"
                    UI.updateNarrativeSidePanel("SPO Placement Drive", "Sheer adrenaline, whiteboards, rapid-fire interviews, and the golden offer letter.");
                    
                    // FIX: Ensure the HUD updates to show "Sem Placement" and "0 Blocks"
                    this.syncHUD();
                    
                    if (state.placementStep === 1) {
                        const resume = Logic.getRichResume();
                        UI.updateBoard(UI.renderPlacementResume(resume));
                    } else if (state.placementStep === 2) {
                        const results = Logic.evaluateAllPlacements();
                        UI.updateBoard(UI.renderPlacementFit(results));
                    } else if (state.placementStep === 3) {
                        const results = Logic.evaluateAllPlacements();
                        const bestCompany = Logic.getBestPlacementOffer(results);
                        UI.updateBoard(UI.renderPlacementOutcome(bestCompany));
                    }
                    this.syncHUD();
                },

                advancePhase: function() {
                    switch (state.phase) {
                        case PHASES.NARRATIVE:
                            if (state.turn === 5) {
                                state.phase = PHASES.INTERLUDE;
                                this.startInterlude();
                                break;
                            }
                            if (state.turn === 8) {
                                state.phase = PHASES.SUMMER;
                                this.startSummer();
                                break;
                            }
                            
                            // FAILSAFE: If the game tries to play Turn 10 as a normal semester, hijack it.
                            if (state.turn === 10) {
                                state.phase = PHASES.PLACEMENT;
                                state.placementStep = 1;
                                this.startPlacement();
                                break;
                            }

                            // Otherwise, play a normal semester
                            state.phase = PHASES.FRICTION;
                            this.startFriction();
                            break;

                        case PHASES.INTERLUDE:
                            // Default to skip if they bypass the UI buttons
                            this.handleInterludeSelection('SKIP');
                            break;
                        case PHASES.SUMMER:
                            this.handleSummerSelection('HOME');
                            break;
                        case PHASES.FRICTION:
                            state.phase = PHASES.OPPORTUNITY;
                            this.startOpportunity();
                            break;
                        case PHASES.OPPORTUNITY:
                            state.phase = PHASES.ACTION;
                            this.startAction();
                            break;
                        case PHASES.ACTION:
                            Logic.calculateEndSemesterCPI();
                            
                            // Advance the clock to the next phase
                            state.phase = PHASES.NARRATIVE;
                            state.turn++;
                            
                            const turnToSem = {
                                1: 1, 2: 2, 3: 3, 4: 4, 
                                5: 4, // Interlude
                                6: 5, 7: 6, 
                                8: 6, // Summer
                                9: 7, 
                                10: 8, // Placements happen before Sem 8 actually starts
                                11: 8
                            };
                            state.semester = turnToSem[state.turn] || 8; 
                            state.blocksRemaining = 12;

                            // INTERCEPT: After Sem 7 finishes (Turn 10 starts) -> Trigger Placements
                            // INTERCEPT: After Sem 7 finishes (Turn 10 starts) -> Trigger Placements
                            if (state.turn === 10) {
                                state.phase = PHASES.PLACEMENT;
                                state.placementStep = 1;
                                
                                // FIX: Override the HUD variables so it doesn't say "Sem 8" or "12 Blocks"
                                state.semester = "Placement"; 
                                state.blocksRemaining = 0; 
                                
                                this.startPlacement();
                                break; 
                            }

                            this.startNarrative();
                            break;

                        case PHASES.PLACEMENT:
                            if (state.placementStep === 1) {
                                state.placementStep = 2;
                                this.startPlacement();
                            } else if (state.placementStep === 2) {
                                state.placementStep = 3;
                                this.startPlacement();
                            } else {
                                // EXTREMELY IMPORTANT: Placements are done! 
                                // We must push the clock to Turn 11 (Sem 8) so Turn 10 ends completely.
                                state.turn = 11;
                                state.semester = 8;
                                state.blocksRemaining = 12;
                                state.phase = PHASES.NARRATIVE;
                                this.startNarrative();
                            }
                            this.syncHUD();
                            break;
                    }
                    this.syncHUD();
                },

                handleLocationClick: function(locId) {
                    const loc = db.locations.find(l => l.ID === locId);
                    if (!loc || state.blocksRemaining < Logic.getSafeInt(loc.Cost_Time)) return;
                    
                    const result = Logic.processCardEffect(loc, 'location');
                    Logic.addLog(result);

                    // --- CHECK FOR SOCIAL ENCOUNTER ---
                    const encounter = Logic.checkSocialEncounter();
                    if (encounter) {
                        const conn = Logic.acquireSocialConnection(encounter);
                        
                        // Rich Narrative Log
                        Logic.addLog({
                            type: 'opportunity', // Gold color
                            icon: '🤝',
                            title: `${conn.name} joined your network`,
                            desc: `📍 While spending time at ${loc.Location_Name}, you bumped into someone new.<br><span style="color: var(--text-muted); font-size: 0.9em; font-style: italic;">Passive: ${conn.passiveDesc}</span>`,
                            effects: { Social: 1 }, 
                            semester: state.semester,
                            turn: state.turn
                        });
                        
                        state.stats.Social += 1;
                        Logic.clampStats();
                    }
                    
                    this.startAction(); 
                    this.syncHUD();
                },

                // PHASE 3: New tab switching handler
                handleTabSwitch: function(tabName) {
                    state.activeTab = tabName;
                    this.startOpportunity(); // Re-render the UI with the new tab
                },

                // PHASE 3: New draft click handler
                handleDraftClick: function(cardId) {
                    // Search all databases to find the card
                    const card = db.proj.find(c => c.ID === cardId) || 
                                 db.intern.find(c => c.ID === cardId) || 
                                 db.por.find(c => c.ID === cardId);
                    
                    if (Logic.draftCard(cardId, card)) {
                        const result = Logic.processCardEffect(card, 'opportunity');
                        Logic.addLog(result);
                        state.history.push(card.ID);
                        
                        this.startOpportunity(); 
                        this.syncHUD();
                    }
                }
            };