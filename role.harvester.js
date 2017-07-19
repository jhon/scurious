var roleBuilder = require('role.builder');
var roleExternalHarvester = require('role.external_harvester');
var utils = require('utils');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function (creep) {

        // QUICK! START UP THE STATE MACHINE!
        if (creep.memory.harvesting && creep.carry.energy == creep.carryCapacity) {
            creep.memory.harvesting = false;
            creep.memory.external_harvesting = false;
        }
        if (!creep.memory.harvesting && creep.carry.energy == 0) {
            creep.memory.harvesting = true;
            creep.memory.building = false;
        }

        // If we couldn't find local resources and started going external, continue with that
        if (creep.memory.external_harvesting)
        {
            roleExternalHarvester.run(creep);
        }
        else if (creep.memory.harvesting) {
            // Are their dropped resources? Prioritize those
            let source = utils.findClosest(creep, FIND_DROPPED_RESOURCES);
            if (source && creep.pickup(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#00aaff' } });
            }
            // Otherwise, go to your normal sources
            // FIXME: the find should filter to see if sources have energy to better handle multi-source rooms
            else if ((source = utils.findClosest(creep, FIND_SOURCES)) && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            // If we found a source but it didn't have any energy, go external
            else if(source && source.energy == 0) {
                creep.memory.external_harvesting = true;
                roleExternalHarvester.run(creep);
            }
        }
        // If we're done harvesting and we're outside the room, navigate back
        else if (!creep.memory.harvesting && creep.room.name != Game.flags['TracteurBase'].room.name)
        {
            creep.moveTo(Game.flags['TracteurBase'].pos, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        // Builder, keep building!
        else if (creep.memory.building)
        {
            roleBuilder.run(creep);
        }
        else {
            // Get our stored target
            let target = Game.getObjectById(creep.memory.target_id);
            // If that target doesn't exist or someone else got their first,
            //   find a new target and save off its id
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
            // ULTIMATE COSMIC POWER!
            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            // If we can't find anyone who wants this delicious energy we've harvested,
            //   go build something with it
            else {
                creep.say('🚧 build');
                creep.memory.building = true;
                roleBuilder.run(creep);
            }
        }
    }
};

module.exports = roleHarvester;