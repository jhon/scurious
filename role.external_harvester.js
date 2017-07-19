var roleBuilder = require('role.builder');
var utils = require('utils');

const EXTERNAL_ROOM = 'W5N8';
const EXTERNAL_ROOM_POS = new RoomPosition(47, 33, EXTERNAL_ROOM);

var roleExternalHarvester = {

    /** @param {Creep} creep **/
    run: function (creep) {

        // QUICK! START UP THE STATE MACHINE!
        if (creep.memory.harvesting && creep.carry.energy == creep.carryCapacity) {
            creep.memory.harvesting = false;
            creep.say('e Delivering');
        }
        if (!creep.memory.harvesting && creep.carry.energy == 0) {
            creep.memory.harvesting = true;
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }

        // Harvester! Keep Harvesting
        if (creep.memory.harvesting) {

            // Prioritize dropped resources no matter where we are
            var source = utils.findClosest(creep, FIND_DROPPED_RESOURCES);
            if (source && source.energy >= creep.carryCapacity/2 && creep.pickup(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#00aaff' } });
            }
            else {
                // This is pretty simple pathing. If we're not in the external room
                //   defined above, navigate to a hard coded point. We don't use the
                //   flag because if we don't have a presence in that room we can't get
                //   the flag's position and I'm multirooming with a GCL of 1 right now
                if (creep.room.name != EXTERNAL_ROOM) {
                    creep.moveTo(EXTERNAL_ROOM_POS, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                else {
                    // Once we're in the hardcoded room, go to the source we always go to
                    //   (or find it if we haven't been there yet)
                    source = Game.getObjectById(creep.memory.source_id);
                    if (!source) {
                        source = utils.findRandom(creep, FIND_SOURCES);
                        if (source) creep.memory.source_id = source.id;
                    }
                    if (source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                }
            }
        }
        // Builder! Keep Building!
        else if (creep.memory.building)
        {
            roleBuilder.run(creep);
        }
        else {
            // If we're not in the homeroom, navitage back there. This time we can use the flag since it's position
            //   is visible to us
            if (creep.room.name != Game.flags['TracteurBase'].room.name) {
                creep.moveTo(Game.flags['TracteurBase'].pos, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            else {
                // Get the target we've been pursuing
                let target = Game.getObjectById(creep.memory.target_id);
                // If that target doesn't/no longer exists or it's now full, find a new target
                //   and save off its id
                if (!target || target.energy == target.energyCapacity) {
                    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                        }
                    });
                    if(target) creep.memory.target_id = target.id;
                }
                // If a suitable target exists, transfer energy there
                if (target) {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                // Otherwise, stay a while and build
                else {
                    creep.say('🚧 build');
                    creep.memory.building = true;
                    roleBuilder.run(creep);
                }
            }
        }
    }
};

module.exports = roleExternalHarvester;