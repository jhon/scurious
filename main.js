var roleHarvester = require('role.harvester');
var roleExternalHarvester = require('role.external_harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var utils = require('utils');

module.exports.loop = function () {

    // Keep track of the spawn for ease. We may also loop through all of these at some later point
    let spawn = Game.spawns['TracteurSpawn'];

    // Keep a local version of creeps? I don't actually use this it was just in the tutorial
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
            Memory.pop_count--;
        }
    }

    // If we're spawning, put up a thing so we know what is happening
    if (spawn.spawning) {
        let spawningCreep = Game.creeps[spawn.spawning.name];
        spawn.room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            spawn.pos.x + 1,
            spawn.pos.y,
            { align: 'left', opacity: 0.8 });
    }
    else {

        // Grab counts for all the roles
        let num_harvesters = utils.countCreeps('harvester');
        let num_builders = utils.countCreeps('builder');
        let num_upgraders = utils.countCreeps('upgrader');
        let num_external_harvesters = utils.countCreeps('external_harvester');

        // Crazy default parts
        //let parts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        let parts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];

        // Check the balance based on magic numbers that have no basis in reality
        if (num_harvesters < 6) {
            utils.spawnCreep(spawn, 'harvester', parts);
        }
        else if (num_builders < 0) {
            utils.spawnCreep(spawn, 'builder', parts);
        }
        else if (num_upgraders < 2) {
            utils.spawnCreep(spawn, 'upgrader', parts);
        }
        else if (num_external_harvesters < 12) {
            parts = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
            utils.spawnCreep(spawn, 'external_harvester', parts);
        }

        // If everything is dead (but we still have a spawn for some reason), try to rebuild!
        if (!spawn.spawning && spawn.energy == 300 && Memory.pop_count == 0 && spawn.room.energyAvailable == 300)
        {
            utils.spawnCreep(spawn, 'harvester', [WORK, CARRY, MOVE]);
        }
    }
    

    // Look through all the towers in the room
    let towers = spawn.room.find(FIND_MY_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_TOWER; }});
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

    // RUN ALL THE THINGS!
    for(let name in Game.creeps) {
        let creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if (creep.memory.role == 'external_harvester')
        {
            roleExternalHarvester.run(creep);
        }
    }
}