const utils = require('utils');

const CREEP_MAXIMUMS = {
    'harvester': 3, // Should be 3*NUM_SOURCES
    'courier': 2,
    'worker': 4,
    'upgrader': 2,
    'drone': 12,
};

const CREEP_PARTS = {
    'harvester': [
        [WORK, WORK, CARRY, MOVE],
        [WORK, CARRY, MOVE],
    ],
    'courier': [
        
        [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
        [CARRY, CARRY, MOVE, MOVE],
    ],
    'worker': [
        [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
        [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    ],
    'upgrader': [
        [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
        [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    ],
    'drone': [
        [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
        [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
        [WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
    ],
};

function UNIT_COST(a) { return _.sum(a, (x) => BODYPART_COST[x]); }

StructureSpawn.prototype.run = function () {
	// If we're spawning, put up a thing so we know what is happening
	if (this.spawning) {
		let spawningCreep = Game.creeps[this.spawning.name];
		this.room.visual.text(
			'🛠️' + spawningCreep.memory.role,
			this.pos.x + 1,
			this.pos.y,
			{ align: 'left', opacity: 0.8 });
	}
	else {
        let num_creeps = _.countBy(Memory.creeps, 'role');

        for (let t in CREEP_MAXIMUMS)
        {
            if (num_creeps[t] < CREEP_MAXIMUMS[t])
            {
                if (t == 'drone' && Memory.last_external_death + 1200 > Game.time)
                {
                    continue;
                }
                let parts = _.find(CREEP_PARTS[t], b => UNIT_COST(b) <= this.room.energyCapacityAvailable);
                utils.spawnCreep(this, t, parts, UNIT_COST(parts));
            }
        }

		// If everything is dead (but we still have a spawn for some reason), try to rebuild!
		if (!this.spawning && Memory.pop_count == 0) {
			utils.spawnCreep(this, 'harvester', [WORK, CARRY, MOVE, MOVE], 250);
		}
	}
}
