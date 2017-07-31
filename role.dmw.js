const utils = require('utils');

module.exports.run = function (in_creep) {
    // More futureproofing than I really need :)
    let r = _.findKey(in_creep.carry);
    if (r) {
        in_creep.drop(r);
    } else {
        if (in_creep.memory.home && in_creep.room.name != in_creep.memory.home) {
            utils.moveCreepTo(in_creep, new RoomPosition(25, 25, in_creep.memory.home), '#aa0000');
        }
        else {
            let target = Game.getObjectById(in_creep.memory.target_id)
            if (!target || target.structureType != STRUCTURE_SPAWN) {
                target = in_creep.pos.findClosestByPath(FIND_MY_SPAWNS);
                if (target) {
                    in_creep.memory.target_id = target.id;
                }
            }
            if (target && target.recycleCreep(in_creep) == ERR_NOT_IN_RANGE) {
                utils.moveCreepTo(in_creep, target, '#ff0000');
            }
        }
    }
};