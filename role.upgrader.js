const utils = require('utils');

module.exports.run = function (creep) {
    // QUICK! START UP THE STATE MACHINE!
    if (creep.memory.upgrading && creep.carry.energy == 0) {
        creep.memory.upgrading = false;
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
        // Harvest from sources... poorly...
        let source = utils.findClosest(creep, FIND_SOURCES);
        if (source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
            utils.moveCreepTo(creep, source, '#ffffff');
        }
    }
};
