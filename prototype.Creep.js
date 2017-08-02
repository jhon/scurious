Creep.prototype.euthanize = function () {
    if (this.memory.work in Memory.exterior_rooms) {
        _.remove(Memory.exterior_rooms[this.memory.work].creeps[this.memory.role],
            x => x == this.name);
    }
    console.log(`Euthanizing ${this.memory.role} ${this.name}`);
    this.memory.role_in_life = this.memory.role;
    this.memory.role = 'euthanized';
    this.suicide();
}

Creep.prototype.recycle = function () {
    if (this.memory.work in Memory.exterior_rooms) {
        _.remove(Memory.exterior_rooms[this.memory.work].creeps[this.memory.role],
            x => x == this.name);
    }
    console.log(`Recycling ${this.memory.role} ${this.name}`);
    this.memory.role_in_life = this.memory.role;
    this.memory.role = "dmw";
}

// Determine if walking steps steps and then recycling will net you >= minReturn energy
Creep.prototype.isWorthRecycling = function (minReturn = 10, steps = 25) {
    return minReturn >= (((this.memory.ttl - steps) / this.memory.ttl_max) * this.memory.cost);
}

////
// Creep handler code :)
////
Creep.prototype.run = function ()
{
    if (!this.spawning) {
        this.memory.ttl = this.ticksToLive;
        this.memory.ttl_max = Math.max(this.ticksToLive, this.memory.ttl_max);
    }
    else {
        this.memory.ttl = 1500;
        this.memory.ttl_max = 500;
    }

    if (this.memory.role != 'dmw') {
        // If the creep can't work or move or if it isn't worth keeping around: kill it off
        let parts = _.countBy(_.filter(this.body, (x) => x.hits != 0), "type");
        let part_max = _.countBy(this.body, 'type');
        if ((!parts.work && part_max.work) ||
            (!parts.carry && part_max.carry) ||
            (!parts.claim && part_max.claim) ||
            !parts.move)
        {
            this.euthanize();
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
    if (roleRunner) {
        roleRunner.run(this);
    }

    this.memory.last_pos = new RoomPosition(this.pos.x, this.pos.y, this.room.name);
}