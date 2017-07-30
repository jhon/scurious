require('prototype.Structure');
require('prototype.StructureSpawn');
require('prototype.StructureTower');
var roleHarvester = require('role.harvester');
var roleExternalHarvester = require('role.external_harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleDmw = require('role.dmw');
var utils = require('utils');
var screepsplus = require('LispEngineer_screepsplus');

const profiler = require('screeps-profiler');
profiler.enable();

const DISPATCH_TABLE = {
    'harvester': roleHarvester.run,
    'upgrader': roleUpgrader.run,
    'builder': roleBuilder.run,
    'external_harvester': roleExternalHarvester.run,
    'dmw': roleDmw.run
};

module.exports.loop = function () { profiler.wrap(function() {

    // Clean up creep memory for creeps we don't have any more :(
    for (var name in Memory.creeps) {
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
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];

        creep.memory.ttl = creep.ticksToLive;
        creep.memory.ttl_max = Math.max(creep.ticksToLive, creep.memory.ttl_max);

        if (creep.memory.role != 'dmw') {
            // If the creep can't work or move or if it isn't worth keeping around: kill it off
            let parts = _.countBy(_.filter(creep.body, (x) => x.hits != 0), "type");
            let force_suicide = (!parts.work || !parts.carry || !parts.move);
            if (force_suicide || creep.memory.ttl < 50) {
                if (force_suicide || !creep.isWorthRecycling(10, 25)) {
                    console.log(`Euthanizing ${creep.memory.role} ${creep.name}`);
                    creep.memory.role_in_life = creep.memory.role;
                    creep.memory.role = 'euthanized';
                    creep.suicide();
                }
                else {
                    creep.recycle();                    
                }
            }
        }

        if (creep.memory.role in DISPATCH_TABLE)
        {
            DISPATCH_TABLE[creep.memory.role](creep);
        }
        
        creep.memory.last_pos = new RoomPosition(creep.pos.x, creep.pos.y, creep.room.name);
    }

    Memory.cpu_stats.Creeps = Game.cpu.getUsed() - Memory.cpu_stats.Structures;

    screepsplus.collect_stats();

    Memory.stats.cpu.Start = Memory.cpu_stats.Start;
    Memory.stats.cpu.Structures = Memory.cpu_stats.Structures;
    Memory.stats.cpu.Creeps = Memory.cpu_stats.Creeps;
    Memory.stats.cpu.used = Game.cpu.getUsed(); // AT END OF MAIN LOOP
    Memory.stats.cpu.stats = Memory.stats.cpu.used - Memory.stats.cpu.Creeps;
})};