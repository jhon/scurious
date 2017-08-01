const utils = require('utils');

module.exports.run = function (creep) {
    // QUICK! START UP THE STATE MACHINE!
    if (creep.memory.harvesting && creep.carry.energy == creep.carryCapacity) {
        creep.memory.harvesting = false;
    }
    if (!creep.memory.harvesting && creep.carry.energy == 0) {
        creep.memory.harvesting = true;
        creep.memory.source_id = null;
        creep.memory.target_id = null;
    }

    if (creep.memory.harvesting) {
        let source = utils.findClosest(creep, FIND_DROPPED_RESOURCES);
        if (source && source.energy >= creep.carryCapacity / 2 && creep.pickup(source) == ERR_NOT_IN_RANGE) {
            utils.moveCreepTo(creep, source, '#00aaff');
        }
        if (!source) {
            source = Game.getObjectById(creep.memory.source_id);
        }
        // Try a link first
        if (!source) {
            source = creep.pos.findInRange(FIND_STRUCTURES, 10, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_LINK) &&
                        structure.energy > creep.carryCapacity;
                }
            })[0];
        }
        // If we can't pull from our previous target, it gets reset here so we don't
        //   now try to pull from a link wherever we ended up
        if (!source || (source.energy && source.energy == 0) || (source.store && source.store[RESOURCE_ENERGY] == 0)) {
            source = null;
        }
        // Try Containers second
        if (!source) {
            source = utils.findClosest(creep, FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType === STRUCTURE_CONTAINER &&
                        structure.store[RESOURCE_ENERGY] > 0;
                }
            });
        }
        // Try Storage third
        if (!source) {
            source = utils.findClosest(creep, FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType === STRUCTURE_STORAGE &&
                        structure.store[RESOURCE_ENERGY] > 0;
                }
            });
        }

        if (source) {
            creep.memory.source_id = source.id;
        }

        if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
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
            target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
                }
            });
            if (target) creep.memory.target_id = target.id;
        }
        if (!target || target.energy == target.energyCapacity) {
            target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                }
            });
            if (target) creep.memory.target_id = target.id;
        }
        if (!target || target.energy == target.energyCapacity) {
            target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE) && structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
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