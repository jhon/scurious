var utils = {
    // Basic as the crow flies distance
    calcDist: function (a, b)
    {
        return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    },

    // If there's no path to an object, findClosestByPath will fail.
    //   This can mean that creeps are blocking it. Some of this code
    //   wants to latch on to a destination even if we cannot path there.
    // This helper does that
    findClosest: function (in_creep, in_what)
    {
        let target = in_creep.pos.findClosestByPath(in_what);
        if (!target)
            target = in_creep.pos.findClosestByRange(in_what);
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

    // Filter for damaged structure. Used by tower and creep repair
    findClosestDamagedStructure: function (in_creep)
    {
        return in_creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
    },

    // Easy filter wrapper
    countCreeps: function (in_role)
    {
        return _.filter(Game.creeps, (creep) => creep.memory.role == in_role).length;
    },

    // EzSpawn
    spawnCreep: function (in_spawn, in_role, in_parts)
    {
        let new_name = in_spawn.createCreep(in_parts, undefined, { role: in_role });
        if (new_name !== -6) {
            console.log('Spawning new ' + in_role + ': ' + new_name);
            Memory.pop_count++;
        }
        return new_name;
    }
};

module.exports = utils;