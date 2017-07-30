require('prototype.Structure');
require('prototype.StructureSpawn');
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

    // Record Start time for teh stats
    Memory.cpu_stats = { Start: Game.cpu.getUsed() };

    // Keep track of the spawn for ease. We may also loop through all of these at some later point
    let spawn = Game.spawns['TracteurSpawn'];

    // Keep a local version of creeps? I don't actually use this it was just in the tutorial
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name]._move; // Trim _move
            console.log('delete Memory.creeps["' + name + '"] = ' + JSON.stringify(Memory.creeps[name]));
            if (Memory.creeps[name].ttl > 1 && Memory.creeps[name].last_pos.roomName != spawn.room.name) {
                Memory.last_external_death = Game.time;
            }
            delete Memory.creeps[name];
            Memory.pop_count--;
        }
    }

    for (let room in Game.rooms)
    {
        let structures = Game.rooms[room].find(FIND_MY_STRUCTURES);
        _.each(structures, (x) => x.run());
    }

    Memory.cpu_stats.CreepManagers = Game.cpu.getUsed() - Memory.cpu_stats.Start;

    // Look through all the towers in the room
    let towers = spawn.room.find(FIND_MY_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_TOWER; } });
    for (let t in towers) {
        let tower = towers[t];
        // If we can find a hostile, attack it
        let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
        }
        // If we can't, try to repair a structure
        // TODO: Creeps repair for 100HP/energy
        //        Towers repair for 80HP/energy within 5 units
        //          dropping off linearly to 20HP/energy at 20 units (and beyond)
        //        We probably want to find a heuristic to determine whether to let
        //          the tower do the repair or if we should dispatch a creep. At the
        //          optimal it's probably worth it. If no creeps are nearby the low end
        //          may be worth it.
        else {
            let closestDamagedStructure = utils.findClosestDamagedStructure(tower);
            if (closestDamagedStructure) {
                tower.repair(closestDamagedStructure);
            }
        }
    }

    Memory.cpu_stats.Towers = Game.cpu.getUsed() - Memory.cpu_stats.CreepManagers;

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

    Memory.cpu_stats.Creeps = Game.cpu.getUsed() - Memory.cpu_stats.Towers;

    screepsplus.collect_stats();

    Memory.stats.cpu.Start = Memory.cpu_stats.Start;
    Memory.stats.cpu.CreepManagers = Memory.cpu_stats.CreepManagers;
    Memory.stats.cpu.Towers = Memory.cpu_stats.Towers;
    Memory.stats.cpu.Creeps = Memory.cpu_stats.Creeps;
    Memory.stats.cpu.used = Game.cpu.getUsed(); // AT END OF MAIN LOOP
    Memory.stats.cpu.stats = Memory.stats.cpu.used - Memory.stats.cpu.Creeps;
})};