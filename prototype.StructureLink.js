const utils = require('utils');

StructureLink.prototype.run = function () {
    // If we're next to a source, we're a source link.
    let sources = this.room.find(FIND_SOURCES, { filter: x => utils.calcDist(this.pos, x.pos) < 3 });
    if (sources.length == 0 || this.energy == 0)
    {
        return;
    }

    // Find other links in the room
    let links = this.room.find(FIND_STRUCTURES, { filter: x => x.structureType == STRUCTURE_LINK && x.id != this.id });

    // Fill the furthest first
    let furthest = _.max(links, x => utils.calcDist(this.pos,x.pos));

    this.transferEnergy(furthest);
    
}
