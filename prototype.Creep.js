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


////
// Creep handler code :)
////
Creep.prototype.run = function ()
{
    this.memory.ttl = this.ticksToLive;
    this.memory.ttl_max = Math.max(this.ticksToLive, this.memory.ttl_max);

    if (this.memory.role != 'dmw') {
        // If the creep can't work or move or if it isn't worth keeping around: kill it off
        let parts = _.countBy(_.filter(this.body, (x) => x.hits != 0), "type");
        let part_max = _.countBy(this.body, 'type');
        let force_suicide = ((!parts.work && part_max.work) ||
            (!parts.carry && part_max.carry) ||
            (!parts.claim && part_max.claim) ||
            !parts.move);
        if (force_suicide || this.memory.ttl < 50) {
            if (force_suicide || !this.isWorthRecycling(10, 25)) {
                console.log(`Euthanizing ${this.memory.role} ${this.name}`);
                this.memory.role_in_life = this.memory.role;
                this.memory.role = 'euthanized';
                this.suicide();
            }
            else {
                this.recycle();
            }
        }
    }

    // Try to automatically include the module
    // ASKME: Is it better to do this or to have not hacked the roles
    //   to handle the euthanized role?
    let roleRunner = null;
    try {
        roleRunner = require('role.' + this.memory.role);
    } catch (e) {
            console.log(e.message);
    }

    roleRunner.run(this);

    this.memory.last_pos = new RoomPosition(this.pos.x, this.pos.y, this.room.name);
}