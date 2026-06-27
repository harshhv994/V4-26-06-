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
                            state.phase = PHASES.NARRATIVE;
                            state.turn++;
                            state.semester = state.turn; // Assuming 1 turn = 1 sem for now
                            state.blocksRemaining = 12;
                            this.startNarrative();
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