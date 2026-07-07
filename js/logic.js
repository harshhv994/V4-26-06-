const Logic = {
    validateCard: function (card) {
        return card && card.ID;
    },
    getBlocksForTurn: function (turn) {
        // Narrative event turns that have no playable academic blocks
        const narrativeTurns = [5, 8, 10];
        return narrativeTurns.includes(turn) ? 0 : GAME_CONFIG.TIME_BLOCKS_PER_SEMESTER;
    },

    getSafeInt: function (val) {
        return parseInt(val) || 0;
    },

    addLog: function (resultObject) {
        if (!resultObject) return;
        state.logs.unshift(resultObject);
        if (state.logs.length > 20) state.logs.pop(); // Keep log size manageable
    },

    clampStats: function () {
        // --- THE DEBT CASCADE ---
        // If an event drops a stat below 0, the deficit converts into raw Stress.
        if (state.stats.Health < 0) {
            state.stats.Stress += Math.abs(state.stats.Health);
            state.stats.Health = 0;
        }
        if (state.stats.Money < 0) {
            state.stats.Stress += Math.abs(state.stats.Money);
            state.stats.Money = 0;
        }
        if (state.stats.Social < 0) {
            state.stats.Stress += Math.abs(state.stats.Social);
            state.stats.Social = 0;
        }

        // --- STANDARD CLAMPING ---
        // Hard cap at 10 to prevent infinite hoarding
        state.stats.Health = Math.max(0, Math.min(state.stats.Health, 10));
        state.stats.Stress = Math.max(0, Math.min(state.stats.Stress, 10));
        state.stats.Social = Math.max(0, Math.min(state.stats.Social, 10));
        state.stats.Money = Math.max(0, Math.min(state.stats.Money, 10));

        // Study is uncapped during the semester
        state.stats.Study = Math.max(0, state.stats.Study);
    },

    // --- THE BURNOUT RULE ---
    // Returns true if taking this action would push Stress above 10.
    // The player must Rest or relieve Stress first.
    wouldCauseBurnout: function (card) {
        const stressGain = this.getSafeInt(card.Cost_Stress) - this.getSafeInt(card.Reward_Stress);
        return (state.stats.Stress + stressGain) > 10;
    },

    validateAction: function (card) {
        if (!this.validateCard(card)) return { allowed: false, reason: 'This action is unavailable.' };

        const costs = {
            Time: this.getSafeInt(card.Cost_Time),
            Health: this.getSafeInt(card.Cost_Health),
            Social: this.getSafeInt(card.Cost_Social),
            Money: this.getSafeInt(card.Cost_Money),
            Study: this.getSafeInt(card.Cost_Study)
        };
        const available = {
            Time: state.blocksRemaining,
            Health: state.stats.Health,
            Social: state.stats.Social,
            Money: state.stats.Money,
            Study: state.stats.Study
        };

        for (const resource of Object.keys(costs)) {
            if (available[resource] < costs[resource]) {
                return { allowed: false, reason: `Not enough ${resource} for this action.` };
            }
        }

        if (this.wouldCauseBurnout(card)) {
            return { allowed: false, reason: 'Burnout: relieve Stress before taking this action.' };
        }

        return { allowed: true, reason: '' };
    },

    deductCosts: function (timeCost) {
        state.blocksRemaining -= Logic.getSafeInt(timeCost);
    },

    applySurvivalStats: function (card) {
        state.stats.Health += Logic.getSafeInt(card.Reward_Health) - Logic.getSafeInt(card.Cost_Health);
        state.stats.Stress += Logic.getSafeInt(card.Cost_Stress) - Logic.getSafeInt(card.Reward_Stress);
        state.stats.Social += Logic.getSafeInt(card.Reward_Social) - Logic.getSafeInt(card.Cost_Social);
        state.stats.Money += Logic.getSafeInt(card.Reward_Money) - Logic.getSafeInt(card.Cost_Money);
    },

    applyResumeStats: function (card) {
        // Uses the exact 'Type' column to fix the tracking bug
        if (card.Type === 'PROJECT') state.resume.Projects++;
        if (card.Type === 'INTERNSHIP') state.resume.Internships++;
        if (card.Type === 'POR') state.resume.Positions += this.getSafeInt(card.Reward_POR);

        // Track hidden resume stats permanently for the Top Bar
        state.resume.Research += this.getSafeInt(card.Reward_Res);
        state.resume.Product += this.getSafeInt(card.Reward_Prod);
        state.resume.Algo += this.getSafeInt(card.Reward_Algo);
    },

    processCardEffect: function (card, actionType = 'neutral') {
        if (!this.validateCard(card)) return null;

        let timeDelta = 0, netHealth = 0, netStress = 0, netSocial = 0, netMoney = 0, netStudy = 0;

        if (card.Type === 'RANDOM') {
            // Random events are unavoidable: rewards help and costs hurt.
            // Any survival-stat shortfall is converted to Stress by clampStats.
            timeDelta = -this.getSafeInt(card.Cost_Time);
            netHealth = this.getSafeInt(card.Reward_Health) - this.getSafeInt(card.Cost_Health);
            netStudy = this.getSafeInt(card.Reward_Study) - this.getSafeInt(card.Cost_Study);
            netSocial = this.getSafeInt(card.Reward_Social) - this.getSafeInt(card.Cost_Social);
            netMoney = this.getSafeInt(card.Reward_Money) - this.getSafeInt(card.Cost_Money);
            netStress = this.getSafeInt(card.Cost_Stress) - this.getSafeInt(card.Reward_Stress);
        } else {
            // Standard cards: Net = Reward - Cost
            timeDelta = -this.getSafeInt(card.Cost_Time); // Costs subtract time
            netHealth = this.getSafeInt(card.Reward_Health) - this.getSafeInt(card.Cost_Health);
            netStress = this.getSafeInt(card.Cost_Stress) - this.getSafeInt(card.Reward_Stress); // Stress is bad, so Cost adds, Reward subtracts
            netSocial = this.getSafeInt(card.Reward_Social) - this.getSafeInt(card.Cost_Social);
            netMoney = this.getSafeInt(card.Reward_Money) - this.getSafeInt(card.Cost_Money);
            netStudy = this.getSafeInt(card.Reward_Study) - this.getSafeInt(card.Cost_Study);
        }

        // Apply the math to the global state
        state.blocksRemaining += timeDelta;
        state.blocksRemaining = Math.max(0, state.blocksRemaining);
        state.stats.Health += netHealth;
        state.stats.Stress += netStress;
        state.stats.Social += netSocial;
        state.stats.Money += netMoney;
        state.stats.Study += netStudy;

        this.applyResumeStats(card);
        this.clampStats();


        // Build effects list for the Event Log UI (only log things that actually changed)
        const effects = {};
        if (timeDelta !== 0) effects.Time = timeDelta;
        if (netHealth !== 0) effects.Health = netHealth;
        if (netStress !== 0) effects.Stress = netStress;
        if (netSocial !== 0) effects.Social = netSocial;
        if (netMoney !== 0) effects.Money = netMoney;
        if (netStudy !== 0) effects.Study = netStudy;

        let icon = '📌';
        if (actionType === 'location') icon = '📍';
        if (actionType === 'friction') icon = '⚡';
        if (actionType === 'opportunity') icon = '💼';

        return {
            type: actionType,
            icon: icon,
            title: card['Card Name'] || card.Location_Name || card.ID,
            effects: effects,
            semester: state.semester,
            turn: state.turn
        };
    },

    drawRandomFriction: function () {
        const validEvents = db.friction.filter(e => {
            const start = parseInt(e.Sem_Start) || 1;
            const end = parseInt(e.Sem_End) || 8;
            return state.semester >= start && state.semester <= end;
        });
        if (validEvents.length === 0) return null;
        return validEvents[Math.floor(Math.random() * validEvents.length)];
    },

    // --- SINGLE AUTHORITATIVE CPI GENERATOR ---
    updateCPI: function (lockForPlacement = false) {
        // CPI is strictly the average of all completed academic semesters
        if (state.spiHistory.length === 0) {
            state.stats.CPI = 0.00;
        } else {
            const totalSPI = state.spiHistory.reduce((sum, val) => sum + val, 0);
            state.stats.CPI = totalSPI / state.spiHistory.length;
        }

        if (lockForPlacement) {
            state.stats.lockedCPI = state.stats.CPI;
        }
    },

    calculateSemesterSPI: function () {
        // 1. Strictly filter for valid academic turns
        const academicTurns = [1, 2, 3, 4, 6, 7, 9, 11];
        if (!academicTurns.includes(state.turn)) return;

        // 2. Fetch earned points and iterate through the grading table
        const studyPoints = state.stats.Study;
        let earnedSPI = 5.00; // Default baseline

        for (const grade of GAME_CONFIG.SPI_GRADING_SCALE) {
            if (studyPoints >= grade.min) {
                earnedSPI = grade.spi;
                break;
            }
        }

        // 3. Save the immutable SPI to history
        state.spiHistory.push(earnedSPI);

        // 4. Reset Study points to 0 for the start of the next semester
        state.stats.Study = 0;

        // 5. Automatically trigger the CPI average recalculation
        this.updateCPI();
    },

    evaluateRequirements: function (reqString) {
        // 1. Handle missing, or literal "None"/"NaN" strings gracefully
        if (!reqString || String(reqString).trim().toUpperCase() === 'NONE' || String(reqString).trim().toUpperCase() === 'NAN') {
            return { locked: false, html: '' };
        }

        let isLocked = false;
        let html = '';

        // 2. CSV uses '+' to separate multiple requirements (not commas)
        String(reqString).split('+').forEach(req => {
            req = req.trim();
            if (!req || req.toUpperCase() === 'NONE' || req.toUpperCase() === 'NAN') return;

            let met = false;

            // 3. Support dynamic stat checks like "Algo>=2" or "Social>=80"
            if (req.includes('>=')) {
                const [statRaw, valRaw] = req.split('>=');
                const statKey = statRaw.trim().toUpperCase();
                const needed = parseFloat(valRaw.trim());

                // Borrow getRichResume to check hidden competencies
                const resume = this.getRichResume ? this.getRichResume() : {
                    cpi: state.stats.CPI || 0,
                    algo: 0, res: 0, prod: 0,
                    por: state.resume.Positions
                };
                resume.social = state.stats.Social || 0; // Explicitly map Social 

                let actual = 0;
                if (statKey === 'CPI') actual = resume.cpi;
                else if (statKey === 'ALGO') actual = resume.algo;
                else if (statKey === 'RES') actual = resume.res;
                else if (statKey === 'PROD') actual = resume.prod;
                else if (statKey === 'POR') actual = resume.por;
                else if (statKey === 'SOCIAL') actual = resume.social;

                if (actual >= needed) met = true;
            } else {
                // 4. Check history for either the Card ID OR the Card Name
                const allCards = [...db.proj, ...db.intern, ...db.por, ...db.social];
                const hasCard = state.history.some(id => {
                    const c = allCards.find(card => card.ID === id);
                    return c && (c['Card Name'] === req || c.ID === req);
                });
                if (hasCard) met = true;
            }

            if (!met) isLocked = true;
            html += `<span class="req-pill ${met ? 'met' : ''}">${req}</span>`;
        });

        return { locked: isLocked, html: html };
    },

    draftCard: function (cardId, cardData) {
        return this.validateAction(cardData).allowed;
    }, // <--- COMMA ADDED HERE

    // --- PHASE 4: ORGANIC SOCIAL ENCOUNTERS ---
    checkSocialEncounter: function (locationCard) {
        if (!locationCard) return null;
        
        const locName = locationCard.Location_Name;
        
        // 1. Log the visit to this specific location
        if (!state.locationVisits) state.locationVisits = {};
        state.locationVisits[locName] = (state.locationVisits[locName] || 0) + 1;
        
        const visits = state.locationVisits[locName];

        // 2. Scan social.csv to see if this visit count unlocks anyone
        const eligible = db.social.filter(card => {
            const start = parseInt(card.Sem_Start) || 1;
            const end = parseInt(card.Sem_End) || 8;
            const inSem = state.semester >= start && state.semester <= end;
            const alreadyOwned = state.network.some(n => n.id === card.ID);
            
            // Check if this location triggers the friend, and if the visit count matches exactly
            const matchesLocation = card.Location_Trigger === locName;
            const meetsVisits = visits >= parseInt(card.Visits_Needed);

            return inSem && !alreadyOwned && matchesLocation && meetsVisits;
        });

        if (eligible.length === 0) return null;
        return eligible[0]; // Return the unlocked friend
    },

    acquireSocialConnection: function (card) {
        // Store the rich object for future passive use
        const newConnection = {
            id: card.ID,
            name: card['Card Name'] || card.ID,
            category: card.Category || 'General',
            trigger: card.Trigger,
            triggerValue: card.Trigger_Value,
            effect: card.Effect,
            effectValue: card.Effect_Value,
            frequency: card.Frequency,
            passiveDesc: card.Passive_Effect,
            semesterAcquired: state.semester,
            maintenanceCost: parseInt(card.Maintenance_Cost) || parseInt(card.Cost_Time) || 1
        };


        state.network.push(newConnection);
        state.activeNetwork.push(newConnection.id);
        return newConnection;
    },


    // ==========================================
    // --- PHASE 7: REFLECTIVE PLACEMENT ENGINE ---
    // ==========================================

    getRichResume: function () {
        return {
            cpi: state.stats.lockedCPI !== null ? state.stats.lockedCPI : (state.stats.CPI || 0),
            algo: state.resume.Algo,
            res: state.resume.Research,
            prod: state.resume.Product,
            por: state.resume.Positions,
            projects: state.resume.Projects,
            internships: state.resume.Internships
        };
    },

    evaluateAllPlacements: function () {
        const resume = this.getRichResume();

        const results = db.placement.map(company => {
            const reqString = company.Req_Prerequisite;
            let isEligible = true;
            let missing = [];
            let totalScore = 0;

            if (!reqString || reqString === 'NaN') {
                return { company, match: 100, eligible: true, missing: [] };
            }

            const reqs = reqString.split('|').map(r => r.trim()).filter(r => r);
            reqs.forEach(req => {
                let score = 0;
                if (req.includes(':')) {
                    const [key, val] = req.split(':');
                    const needed = parseFloat(val.trim());
                    const statKey = key.trim().toUpperCase();

                    let actual = 0;
                    if (statKey === 'CPI') actual = resume.cpi;
                    else if (statKey === 'ALGO') actual = resume.algo;
                    else if (statKey === 'POR') actual = resume.por;
                    else if (statKey === 'RESEARCH') actual = resume.res;
                    else if (statKey === 'PRODUCT') actual = resume.prod;

                    if (actual >= needed) {
                        score = 1;
                    } else {
                        score = needed > 0 ? (actual / needed) : 0;
                        missing.push(`${statKey} (Need ${needed})`);
                        isEligible = false;
                    }
                } else if (req.toUpperCase() === 'ANY INTERN') {
                    if (resume.internships > 0) { score = 1; }
                    else { missing.push('Any Internship'); isEligible = false; }
                } else {
                    const allCards = [...db.proj, ...db.intern, ...db.por];
                    const hasCard = state.history.some(id => {
                        const c = allCards.find(card => card.ID === id);
                        return c && (c['Card Name'] === req || c.ID === req);
                    });
                    if (hasCard) { score = 1; }
                    else { missing.push(req); isEligible = false; }
                }
                totalScore += score;
            });

            const match = reqs.length > 0 ? Math.round((totalScore / reqs.length) * 100) : 100;
            return { company, match, eligible: isEligible, missing };
        });

        // Sort descending by Match %
        return results.sort((a, b) => b.match - a.match);
    },

    getBestPlacementOffer: function (results) {
        const eligible = results.filter(r => r.eligible);
        if (eligible.length === 0) return null;

        // Sort eligible offers by extracting the maximum CTC number (e.g. "60-144 LPA" -> 144)
        return eligible.sort((a, b) => {
            const getCTC = (str) => {
                const match = String(str).match(/(\d+)/g);
                return match ? Math.max(...match.map(Number)) : 0;
            };
            return getCTC(b.company['Est. CTC']) - getCTC(a.company['Est. CTC']);
        })[0].company;
    },
    // --- NEW: SEMESTER BONUS MODEL ---
    applyMaintenanceRewards: function (selectedIds) {
        let summary = [];

        selectedIds.forEach(id => {
            const card = db.social.find(s => s.ID === id);
            if (card) {
                let friendSummary = { name: card['Card Name'], rewards: [] };

                const rHealth = parseInt(card.Reward_Health) || 0;
                const rStudy = parseInt(card.Reward_Study) || 0;
                const rSocial = parseInt(card.Reward_Social) || 0;
                const rMoney = parseInt(card.Reward_Money) || 0;
                const rStress = parseInt(card.Reward_Stress) || 0;

                const careerBonusAvailable = !state.mentorBonusesClaimed.includes(id);
                const rAlgo = careerBonusAvailable ? (parseInt(card.Reward_Algo) || 0) : 0;
                const rPOR = careerBonusAvailable ? (parseInt(card.Reward_POR) || 0) : 0;
                const rRes = careerBonusAvailable ? (parseInt(card.Reward_Res) || 0) : 0;
                const rProd = careerBonusAvailable ? (parseInt(card.Reward_Prod) || 0) : 0;

                // Apply stats
                if (rHealth > 0) { state.stats.Health += rHealth; friendSummary.rewards.push(`❤️ +${rHealth}`); }
                if (rStudy > 0) { state.stats.Study += rStudy; friendSummary.rewards.push(`📚 +${rStudy}`); }
                if (rSocial > 0) { state.stats.Social += rSocial; friendSummary.rewards.push(`🤝 +${rSocial}`); }
                if (rMoney > 0) { state.stats.Money += rMoney; friendSummary.rewards.push(`💰 +${rMoney}`); }
                if (rStress > 0) { state.stats.Stress -= rStress; friendSummary.rewards.push(`😌 -${rStress} Stress`); }

                if (rAlgo > 0) { state.resume.Algo += rAlgo; friendSummary.rewards.push(`💻 +${rAlgo} Algo`); }
                if (rPOR > 0) { state.resume.Positions += rPOR; friendSummary.rewards.push(`👑 +${rPOR} POR`); }
                if (rRes > 0) { state.resume.Research += rRes; friendSummary.rewards.push(`🔬 +${rRes} Res`); }
                if (rProd > 0) { state.resume.Product += rProd; friendSummary.rewards.push(`🚀 +${rProd} Prod`); }

                if (careerBonusAvailable && (rAlgo > 0 || rPOR > 0 || rRes > 0 || rProd > 0)) {
                    state.mentorBonusesClaimed.push(id);
                }

                if (friendSummary.rewards.length > 0) summary.push(friendSummary);
            }
        });

        this.clampStats();
        return summary;
    }





}; // <--- CLOSING BRACE FOR LOGIC OBJECT
