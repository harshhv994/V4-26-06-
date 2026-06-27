// --- 3. UI LAYER (Rendering) ---
            const UI = {
                updateHUD: function(stats, resume, turn, semester, blocks) {
                    document.getElementById('survival-stats').innerHTML = `
                        <div class="stat-box">❤️ Health: ${Math.max(0, stats.Health)}</div>
                        <div class="stat-box">😰 Stress: ${stats.Stress}</div>
                        <div class="stat-box">👥 Social: ${stats.Social}</div>
                        <div class="stat-box">💵 Money: ₹${stats.Money}</div>
                    `;
                    document.getElementById('resume-stats').innerHTML = `
                        <div class="stat-box">📊 Projects: ${resume.Projects}</div>
                        <div class="stat-box">🏢 Internships: ${resume.Internships}</div>
                        <div class="stat-box">🎓 Positions: ${resume.Positions}</div>
                        <div class="stat-box">📈 CPI: ${(stats.CPI || 0).toFixed(2)}</div>
                    `;
                    document.getElementById('time-tracker').innerHTML = `Sem ${semester} | Turn ${turn} | Blocks: ${blocks}`;
                },

                updateEventLog: function(logs) {
                    const logHTML = logs.map(log => {
                        let color = 'var(--text-muted)';
                        if (log.type === 'opportunity') color = 'var(--accent-gold)';
                        if (log.type === 'friction') color = 'var(--accent-red)';
                        if (log.type === 'location') color = 'var(--accent-blue)';

                        let effectsHTML = '';
                        for (const [stat, value] of Object.entries(log.effects)) {
                            const isPositive = value > 0;
                            const sign = isPositive ? '+' : '';
                            
                            let pillColor = 'var(--text-muted)';
                            if (['Health', 'Social', 'Study', 'Money'].includes(stat)) {
                                pillColor = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';
                            } else if (['Stress', 'Time'].includes(stat)) {
                                pillColor = isPositive ? 'var(--accent-red)' : 'var(--accent-green)';
                            }

                            effectsHTML += `<span style="display:inline-block; margin-right: 5px; margin-top: 5px; font-size: 0.75em; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid ${pillColor}; color: ${pillColor}; font-weight: bold;">${sign}${value} ${stat}</span>`;
                        }

                        return `
                            <div style="margin-bottom: 15px; border-left: 3px solid ${color}; padding: 8px 10px; background: rgba(255,255,255,0.02); border-radius: 0 8px 8px 0;">
                                <div style="font-size: 0.75em; color: var(--text-muted); text-transform: uppercase;">Sem ${log.semester} | Turn ${log.turn}</div>
                                <div style="font-size: 1.05em; font-weight: bold; margin-top: 4px; color: ${color};">
                                    ${log.icon} ${log.title}
                                </div>
                                <div>${effectsHTML}</div>
                            </div>
                        `;
                    }).join('');

                    document.getElementById('event-log').innerHTML = logHTML;
                },

                updateNarrativeSidePanel: function(phase, vibe) {
                    document.getElementById('current-phase').textContent = phase;
                    document.getElementById('phase-vibe').textContent = vibe;
                },

                updateBoard: function(html) {
                    document.getElementById('board-panel').innerHTML = html;
                },

                renderNarrative: function(phase, psychology, poetic) {
                    return `<div class="game-card">
                        <h3>${phase}</h3>
                        <p style="margin-top: 10px; line-height: 1.6;">${psychology}</p>
                        <p style="margin-top: 10px; font-style: italic; color: var(--text-muted);">"${poetic}"</p>
                    </div>`;
                },

                renderFriction: function(eventCard) {
                    if (!eventCard) return '<div class="game-card"><p>No friction events for this semester.</p></div>';
                    
                    const costTime = Logic.getSafeInt(eventCard.Cost_Time);
                    const costHealth = Logic.getSafeInt(eventCard.Cost_Health);
                    const costStress = Logic.getSafeInt(eventCard.Cost_Stress);
                    const costSocial = Logic.getSafeInt(eventCard.Cost_Social);
                    const costMoney = Logic.getSafeInt(eventCard.Cost_Money);

                    return `<div class="game-card">
                        <div class="card-header">
                            <span>${eventCard.Name || eventCard.ID}</span>
                            <span class="card-cost">${costTime} blocks</span>
                        </div>
                        <p class="card-flavor">${eventCard.Description || 'A random event affects your semester.'}</p>
                        <div class="pill-container">
                            ${costHealth > 0 ? `<span class="stat-pill" style="background: rgba(244, 67, 54, 0.2); color: var(--accent-red);">-${costHealth} Health</span>` : ''}
                            ${costStress > 0 ? `<span class="stat-pill" style="background: rgba(244, 67, 54, 0.2); color: var(--accent-red);">+${costStress} Stress</span>` : ''}
                            ${costSocial > 0 ? `<span class="stat-pill" style="background: rgba(244, 67, 54, 0.2); color: var(--accent-red);">-${costSocial} Social</span>` : ''}
                            ${costMoney > 0 ? `<span class="stat-pill" style="background: rgba(244, 67, 54, 0.2); color: var(--accent-red);">-₹${costMoney}</span>` : ''}
                        </div>
                    </div>`;
                },

                renderOpportunity: function(tabData, activeTab) {
                    const tabNames = { projects: 'Projects', interns: 'Internships', pors: 'Positions' };
                    return `
                        <h2>Opportunities</h2>
                        <div class="tabs">
                            <button class="tab-btn ${activeTab === 'projects' ? 'active' : ''}" onclick="CampusSimulator.switchTab('projects')">📋 Projects</button>
                            <button class="tab-btn ${activeTab === 'interns' ? 'active' : ''}" onclick="CampusSimulator.switchTab('interns')">🏢 Internships</button>
                            <button class="tab-btn ${activeTab === 'pors' ? 'active' : ''}" onclick="CampusSimulator.switchTab('pors')">🎓 Positions</button>
                        </div>
                        <div class="card-grid">
                            ${tabData.map(item => item.html).join('')}
                        </div>
                    `;
                },

                renderAction: function(locations, blocksRemaining) {
                    return `<div style="width: 100%; max-width: 600px;">
                        <h2>Locations</h2>
                        ${locations.map(loc => {
                            const cost = Logic.getSafeInt(loc.Cost_Time);
                            const isAffordable = blocksRemaining >= cost;
                            return `<div class="game-card ${isAffordable ? 'clickable' : 'disabled'}" onclick="${isAffordable ? `CampusSimulator.takeLocationAction('${loc.ID}')` : ''}" style="cursor: ${isAffordable ? 'pointer' : 'not-allowed'};">
                                <div class="card-header">
                                    <span>${loc.Location_Name}</span>
                                    <span class="card-cost">${cost} blocks</span>
                                </div>
                                <p class="card-flavor">${loc.Description || 'A place to spend time.'}</p>
                            </div>`;
                        }).join('')}
                    </div>`;
                },

                components: {
                    oppCard: function(card, isLocked, isAffordable, reqHTML) {
                        const cost = Logic.getSafeInt(card.Cost_Time);
                        const costHealth = Logic.getSafeInt(card.Cost_Health);
                        const rewardHealth = Logic.getSafeInt(card.Reward_Health);

                        return `
                            <div class="opp-card ${isLocked ? 'locked' : ''}">
                                <div>
                                    <div style="font-weight: bold; font-size: 1.05em;">${card['Card Name'] || card.ID}</div>
                                    <div style="font-size: 0.9em; color: var(--text-muted); margin-top: 5px;">Cost: <span style="color: var(--accent-blue);">${cost} blocks</span></div>
                                    <div style="font-size: 0.85em; margin-top: 8px; line-height: 1.4;">${card.Description || 'An opportunity awaits.'}</div>
                                    ${reqHTML ? `<div>${reqHTML}</div>` : ''}
                                </div>
                                <button class="draft-btn" onclick="CampusSimulator.draftCard('${card.ID}')" ${isLocked || !isAffordable ? 'disabled' : ''}>
                                    ${isLocked ? '🔒 Locked' : !isAffordable ? '❌ Not Enough Time' : '✅ Draft'}
                                </button>
                            </div>
                        `;
                    }
                }
            };