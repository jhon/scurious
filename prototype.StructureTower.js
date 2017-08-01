const utils = require('utils');

StructureTower.prototype.run = function () {
    let closestHostile = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (closestHostile) {
        this.attack(closestHostile);
    }
    // If we can't, try to repair a structure if we have >75% power
    //   (so we have power for defense)
    // TODO: Creeps repair for 100HP/energy
    //        Towers repair for 80HP/energy within 5 units
    //          dropping off linearly to 20HP/energy at 20 units (and beyond)
    //        We probably want to find a heuristic to determine whether to let
    //          the tower do the repair or if we should dispatch a creep. At the
    //          optimal it's probably worth it. If no creeps are nearby the low end
    //          may be worth it.
    else if(this.energy > this.energyCapacity*0.75){
        let closestDamagedStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => (structure.structureType == STRUCTURE_ROAD && structure.hits < structure.hitsMax * 0.9)
        });
        if (closestDamagedStructure) {
            this.repair(closestDamagedStructure);
        }
    }
}
