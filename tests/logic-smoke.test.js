const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync('js/state.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('js/logic.js', 'utf8'), context);

function run(source) {
    return vm.runInContext(`(() => { ${source} })()`, context);
}

function snapshot(source) {
    return JSON.parse(JSON.stringify(run(source)));
}

run(`
    state.blocksRemaining = 10;
    state.stats.Health = 5;
    state.stats.Stress = 0;
    state.stats.Social = 2;
    state.stats.Money = 2;
    Logic.processCardEffect({
        ID: 'EVT_NEG', Type: 'RANDOM', Cost_Time: 1,
        Cost_Health: 1, Cost_Stress: 1
    }, 'friction');
`);
assert.deepEqual(
    snapshot(`return { time: state.blocksRemaining, health: state.stats.Health, stress: state.stats.Stress };`),
    { time: 9, health: 4, stress: 1 }
);

run(`
    state.stats.Study = 0;
    state.stats.Social = 1;
    state.stats.Stress = 3;
    Logic.processCardEffect({
        ID: 'EVT_POS', Type: 'RANDOM', Reward_Study: 5,
        Reward_Social: 1, Reward_Stress: 2
    }, 'friction');
`);
assert.deepEqual(
    snapshot(`return { study: state.stats.Study, social: state.stats.Social, stress: state.stats.Stress };`),
    { study: 5, social: 2, stress: 1 }
);

run(`state.stats.Health = 0; state.stats.Stress = 0; state.blocksRemaining = 17;`);
assert.equal(
    run(`return Logic.validateAction({ ID: 'NO_HEALTH', Cost_Time: 2, Cost_Health: 1 }).allowed;`),
    false
);

run(`state.stats.Health = 10; state.stats.Stress = 9;`);
assert.equal(
    run(`return Logic.validateAction({ ID: 'BURNOUT', Cost_Stress: 2 }).allowed;`),
    false
);
assert.equal(
    run(`return Logic.validateAction({ ID: 'REST', Reward_Stress: 1 }).allowed;`),
    true
);

run(`
    state.resume.Positions = 0;
    Logic.applyResumeStats({ ID: 'VOLUNTEER', Type: 'POR', Reward_POR: 0 });
    Logic.applyResumeStats({ ID: 'COORDINATOR', Type: 'POR', Reward_POR: 2 });
`);
assert.equal(run(`return state.resume.Positions;`), 2);

run(`
    state.resume.Algo = 0;
    state.mentorBonusesClaimed = [];
    db.social = [{ ID: 'MENTOR', 'Card Name': 'Mentor', Reward_Algo: 1 }];
    Logic.applyMaintenanceRewards(['MENTOR']);
    Logic.applyMaintenanceRewards(['MENTOR']);
`);
assert.equal(run(`return state.resume.Algo;`), 1);

run(`
    state.stats.lockedCPI = 9;
    state.resume.Algo = 3;
    state.history = ['INT_003'];
    db.intern = [{ ID: 'INT_003', Type: 'INTERNSHIP', 'Card Name': 'quant_intern' }];
    db.proj = [];
    db.por = [];
    db.placement = [{
        ID: 'QUANT', 'Card Name': 'God-Tier Quant',
        Req_Prerequisite: 'CPI:9 | Algo:3 | INT_003'
    }];
`);
assert.equal(run(`return Logic.evaluateAllPlacements()[0].eligible;`), true);

console.log('logic smoke tests passed');
