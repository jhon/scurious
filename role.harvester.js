const utils = require('utils');

module.exports.run = function (creep) {
    // QUICK! START UP THE STATE MACHINE!
    if (creep.memory.harvesting && creep.carry.energy == creep.carryCapacity) {
        creep.memory.harvesting = false;
    }
    if (!creep.memory.harvesting && creep.carry.energy == 0) {
        creep.memory.harvesting = true;
        creep.memory.target_id = null;
    }

    if (creep.memory.harvesting) {
        // Are their dropped resources? Prioritize those
        let source = utils.findClosest(creep, FIND_DROPPED_RESOURCES);
        // Otherwise, go to your normal sources
        // FIXME: the find should filter to see if sources have energy to better handle multi-source rooms
        if ((source = utils.findClosest(creep, FIND_SOURCES)) && creep.harvest(source) == ERR_NOT_IN_RANGE) {
            utils.moveCreepTo(creep, source, '#ffaa00');
        }
    }
    // If we're done harvesting and we're outside the room, navigate back
    else if (!creep.memory.harvesting && creep.room.name != Game.flags['TracteurBase'].room.name) {
        utils.moveCreepTo(creep, Game.flags['TracteurBase'].pos, '#ffffff');
    }
    else {
        // Get our stored target
        let target = Game.getObjectById(creep.memory.target_id);
        // If that target doesn't exist or someone else got their first,
        //   find a new target and save off its id
        if (!target || target.energy == target.energyCapacity) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_CONTAINER) && structure.store.energy < structure.storeCapacity;
                }
            });
            if (target) creep.memory.target_id = target.id;
        }
        // ULTIMATE COSMIC POWER!
        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                utils.moveCreepTo(creep, target, '#ffffff');
            }
        }
    }
};