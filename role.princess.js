const utils = require('utils');

const EXTERNAL_ROOM = 'W5N8';
const EXTERNAL_ROOM_POS = new RoomPosition(47, 33, EXTERNAL_ROOM);

module.exports.run = function (creep) {
    if (creep.room.name != EXTERNAL_ROOM) {
        utils.moveCreepTo(creep, EXTERNAL_ROOM_POS, '#0000aa');
    }
    else if (creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE)
    {
        utils.moveCreepTo(creep, creep.room.controller, '#0000aa');
    }
};