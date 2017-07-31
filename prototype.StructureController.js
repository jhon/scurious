const utils = require('utils');

const MAX_EXTENSIONS = [0, 0, 5, 10, 20, 30, 40, 50, 60];
const MAX_STORAGE = [0, 0, 0, 0, 1, 1, 1, 1, 1];

function createRoomPlan(controller, structures) {
    let construction_sites = controller.room.find(FIND_MY_CONSTRUCTION_SITES);
    if (construction_sites.length >= 2) {
        return;
    }

    let structure_goals = [];
    let cost_matrix = new PathFinder.CostMatrix;
    _.each(structures, function (s) {
        if (s.structureType === STRUCTURE_ROAD) {
            cost_matrix.set(s.pos.x, s.pos.y, 1);
        } else if (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_RAMPART) {
            cost_matrix.set(s.pos.x, s.pos.y, 0xff);
            structure_goals.push({ pos: s.pos, range: 1 });
        } else {
            cost_matrix.set(s.pos.x, s.pos.y, 0xff);
            structure_goals.push({ pos: s.pos, range: 2 });
        }
    });
    _.each(construction_sites, function (s) {
        if (s.structureType === STRUCTURE_ROAD) {
            cost_matrix.set(s.pos.x, s.pos.y, 1);

        }
        else if (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_RAMPART) {
            cost_matrix.set(s.pos.x, s.pos.y, 0xff);
            structure_goals.push({ pos: s.pos, range: 1 });
        } else {
            cost_matrix.set(s.pos.x, s.pos.y, 0xff);
            structure_goals.push({ pos: s.pos, range: 2 });
        }
    });

    let grouped_structures = _.groupBy(structures, 'structureType');
    let grouped_sites = _.groupBy(construction_sites, 'structureType');
    
    //
    // CONSTRUCT STORAGE
    //
    if (controller.my && grouped_structures[STRUCTURE_SPAWN].length != 0)
    {
        let spawn = grouped_structures[STRUCTURE_SPAWN][0];
        let num_storage = (STRUCTURE_STORAGE in grouped_structures) ? grouped_structures[STRUCTURE_STORAGE].length : 0 +
            (STRUCTURE_STORAGE in grouped_sites) ? grouped_sites[STRUCTURE_STORAGE].length : 0;
        if (num_storage < MAX_STORAGE[controller.level]) {
            let path = PathFinder.search(spawn.pos, structure_goals, { roomCallback: r => cost_matrix, plainCost: 2, swampCost: 10, flee: true });
            if (path.path.length != 0 && !path.incomplete) {
                controller.room.createConstructionSite(path.path[path.path.length - 1], STRUCTURE_STORAGE);
                return;
            }
        }
    }

    //
    // CONSTRUCT EXTENSIONS
    //
    if (controller.my && grouped_structures[STRUCTURE_SPAWN].length != 0)
    {
        let spawn = grouped_structures[STRUCTURE_SPAWN][0];
        let num_extensions = (STRUCTURE_EXTENSION in grouped_structures) ? grouped_structures[STRUCTURE_EXTENSION].length : 0 +
            (STRUCTURE_EXTENSION in grouped_sites) ? grouped_sites[STRUCTURE_EXTENSION].length : 0;
        if (num_extensions < MAX_EXTENSIONS[controller.level])
        {
            let path = PathFinder.search(spawn.pos, structure_goals, { roomCallback: r => cost_matrix, plainCost: 2, swampCost: 10, flee: true });
            if (path.path.length != 0 && !path.incomplete)
            {
                controller.room.createConstructionSite(path.path[path.path.length - 1], STRUCTURE_EXTENSION);
                return;
            }
        }
    }

    //
    // CONSTRUCT SOURCE CONTAINERS
    //
    {
        let sources = controller.room.find(FIND_SOURCES);
        let containers = grouped_structures[STRUCTURE_CONTAINER];
        containers.concat(grouped_sites[STRUCTURE_CONTAINER]);

        let containers_per_source = Math.floor(5 / sources.length);

        _.each(sources, function (s) {
            let nearby_containers = _.filter(containers, (x) => utils.calcDist(s.pos, x.pos) < 2);
            if (nearby_containers.length < containers_per_source) {
                structure_goals.push({ pos: s.pos, range: 1 });
                let path = PathFinder.search(s.pos, structure_goals, { roomCallback: function (room) { return cost_matrix }, plainCost: 2, swampCost: 10, flee: true });
                if (path.path.length != 0 && !path.incomplete) {
                    controller.room.createConstructionSite(path.path[path.path.length - 1], STRUCTURE_CONTAINER);
                    return;
                }
            }
        });
    }
}

StructureController.prototype.run = function () {
    this.memory = Memory.controllers[this.room.name];
    if (!this.memory) {
        this.memory = {}
    }

    // We're only dealing with our controllers right now :)
    if (!this.my) {
        return;
    }

    let structures = this.room.find(FIND_STRUCTURES);

    if (this.memory.level != this.level || structures.length != this.memory.numStructures)
    {
        createRoomPlan(this, structures);
        this.memory.level = this.level;
        this.memory.numStructures = structures.length;
    }

}
