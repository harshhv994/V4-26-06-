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
                    
                    // Double check affordability
                    if (state.blocksRemaining < this.getSafeInt(cardData.Cost_Time)) return false;

                    return true;
                }
            };