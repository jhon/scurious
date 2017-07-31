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
            if (creep.pos.x < 4 || creep.pos.x > 46 || creep.pos.y < 4 || creep.pos.y > 46) {
                utils.moveCreepTo(creep, new RoomPosition(25, 25, creep.memory.work), '#0000aa');
            }
            else {
                // Try to stay out of the way of the drones
                let drones = creep.room.find(FIND_MY_CREEPS);
                _.remove(drones, (d) => d.memory.role == 'soldier' || utils.calcDist(d.pos, creep.pos) > 3);
                drones = _.map(drones, function (d) { return { pos: d.pos, range: 2 }; });
                let path = PathFinder.search(creep.pos, drones, {
                    flee: true,
                    roomCallback: function (room) {
                        return new PathFinder.CostMatrix;
                    }
                });
                if (path.path.length != 0 && !path.incomplete)
                {
                    creep.moveByPath(path.path);
                }
            }
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