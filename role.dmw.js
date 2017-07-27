var utils = require('utils');

////
// Original module structure/function comes from @aalku, this module is more hack than man now 
////

Creep.prototype.recycle = function () {
    console.log(`Recycling ${this.memory.role} ${this.name}`);
    this.memory.role_in_life = this.memory.role;
    this.memory.role = "dmw";
}

////
// Suicidal functions courtesy @warinternal
////
// Should we recycle or suicide:
/**
 * Modifer is optional, pass cost of moving to a spawn for recycle
 * Should be clamped to 0 <= x <= this.cost
 */
Creep.prototype.getRecycleWorth = function (modifier = 0) {
    return Math.floor(this.memory.cost * 1 * Math.max(0, this.ticksToLive - modifier) / this.memory.ttl_max);
}

Creep.prototype.getSuicideWorth = function () {
    return Math.floor(this.memory.cost * CREEP_CORPSE_RATE * this.ticksToLive / this.memory.ttl_max);
}

/**
 * Math heavy formula for whether a trip to recycle is worth the trouble.
 *
 * Formula states that ttl must be greater than the latter portion to return
 * the minimum amount of energy after the given number of steps.
 * 
 * https://www.symbolab.com/solver/solve-for-equation-calculator/solve%20for%20t%2C%20c%5Ccdot%5Cleft(%5Cfrac%7Bt-d%7D%7Bm%7D%5Cright)%5Cge%20x
 */
Creep.prototype.isWorthRecycling = function (minReturn = 10, steps = 0) {
    return this.memory.ttl_max >= ((minReturn * this.memory.ttl_max) + (steps * this.memory.cost)) / this.memory.cost;
}

module.exports.run = function (in_creep) {
    // More futureproofing than I really need :)
    var r = _.findKey(in_creep.carry);
    if (r) {
        in_creep.drop(r[1]);
    } else {
        let target = Game.getObjectById(in_creep.memory.target_id)
        if (!target || target.structureType != STRUCTURE_SPAWN) {
            in_creep.target = in_creep.pos.findClosestByPath(FIND_MY_SPAWNS);
            in_creep.memory.target_id = target.id;
        }
        if (target.recycleCreep(in_creep) == ERR_NOT_IN_RANGE) {
            utils.moveCreepTo(in_creep,target);
        }
    }
}