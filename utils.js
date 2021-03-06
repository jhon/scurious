﻿module.exports = {
    // Basic as the crow flies distance
    calcDist: function (a, b)
    {
        return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    },

    // If there's no path to an object, findClosestByPath will fail.
    //   This can mean that creeps are blocking it. Some of this code
    //   wants to latch on to a destination even if we cannot path there.
    // This helper does that
    findClosest: function (in_creep, in_what, in_filter = undefined)
    {
        let target = in_creep.pos.findClosestByPath(in_what, in_filter);
        if (!target)
            target = in_creep.pos.findClosestByRange(in_what, in_filter);
        return target;
    },

    // Get a list of objects, select one at random
    findRandom: function (in_creep, in_what)
    {
        let targets = in_creep.room.find(in_what);
        if (targets.length == 0)
        {
            return null;
        }
        return targets[Math.floor(Math.random() * targets.length)];
    },

    // Easy filter wrapper
    countCreeps: function (in_role)
    {
        return _.filter(Game.creeps, (creep) => creep.memory.role == in_role).length;
    },

    // EzMove
    moveCreepTo: function (in_creep, in_destination, in_pathColor)
    {
        let visualize_path_style = undefined;
        if (in_pathColor)
        {
            visualize_path_style = { stroke: in_pathColor };
        }

        // Am I on a road? Repair it
        //   Don't verify it's actually a road. If we can walk on it we're willing
        //   to repair it (e.g. rampart)
        if (in_creep.carry.energy > 0) {
            let structures = in_creep.pos.lookFor(LOOK_STRUCTURES);
            let most_damaged = _.min(structures, x => x.hits / x.hitsMax);
            if (most_damaged != Infinity) {
                in_creep.repair(most_damaged);
            }
        }

        /*
        let creep_moved = in_creep.memory.last_pos && (in_creep.pos.x != in_creep.memory.last_pos.x ||
            in_creep.pos.y != in_creep.memory.last_pos.y ||
            in_creep.room.name != in_creep.memory.last_pos.roomName);
        */

        //return in_creep.moveTo(in_destination, { ignoreCreeps: creep_moved, visualizePathStyle: visualize_path_style });
        return in_creep.moveTo(in_destination, { ignoreCreeps: false, visualizePathStyle: visualize_path_style });
    },

    energyFull: function (in_target)
    {
        return (in_target.energy && in_target.energy == in_target.energyCapacity) ||
            (in_target.store && in_target.store[RESOURCE_ENERGY] == in_target.storeCapacity);
    }
};
