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
        // FIXME: This doesn't handle multi-source rooms
        let source = utils.findClosest(creep, FIND_SOURCES);
        if (source) {
            let result = creep.harvest(source);
            if (result == ERR_NOT_IN_RANGE || result == ERR_NOT_ENOUGH_RESOURCES) {
                utils.moveCreepTo(creep, source, '#ffaa00');
            }
        }
    }
    // If we're done harvesting and we're outside the room, navigate back
    else if (!creep.memory.harvesting && creep.room.name != Game.flags['TracteurBase'].room.name) {
        utils.moveCreepTo(creep, Game.flags['TracteurBase'].pos, '#ffffff');
    }
    else {
        // Get our stored target
        let target = Game.getObjectById(creep.memory.target_id);
        // If there is a link within 1 square of us, drop our energy there instead
        if (target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: function (s) {
                return (s.structureType == STRUCTURE_LINK && s.energy < s.energyCapacity && utils.calcDist(s.pos, creep.pos) == 1);
            }
            }))
        {
            creep.memory.target_id = target.id;
        }
        // If that target doesn't exist or someone else got their first,
        //   find a new target and save off its id
        if (!target || target.energy == target.energyCapacity) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_CONTAINER) && structure.store.energy < structure.storeCapacity;
                }
            });
        }
        // ULTIMATE COSMIC POWER!
        if (target) {
            creep.memory.target_id = target.id;
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                utils.moveCreepTo(creep, target, '#ffffff');
            }
            else {
                creep.memory.target_id = null;
            }
        }
    }
};