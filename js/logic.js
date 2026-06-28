 const Logic = {
                validateCard: function(card) {
                    return card && card.ID;
                },

                getSafeInt: function(val) {
                    return parseInt(val) || 0;
                },

                addLog: function(resultObject) {
                    if (!resultObject) return;
                    state.logs.unshift(resultObject);
                    if (state.logs.length > 20) state.logs.pop(); // Keep log size manageable
                },

                clampStats: function() {
                    state.stats.Health = Math.max(0, Math.min(state.stats.Health, 200));
                    state.stats.Stress = Math.max(0, Math.min(state.stats.Stress, 200));
                    state.stats.Social = Math.max(0, Math.min(state.stats.Social, 200));
                    state.stats.Money = Math.max(0, state.stats.Money);
                    state.stats.Study = Math.max(0, state.stats.Study);
                },

                deductCosts: function(timeCost) {
                    state.blocksRemaining -= Logic.getSafeInt(timeCost);
                },

                applySurvivalStats: function(card) {
                    state.stats.Health += Logic.getSafeInt(card.Reward_Health) - Logic.getSafeInt(card.Cost_Health);
                    state.stats.Stress += Logic.getSafeInt(card.Cost_Stress) - Logic.getSafeInt(card.Reward_Stress);
                    state.stats.Social += Logic.getSafeInt(card.Reward_Social) - Logic.getSafeInt(card.Cost_Social);
                    state.stats.Money += Logic.getSafeInt(card.Reward_Money) - Logic.getSafeInt(card.Cost_Money);
                },

                applyResumeStats: function(card) {
                    if (card['Card Type'] === 'Project') state.resume.Projects++;
                    if (card['Card Type'] === 'Internship') state.resume.Internships++;
                    if (card['Card Type'] === 'POR') state.resume.Positions++;
                },

                processCardEffect: function(card, actionType = 'neutral') {
                    if (!this.validateCard(card)) return null;

                    const timeCost = this.getSafeInt(card.Cost_Time);
                    this.deductCosts(card.Cost_Time);
                    this.applySurvivalStats(card);
                    this.applyResumeStats(card);
                    this.clampStats();

                    // Calculate net changes for the log
                    const netHealth = this.getSafeInt(card.Reward_Health) - this.getSafeInt(card.Cost_Health);
                    const netStress = this.getSafeInt(card.Reward_Stress) - this.getSafeInt(card.Cost_Stress);
                    const netSocial = this.getSafeInt(card.Reward_Social) - this.getSafeInt(card.Cost_Social);
                    const netMoney  = this.getSafeInt(card.Reward_Money)  - this.getSafeInt(card.Cost_Money);
                    const netStudy  = this.getSafeInt(card.Reward_Study)  - this.getSafeInt(card.Cost_Study);

                    const effects = {};
                    if (timeCost !== 0) effects.Time = -timeCost;
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

                drawRandomFriction: function() {
                    const validEvents = db.friction.filter(e => {
                        const start = parseInt(e.Sem_Start) || 1;
                        const end = parseInt(e.Sem_End) || 8;
                        return state.semester >= start && state.semester <= end;
                    });
                    if (validEvents.length === 0) return null;
                    return validEvents[Math.floor(Math.random() * validEvents.length)];
                },

                calculateEndSemesterCPI: function() {
                    const baseCPI = 7.0;
                    const resumeBonus = (state.resume.Projects * 0.2) + (state.resume.Internships * 0.3) + (state.resume.Positions * 0.1);
                    const stressModifier = state.stats.Stress > 100 ? -0.5 : 0;
                    state.stats.CPI = Math.max(0, Math.min(10, baseCPI + resumeBonus + stressModifier));
                },

                evaluateRequirements: function(reqString) {
                    if (!reqString) return { locked: false, html: '' };
                    
                    let isLocked = false;
                    let html = '';
                    
                    reqString.split(',').forEach(req => {
                        req = req.trim();
                        if (!req) return;
                        
                        let met = false;
                        if (state.history.includes(req)) met = true;

                        if (!met) isLocked = true;
                        html += `<span class="req-pill ${met ? 'met' : ''}">${req}</span>`;
                    });

                    return { locked: isLocked, html: html };
                },

                draftCard: function(cardId, cardData) {
                    if (!this.validateCard(cardData)) return false;
                    if (state.blocksRemaining < this.getSafeInt(cardData.Cost_Time)) return false;
                    return true;
                }, // <--- COMMA ADDED HERE

                // --- PHASE 4: ORGANIC SOCIAL ENCOUNTERS ---
                checkSocialEncounter: function() {
                    // Use config variable (Defaults to 0.25 in state.js)
                    if (Math.random() > GAME_CONFIG.SOCIAL_ENCOUNTER_CHANCE) return null;

                    const eligible = db.social.filter(card => {
                        const start = parseInt(card.Sem_Start) || 1;
                        const end = parseInt(card.Sem_End) || 8;
                        const inSem = state.semester >= start && state.semester <= end;
                        
                        // Prevent meeting the same person twice
                        const alreadyOwned = state.network.some(n => n.id === card.ID);
                        return inSem && !alreadyOwned;
                    });

                    if (eligible.length === 0) return null;
                    return eligible[Math.floor(Math.random() * eligible.length)];
                },

                acquireSocialConnection: function(card) {
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
                        semesterAcquired: state.semester
                    };
                    state.network.push(newConnection);
                    return newConnection;
                }, 

                // ==========================================
                // --- PHASE 7: REFLECTIVE PLACEMENT ENGINE ---
                // ==========================================

                getRichResume: function() {
                    let algo = 0, res = 0, prod = 0;
                    const allCards = [...db.proj, ...db.intern, ...db.por];
                    
                    state.history.forEach(id => {
                        const card = allCards.find(c => c.ID === id);
                        if (card) {
                            algo += this.getSafeInt(card.Reward_Algo);
                            res += this.getSafeInt(card.Reward_Res);
                            prod += this.getSafeInt(card.Reward_Prod);
                        }
                    });
                    
                    return { 
                        cpi: state.stats.CPI || 0, 
                        algo: algo, 
                        res: res, 
                        prod: prod, 
                        por: state.resume.Positions,
                        projects: state.resume.Projects,
                        internships: state.resume.Internships
                    };
                },

                evaluateAllPlacements: function() {
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

                getBestPlacementOffer: function(results) {
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
                } 





            }; // <--- CLOSING BRACE FOR LOGIC OBJECT