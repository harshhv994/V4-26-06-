const Controller = {
    syncHUD: function () {
        UI.updateHUD(state.stats, state.resume, state.turn, state.semester, state.blocksRemaining);
        UI.updateEventLog(state.logs);
        UI.updateNetworkPanel(state.network);
    },
    closeTutorial: function () {
        state.hasSeenTimeTutorial = true;
        const modal = document.getElementById('time-tutorial-modal');
        if (modal) modal.remove();
    },

    // --- PATCH 3 ADDITION: Close Report Card ---
    closeReportCard: function () {
        const modal = document.getElementById('report-card-modal');
        if (modal) modal.remove();
    },

    startNarrative: function () {
        const currentData = db.timeline.find(t => t.Turn === state.turn);
        if (!currentData) {
            UI.updateBoard(`<h2>Game Over</h2><p>Proceed to Placement Evaluation.</p>`);
            return;
        }
        UI.updateNarrativeSidePanel(`${currentData.Semester}: ${currentData.Phase}`, currentData['the vibe']);
        UI.updateBoard(UI.renderNarrative(currentData.Phase, currentData['the psychology '], currentData.Poetic));

        // --- ONE-TIME UX TUTORIAL ---
        if (state.turn === 1 && !state.hasSeenTimeTutorial) {
            document.body.insertAdjacentHTML('beforeend', UI.renderTutorialModal());
        }
    },
    startInterlude: function () {
        UI.updateNarrativeSidePanel("The SPO Portal", "The official placement office portal is live. Major corporate internships are now available.");
        
        // Filter: Only load heavy corporate SPO internships for the Interlude
        const validInterns = db.intern.filter(card => card.Category === 'SPO');

        UI.updateBoard(UI.renderInterlude(validInterns));
        this.syncHUD();
    },

    handleInterludeSelection: function (cardId) {
        if (cardId === 'SKIP') {
            state.stats.Health += 5;
            state.stats.Stress -= 5;
            Logic.clampStats();
            Logic.addLog({
                type: 'neutral', icon: '🏠', title: 'Summer at Home',
                desc: 'You took a break, recovered your health, and lowered your stress.',
                effects: { Health: 5, Stress: -5 },
                semester: state.semester, turn: state.turn
            });
        } else {
            const card = db.intern.find(c => c.ID === cardId);
            if (!card) return;
            if (state.history.includes(card.ID)) return;
            const validation = Logic.validateAction(card);
            if (!validation.allowed) {
                alert(validation.reason);
                return;
            }
            const result = Logic.processCardEffect(card, 'opportunity');
            Logic.addLog(result);
            state.history.push(card.ID);
        }

        // Fast forward directly to Turn 6 (Semester 5)
        state.turn = 6;
        state.semester = 5;
        state.blocksRemaining = Logic.getBlocksForTurn(state.turn); // CENTRALIZED ALLOCATION
        state.phase = PHASES.NARRATIVE;

        this.startNarrative();
        this.syncHUD();
    },
    startSummer: function () {
        UI.updateNarrativeSidePanel("The Summer Divide", "Empty hostels, quiet campus roads, or a new city skyline.");
        UI.updateBoard(UI.renderSummer());
        this.syncHUD();
    },

    handleSummerSelection: function (choice) {
        if (choice === 'INTERN') {
            const hasInternship = state.history.some(id => id.startsWith('INT_'));
            if (!hasInternship) {
                alert('You need to secure an internship before you can complete one.');
                return;
            }
            if (state.stats.Stress + 3 > 10) {
                alert('Burnout: you are too stressed to complete the internship. Choose recovery or a different summer path.');
                return;
            }
            state.stats.Money += 2;
            state.stats.Stress += 3;
            Logic.addLog({ type: 'neutral', icon: '💼', title: 'Summer Internship', desc: 'Completed your secured internship.', effects: { Money: 2, Stress: 3 }, semester: state.semester, turn: state.turn });
        } else if (choice === 'PROJECT') {
            if (state.stats.Social < 2) {
                alert('Not enough Social support for the summer project.');
                return;
            }
            state.stats.Study += 15;
            state.stats.Social -= 2;
            state.resume.Research += 2;
            Logic.addLog({ type: 'neutral', icon: '🔬', title: 'Summer Project', desc: 'Built your research profile.', effects: { Study: 15, Social: -2, Research: 2 }, semester: state.semester, turn: state.turn });
        } else if (choice === 'HOME') {
            state.stats.Health += 5;
            state.stats.Stress -= 5;
            Logic.addLog({ type: 'neutral', icon: '🏠', title: 'Chilled at Home', desc: 'Recovered from burnout.', effects: { Health: 5, Stress: -5 }, semester: state.semester, turn: state.turn });
        }
        Logic.clampStats();

        // SNAPSHOT THE CPI FOR PLACEMENTS VIA THE ENGINE
        Logic.updateCPI(true);

        // Fast forward directly to Turn 9 (Semester 7)
        state.turn = 9;
        state.semester = 7;
        state.blocksRemaining = Logic.getBlocksForTurn(state.turn); // CENTRALIZED ALLOCATION
        // Drop them into the Sem 7 Narrative (The Final Sprint)
        state.phase = PHASES.NARRATIVE;
        this.startNarrative();
        this.syncHUD();

        // Trigger the SPO System Pop-up to warn the player
        setTimeout(() => {
            alert(`🏢 SPO OFFICIAL NOTICE:\n\nYour Placement CPI has been formally locked at ${state.stats.lockedCPI.toFixed(2)} based on your 6th-semester transcript.\n\nYou have exactly ${GAME_CONFIG.TIME_BLOCKS_PER_SEMESTER} available blocks (Semester 7) left to aggressively acquire final PORs, Projects, and hidden skills before the Placement Drive begins!`);
        }, 100);
    },

    startFriction: function () {
        const eventCard = Logic.drawRandomFriction();
        if (eventCard) {
            const result = Logic.processCardEffect(eventCard, 'friction');
            Logic.addLog(result);
        }
        UI.updateBoard(UI.renderFriction(eventCard));
    },

    startOpportunity: function () {
        // Default to showing the 'projects' tab when the phase opens
        this.handleTabSwitch('projects');
    },

    startAction: function () {
        // Send UI only the data it needs
        const validLocs = db.locations.filter(l => (parseInt(l.Sem_Unlocked) || 1) <= state.semester);
        UI.updateBoard(UI.renderAction(validLocs, state.blocksRemaining));
    },

    startPlacement: function () {
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
    advancePhase: function () {
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
                if (state.turn === 10) {
                    state.phase = PHASES.PLACEMENT;
                    state.placementStep = 1;
                    this.startPlacement();
                    break;
                }

                if (state.turn > 1 && state.network.length > 0 && state.maintenanceDoneForTurn !== state.turn) {
                    state.activeNetwork = [];
                    document.body.insertAdjacentHTML('beforeend', UI.renderSocialMaintenanceModal(state.network, state.blocksRemaining));
                    UI.bindMaintenanceModalListeners(state.blocksRemaining);
                    return; // HALT THE GAME LOOP
                }


                state.phase = PHASES.FRICTION;
                this.startFriction();
                break;

            case PHASES.INTERLUDE:
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



            // --- PATCH 3: REWRITTEN ACTION PHASE (REPORT CARD TRIGGER) ---
            case PHASES.ACTION: {  // <--- ADD THIS OPENING BRACE
                const academicTurns = [1, 2, 3, 4, 6, 7, 9, 11];
                const isAcademic = academicTurns.includes(state.turn);

                const prevStudy = state.stats.Study;
                const prevSem = state.semester;

                Logic.calculateSemesterSPI();

                const earnedSPI = isAcademic && state.spiHistory.length > 0 ? state.spiHistory[state.spiHistory.length - 1] : 0;

                state.phase = PHASES.NARRATIVE;
                state.turn++;

                const turnToSem = {
                    1: 1, 2: 2, 3: 3, 4: 4,
                    5: 4, 6: 5, 7: 6, 8: 6, 9: 7, 10: 8, 11: 8
                };
                state.semester = turnToSem[state.turn] || 8;

                state.blocksRemaining = Logic.getBlocksForTurn(state.turn);

                if (state.turn === 10) {
                    state.phase = PHASES.PLACEMENT;
                    state.placementStep = 1;
                    state.semester = "Placement";
                    this.startPlacement();
                } else {
                    this.startNarrative();
                }

                this.syncHUD();

                // ONLY SHOW REPORT CARD HERE
                if (isAcademic) {
                    document.body.insertAdjacentHTML('beforeend', UI.renderReportCardModal(prevSem, prevStudy, earnedSPI, state.stats.CPI));
                }
                break;
            } // <--- ADD THIS CLOSING BRACE

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
                    state.blocksRemaining = Logic.getBlocksForTurn(state.turn); // CENTRALIZED ALLOCATION
                    state.phase = PHASES.NARRATIVE;
                    this.startNarrative();
                }
                this.syncHUD();
                break;
        }
        this.syncHUD();
    },

    handleLocationClick: function (locationId) {
        const card = db.locations.find(l => l.ID === locationId) || db.loc.find(l => l.ID === locationId);
        if (!card) return;

        const validation = Logic.validateAction(card);
        if (!validation.allowed) {
            alert(`Cannot visit ${card.Location_Name}: ${validation.reason}`);
            return;
        }

        // Process the location effects
        const result = Logic.processCardEffect(card, 'location');
        Logic.addLog(result);

        // NEW: Check for deterministic Social Unlocks based on this location
        const socialUnlock = Logic.checkSocialEncounter(card);
        if (socialUnlock) {
            const newFriend = Logic.acquireSocialConnection(socialUnlock);
            Logic.addLog({
                type: 'opportunity',
                icon: '🤝',
                title: `New Connection Unlocked: ${newFriend.name}`,
                effects: { Social: 1 }, 
                semester: state.semester,
                turn: state.turn
            });
            // Force the UI to refresh the network panel immediately
            UI.updateNetworkPanel(state.network);
        }

        this.syncHUD();
        this.advanceTurn();
    },

    handleTabSwitch: function (tabName) {
        try {
            state.activeTab = tabName;
            let tabData = [];

            if (tabName === 'projects') {
                tabData = (db.proj || []).filter(card => {
                    const start = parseInt(card.Sem_Start) || 1;
                    const end = parseInt(card.Sem_End) || 8;
                    return state.semester >= start && state.semester <= end;
                }).map(card => {
                    const reqEval = Logic.evaluateRequirements(card.Req_Prerequisite);
                    const isDrafted = state.history.includes(card.ID);
                    const isAffordable = Logic.validateAction(card).allowed;
                    let cardHtml = '';
                    if (isDrafted) {
                        cardHtml = `<div class="opp-card locked" style="border-color: #333; opacity: 0.6;">
                                        <div>
                                            <div style="font-weight: bold; color: var(--accent-green);">✓ ${card['Card Name'] || card.ID}</div>
                                            <div style="font-size: 0.85em; margin-top: 5px; color: var(--text-muted);">Already Completed.</div>
                                        </div>
                                    </div>`;
                    } else {
                        cardHtml = UI.components.oppCard(card, reqEval.locked, isAffordable, reqEval.html);
                    }
                    return { html: cardHtml };
                });
            } else if (tabName === 'pors') {
                tabData = (db.por || []).filter(card => {
                    const start = parseInt(card.Sem_Start) || 1;
                    const end = parseInt(card.Sem_End) || 8;
                    return state.semester >= start && state.semester <= end;
                }).map(card => {
                    const reqEval = Logic.evaluateRequirements(card.Req_Prerequisite);
                    const isDrafted = state.history.includes(card.ID);
                    const isAffordable = Logic.validateAction(card).allowed;
                    let cardHtml = '';
                    if (isDrafted) {
                         cardHtml = `<div class="opp-card locked" style="border-color: #333; opacity: 0.6;">
                                        <div>
                                            <div style="font-weight: bold; color: var(--accent-green);">✓ ${card['Card Name'] || card.ID}</div>
                                            <div style="font-size: 0.85em; margin-top: 5px; color: var(--text-muted);">Already Completed.</div>
                                        </div>
                                    </div>`;
                    } else {
                        cardHtml = UI.components.oppCard(card, reqEval.locked, isAffordable, reqEval.html);
                    }
                    return { html: cardHtml };
                });
            } else if (tabName === 'interns') {
                // Load Off-Campus internships dynamically
                tabData = (db.intern || []).filter(card => {
                    const start = parseInt(card.Sem_Start) || 3;
                    const end = parseInt(card.Sem_End) || 8;
                    return card.Category === 'Off-Campus' && state.semester >= start && state.semester <= end;
                }).map(card => {
                    const reqEval = Logic.evaluateRequirements(card.Req_Prerequisite);
                    const isDrafted = state.history.includes(card.ID);
                    const isAffordable = Logic.validateAction(card).allowed;
                    let cardHtml = '';
                    if (isDrafted) {
                        cardHtml = `<div class="opp-card locked" style="border-color: #333; opacity: 0.6;">
                                        <div>
                                            <div style="font-weight: bold; color: var(--accent-green);">✓ ${card['Card Name'] || card.ID}</div>
                                            <div style="font-size: 0.85em; margin-top: 5px; color: var(--text-muted);">Already Completed.</div>
                                        </div>
                                    </div>`;
                    } else {
                        cardHtml = UI.components.oppCard(card, reqEval.locked, isAffordable, reqEval.html);
                    }
                    return { html: cardHtml };
                });
            }

            if (tabData.length === 0) {
                tabData.push({ html: '<p style="color: var(--text-muted); padding: 15px; font-style: italic;">No new opportunities available for your current semester.</p>' });
            }

            // 3. Send it back to your UI to re-render the board and update the active tab
            UI.updateBoard(UI.renderOpportunity(tabData, tabName));

        } catch (error) {
            console.error("Tab Switch Error: ", error);
        }
    },

    handleDraftClick: function (cardId) {
        // Search all databases to find the card
        const card = db.proj.find(c => c.ID === cardId) ||
            db.intern.find(c => c.ID === cardId) ||
            db.por.find(c => c.ID === cardId);

        const validation = Logic.validateAction(card);
        if (!validation.allowed) {
            alert(validation.reason);
            return;
        }

        if (Logic.draftCard(cardId, card)) {
            const result = Logic.processCardEffect(card, 'opportunity');
            Logic.addLog(result);
            state.history.push(card.ID);

            this.startOpportunity();
            this.syncHUD();
        }
    },
    // --- SYNC: RESUME GAME LOOP AFTER MAINTENANCE ---
    handleSocialMaintenanceConfirm: function (selectedIds, totalCost) {
        if (totalCost > state.blocksRemaining) return;

        state.blocksRemaining -= totalCost;
        state.activeNetwork = selectedIds;
        state.maintenanceDoneForTurn = state.turn; // Marks that we paid for this semester

        const modal = document.getElementById('social-maintenance-modal');
        if (modal) modal.remove();

        // Apply stats directly from CSV and show the Summary Screen
        const summaryData = Logic.applyMaintenanceRewards(selectedIds);
        document.body.insertAdjacentHTML('beforeend', UI.renderMaintenanceSummaryModal(summaryData, totalCost));
    },

    handleMaintenanceSummaryConfirm: function () {
        const modal = document.getElementById('maintenance-summary-modal');
        if (modal) modal.remove();

        // Resume Game Loop into the Friction phase!
        state.phase = PHASES.FRICTION;
        this.startFriction();
        this.syncHUD();
    },

};
