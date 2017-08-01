const utils = require('utils');

module.exports.run = function (creep) {
    // QUICK! START UP THE STATE MACHINE!
    if (creep.memory.upgrading && creep.carry.energy == 0) {
        creep.memory.upgrading = false;
        creep.memory.source_id = null;
        creep.say('🔄 harvest');
    }
    if (!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
        creep.memory.upgrading = true;
        creep.say('⚡ upgrade');
    }

    // Hack fix for the fact that an upgrader got stuck in the external room? How did it even get there...
    if (creep.room.name != Game.flags['TracteurBase'].room.name) {
        utils.moveCreepTo(creep, Game.flags['TracteurBase'].pos, '#ffffff');
    }
    // Upgrade Upgrade Upgrade
    else if (creep.memory.upgrading) {
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            utils.moveCreepTo(creep, creep.room.controller, '#ffffff');
        }
    }
    else {
        // Grab energy from a link if it's super close
        let source = Game.getObjectById(creep.memory.source_id);
        if (!source) {
            source = creep.pos.findInRange(FIND_STRUCTURES, 10, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_LINK) &&
                        structure.energy > creep.carryCapacity;
                }
            })[0];
        }
        if (!source || (source.energy && source.energy == 0) || (source.store && source.store[RESOURCE_ENERGY] == 0)) {
            source = null;
        }
        if (!source) {
            source = utils.findClosest(creep, FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_CONTAINER ||
                        structure.structureType === STRUCTURE_STORAGE) &&
                        structure.store[RESOURCE_ENERGY] > 0;
                }
            });
        }

        // Grab energy from containers / storage
        if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            utils.moveCreepTo(creep, source, '#ffaa00');
        }
    }
};
