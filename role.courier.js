﻿const utils = require('utils');

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
        if (source && source.energy >= creep.carryCapacity / 2 && creep.pickup(source) == ERR_NOT_IN_RANGE) {
            utils.moveCreepTo(creep, source, '#00aaff');
        }
        
        // Otherwise, go to your normal sources
        else if ((source = utils.findClosest(creep, FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.energy > 0
        })) && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            utils.moveCreepTo(creep, source, '#ffaa00');
        }
        else if ((source = utils.findClosest(creep, FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_STORAGE) && structure.store[RESOURCE_ENERGY] > 0;
            }
        })) && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
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