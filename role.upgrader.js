var utils = require('utils');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

        // QUICK! START UP THE STATE MACHINE!
        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
        }

        // Hack fix for the fact that an upgrader got stuck in the external room? How did it even get there...
        if (creep.room.name != Game.flags['TracteurBase'].room.name) {
            creep.moveTo(Game.flags['TracteurBase'].pos, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        // Upgrade Upgrade Upgrade
        else if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else {
            // Harvest from sources... poorly...
            var source = utils.findClosest(creep, FIND_SOURCES);
            if(source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
    }
};

module.exports = roleUpgrader;