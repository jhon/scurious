require('prototype.Structure');
require('prototype.StructureSpawn');
require('prototype.StructureTower');
require('prototype.Creep');
const screepsplus = require('LispEngineer_screepsplus');

const profiler = require('screeps-profiler');
profiler.enable();

module.exports.loop = function () { profiler.wrap(function() {

    // Clean up creep memory for creeps we don't have any more :(
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name]._move; // Trim _move
            console.log('delete Memory.creeps["' + name + '"] = ' + JSON.stringify(Memory.creeps[name]));
            if (Memory.creeps[name].ttl > 1 && !(Memory.creeps[name].last_pos.roomName in Game.rooms)) {
                Memory.last_external_death = Game.time;
            }
            delete Memory.creeps[name];
            Memory.pop_count--;
        }
    }

    // Record Start time for teh stats
    Memory.cpu_stats = { Start: Game.cpu.getUsed() };

    for (let room in Game.rooms)
    {
        let structures = Game.rooms[room].find(FIND_MY_STRUCTURES);
        _.each(structures, (x) => x.run());
    }

    Memory.cpu_stats.Structures = Game.cpu.getUsed() - Memory.cpu_stats.Start;
    
    // RUN ALL THE THINGS!
    _.each(Game.creeps, (x) => x.run());

    Memory.cpu_stats.Creeps = Game.cpu.getUsed() - Memory.cpu_stats.Structures;

    screepsplus.collect_stats();

    Memory.stats.cpu.Start = Memory.cpu_stats.Start;
    Memory.stats.cpu.Structures = Memory.cpu_stats.Structures;
    Memory.stats.cpu.Creeps = Memory.cpu_stats.Creeps;
    Memory.stats.cpu.used = Game.cpu.getUsed(); // AT END OF MAIN LOOP
    Memory.stats.cpu.stats = Memory.stats.cpu.used - Memory.stats.cpu.Creeps;
})};