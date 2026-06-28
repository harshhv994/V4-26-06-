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
                    UI.updateNarrativeSidePanel("Semester 7: The Reckoning", "Your summer internship has concluded. You return to campus to face the Placement Drive.");
                    
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
                            state.phase = PHASES.FRICTION;
                            this.startFriction();
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
                            
                            // Advance the clock to the next semester
                            state.phase = PHASES.NARRATIVE;
                            state.turn++;
                            state.semester = state.turn; 
                            state.blocksRemaining = 12;

                            // INTERCEPT: After Sem 6 Action (Summer Internships) -> Start of Sem 7
                            if (state.semester === 7) {
                                state.phase = PHASES.PLACEMENT;
                                state.placementStep = 1;
                                this.startPlacement();
                                break; 
                            }

                            this.startNarrative();
                            break;

                        case PHASES.PLACEMENT:
                            // Cycle through the 3 reflective screens
                            if (state.placementStep < 3) {
                                state.placementStep++;
                                this.startPlacement();
                            } else {
                                // Done reflecting, formally continue into the Semester 7 Narrative
                                state.phase = PHASES.NARRATIVE;
                                this.startNarrative();
                            }
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