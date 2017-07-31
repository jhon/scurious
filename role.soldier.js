const utils = require('utils');

module.exports.run = function (creep) {
    if (creep.room.name != creep.memory.work) {
        utils.moveCreepTo(creep, new RoomPosition(25,25,creep.memory.work), '#0000aa');
    }
    else
    {
        let hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length == 0)
        {
            return;
        }
        let hostile = Game.getObjectById(creep.memory.hostile_id);
        if (!hostile) {
            hostile = hostiles[_.random(hostiles.length)];
            creep.memory.hostile_id = hostile.id;
        }

        // Move closer, ranged attack, attack
        utils.moveCreepTo(creep, hostile, '#ff0000');
        creep.attack(hostile);
        creep.rangedAttack(hostile);
    }
};