// --- 6. INITIALIZATION & DATA LOADING ---
            function loadCSV(filename) {
                return new Promise((resolve, reject) => {
                    Papa.parse(filename, {
                        download: true, header: true, dynamicTyping: true, skipEmptyLines: true,
                        complete: (results) => resolve(results.data),
                        error: (err) => reject(err)
                    });
                });
            }
            
            async function initGame() {
                try {
                    const [tl, fric, por, intern, proj, loc, place, soc] = await Promise.all([
    loadCSV('csv/timeline.csv'),
    loadCSV('csv/friction.csv'),
    loadCSV('csv/POR.csv'),
    loadCSV('csv/internships.csv'),
    loadCSV('csv/projects.csv'),
    loadCSV('csv/locations.csv'),
    loadCSV('csv/placement.csv'),
    loadCSV('csv/social.csv')
    ]);
                    
                    db.timeline = tl; db.friction = fric; db.por = por; db.intern = intern;
                    db.proj = proj; db.locations = loc; db.placement = place; db.social = soc;

                    Controller.startNarrative();
                    Controller.syncHUD();

                } catch (error) {
                    UI.updateBoard(`<h2 style="color:var(--accent-red)">Failed to load databases.</h2><p>${error.message}</p>`);
                }
            }