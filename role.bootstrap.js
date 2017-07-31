// This role does harvest -> spawn/extension to help bootstrap a starved colony
//   Following this we should have enough energy to spawn harvesters + couriers

const utils = require('utils');

module.exports.run = function (creep) {
    // QUICK! START UP THE STATE MACHINE!
    if (creep.memory.harvesting && creep.carry.energy == creep.carryCapacity) {
        creep.memory.harvesting = false;
    }
    if (!creep.memory.harvesting && creep.carry.energy == 0) {
        creep.memory.harvesting = true;
    }

    if (creep.memory.harvesting) {
        // Grab some sweet sweet energy
        let source = undefined;
        if ((source = utils.findClosest(creep, FIND_SOURCES)) && creep.harvest(source) == ERR_NOT_IN_RANGE) {
            utils.moveCreepTo(creep, source, '#ffaa00');
        }
    }
    else {
        let target = undefined;
        if (!target || target.energy == target.energyCapacity) {
            target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
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
