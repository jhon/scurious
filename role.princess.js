const utils = require('utils');

module.exports.run = function (creep) {
    if (creep.room.name != creep.memory.work) {
        utils.moveCreepTo(creep, new RoomPosition(25,25,creep.memory.work), '#0000aa');
    }
    else if (creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE)
    {
        utils.moveCreepTo(creep, creep.room.controller, '#0000aa');
    }
};