const utils = require('utils');

const MAX_SPAWNS = [0, 1, 1, 1, 1, 1, 1, 2, 2];
const MAX_STORAGE = [0, 0, 0, 0, 1, 1, 1, 1, 1];
const MAX_EXTENSIONS = [0, 0, 5, 10, 20, 30, 40, 50, 60];
const MAX_LINKS = [0, 0, 0, 0, 0, 2, 3, 4, 6];

function countBuildings(type, structures, sites)
{
    return (type in structures) ? structures[type].length : 0 +
        (type in sites) ? sites[type].length : 0;
}

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
    let sources = controller.room.find(FIND_SOURCES);

    //
    // CONSTRUCT ADDITIONAL SPAWNS
    //
    if (controller.my && grouped_structures[STRUCTURE_SPAWN].length != 0) {
        let spawn = grouped_structures[STRUCTURE_SPAWN][0];
        let num_spawns = countBuildings(STRUCTURE_SPAWN, grouped_structures, grouped_sites);
        if (num_spawns < MAX_SPAWNS[controller.level]) {
            let path = PathFinder.search(spawn.pos, structure_goals, { roomCallback: r => cost_matrix, plainCost: 2, swampCost: 10, flee: true });
            if (path.path.length != 0 && !path.incomplete) {
                controller.room.createConstructionSite(path.path[path.path.length - 1], STRUCTURE_SPAWN);
                return;
            }
        }
    }

    //
    // CONSTRUCT LINKS
    //
    if (controller.my && countBuildings(STRUCTURE_LINK, grouped_structures, grouped_sites) < MAX_LINKS[controller.level])
    {
        // Is there 1 within 2 units of a source?
        let sourcelink = false;
        let furthest_source = null;
        let furthest_source_distance = undefined;
        for (let i in sources)
        {
            let d = utils.calcDist(sources[i].pos, grouped_structures[STRUCTURE_SPAWN][0]);
            if (!furthest_source_distance || furthest_source_distance < d)
            {
                furthest_source = sources[i];
                furthest_source_distance = d;
            }
            for (let j in grouped_structures[STRUCTURE_LINK])
            {
                sourcelink = utils.calcDist(sources[i].pos, grouped_structures[STRUCTURE_LINK][j].pos) < 3;
                if (sourcelink) {
                    break;
                }
            }
            if (sourcelink) {
                break;
            }
            for (let j in grouped_sites[STRUCTURE_LINK]) {
                sourcelink = utils.calcDist(sources[i].pos, grouped_sites[STRUCTURE_LINK][j].pos) < 3;
                if (sourcelink) {
                    break;
                }
            }
            if (sourcelink) {
                break;
            }
        }
        if (!sourcelink && furthest_source)
        {
            let link_goals = structure_goals.slice();
            link_goals.push({ pos: furthest_source.pos, range: 2 });
            let path = PathFinder.search(furthest_source.pos, link_goals, { roomCallback: r => cost_matrix, plainCost: 2, swampCost: 10, flee: true });
            if (path.path.length != 0 && !path.incomplete) {
                controller.room.createConstructionSite(path.path[path.path.length - 1], STRUCTURE_LINK);
                return;
            }
        }

        let links = grouped_structures[STRUCTURE_LINK].concat(grouped_sites[STRUCTURE_LINK]);
        // Is there one within 2 units of the controller?
        {
            let nearby_links = _.filter(links, x => x && utils.calcDist(controller.pos, x.pos) < 3);
            if (nearby_links.length < 1)
            {
                let link_goals = structure_goals.slice();
                link_goals.push({ pos: controller.pos, range: 2 });
                let path = PathFinder.search(controller.pos, link_goals, { roomCallback: r => cost_matrix, plainCost: 2, swampCost: 10, flee: true });
                if (path.path.length != 0 && !path.incomplete) {
                    controller.room.createConstructionSite(path.path[path.path.length - 1], STRUCTURE_LINK);
                    return;
                }
            }
        }
        // Is there one within 1 unit of a spawn?
        {
            let nearby_links = _.filter(links, x => utils.calcDist(grouped_structures[STRUCTURE_SPAWN][0].pos, x.pos) < 2);
            if (nearby_links.length < 1) {
                let link_goals = _.map(structure_goals, function (x) { return { pos: x.pos, range: 1 }; });
                let path = PathFinder.search(grouped_structures[STRUCTURE_SPAWN][0].pos, link_goals, { roomCallback: r => cost_matrix, plainCost: 2, swampCost: 10, flee: true });
                if (path.path.length != 0 && !path.incomplete) {
                    controller.room.createConstructionSite(path.path[path.path.length - 1], STRUCTURE_LINK);
                    return;
                }
            }
        }

        // TODO: Is there 1 within 2 units of all sources?
        // TODO: Is there 1 within 1 units of all spawns?
    }

    //
    // CONSTRUCT STORAGE
    //
    if (controller.my && grouped_structures[STRUCTURE_SPAWN].length != 0) {
        let spawn = grouped_structures[STRUCTURE_SPAWN][0];
        let num_storage = countBuildings(STRUCTURE_STORAGE, grouped_structures, grouped_sites);
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
    if (controller.my && grouped_structures[STRUCTURE_SPAWN].length != 0) {
        let spawn = grouped_structures[STRUCTURE_SPAWN][0];
        let num_extensions = countBuildings(STRUCTURE_EXTENSION, grouped_structures, grouped_sites);
        if (num_extensions < MAX_EXTENSIONS[controller.level]) {
            let path = PathFinder.search(spawn.pos, structure_goals, { roomCallback: r => cost_matrix, plainCost: 2, swampCost: 10, flee: true });
            if (path.path.length != 0 && !path.incomplete) {
                controller.room.createConstructionSite(path.path[path.path.length - 1], STRUCTURE_EXTENSION);
                return;
            }
        }
    }

    //
    // CONSTRUCT SOURCE CONTAINERS
    //
    {
        let containers = grouped_structures[STRUCTURE_CONTAINER].concat(grouped_sites[STRUCTURE_CONTAINER]);
        let source_goals = structure_goals.slice();

        let containers_per_source = Math.floor(5 / sources.length);

        _.each(sources, function (s) {
            let nearby_containers = _.filter(containers, (x) => x && (utils.calcDist(s.pos, x.pos) < 2));
            if (nearby_containers.length < containers_per_source) {
                source_goals.push({ pos: s.pos, range: 1 });
                let path = PathFinder.search(s.pos, source_goals, { roomCallback: function (room) { return cost_matrix }, plainCost: 2, swampCost: 10, flee: true });
                if (path.path.length != 0 && !path.incomplete) {
                    controller.room.createConstructionSite(path.path[path.path.length - 1], STRUCTURE_CONTAINER);
                    return;
                }
            }
        });
    }
}

function printStatistics(controller,adjacent_rooms)
{
    let rv = new RoomVisual(controller.room.name);
    let creeps = _.groupBy(Memory.creeps, 'work');
    rv.text(controller.room.name + ": " + JSON.stringify(_.countBy(creeps[controller.room.name], 'role')), 0, 0, { align: 'left' });
    
    let y = 1;
    for (let i in adjacent_rooms) {
        let r = adjacent_rooms[i];
        let last_death = Memory.exterior_rooms[r].last_death + 600 - Game.time;
        rv.text(r + ": " + JSON.stringify(_.countBy(creeps[r],'role')) + " " + (last_death>0?last_death:0), 0, y, { align: 'left' });
        y += 1;
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

    // Map out the surrounding rooms
    let adjacent_rooms = _.values(Game.map.describeExits(this.room.name));
    let exterior_rooms = _.map(adjacent_rooms, x => _.values(Game.map.describeExits(x)));
    for (let i in exterior_rooms)
    {
        adjacent_rooms = adjacent_rooms.concat(exterior_rooms[i]);
    }
    if (!Memory.exterior_rooms)
    {
        Memory.exterior_rooms = {};
    }
    for (let i in adjacent_rooms) {
        let e = adjacent_rooms[i];
        if (!Memory.exterior_rooms[e]) {
            Memory.exterior_rooms[e] = { creeps: {}};
        }
    }
    _.remove(adjacent_rooms, x => x == this.room.name);

    printStatistics(this,adjacent_rooms);

    let structures = this.room.find(FIND_STRUCTURES);

    if (this.memory.level != this.level || structures.length != this.memory.numStructures)
    {
        createRoomPlan(this, structures);
        this.memory.level = this.level;
        this.memory.numStructures = structures.length;
    }

}
