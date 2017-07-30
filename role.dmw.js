var utils = require('utils');

module.exports.run = function (in_creep) {
    // More futureproofing than I really need :)
    var r = _.findKey(in_creep.carry);
    if (r) {
        in_creep.drop(r);
    } else {
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