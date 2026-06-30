        // ========== PHASE 0: GAME ENGINE ==========
        const CampusSimulator = (() => {
        


            

            

           // --- 7. EXPOSE PUBLIC API ---
            // These are the only functions the HTML buttons are allowed to call!
            return {
                boot: initGame,
                nextPhase: function() { Controller.advancePhase(); },
                takeLocationAction: function(locId) { Controller.handleLocationClick(locId); },
                switchTab: function(tabName) { Controller.handleTabSwitch(tabName); },
                draftCard: function(cardId) { Controller.handleDraftClick(cardId); },
                selectInterlude: function(cardId) { Controller.handleInterludeSelection(cardId); },
                selectSummer: function(choice) { Controller.handleSummerSelection(choice); },
                closeTutorial: function() { Controller.closeTutorial(); },
                closeReportCard: function() { Controller.closeReportCard(); }
                 // <--- ADD THIS
            };


        })();

        // Boot the engine when the window loads
        window.onload = CampusSimulator.boot;