const roleHarvester = require('role.harvester');
const roleExternalHarvester = require('role.external_harvester');
const roleUpgrader = require('role.upgrader');
const roleBuilder = require('role.builder');
const roleDmw = require('role.dmw');

const DISPATCH_TABLE = {
    'harvester': roleHarvester.run,
    'upgrader': roleUpgrader.run,
    'builder': roleBuilder.run,
    'external_harvester': roleExternalHarvester.run,
    'dmw': roleDmw.run
};

Creep.prototype.run = function ()
{
    this.memory.ttl = this.ticksToLive;
    this.memory.ttl_max = Math.max(this.ticksToLive, this.memory.ttl_max);

    if (this.memory.role != 'dmw') {
        // If the creep can't work or move or if it isn't worth keeping around: kill it off
        let parts = _.countBy(_.filter(this.body, (x) => x.hits != 0), "type");
        let force_suicide = (!parts.work || !parts.carry || !parts.move);
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

    if (this.memory.role in DISPATCH_TABLE) {
        DISPATCH_TABLE[this.memory.role](this);
    }

    this.memory.last_pos = new RoomPosition(this.pos.x, this.pos.y, this.room.name);
}