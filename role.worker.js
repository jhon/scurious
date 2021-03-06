const roleUpgrader = require('role.upgrader');
const utils = require('utils');

module.exports.run = function (creep) {
    // QUICK! START UP THE STATE MACHINE!
    if (creep.memory.building && creep.carry.energy == 0) {
        creep.memory.building = false;
        creep.memory.upgrading = false;
        creep.say('🔄 harvest');
    }
    if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
        creep.memory.building = true;
        creep.say('🚧 build');
    }

    // If we aren't in the right room (probably due to being promoted?)
    //   move to the right room
    if (creep.room.name != Game.flags['TracteurBase'].room.name) {
        utils.moveCreepTo(creep, Game.flags['TracteurBase'].pos, '#ffffff');
    }
    // If we started working as an upgrader, work to finish the job before we go back to buildering
    else if (creep.memory.upgrading) {
        roleUpgrader.run(creep);
    }
    // Builder, start building!
    else if (creep.memory.building) {
        let target = null;

        // Preferably repair buildings
        if (!target)
        {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => structure.structureType != STRUCTURE_ROAD && structure.hits < structure.hitsMax
            });
        }
        // Then roads < 80%
        if (!target)
        {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax*0.8
            });
        }
        // Then look for roads on swamplands
        if (!target)
        {
            target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
                filter: (structure) => {
                    if (structure.structureType != STRUCTURE_ROAD) return false;
                    const l = structure.pos.lookFor(LOOK_TERRAIN);
                    return (l.length && l[0] == 'swamp');
                }
            });
        }
        // Then look for non-roads
        if (!target)
        {
            target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
                filter: (structure) => { return structure.structureType != STRUCTURE_ROAD; }
            });
        }
        // Then anything else
        if (!target)
        {
            target = utils.findClosest(creep, FIND_CONSTRUCTION_SITES);
        }

        if (target && target instanceof Structure)
        {
            if (creep.repair(target) == ERR_NOT_IN_RANGE)
            {
                utils.moveCreepTo(creep, target, '#ffffff');
            }
        }
        else if (target && target instanceof ConstructionSite)
        {
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
                utils.moveCreepTo(creep, target, '#ffffff');
            }
        }
        // If we cannot find anything else to do, call into the upgrader code and start
        //   pumping that RCL
        else {
            creep.say('⚡ upgrade');
            creep.memory.upgrading = true;
            roleUpgrader.run(creep);
        }
    }
    else {
        // Grab energy from containers / storage
        let source = utils.findClosest(creep, FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_CONTAINER ||
                    structure.structureType === STRUCTURE_STORAGE) &&
                    structure.store[RESOURCE_ENERGY] > 0;
            }
        });
        if (source)
        {
            creep.memory.source_id = source.id;
        }
        if (source && creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            utils.moveCreepTo(creep, source, '#ffaa00');
        }
    }
};
