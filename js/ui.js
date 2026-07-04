// --- 3. UI LAYER (Rendering) ---
const UI = {
    updateHUD: function (stats, resume, turn, semester, blocks) {
        // Update Survival (Left Side)
        document.getElementById('survival-stats').innerHTML = `
            <div class="stat-box">❤️ Health: ${Math.max(0, stats.Health)}</div>
            <div class="stat-box">👥 Social: ${stats.Social}</div>
            <div class="stat-box">🤯 Stress: ${stats.Stress}</div>
            <div class="stat-box" style="border-color: var(--accent-blue); color: var(--accent-blue);">📚 Study: ${stats.Study}</div>
            <div class="stat-box">💵 Money: ₹${stats.Money}</div>
        `;

        // Update Resume (Right Side) - FIXED to show actual stats instead of generic counts
        document.getElementById('resume-stats').innerHTML = `
            <div class="stat-box" style="border-color: var(--accent-gold); color: var(--accent-gold);">📈 CPI: ${(stats.CPI || 0).toFixed(2)}</div>
            <div class="stat-box">👑 POR: ${resume.Positions}</div>
            <div class="stat-box">💻 Algo: ${resume.Algo}</div>
            <div class="stat-box">🔬 Research: ${resume.Research}</div>
            <div class="stat-box">🚀 Product: ${resume.Product}</div>
        `;

        // Update Time Panel
        let blockText = '';
        const narrativeTurns = [5, 8, 10]; // Interlude, Summer, Placement

        if (narrativeTurns.includes(turn)) {
            blockText = `Blocks: 0`;
        } else {
            blockText = `<span class="tooltip" style="border-bottom: 1px dashed #888; cursor: help;">⏱️ ${blocks} / ${GAME_CONFIG.TIME_BLOCKS_PER_SEMESTER} Available<span class="tooltip-text"><strong style="color: var(--accent-blue);">Healthy Time Management</strong><br><br>A week contains 24 blocks (168 hrs). 7 are automatically reserved for healthy sleep.<br><br>You have ${GAME_CONFIG.TIME_BLOCKS_PER_SEMESTER} discretionary blocks to spend.</span></span>`;
        }

        document.getElementById('time-tracker').innerHTML = `Sem ${semester} | Turn ${turn} | ${blockText}`;
    },

    renderTutorialModal: function () {
        return `
            <div id="time-tutorial-modal" class="modal-overlay">
                <div class="modal-content">
                    <h2 style="color: var(--accent-blue); margin-bottom: 15px;">🛌 Healthy Time Management</h2>
                    <p style="color: var(--text-main); margin-bottom: 15px; line-height: 1.6; text-align: left;">
                        Every semester simulates one week of student life.<br><br>
                        A week contains <strong>24 time blocks</strong> (168 hours).<br>
                        To encourage realistic planning, <strong style="color: var(--accent-green);">7 blocks are automatically reserved for sleep.</strong><br><br>
                        You begin each semester with <strong>${GAME_CONFIG.TIME_BLOCKS_PER_SEMESTER} available blocks</strong> to spend on academics, projects, clubs, networking, fitness, and campus life.<br><br>
                        <span style="color: var(--text-muted); font-style: italic;">Manage them wisely—once they're gone, the semester ends.</span>
                    </p>
                    <button class="modal-btn" onclick="CampusSimulator.closeTutorial()">Understood</button>
                </div>
            </div>
        `;
    },

    renderReportCardModal: function (semester, studyPoints, spi, cpi) {
        return `
            <div id="report-card-modal" class="modal-overlay" style="animation: fadeIn 0.3s ease-out;">
                <div class="modal-content" style="max-width: 450px; animation: popIn 0.4s ease-out; border: 1px solid var(--accent-gold);">
                    <h2 style="color: var(--accent-gold); margin-bottom: 10px; font-size: 1.8em;">🎓 Semester Report</h2>
                    <p style="color: var(--text-muted); font-size: 1.1em; margin-bottom: 20px;">Semester ${semester} Completed</p>
                    
                    <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 1.2em;">
                            <span>📚 Study Points</span>
                            <span style="color: var(--accent-blue); font-weight: bold;">${studyPoints} / 70</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 1.2em;">
                            <span>🎯 Semester SPI</span>
                            <span style="color: var(--accent-green); font-weight: bold;">${spi.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 1.2em; border-top: 1px solid #444; padding-top: 12px;">
                            <span>📈 Current CPI</span>
                            <span style="color: var(--accent-gold); font-weight: bold;">${cpi.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div style="background: rgba(74, 144, 226, 0.1); border-left: 3px solid var(--accent-blue); padding: 15px; text-align: left; margin-bottom: 25px; border-radius: 4px;">
                        <div style="font-weight: bold; color: var(--accent-blue); margin-bottom: 8px;">💡 Academic Insight</div>
                        <div style="font-size: 0.85em; color: var(--text-main); line-height: 1.5;">
                            Your Study Points represent the total academic effort invested throughout the semester, including lectures, tutorials, assignments, quizzes, labs, course projects, and exam preparation.<br><br>
                            A perfect 10.00 SPI requires 70 Study Points, reflecting consistent academic effort across the entire semester—not just classroom attendance.
                        </div>
                    </div>
                    
                    <button class="modal-btn" style="width: 100%; background: var(--accent-gold); color: black;" onclick="CampusSimulator.closeReportCard()">Continue →</button>
                </div>
            </div>
        `;
    },

    renderSocialMaintenanceModal: function (networkList, availableBlocks) {
        const friendsHTML = networkList.map(conn => {
            const cost = 1;

            return `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" class="social-checkbox" value="${conn.id}" data-cost="${cost}" checked>
                        <span style="color: var(--text-main); font-weight: bold;">${conn.name}</span>
                    </label>
                    <span style="color: var(--accent-blue); font-size: 0.9em;">${cost} Block</span>
                </div>
            `;
        }).join('');

        return `
            <div id="social-maintenance-modal" class="modal-overlay" style="z-index: 10000; animation: fadeIn 0.3s ease-out;">
                <div class="modal-content" style="max-width: 400px; border: 1px solid var(--accent-purple);">
                    <h2 style="color: var(--accent-purple); margin-bottom: 15px;">🤝 Maintain Network</h2>
                    <p style="color: var(--text-muted); font-size: 0.9em; margin-bottom: 20px;">
                        Friendships require time. Select who to spend time with this semester. Inactive friends grant no bonuses.
                    </p>
                    
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; text-align: left; max-height: 250px; overflow-y: auto;">
                        ${friendsHTML}
                    </div>
                    
                    <div style="margin-top: 20px; font-size: 1.1em; font-weight: bold;">
                        Total Cost: <span id="maintenance-cost-display">0</span> / ${availableBlocks} Blocks
                    </div>
                    
                    <button id="maintenance-confirm-btn" class="modal-btn" style="width: 100%; background: var(--accent-purple);">
                        Confirm Investments
                    </button>
                </div>
            </div>
        `;
    },

    bindMaintenanceModalListeners: function (availableBlocks) {
        const checkboxes = document.querySelectorAll('.social-checkbox');
        const costDisplay = document.getElementById('maintenance-cost-display');
        const confirmBtn = document.getElementById('maintenance-confirm-btn');

        const updateTotal = () => {
            let total = 0;
            checkboxes.forEach(cb => {
                if (cb.checked) total += parseInt(cb.dataset.cost);
            });

            costDisplay.innerText = total;

            if (total > availableBlocks) {
                costDisplay.style.color = 'var(--accent-red)';
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.5';
                confirmBtn.style.cursor = 'not-allowed';
            } else {
                costDisplay.style.color = 'var(--text-main)';
                confirmBtn.disabled = false;
                confirmBtn.style.opacity = '1';
                confirmBtn.style.cursor = 'pointer';
            }
        };

        checkboxes.forEach(cb => cb.addEventListener('change', updateTotal));

        confirmBtn.addEventListener('click', (e) => {
            e.preventDefault();

            let selected = [];
            let totalCost = 0;
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    selected.push(cb.value);
                    totalCost += parseInt(cb.dataset.cost);
                }
            });

            if (typeof Controller !== 'undefined' && typeof Controller.handleSocialMaintenanceConfirm === 'function') {
                Controller.handleSocialMaintenanceConfirm(selected, totalCost);
            }
        });

        updateTotal();
    },

    renderMaintenanceSummaryModal: function (summaryData, totalCost) {
        let summaryHTML = summaryData.map(friend => `
            <div style="margin-bottom: 12px; border-bottom: 1px dashed #444; padding-bottom: 8px;">
                <strong style="color: var(--text-main);">${friend.name}</strong><br>
                <span style="color: var(--accent-green); font-size: 0.9em;">${friend.rewards.join(' | ')}</span>
            </div>
        `).join('');

        if (summaryHTML === '') {
            summaryHTML = `<p style="color: var(--text-muted);">No friendships maintained this semester.</p>`;
        }

        return `
            <div id="maintenance-summary-modal" class="modal-overlay" style="z-index: 10000; animation: fadeIn 0.3s ease-out;">
                <div class="modal-content" style="max-width: 400px; border: 1px solid var(--accent-purple);">
                    <h2 style="color: var(--accent-purple); margin-bottom: 15px;">Friendships Maintained</h2>
                    
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; text-align: left; max-height: 250px; overflow-y: auto;">
                        ${summaryHTML}
                    </div>
                    
                    <div style="margin-top: 20px; font-size: 1.1em; font-weight: bold;">
                        Total Cost: <span style="color: var(--accent-red);">${totalCost} Time Blocks</span>
                    </div>
                    
                    <button class="modal-btn" style="width: 100%; background: var(--accent-purple); margin-top: 15px;" onclick="CampusSimulator.confirmMaintenanceSummary()">
                        Continue →
                    </button>
                </div>
            </div>
        `;
    },

    updateEventLog: function (logs) {
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

    updateNetworkPanel: function (network) {
        const container = document.getElementById('active-connections');
        if (!container) return;

        if (network.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9em; font-style: italic;">No connections yet. Visit locations to meet people.</p>`;
            return;
        }

        container.innerHTML = network.map(conn => `
            <div style="background: #2a2a2a; border-left: 3px solid var(--accent-green); padding: 10px; border-radius: 6px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                <div style="font-weight: bold; font-size: 1.05em; color: var(--text-main);">🤝 ${conn.name}</div>
                <div style="font-size: 0.75em; color: var(--accent-blue); text-transform: uppercase; margin-top: 3px; letter-spacing: 0.5px;">${conn.category}</div>
                <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 6px; line-height: 1.3;">Maintained for Semester Bonuses</div>
            </div>
        `).join('');
    },

    updateNarrativeSidePanel: function (phase, vibe) {
        document.getElementById('current-phase').textContent = phase;
        document.getElementById('phase-vibe').textContent = vibe;
    },

    updateBoard: function (html) {
        document.getElementById('board-panel').innerHTML = html;
    },

    renderInterlude: function (interns) {
        const internCards = interns.map(card => {
            const reqEval = Logic.evaluateRequirements(card.Req_Prerequisite);
            const btnState = reqEval.locked ? 'disabled' : '';
            const btnText = reqEval.locked ? 'Locked' : 'Select';

            return `
                <div class="opp-card ${reqEval.locked ? 'locked' : ''}">
                    <div>
                        <div style="font-weight: bold; font-size: 1.1em; color: var(--accent-gold);">${card['Card Name'] || card.ID}</div>
                        <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 5px;">Category: ${card.Category || 'Internship'}</div>
                        <div style="margin-top: 10px; border-top: 1px solid #444; padding-top: 10px;">${reqEval.html}</div>
                        <div style="margin-top: 5px; font-size: 0.85em; color: var(--accent-blue);">
                           Rewards: ${card.Reward_Algo > 0 ? `💻 +${card.Reward_Algo} Algo ` : ''}
                           ${card.Reward_Res > 0 ? `🔬 +${card.Reward_Res} Res ` : ''}
                           ${card.Reward_Prod > 0 ? `🚀 +${card.Reward_Prod} Prod ` : ''}
                        </div>
                    </div>
                    <button class="draft-btn" ${btnState} onclick="CampusSimulator.selectInterlude('${card.ID}')">
                        ${reqEval.locked ? '🔒' : '✅'} ${btnText}
                    </button>
                </div>
            `;
        }).join('');

        return `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-gold); font-size: 1.8em;">🏢 SPO Internship Drive</h2>
                <p style="color: var(--text-muted);">Your profile is your currency. Choose one path for the summer.</p>
            </div>
            <div class="card-grid">
                ${internCards}
                <div class="opp-card" style="border-color: var(--accent-blue);">
                    <div>
                        <div style="font-weight: bold; font-size: 1.1em; color: var(--accent-blue);">Chill at Home</div>
                        <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 5px;">Take a complete break.</div>
                        <div style="margin-top: 10px; font-size: 0.9em; color: var(--accent-green);">+5 Health, -5 Stress</div>
                    </div>
                    <button class="draft-btn" style="background: var(--accent-blue);" onclick="CampusSimulator.selectInterlude('SKIP')">
                        🏠 Go Home
                    </button>
                </div>
            </div>
        `;
    },

    renderSummer: function () {
        const hasInternship = state.history.some(id => id.startsWith('INT_'));
        const canDoProject = state.stats.Social >= 2;
        return `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-gold); font-size: 1.8em;">☀️ The Summer Divide</h2>
                <p style="color: var(--text-muted);">Campus is empty. How will you spend your final summer before placements?</p>
            </div>
            <div class="card-grid">
                
                <div class="opp-card" style="border-color: var(--accent-gold);">
                    <div>
                        <div style="font-weight: bold; font-size: 1.1em; color: var(--accent-gold);">🏢 Complete Internship</div>
                        <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 5px;">Execute your corporate or research role.</div>
                        <div style="margin-top: 10px; font-size: 0.9em; color: var(--accent-green);">+2 Money, +3 Stress</div>
                    </div>
                    <button class="draft-btn" style="background: var(--accent-gold); color: black;" onclick="CampusSimulator.selectSummer('INTERN')" ${hasInternship ? '' : 'disabled'}>
                        ${hasInternship ? '💼 Go to Work' : '🔒 No Internship Secured'}
                    </button>
                </div>

                <div class="opp-card" style="border-color: var(--accent-blue);">
                    <div>
                        <div style="font-weight: bold; font-size: 1.1em; color: var(--accent-blue);">🔬 Summer Project</div>
                        <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 5px;">Stay in empty hostels and work with a Prof.</div>
                        <div style="margin-top: 10px; font-size: 0.9em; color: var(--accent-green);">+2 Research, +15 Study, -2 Social</div>
                    </div>
                    <button class="draft-btn" style="background: var(--accent-blue);" onclick="CampusSimulator.selectSummer('PROJECT')" ${canDoProject ? '' : 'disabled'}>
                        ${canDoProject ? '📚 Stay on Campus' : '🔒 Need 2 Social'}
                    </button>
                </div>

                <div class="opp-card" style="border-color: var(--accent-green);">
                    <div>
                        <div style="font-weight: bold; font-size: 1.1em; color: var(--accent-green);">🏠 Chill at Home</div>
                        <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 5px;">Mom's food and absolute rest.</div>
                        <div style="margin-top: 10px; font-size: 0.9em; color: var(--accent-green);">+5 Health, -5 Stress</div>
                    </div>
                    <button class="draft-btn" style="background: var(--accent-green);" onclick="CampusSimulator.selectSummer('HOME')">
                        ✈️ Pack Bags
                    </button>
                </div>
            </div>
        `;
    },

    renderPlacementResume: function (resume) {
        return `
            <div style="width: 100%; max-width: 600px; margin: 0 auto; text-align: center;">
                <h2 style="color: var(--accent-gold); font-size: 1.8em; margin-bottom: 5px;">Your Resume Before Placement Season</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Returning from your summer internship, this is the profile you've built.</p>
                
                <div class="game-card" style="text-align: left; background: #1a1a1a; padding: 25px;">
                    <div style="font-size: 1.2em; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px;">
                        <strong>Academic Performance</strong><br>
                        <span style="color: var(--accent-blue);">Cumulative Performance Index (CPI): ${resume.cpi.toFixed(2)}</span>
                    </div>
                    <div style="font-size: 1.1em; margin-bottom: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div><strong>💼 Internships:</strong> ${resume.internships}</div>
                        <div><strong>🎓 POR Score:</strong> ${resume.por}</div>
                    </div>
                    <div style="font-size: 1.1em; border-top: 1px solid #333; padding-top: 15px; margin-top: 10px;">
                        <strong>Hidden Competencies</strong>
                        <div style="margin-top: 5px; color: var(--text-muted); line-height: 1.6;">
                            Algorithms & Data Structures: <span style="color: var(--text-main); font-weight: bold;">${resume.algo}</span><br>
                            Research & Analysis: <span style="color: var(--text-main); font-weight: bold;">${resume.res}</span><br>
                            Product & Design: <span style="color: var(--text-main); font-weight: bold;">${resume.prod}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderPlacementFit: function (results) {
        const top5 = results.slice(0, 5);
        const fitHTML = top5.map(res => {
            const statusColor = res.eligible ? 'var(--accent-green)' : (res.match >= 75 ? 'var(--accent-gold)' : 'var(--accent-red)');
            const icon = res.eligible ? '✓' : '⚠';
            const statusText = res.eligible ? 'Eligible' : (res.match >= 75 ? 'Nearly Eligible' : 'Not Eligible');
            const missingText = res.missing.length > 0 ? `<br><span style="font-size: 0.85em; color: var(--text-muted);">Missing: ${res.missing.join(', ')}</span>` : '';

            let recruiters = "Top Industry Leaders";
            const name = res.company['Card Name'].toLowerCase();
            if (name.includes('sde') || name.includes('software')) recruiters = "Microsoft, Google, Atlassian, Rubrik";
            else if (name.includes('quant')) recruiters = "Jane Street, Tower Research, Optiver";
            else if (name.includes('consulting')) recruiters = "McKinsey, BCG, Bain";
            else if (name.includes('product') || name.includes('apm')) recruiters = "Uber, Flipkart, Swiggy";
            else if (name.includes('ai') || name.includes('ml')) recruiters = "OpenAI, Google DeepMind, Amazon";

            return `
                <div style="background: #2a2a2a; border-left: 3px solid ${statusColor}; padding: 12px; border-radius: 6px; margin-bottom: 12px; text-align: left;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em;">
                        <span>${icon} ${res.company['Card Name']}</span>
                        <span style="color: ${statusColor};">${res.match}% Match</span>
                    </div>
                    <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 4px;">Typical Recruiters: ${recruiters}</div>
                    <div style="font-size: 0.9em; color: var(--accent-blue); margin-top: 6px; border-top: 1px solid #333; padding-top: 6px;">
                        Est. CTC: ${res.company['Est. CTC']} &nbsp;|&nbsp; <span style="color: ${statusColor};">${statusText}</span>
                        ${missingText}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="width: 100%; max-width: 600px; margin: 0 auto; text-align: center;">
                <h2 style="color: var(--accent-gold); font-size: 1.8em; margin-bottom: 5px;">Where Do You Stand?</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Based on the choices you made throughout college, these are the career paths that best match your profile.</p>
                ${fitHTML}
            </div>
        `;
    },

    renderPlacementOutcome: function (bestCompany) {
        if (bestCompany) {
            return `
                <div style="width: 100%; max-width: 600px; margin: 0 auto; text-align: center;">
                    <h2 style="color: var(--accent-green); font-size: 2em; margin-bottom: 5px;">Campus Placement Result</h2>
                    <p style="color: var(--text-main); font-size: 1.1em; margin-bottom: 20px;">Congratulations on securing your future!</p>
                    
                    <div class="game-card" style="text-align: center; border-color: var(--accent-green); padding: 30px;">
                        <div style="font-size: 3em; margin-bottom: 10px;">🎉</div>
                        <div style="font-size: 1.3em; font-weight: bold; margin-bottom: 5px;">Profile: ${bestCompany['Card Name']}</div>
                        <div style="font-size: 1.2em; font-weight: bold; color: var(--accent-gold); margin-bottom: 5px;">Estimated CTC: ${bestCompany['Est. CTC']}</div>
                        
                        <div style="color: var(--text-muted); margin-top: 15px; font-style: italic; line-height: 1.5;">
                            Your accumulated profile, strategic internships, and hard work over the last six semesters made you a prime candidate for this role.
                        </div>
                        <div style="margin-top: 20px; font-weight: bold; color: var(--accent-blue);">Status: Joining after graduation</div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div style="width: 100%; max-width: 600px; margin: 0 auto; text-align: center;">
                    <h2 style="color: var(--accent-red); font-size: 2em; margin-bottom: 5px;">Placement Unsuccessful</h2>
                    
                    <div class="game-card" style="text-align: center; border-color: var(--accent-red); padding: 30px; margin-top: 20px;">
                        <div style="font-size: 3em; margin-bottom: 10px;">📉</div>
                        <div style="color: var(--text-main); font-size: 1.1em; margin-bottom: 15px;">
                            Unfortunately, you did not secure a campus placement.
                        </div>
                        <div style="color: var(--text-muted); font-style: italic; line-height: 1.5;">
                            Your current profile did not fully satisfy the stringent requirements of any participating companies.
                            <br><br>
                            However, your journey does not end here. You may still pursue off-campus opportunities, research, entrepreneurship, or higher studies.
                        </div>
                    </div>
                </div>
            `;
        }
    },

    renderNarrative: function (phase, psychology, poetic) {
        return `<div class="game-card">
            <h3>${phase}</h3>
            <p style="margin-top: 10px; line-height: 1.6;">${psychology}</p>
            <p style="margin-top: 10px; font-style: italic; color: var(--text-muted);">"${poetic}"</p>
        </div>`;
    },

    renderFriction: function (eventCard) {
        if (!eventCard) return '<div class="game-card"><p>No friction events for this semester.</p></div>';

        const buildPill = (val, stat, isBadIfPositive) => {
            if (val === 0) return '';
            const isPositive = val > 0;
            const sign = isPositive ? '+' : '';

            let isGood = isBadIfPositive ? !isPositive : isPositive;

            const colorStr = isGood ? 'var(--accent-green)' : 'var(--accent-red)';
            const bgStr = isGood ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';

            return `<span class="stat-pill" style="background: ${bgStr}; color: ${colorStr}; border: 1px solid ${colorStr};">${sign}${val} ${stat}</span>`;
        };

        const t = Logic.getSafeInt(eventCard.Cost_Time);
        const h = Logic.getSafeInt(eventCard.Cost_Health);
        const s = Logic.getSafeInt(eventCard.Cost_Study);
        const soc = Logic.getSafeInt(eventCard.Cost_Social);
        const m = Logic.getSafeInt(eventCard.Cost_Money);
        const str = Logic.getSafeInt(eventCard.Cost_Stress);

        return `<div class="game-card">
            <div class="card-header">
                <span>${eventCard.Name || eventCard.ID}</span>
            </div>
            <p class="card-flavor" style="margin-top: 8px;">${eventCard.Flavor_Text || eventCard.Description || 'A random event affects your semester.'}</p>
            <div class="pill-container">
                ${buildPill(t, 'Time', false)}
                ${buildPill(h, 'Health', false)}
                ${buildPill(s, 'Study', false)}
                ${buildPill(soc, 'Social', false)}
                ${buildPill(m, 'Money', false)}
                ${buildPill(str, 'Stress', true)}
            </div>
        </div>`;
    },

    renderOpportunity: function (tabData, activeTab) {
        // Dynamically check if player is in 2nd Year (Sem 3+) to unlock the tab
        const showInternTab = typeof state !== 'undefined' && state.semester >= 3;

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0;">Opportunities</h2>
            </div>
            <div class="tabs">
                <button class="tab-btn ${activeTab === 'projects' ? 'active' : ''}" onclick="CampusSimulator.switchTab('projects')">📋 Projects</button>
                <button class="tab-btn ${activeTab === 'pors' ? 'active' : ''}" onclick="CampusSimulator.switchTab('pors')">👑 PORs</button>
                ${showInternTab ? `<button class="tab-btn ${activeTab === 'interns' ? 'active' : ''}" onclick="CampusSimulator.switchTab('interns')">💼 Off-Campus</button>` : ''}
            </div>
            <div class="card-grid">
                ${tabData.map(item => item.html).join('')}
            </div>
        `;
    },

    renderAction: function (locations, blocksRemaining) {
        return `<div style="width: 100%; max-width: 600px;">
            <h2>Locations</h2>
            ${locations.map(loc => {
            const cost = Logic.getSafeInt(loc.Cost_Time);
            const isAffordable = Logic.validateAction(loc).allowed;
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
        oppCard: function (card, isLocked, isAffordable, reqHTML) {
            const cost = Logic.getSafeInt(card.Cost_Time);

            // Add visible stat rewards to the cards so players know what they are buying
            let rewardTags = [];
            if (Logic.getSafeInt(card.Reward_Algo) > 0) rewardTags.push(`💻 +${card.Reward_Algo} Algo`);
            if (Logic.getSafeInt(card.Reward_Res) > 0) rewardTags.push(`🔬 +${card.Reward_Res} Res`);
            if (Logic.getSafeInt(card.Reward_Prod) > 0) rewardTags.push(`🚀 +${card.Reward_Prod} Prod`);
            if (Logic.getSafeInt(card.Reward_POR) > 0) rewardTags.push(`👑 +${card.Reward_POR} POR`);
            const rewardsHtml = rewardTags.length > 0 ? `<div style="margin-top: 8px; font-size: 0.85em; color: var(--accent-green); font-weight: bold;">${rewardTags.join(' | ')}</div>` : '';

            return `
                <div class="opp-card ${isLocked ? 'locked' : ''}">
                    <div>
                        <div style="font-weight: bold; font-size: 1.05em;">${card['Card Name'] || card.ID}</div>
                        <div style="font-size: 0.9em; color: var(--text-muted); margin-top: 5px;">Cost: <span style="color: var(--accent-blue);">${cost} blocks</span></div>
                        <div style="font-size: 0.85em; margin-top: 8px; line-height: 1.4;">${card.Description || 'An opportunity awaits.'}</div>
                        ${rewardsHtml}
                        ${reqHTML ? `<div style="margin-top: 8px;">${reqHTML}</div>` : ''}
                    </div>
                    <button class="draft-btn" onclick="CampusSimulator.draftCard('${card.ID}')" ${isLocked || !isAffordable ? 'disabled' : ''}>
                        ${isLocked ? '🔒 Locked' : !isAffordable ? '❌ Cannot Afford' : '✅ Draft'}
                    </button>
                </div>
            `;
        }
    }
};
