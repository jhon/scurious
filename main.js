require('prototype.Structure');
require('prototype.StructureController');
require('prototype.StructureSpawn');
require('prototype.StructureTower');
require('prototype.StructureLink');
require('prototype.Creep');
const screepsplus = require('LispEngineer_screepsplus');

const profiler = require('screeps-profiler');
profiler.enable();

module.exports.loop = function () { profiler.wrap(function() {

    // Make sure a controlled room isn't in the exterior_rooms data structure
    /*
    for (let r in Memory.exterior_rooms)
    {
        if (Game.rooms[r] && Game.rooms[r].controller.my && Game.rooms[r].controller.level != 0)
        {
            console.log(`Removing ${r}`);
            delete Memory.exterior_rooms[r];
        }
    }
    */

    for (let r in Memory.exterior_rooms)
    {
        for (let t in Memory.exterior_rooms[r].creeps)
        {
            _.remove(Memory.exterior_rooms[r].creeps[t], x => !Game.creeps[x]);
        }
    }

    // Clean up creep memory for creeps we don't have any more :(
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name]._move; // Trim _move
            console.log('delete Memory.creeps["' + name + '"] = ' + JSON.stringify(Memory.creeps[name]));
            if (Memory.creeps[name].ttl > 1 && Memory.creeps[name].last_pos.roomName in Memory.exterior_rooms)
            {
                Memory.exterior_rooms[Memory.creeps[name].last_pos.roomName].last_death = Game.time;
                if (Memory.creeps[name].work in Memory.exterior_rooms)
                {
                    _.remove(Memory.exterior_rooms[Memory.creeps[name].work].creeps[Memory.creeps[name].role],
                        x => x == name);
                }
            }
            delete Memory.creeps[name];
            Memory.pop_count--;
        }
    }

    // Record Start time for teh stats
    Memory.cpu_stats = { Start: Game.cpu.getUsed() };

    _.invoke(Game.structures, 'run');

    Memory.cpu_stats.Structures = Game.cpu.getUsed() - Memory.cpu_stats.Start;
    
    // RUN ALL THE THINGS!
    _.invoke(Game.creeps, 'run');

    Memory.cpu_stats.Creeps = Game.cpu.getUsed() - Memory.cpu_stats.Structures;

    screepsplus.collect_stats();

    Memory.stats.creeps = _.countBy(Memory.creeps, 'role');

    Memory.stats.cpu.Start = Memory.cpu_stats.Start;
    Memory.stats.cpu.Structures = Memory.cpu_stats.Structures;
    Memory.stats.cpu.Creeps = Memory.cpu_stats.Creeps;
    Memory.stats.cpu.used = Game.cpu.getUsed(); // AT END OF MAIN LOOP
    Memory.stats.cpu.stats = Memory.stats.cpu.used - Memory.stats.cpu.Creeps;
})};