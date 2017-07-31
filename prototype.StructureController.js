const utils = require('utils');

function createRoomPlan(controller, structures) {
    let construction_sites = controller.room.find(FIND_MY_CONSTRUCTION_SITES);
    if (construction_sites.length > 2) {
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

    //
    // CONSTRUCT SOURCE CONTAINERS
    //
    {
        let sources = controller.room.find(FIND_SOURCES);
        let grouped_structures = _.groupBy(structures, 'structureType');
        let grouped_sites = _.groupBy(construction_sites, 'structureType');
        let goals = [];
        _.each(grouped_structures[STRUCTURE_CONTAINER], (x) => goals.push({ pos: x.pos, range: 0 }));
        _.each(grouped_sites[STRUCTURE_CONTAINER], (x) => goals.push({ pos: x.pos, range: 0 }));

        let containers_per_source = Math.floor(5 / sources.length);

        _.each(sources, function (s) {
            let nearby_containers = _.filter(goals, (x) => utils.calcDist(s.pos, x.pos) < 2);
            if (nearby_containers.length < containers_per_source) {
                structure_goals.push({ pos: s.pos, range: 1 });
                path = PathFinder.search(s.pos, structure_goals, { roomCallback: function (room) { return cost_matrix }, plainCost: 2, swampCost: 10, flee: true });
                if (path.path.length != 0 && !path.incomplete) {
                    controller.room.createConstructionSite(path.path[path.path.length - 1], STRUCTURE_CONTAINER);
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
