module.exports = {
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

    // Filter for damaged structure. Used by tower and creep repair
    findClosestDamagedStructure: function (in_creep)
    {
        // Find structures < 100% or roads < 90%
        return in_creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => (structure.structureType!=STRUCTURE_ROAD)?(structure.hits < structure.hitsMax):(structure.hits < structure.hitsMax*0.9)
        });
    },

    // Easy filter wrapper
    countCreeps: function (in_role)
    {
        return _.filter(Game.creeps, (creep) => creep.memory.role == in_role).length;
    },

    // EzSpawn
    spawnCreep: function (in_spawn, in_role, in_parts, in_cost)
    {
        let new_name = in_spawn.createCreep(in_parts, undefined, { role: in_role, cost:in_cost, home:in_spawn.room.name });
        if (new_name !== -6) {
            console.log('Spawning new ' + in_role + ': ' + new_name);
            Memory.pop_count++;
        }
        return new_name;
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
            let road = in_creep.pos.lookFor(LOOK_STRUCTURES)[0];
            if (road) {
                in_creep.repair(road);
            }
        }

        let creep_moved = in_creep.memory.last_pos && (in_creep.pos.x != in_creep.memory.last_pos.x ||
            in_creep.pos.y != in_creep.memory.last_pos.y ||
            in_creep.room.name != in_creep.memory.last_pos.roomName);
        
        return in_creep.moveTo(in_destination, { ignoreCreeps: creep_moved, visualizePathStyle: visualize_path_style });
    },
};
